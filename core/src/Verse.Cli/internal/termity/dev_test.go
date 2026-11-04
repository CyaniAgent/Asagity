package termity

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/CyaniAgent/Asagity/core/src/Verse.Cli/internal/config"
)

// TestParseGitPorcelain covers the porcelain shapes: modified, untracked,
// rename arrows and quoted paths.
func TestParseGitPorcelain(t *testing.T) {
	out := strings.Join([]string{
		" M core/src/Verse.Api/Services/Foo.cs",
		"?? web/src/pages/bar.tsx",
		"R  old/name.go -> new/name.go",
		"?? \"web/src/wei rd/file.ts\"",
		"A  core/src/Verse.Api/New.cs",
		"D  core/src/Verse.Data/Gone.cs",
		"",
	}, "\n")

	changes := parseGitPorcelain(out)
	want := []gitChange{
		{code: "M", path: "core/src/Verse.Api/Services/Foo.cs"},
		{code: "??", path: "web/src/pages/bar.tsx"},
		{code: "R", path: "new/name.go"},
		{code: "??", path: "web/src/wei rd/file.ts"},
		{code: "A", path: "core/src/Verse.Api/New.cs"},
		{code: "D", path: "core/src/Verse.Data/Gone.cs"},
	}
	if len(changes) != len(want) {
		t.Fatalf("got %d changes, want %d: %+v", len(changes), len(want), changes)
	}
	for i := range want {
		if changes[i] != want[i] {
			t.Errorf("changes[%d] = %+v, want %+v", i, changes[i], want[i])
		}
	}
}

// TestDevComponent pins path → component inference.
func TestDevComponent(t *testing.T) {
	cases := map[string]string{
		"core/src/Verse.Engine/main.go":        "engine",
		"core/src/Verse.Api/Program.cs":        "api",
		"core/src/Verse.Data/Repo.cs":          "api",
		"core/src/Verse.Cli/cmd/verse/main.go": "cli",
		"web/src/App.tsx":                      "web",
		"docs/cli/termity-base-cli.md":         "docs",
		"docker-compose.yml":                   "infra",
		"core/Directory.Build.props":           "core",
	}
	for path, want := range cases {
		if got := devComponent(path); got != want {
			t.Errorf("devComponent(%q) = %q, want %q", path, got, want)
		}
	}
}

// TestDevBuildTargets covers argument parsing and the "all" default.
func TestDevBuildTargets(t *testing.T) {
	cases := []struct {
		args []string
		want []string
		ok   bool
	}{
		{nil, []string{"engine", "api", "web"}, true},
		{[]string{"all"}, []string{"engine", "api", "web"}, true},
		{[]string{"engine"}, []string{"engine"}, true},
		{[]string{"api"}, []string{"api"}, true},
		{[]string{"web"}, []string{"web"}, true},
		{[]string{"engine", "web"}, nil, false}, // one target at a time
		{[]string{"bogus"}, nil, false},
	}
	for _, c := range cases {
		got, ok := devBuildTargets(c.args)
		if ok != c.ok || strings.Join(got, ",") != strings.Join(c.want, ",") {
			t.Errorf("devBuildTargets(%v) = %v,%v want %v,%v",
				c.args, got, ok, c.want, c.ok)
		}
	}
}

// writeFiles creates files under dir with the given sizes (1 byte each is
// enough — size accounting only needs existence and count).
func writeFiles(t *testing.T, files ...string) {
	t.Helper()
	for _, f := range files {
		if err := os.MkdirAll(filepath.Dir(f), 0o755); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(f, []byte("x"), 0o644); err != nil {
			t.Fatal(err)
		}
	}
}

// TestDevCacheEntriesPurgeFlags: obj/bin purge, Verse.Cli/bin and live
// outputs are kept.
func TestDevCacheEntriesPurgeFlags(t *testing.T) {
	root := t.TempDir()
	writeFiles(t,
		filepath.Join(root, "core/src/Verse.Api/obj/x.o"),
		filepath.Join(root, "core/src/Verse.Api/bin/y.dll"),
		filepath.Join(root, "core/src/Verse.Cli/obj/z.o"),
		filepath.Join(root, "core/src/Verse.Cli/bin/versetool"),
		filepath.Join(root, "web/node_modules/.vite/dep.js"),
		filepath.Join(root, "web/dist/index.html"),
		filepath.Join(root, ".verse/bin/verse-engine"),
		filepath.Join(root, ".verse/publish/api/Verse.Api.dll"),
	)

	entries := devCacheEntries(root, "", false)
	byRel := map[string]cacheEntry{}
	for _, e := range entries {
		byRel[e.rel] = e
	}

	purge := []string{
		"core/src/Verse.Api/obj",
		"core/src/Verse.Api/bin",
		"core/src/Verse.Cli/obj",
		"web/node_modules/.vite",
	}
	keep := map[string]string{
		"core/src/Verse.Cli/bin":           "versetool",
		"web/dist":                         "dist",
		filepath.Join(".verse", "bin"):     "verse",
		filepath.Join(".verse", "publish"): "publish",
	}
	for _, rel := range purge {
		e, hit := byRel[rel]
		if !hit {
			t.Errorf("missing purge entry %q (have %v)", rel, keys(byRel))
			continue
		}
		if !e.purge {
			t.Errorf("%q should be purgeable", rel)
		}
		if e.size == 0 {
			t.Errorf("%q size = 0, want > 0", rel)
		}
	}
	for rel := range keep {
		e, hit := byRel[rel]
		if !hit {
			t.Errorf("missing keep entry %q (have %v)", rel, keys(byRel))
			continue
		}
		if e.purge {
			t.Errorf("%q must NOT be purged", rel)
		}
		if e.why == "" {
			t.Errorf("%q kept without a reason", rel)
		}
	}

	// Purgeable entries sort before kept ones.
	for i := 1; i < len(entries); i++ {
		if !entries[i-1].purge && entries[i].purge {
			t.Errorf("order violated at %d: %+v before %+v", i, entries[i-1], entries[i])
		}
	}
}

