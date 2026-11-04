package termity

// /dev — developer tools inside the REPL.
//
//	/dev build [engine|api|web|all]   git-aware build: show what changed,
//	                                  then rebuild the requested components
//	/dev cache-clean                  purge redundant build caches, report
//	                                  artifacts and shared caches it keeps
//
// Build logic lives in the runner package (single source of truth shared
// with /start); this file only orchestrates: git summary, target parsing,
// cache inventory and pretty output.

import (
	"fmt"
	"net"
	"os"
	"os/exec"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"github.com/CyaniAgent/Asagity/core/src/Verse.Cli/internal/runner"
)

// cmdDev dispatches the developer subcommands.
func cmdDev(args []string, env *Env) Outcome {
	if len(args) == 0 {
		return invalidUsage(env, "/dev <build [engine|api|web|all]|cache-clean>")
	}
	switch args[0] {
	case "build":
		return cmdDevBuild(args[1:], env)
	case "cache-clean":
		return cmdDevCacheClean(env)
	default:
		return invalidUsage(env, "/dev <build [engine|api|web|all]|cache-clean>")
	}
}

// ---------------------------------------------------------------- build

// cmdDevBuild shows the git change list FIRST (so you know exactly what you
// are rebuilding), then streams the build of each requested component.
func cmdDevBuild(args []string, env *Env) Outcome {
	targets, ok := devBuildTargets(args)
	if !ok {
		return invalidUsage(env, "/dev build [engine|api|web|all]")
	}

	lines := devGitSummary(env)
	lines = append(lines,
		env.st.dim.Render("→ building: "+strings.Join(targets, " · ")),
		"")

	failed := ""
	env.streamRunner(func() {
		for _, t := range targets {
			var err error
			switch t {
			case runner.Engine:
				err = devBuildOne("engine", env.Runner.BuildEngine)
			case runner.API:
				err = devBuildOne("api", env.Runner.BuildAPI)
			case "web":
				err = devBuildOne("web", env.Runner.BuildWeb)
			}
			if err != nil {
				fmt.Printf("[FAIL] %s build: %v\n", t, err)
				failed = t
				return // stop at the first failure — later targets would likely fail too
			}
		}
	})
	if failed != "" {
		return Outcome{OK: false, Lines: lines}
	}
	return Outcome{OK: true, Lines: lines}
}

// devBuildOne prints a streamed build banner and runs the build.
func devBuildOne(name string, build func() error) error {
	fmt.Printf("[DEV] building %s ...\n", name)
	if err := build(); err != nil {
		return err
	}
	fmt.Printf("[OK] %s built\n", name)
	return nil
}

// devBuildTargets maps the command arguments to build targets.
// No argument means "all" — the safe default for a full rebuild.
func devBuildTargets(args []string) ([]string, bool) {
	const all = "engine api web"
	switch {
	case len(args) == 0:
		return strings.Fields(all), true
	case args[0] == "all":
		return strings.Fields(all), true
	case args[0] == "engine" || args[0] == runner.API || args[0] == "web":
		if len(args) > 1 {
			return nil, false
		}
		return []string{args[0]}, true
	}
	return nil, false
}

// gitChange is one porcelain status entry (e.g. " M", "??", "R  old -> new").
type gitChange struct {
	code string
	path string
}

// devGitSummary runs `git status --porcelain`, colorizes the change list and
// infers which build components are affected — the "look before you build"
// step.
func devGitSummary(env *Env) []string {
	st := env.st
	root := env.Cfg.ProjectRoot
	cmd := exec.Command("git", "-C", root, "status", "--porcelain")
	out, err := cmd.Output()
	if err != nil {
		return []string{st.warn.Render(fmt.Sprintf("[WARN] git status unavailable: %v", err))}
	}
	changes := parseGitPorcelain(string(out))
	if len(changes) == 0 {
		return []string{st.dim.Render("git · working tree clean — nothing changed")}
	}

	const showMax = 8
	lines := make([]string, 0, showMax+3)
	lines = append(lines, st.accentText.Render(
		fmt.Sprintf("git · %d change(s)", len(changes))))
	comps := map[string]int{}
	for i, c := range changes {
		comp := devComponent(c.path)
		comps[comp]++
		if i < showMax {
			lines = append(lines, fmt.Sprintf("  %s %-*s %s",
				devCodeColor(st, c.code), 44, c.path,
				st.dim.Render("["+comp+"]")))
		}
	}
	if len(changes) > showMax {
		lines = append(lines, st.dim.Render(
			fmt.Sprintf("  … +%d more", len(changes)-showMax)))
	}

	// Build-relevant components touched (cli/docs/infra don't affect the
	// engine/api/web binaries).
	names := make([]string, 0, len(comps))
	for c := range comps {
		names = append(names, c)
	}
	sort.Strings(names)
	lines = append(lines, st.dim.Render("→ touched: "+strings.Join(names, " · ")))
	if hint := devBuildHint(comps); hint != "" {
		lines = append(lines, st.dim.Render(hint))
	}
	return lines
}