// TestDevCacheViteGuard: while the vite dev server runs, the .vite dep
// cache is in active use — kept with a reason; otherwise purgeable.
func TestDevCacheViteGuard(t *testing.T) {
	root := t.TempDir()
	writeFiles(t, filepath.Join(root, "web/node_modules/.vite/dep.js"))

	found := false
	for _, e := range devCacheEntries(root, "", true) {
		if e.rel != "web/node_modules/.vite" {
			continue
		}
		found = true
		if e.purge {
			t.Error(".vite must be kept while the dev server runs")
		}
		if !strings.Contains(e.why, "2000") {
			t.Errorf("why = %q, want a mention of the dev port", e.why)
		}
	}
	if !found {
		t.Fatal("missing .vite entry")
	}
	for _, e := range devCacheEntries(root, "", false) {
		if e.rel == "web/node_modules/.vite" && !e.purge {
			t.Error(".vite should be purgeable when no dev server runs")
		}
	}
}

// TestCmdDevCacheClean removes purgeable caches and preserves kept dirs.
func TestCmdDevCacheClean(t *testing.T) {
	root := t.TempDir()
	writeFiles(t,
		filepath.Join(root, "core/src/Verse.Api/obj/x.o"),
		filepath.Join(root, "core/src/Verse.Api/bin/y.dll"),
		filepath.Join(root, "web/node_modules/.vite/dep.js"),
		filepath.Join(root, "web/dist/index.html"),
		filepath.Join(root, "core/src/Verse.Cli/bin/versetool"),
	)
	env := &Env{Cfg: &config.Config{ProjectRoot: root}, st: newStyles()}

	// Pin the dev-server probe: this test asserts .vite gets PURGED, which
	// must not depend on whether the host happens to run vite on :2000.
	saved := webDevServerCheck
	webDevServerCheck = func() bool { return false }
	defer func() { webDevServerCheck = saved }()

	out := cmdDevCacheClean(env)
	if !out.OK {
		t.Fatalf("cache-clean failed: %v", out)
	}

	gone := []string{
		filepath.Join(root, "core/src/Verse.Api/obj"),
		filepath.Join(root, "core/src/Verse.Api/bin"),
		filepath.Join(root, "web/node_modules/.vite"),
	}
	for _, p := range gone {
		if _, err := os.Stat(p); !os.IsNotExist(err) {
			t.Errorf("%s still exists after clean", p)
		}
	}
	still := []string{
		filepath.Join(root, "web/dist/index.html"),
		filepath.Join(root, "core/src/Verse.Cli/bin/versetool"),
	}
	for _, p := range still {
		if _, err := os.Stat(p); err != nil {
			t.Errorf("%s was removed but must be kept: %v", p, err)
		}
	}
	joined := strings.Join(out.Lines, "\n")
	if !strings.Contains(joined, "freed") {
		t.Errorf("no freed summary in output:\n%s", joined)
	}
	if !strings.Contains(joined, "[KEEP]") {
		t.Errorf("no kept entries reported:\n%s", joined)
	}
}

// TestDevCmdValidation: unknown subcommand and bad build targets are usage
// errors, not panics.
func TestDevCmdValidation(t *testing.T) {
	env := &Env{Cfg: &config.Config{ProjectRoot: t.TempDir()}, st: newStyles()}

	if out := cmdDev(nil, env); out.OK {
		t.Error("/dev without args should be a usage error")
	}
	if out := cmdDev([]string{"frobnicate"}, env); out.OK {
		t.Error("/dev frobnicate should be a usage error")
	}
	if out := cmdDev([]string{"build", "engine", "web"}, env); out.OK {
		t.Error("/dev build engine web should be a usage error")
	}
	if out := cmdDev([]string{"cache-clean"}, env); !out.OK {
		t.Errorf("/dev cache-clean on an empty tree should succeed: %v", out)
	}
}

// TestHumanSize pins the unit formatting.
func TestHumanSize(t *testing.T) {
	cases := map[int64]string{
		0:                      "0 B",
		512:                    "512 B",
		1024:                   "1.0 KiB",
		1536:                   "1.5 KiB",
		1024 * 1024:            "1.0 MiB",
		3 * 1024 * 1024 * 1024: "3.0 GiB",
	}
	for n, want := range cases {
		if got := humanSize(n); got != want {
			t.Errorf("humanSize(%d) = %q, want %q", n, got, want)
		}
	}
}

func keys(m map[string]cacheEntry) []string {
	out := make([]string, 0, len(m))
	for k := range m {
		out = append(out, k)
	}
	return out
}