// parseGitPorcelain splits `git status --porcelain` output into entries.
func parseGitPorcelain(out string) []gitChange {
	var changes []gitChange
	for _, line := range strings.Split(out, "\n") {
		if len(line) < 4 {
			continue
		}
		code := strings.TrimSpace(line[:2])
		path := strings.TrimSpace(line[3:])
		if i := strings.Index(path, " -> "); i >= 0 { // rename: keep the new name
			path = strings.Trim(strings.TrimSpace(path[i+4:]), "\"")
		} else {
			path = strings.Trim(path, "\"")
		}
		changes = append(changes, gitChange{code: code, path: path})
	}
	return changes
}

// devComponent maps a repo-relative path to the component it belongs to.
func devComponent(path string) string {
	switch {
	case strings.HasPrefix(path, "core/src/Verse.Engine/"):
		return runner.Engine
	case strings.HasPrefix(path, "core/src/Verse.Cli/"):
		return "cli"
	case strings.HasPrefix(path, "core/src/"): // Api/Data/Modules/Shared/Tests
		return runner.API
	case strings.HasPrefix(path, "core/"):
		return "core"
	case strings.HasPrefix(path, "web/"):
		return "web"
	case strings.HasPrefix(path, "docs/"):
		return "docs"
	default:
		return "infra"
	}
}

// devBuildHint suggests the narrowest /dev build for the touched set.
func devBuildHint(comps map[string]int) string {
	if comps["cli"] > 0 {
		return "  hint: versetool itself changed — rebuild it with " +
			"core/src/Verse.Cli: go build -o bin/versetool ./cmd/verse"
	}
	var buildable []string
	for _, c := range []string{runner.Engine, runner.API, "web"} {
		if comps[c] > 0 {
			buildable = append(buildable, c)
		}
	}
	switch len(buildable) {
	case 0:
		return "  hint: no build components affected — /dev build not needed"
	case 1:
		return "  hint: /dev build " + buildable[0]
	default:
		return ""
	}
}

// devCodeColor paints a porcelain status code.
func devCodeColor(st styles, code string) string {
	switch code {
	case "??", "!!":
		return st.accentText.Render(code)
	case "A", "M", "RM", "AM":
		return st.warn.Render(code)
	case "D", "MD":
		return st.fail.Render(code)
	default:
		return st.skip.Render(code)
	}
}

// ------------------------------------------------------------ cache-clean

// cacheEntry is one cache/artifact directory considered by cache-clean.
type cacheEntry struct {
	rel   string // display path (repo-relative or absolute)
	path  string // absolute path
	size  int64
	purge bool   // clean it now, or report only
	why   string // reason shown when kept
}

// cmdDevCacheClean purges redundant build caches and reports what it kept.
// Build artifacts of running services (.verse/bin, .verse/publish), the web
// dist bundle and the machine-wide Go build cache are only reported — they
// are either live or shared, not redundant.
func cmdDevCacheClean(env *Env) Outcome {
	st := env.st
	root := env.Cfg.ProjectRoot
	entries := devCacheEntries(root, goBuildCacheDir(), webDevServerCheck())

	if len(entries) == 0 {
		return Outcome{OK: true,
			Lines: []string{st.dim.Render("no build caches found — already clean")}}
	}

	lines := make([]string, 0, len(entries)+2)
	var freed int64
	purged := 0
	for _, e := range entries {
		if !e.purge {
			continue
		}
		if err := os.RemoveAll(e.path); err != nil {
			lines = append(lines, fmt.Sprintf("%s %s: %v",
				st.fail.Render("[FAIL]"), e.rel, err))
			continue
		}
		freed += e.size
		purged++
		lines = append(lines, fmt.Sprintf("%s %-34s %s",
			st.ok.Render("[OK]"), e.rel, st.dim.Render(humanSize(e.size))))
	}
	for _, e := range entries {
		if e.purge {
			continue
		}
		lines = append(lines, fmt.Sprintf("%s %-34s %s  %s",
			st.skip.Render("[KEEP]"), e.rel,
			st.dim.Render(humanSize(e.size)), st.dim.Render("("+e.why+")")))
	}
	if purged == 0 {
		lines = append(lines, st.dim.Render("nothing to clean"))
	} else {
		lines = append(lines, st.ok.Render(
			fmt.Sprintf("freed %s across %d cache(s)", humanSize(freed), purged)))
	}
	return Outcome{OK: true, Lines: lines}
}

// devCacheEntries walks the known cache locations under root and returns an
// inventory ordered: purgeable first, kept last. webDevUp reports whether the
// vite dev server is running (its .vite cache is then in use, not redundant).
func devCacheEntries(root, goCache string, webDevUp bool) []cacheEntry {
	var entries []cacheEntry

	// .NET intermediates + build output per project.
	if projects, err := filepath.Glob(filepath.Join(root, "core", "src", "*")); err == nil {
		for _, p := range projects {
			name := filepath.Base(p)
			add := func(dir, why string, purge bool) {
				if fi, err := os.Stat(dir); err == nil && fi.IsDir() {
					entries = append(entries, cacheEntry{
						rel:   relOrAbs(root, dir),
						path:  dir,
						size:  dirSize(dir),
						purge: purge,
						why:   why,
					})
				}
			}
			add(filepath.Join(p, "obj"), "", true)
			if name == "Verse.Cli" {
				// bin/versetool is the RUNNING binary — keep it.
				add(filepath.Join(p, "bin"), "the running versetool binary lives here", false)
			} else {
				add(filepath.Join(p, "bin"), "", true)
			}
		}
	}

	// Vite dependency cache (re-created transparently on next dev/build) —
	// unless the dev server is up: then .vite is in ACTIVE use, not
	// redundant, and deleting it would force a re-optimize under the
	// running session.
	if fi, err := os.Stat(filepath.Join(root, "web", "node_modules")); err == nil && fi.IsDir() {
		vite := filepath.Join(root, "web", "node_modules", ".vite")
		if fi, err := os.Stat(vite); err == nil && fi.IsDir() {
			e := cacheEntry{
				rel: "web/node_modules/.vite", path: vite,
				size: dirSize(vite), purge: true,
			}
			if webDevUp {
				e.purge = false
				e.why = "vite dev server is running on :2000"
			}
			entries = append(entries, e)
		}
	}

	// Live outputs / shared caches: report only.
	keep := []struct{ rel, why string }{
		{filepath.Join("web", "dist"), "build artifact — rebuild via /dev build web"},
		{filepath.Join(".verse", "bin"), "live engine binaries (running services)"},
		{filepath.Join(".verse", "publish"), "live api publish dir (running services)"},
	}
	for _, k := range keep {
		dir := filepath.Join(root, k.rel)
		if fi, err := os.Stat(dir); err == nil && fi.IsDir() {
			entries = append(entries, cacheEntry{
				rel: k.rel, path: dir, size: dirSize(dir), purge: false, why: k.why,
			})
		}
	}
	if goCache != "" {
		if fi, err := os.Stat(goCache); err == nil && fi.IsDir() {
			entries = append(entries, cacheEntry{
				rel: goCache, path: goCache, size: dirSize(goCache),
				purge: false, why: "shared across all Go projects (go clean -cache)",
			})
		}
	}

	sort.Slice(entries, func(i, j int) bool {
		if entries[i].purge != entries[j].purge {
			return entries[i].purge // purgeable first
		}
		return entries[i].rel < entries[j].rel
	})
	return entries
}

// webDevServerCheck is the dev-server probe used by cache-clean; a var so
// tests can pin the result instead of depending on the host's port 2000.
var webDevServerCheck = webDevServerListening

// webDevServerListening reports whether something (the vite dev server,
// `npm run dev` pins port 2000) accepts connections on the web dev port.
func webDevServerListening() bool {
	conn, err := net.DialTimeout("tcp", "127.0.0.1:2000", 200*time.Millisecond)
	if err != nil {
		return false
	}
	_ = conn.Close()
	return true
}

// goBuildCacheDir resolves GOCACHE (go env, else the default).
func goBuildCacheDir() string {
	if v := os.Getenv("GOCACHE"); v != "" {
		return v
	}
	if out, err := exec.Command("go", "env", "GOCACHE").Output(); err == nil {
		if v := strings.TrimSpace(string(out)); v != "" && v != "off" {
			return v
		}
	}
	return ""
}

// dirSize sums file sizes under dir (tolerating unreadable entries).
func dirSize(dir string) int64 {
	var total int64
	_ = filepath.Walk(dir, func(_ string, fi os.FileInfo, err error) error {
		if err != nil {
			return nil
		}
		if !fi.IsDir() {
			total += fi.Size()
		}
		return nil
	})
	return total
}

// humanSize renders bytes as a compact human string.
func humanSize(n int64) string {
	const unit = 1024
	if n < unit {
		return fmt.Sprintf("%d B", n)
	}
	div, exp := int64(unit), 0
	for m := n / unit; m >= unit && exp < 3; m /= unit {
		div *= unit
		exp++
	}
	return fmt.Sprintf("%.1f %ciB", float64(n)/float64(div), "KMG"[exp])
}

// relOrAbs returns path relative to root when inside it, else the full path.
func relOrAbs(root, path string) string {
	if rel, err := filepath.Rel(root, path); err == nil && !strings.HasPrefix(rel, "..") {
		return rel
	}
	return path
}
