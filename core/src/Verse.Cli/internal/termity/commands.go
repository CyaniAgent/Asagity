package termity

import (
	"bufio"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/CyaniAgent/Asagity/core/src/Verse.Cli/internal/config"
	"github.com/CyaniAgent/Asagity/core/src/Verse.Cli/internal/doctor"
	"github.com/CyaniAgent/Asagity/core/src/Verse.Cli/internal/engineapi"
	"github.com/CyaniAgent/Asagity/core/src/Verse.Cli/internal/mode"
	"github.com/CyaniAgent/Asagity/core/src/Verse.Cli/internal/modulemgr"
	"github.com/CyaniAgent/Asagity/core/src/Verse.Cli/internal/process"
	"github.com/CyaniAgent/Asagity/core/src/Verse.Cli/internal/runner"
)

// Env is the handler environment: config, runner and the mutable session
// mode (changed by /mode, read by /start /restart /db). The Live hooks are
// injected by the TUI (nil in tests / plain runs): they receive an already
// colorized line and push it into the transcript immediately, so long
// operations stream progress instead of dumping it all at the end.
type Env struct {
	Cfg    *config.Config
	Runner *runner.Runner
	Mode   mode.Mode
	st     styles

	LiveRunner func(line string)      // runner progress ([OK] engine starting...)
	LiveLog    func(svc, line string) // service log tail lines
}

// streamRunner runs fn while forwarding every line it prints to LiveRunner.
// When a live sink is attached the lines are NOT returned (the transcript
// already has them); without one they are collected as before.
func (e *Env) streamRunner(fn func()) []string {
	var live func(string)
	if e.LiveRunner != nil {
		live = e.LiveRunner
	}
	lines := captureStream(fn, live)
	if live != nil {
		return nil
	}
	return lines
}

// Outcome is one command result: colored lines for the transcript plus the
// success flag journaled to the session file. Follow/Unfollow request live
// log tails from the TUI layer (Supervisor-style streaming).
type Outcome struct {
	OK       bool
	Lines    []string
	Follow   []string // start tailing these services' logs after success
	Unfollow bool     // detach all log tails
}

// command is one /verb in the registry.
type command struct {
	Name    string
	Usage   string
	Desc    string
	Confirm bool // inline y/N confirmation before running (destroy)
	Run     func(args []string, env *Env) Outcome
}

// registry is the command table; order drives /help. Built in init() because
// cmdHelp renders the registry itself (a package-var initializer referring to
// a function that reads the same var is an initialization cycle).
var registry []*command

func init() {
	registry = []*command{
		{
			Name:  "start",
			Usage: "/start [prod|dev|dbless] [service]",
			Desc:  "start services (default: session mode, all)",
			Run:   cmdStart,
		},
		{
			Name:  "stop",
			Usage: "/stop [service]",
			Desc:  "stop services gracefully (default: all)",
			Run:   cmdStop,
		},
		{
			Name:  "restart",
			Usage: "/restart [prod|dev|dbless] [service]",
			Desc:  "restart services (default: session mode, all)",
			Run:   cmdRestart,
		},
		{
			Name:    "destroy",
			Usage:   "/destroy [service]",
			Desc:    "force-kill services, no grace period (emergency)",
			Confirm: true,
			Run:     cmdDestroy,
		},
		{
			Name:  "status",
			Usage: "/status",
			Desc:  "three-level status: process, port, /healthz + RSS",
			Run:   cmdStatusLines,
		},
		{
			Name:  "health",
			Usage: "/health",
			Desc:  "probe engine + api /healthz",
			Run:   cmdHealthLines,
		},
		{
			Name:  "doctor",
			Usage: "/doctor",
			Desc:  "environment and service diagnostics",
			Run:   cmdDoctorLines,
		},
		{
			Name:  "logs",
			Usage: "/logs [-f] <engine|api|off>",
			Desc:  "last 50 log lines; -f follows live, off detaches",
			Run:   cmdLogsLines,
		},
		{
			Name:  "dev",
			Usage: "/dev <build [engine|api|web|all]|cache-clean>",
			Desc:  "dev tools: git-aware build, redundant cache cleanup",
			Run:   cmdDev,
		},
		{
			Name:  "app",
			Usage: "/app <list|enable|disable> [name]",
			Desc:  "manage installed .aap applications",
			Run:   cmdAppLines,
		},
		{
			Name:  "db",
			Usage: "/db",
			Desc:  "database mode, path and seeded account",
			Run:   cmdDBLines,
		},
		{
			Name:  "mode",
			Usage: "/mode [prod|dev|dbless]",
			Desc:  "show or switch the session mode",
			Run:   cmdMode,
		},
		{
			Name:  "recent",
			Usage: "/recent [id]",
			Desc:  "list past sessions; with id, show its command flow",
			Run:   cmdRecent,
		},
		{
			Name:  "help",
			Usage: "/help",
			Desc:  "this help",
			Run:   cmdHelp,
		},
		{
			Name:  "exit",
			Usage: "/exit",
			Desc:  "leave the CLI (also Ctrl+C / Ctrl+D)",
			Run:   cmdExit,
		},
	}
}

// commandNames returns every verb for suggestions/completion.
func commandNames() []string {
	out := make([]string, 0, len(registry))
	for _, c := range registry {
		out = append(out, c.Name)
	}
	return out
}

// lookup resolves an exact verb; empty string when unknown.
func lookup(name string) *command {
	for _, c := range registry {
		if c.Name == name {
			return c
		}
	}
	return nil
}

// suggest returns the closest verb within edit distance 2 ("" when none).
// Damerau distance (adjacent transposition counts 1) so common typos like
// "stauts" resolve to "status" rather than tying with "start".
func suggest(name string) string {
	if name == "" {
		return ""
	}
	best, bestD := "", 3
	for _, c := range registry {
		if d := damerauLevenshtein(name, c.Name); d < bestD {
			best, bestD = c.Name, d
		}
	}
	return best
}

// levenshtein is the classic edit distance (small strings only).
func levenshtein(a, b string) int {
	ra, rb := []rune(a), []rune(b)
	prev := make([]int, len(rb)+1)
	cur := make([]int, len(rb)+1)
	for j := range prev {
		prev[j] = j
	}
	for i := 1; i <= len(ra); i++ {
		cur[0] = i
		for j := 1; j <= len(rb); j++ {
			cost := 1
			if ra[i-1] == rb[j-1] {
				cost = 0
			}
			cur[j] = min3(prev[j]+1, cur[j-1]+1, prev[j-1]+cost)
		}
		prev, cur = cur, prev
	}
	return prev[len(rb)]
}

// damerauLevenshtein is the optimal string alignment distance: levenshtein
// plus adjacent-transposition = 1.
func damerauLevenshtein(a, b string) int {
	ra, rb := []rune(a), []rune(b)
	la, lb := len(ra), len(rb)
	d := make([][]int, la+1)
	for i := range d {
		d[i] = make([]int, lb+1)
		d[i][0] = i
	}
	for j := range d[0] {
		d[0][j] = j
	}
	for i := 1; i <= la; i++ {
		for j := 1; j <= lb; j++ {
			cost := 1
			if ra[i-1] == rb[j-1] {
				cost = 0
			}
			d[i][j] = min3(d[i-1][j]+1, d[i][j-1]+1, d[i-1][j-1]+cost)
			if i > 1 && j > 1 && ra[i-1] == rb[j-2] && ra[i-2] == rb[j-1] {
				d[i][j] = min(d[i][j], d[i-2][j-2]+1)
			}
		}
	}
	return d[la][lb]
}

func min3(a, b, c int) int {
	if b < a {
		a = b
	}
	if c < a {
		a = c
	}
	return a
}

// captureStream redirects stdout+stderr while fn runs, splitting the output
// into lines. When onLine is non-nil it is called for EACH line as it
// arrives (streaming, Supervisor-style); the full slice is returned either
// way so callers without a live sink can batch it. The runner reports
// progress with fmt.Printf, so this keeps TUI rendering intact without
// rewriting the runner.
func captureStream(fn func(), onLine func(string)) []string {
	oldOut, oldErr := os.Stdout, os.Stderr
	r, w, err := os.Pipe()
	if err != nil {
		fn()
		return nil
	}
	os.Stdout, os.Stderr = w, w
	done := make(chan []string, 1)
	go func() {
		var lines []string
		sc := bufio.NewScanner(r)
		sc.Buffer(make([]byte, 0, 64*1024), 1024*1024)
		for sc.Scan() {
			if t := strings.TrimRight(sc.Text(), "\r"); t != "" {
				lines = append(lines, t)
				if onLine != nil {
					onLine(t)
				}
			}
		}
		done <- lines
	}()
	fn()
	_ = w.Close()
	os.Stdout, os.Stderr = oldOut, oldErr
	return <-done
}

// capture is the batch variant of captureStream (no live sink).
func capture(fn func()) []string {
	return captureStream(fn, nil)
}

// resolveTarget parses "[prod|dev|dbless] [service]" against the session
// default, mirroring the argument form of `versetool start`.
func resolveTarget(args []string, def mode.Mode) (string, mode.Mode, bool) {
	svc, md := "all", def
	if len(args) > 0 {
		if m, ok := mode.Alias(args[0]); ok {
			md = m
			if len(args) > 1 {
				svc = args[1]
			}
		} else {
			svc = args[0]
		}
	}
	for _, known := range runner.All {
		if svc == known {
			return svc, md, true
		}
	}
	if svc == "all" {
		return svc, md, true
	}
	return "", md, false
}

// serviceArg validates a bare "[service]" argument (stop/destroy).
func serviceArg(args []string) (string, bool) {
	if len(args) == 0 {
		return "all", true
	}
	for _, known := range runner.All {
		if args[0] == known {
			return args[0], true
		}
	}
	return "", false
}

func invalidUsage(env *Env, usage string) Outcome {
	return Outcome{OK: false, Lines: []string{env.st.warn.Render("usage: " + usage)}}
}

// cmdStart implements /start (async; the caller runs it in a goroutine).
// Progress streams live; on success the TUI attaches to the service logs.
func cmdStart(args []string, env *Env) Outcome {
	svc, md, ok := resolveTarget(args, env.Mode)
	if !ok {
		return invalidUsage(env, "/start [prod|dev|dbless] [service]")
	}
	env.streamRunner(func() { _ = env.Runner.Start(svc, md) })
	return Outcome{OK: true, Follow: loggable(svc)}
}

func cmdStop(args []string, env *Env) Outcome {
	svc, ok := serviceArg(args)
	if !ok {
		return invalidUsage(env, "/stop [service]")
	}
	env.streamRunner(func() { env.Runner.Stop(svc) })
	return Outcome{OK: true, Unfollow: true}
}

func cmdRestart(args []string, env *Env) Outcome {
	svc, md, ok := resolveTarget(args, env.Mode)
	if !ok {
		return invalidUsage(env, "/restart [prod|dev|dbless] [service]")
	}
	env.streamRunner(func() { _ = env.Runner.Restart(svc, md) })
	return Outcome{OK: true, Follow: loggable(svc)}
}

func cmdDestroy(args []string, env *Env) Outcome {
	svc, ok := serviceArg(args)
	if !ok {
		return invalidUsage(env, "/destroy [service]")
	}
	env.streamRunner(func() { env.Runner.Destroy(svc) })
	return Outcome{OK: true, Unfollow: true}
}

// loggable maps a start target to the services whose logs are worth tailing
// (only engine and api write log files; db/redis are docker compose).
func loggable(svc string) []string {
	switch svc {
	case runner.Engine, runner.API:
		return []string{svc}
	default: // "all"
		return []string{runner.Engine, runner.API}
	}
}

func cmdStatusLines(_ []string, env *Env) Outcome {
	st := env.Runner.Status()
	head := fmt.Sprintf("%-8s %-9s %-7s %-7s %-10s", "SERVICE", "PROCESS", "PORT", "HEALTH", "RSS")
	lines := []string{
		env.st.dim.Render(head),
		env.st.dim.Render(strings.Repeat("─", 48)),
	}
	for _, svc := range runner.All {
		lv := st[svc]
		rss := "-"
		if lv.RSSKB > 0 {
			rss = fmt.Sprintf("%.1f MB", float64(lv.RSSKB)/1024.0)
		}
		lines = append(lines, fmt.Sprintf("%s %s %s %s %s",
			padCell(svc, 8),
			upDownCell(env.st, lv.Process, 7),
			upDownCell(env.st, lv.Port, 7),
			healthCell(env.st, lv.Health, svc, 7),
			padCell(rss, 10),
		))
	}
	return Outcome{OK: true, Lines: lines}
}

// padCell pads plain text to width BEFORE any ANSI wrapping — fmt width
// counts escape bytes, so styling must come after padding.
func padCell(s string, width int) string {
	if len(s) >= width {
		return s
	}
	return s + strings.Repeat(" ", width-len(s))
}

func upDownCell(st styles, ok bool, width int) string {
	if ok {
		return st.ok.Render(padCell("UP", width))
	}
	return st.fail.Render(padCell("DOWN", width))
}

func healthCell(st styles, health bool, svc string, width int) string {
	if svc != runner.Engine && svc != runner.API {
		return st.dim.Render(padCell("-", width))
	}
	if health {
		return st.ok.Render(padCell("UP", width))
	}
	return st.fail.Render(padCell("DOWN", width))
}

func cmdHealthLines(_ []string, env *Env) Outcome {
	eng := process.HealthOK(env.Runner.EngineURL()+"/healthz", 3*time.Second)
	api := process.HealthOK(env.Runner.APIURL()+"/healthz", 3*time.Second)
	lines := []string{
		fmt.Sprintf("engine %s (%s/healthz)", upDownCell(env.st, eng, 0), env.Runner.EngineURL()),
		fmt.Sprintf("api    %s (%s/healthz)", upDownCell(env.st, api, 0), env.Runner.APIURL()),
	}
	return Outcome{OK: eng, Lines: lines}
}

func cmdDoctorLines(_ []string, env *Env) Outcome {
	checks := doctor.Run(env.Cfg, env.Runner, env.Mode)
	lines := make([]string, 0, len(checks))
	ok := true
	for _, c := range checks {
		mark := env.st.ok.Render("✔")
		if !c.OK {
			mark = env.st.fail.Render("✘")
			ok = false
		}
		lines = append(lines, fmt.Sprintf("%s %-16s %s", mark, c.Name, c.Detail))
	}
	return Outcome{OK: ok, Lines: lines}
}

// cmdLogsLines prints the tail of a service log, or with "-f" switches to
// Supervisor-style live follow (tail first, then stream new lines until
// "/logs off" or Ctrl+C).
func cmdLogsLines(args []string, env *Env) Outcome {
	follow := false
	if len(args) > 0 && args[0] == "-f" {
		follow = true
		args = args[1:]
	}
	if len(args) == 1 && args[0] == "off" {
		return Outcome{OK: true, Unfollow: true,
			Lines: []string{env.st.dim.Render("log follow detached")}}
	}
	if len(args) != 1 || (args[0] != runner.Engine && args[0] != runner.API) {
		return invalidUsage(env, "/logs [-f] <engine|api|off>")
	}
	data, err := os.ReadFile(env.Runner.Proc().LogFile(args[0]))
	if err != nil {
		if follow {
			// No log yet (service not started) — still attach: the file may
			// appear when the service boots.
			return Outcome{OK: true, Follow: []string{args[0]},
				Lines: []string{env.st.dim.Render(
					fmt.Sprintf("no log for %s yet — following, waiting for output...", args[0]))}}
		}
		return Outcome{OK: false, Lines: []string{
			env.st.fail.Render(fmt.Sprintf("no log for %s: %v", args[0], err))}}
	}
	all := strings.Split(strings.TrimRight(string(data), "\n"), "\n")
	if len(all) > 50 {
		all = all[len(all)-50:]
	}
	lines := make([]string, 0, len(all))
	for _, ln := range all {
		lines = append(lines, env.st.colorizeServiceLine(args[0], ln))
	}
	if len(lines) == 0 {
		lines = append(lines, env.st.dim.Render("(empty log)"))
	}
	if follow {
		// The TUI attaches the tail and prints its own "following" banner
		// when it processes this outcome — no duplicate footer here.
		return Outcome{OK: true, Follow: []string{args[0]}, Lines: lines}
	}
	return Outcome{OK: true, Lines: lines}
}

func cmdAppLines(args []string, env *Env) Outcome {
	mgr, err := modulemgr.New(env.Cfg.AppsDir)
	if err != nil {
		return Outcome{OK: false, Lines: []string{env.st.fail.Render(err.Error())}}
	}
	if len(args) == 0 || args[0] == "list" {
		apps, err := mgr.List()
		if err != nil {
			return Outcome{OK: false, Lines: []string{env.st.fail.Render(err.Error())}}
		}
		if len(apps) == 0 {
			return Outcome{OK: true, Lines: []string{
				env.st.dim.Render(fmt.Sprintf("no .aap applications installed under %s", env.Cfg.AppsDir))}}
		}
		lines := make([]string, 0, len(apps))
		for _, a := range apps {
			state := env.st.ok.Render("enabled")
			if !a.Enabled {
				state = env.st.dim.Render("disabled")
			}
			lines = append(lines, fmt.Sprintf("%-24s %-10s %s", a.Name, a.Version, state))
		}
		return Outcome{OK: true, Lines: lines}
	}
	if len(args) < 2 {
		return invalidUsage(env, "/app <list|enable|disable> [name]")
	}
	var runErr error
	switch args[0] {
	case "enable":
		runErr = mgr.Enable(args[1])
	case "disable":
		runErr = mgr.Disable(args[1])
	default:
		return invalidUsage(env, "/app <list|enable|disable> [name]")
	}
	if runErr != nil {
		return Outcome{OK: false, Lines: []string{env.st.fail.Render(runErr.Error())}}
	}
	return Outcome{OK: true, Lines: []string{
		env.st.ok.Render(fmt.Sprintf("[OK] %s %s", args[0], args[1]))}}
}

func cmdDBLines(_ []string, env *Env) Outcome {
	st := env.st
	lines := []string{
		fmt.Sprintf("engine    : %s", env.Runner.EngineURL()),
		fmt.Sprintf("mode      : %s", env.Mode),
	}
	switch env.Mode {
	case mode.Databaseless:
		lines = append(lines, st.dim.Render("storage   : none (databaseless mock mode)"))
	case mode.Lite:
		path := env.Cfg.LiteDBPath()
		note := ""
		if _, err := os.Stat(path); err != nil {
			note = st.dim.Render(" (not created yet)")
		}
		lines = append(lines,
			fmt.Sprintf("lite path : %s%s", path, note),
			st.dim.Render("cache     : in-process memory (no external service)"),
		)
	default:
		lines = append(lines,
			fmt.Sprintf("postgres  : %s:%s/%s", env.Cfg.Env["DB_HOST"], env.Cfg.Env["DB_PORT"], env.Cfg.Env["DB_NAME"]),
			fmt.Sprintf("redis     : %s", env.Cfg.Env["REDIS_ADDR"]),
		)
	}
	acc, err := engineapi.FetchDeveloperAccount(env.Runner.EngineURL(), 3*time.Second)
	switch {
	case err != nil:
		lines = append(lines, st.dim.Render("account   : engine unreachable (start it with /start)"))
	case !acc.Exists:
		lines = append(lines, st.dim.Render("account   : none seeded yet"))
	default:
		lines = append(lines,
			fmt.Sprintf("account   : %s <%s>", acc.Username, acc.Email),
			fmt.Sprintf("group     : %s (%s)", acc.Group, acc.GroupID),
		)
		if env.Mode == mode.Lite {
			lines = append(lines, fmt.Sprintf("password  : %s (fixed dev credential)", runner.LiteDeveloperPassword))
		}
	}
	return Outcome{OK: true, Lines: lines}
}

func cmdMode(args []string, env *Env) Outcome {
	if len(args) == 0 {
		return Outcome{OK: true, Lines: []string{
			fmt.Sprintf("session mode: %s", env.Mode)}}
	}
	m, ok := mode.Alias(args[0])
	if !ok {
		return invalidUsage(env, "/mode [prod|dev|dbless]")
	}
	env.Mode = m
	return Outcome{OK: true, Lines: []string{
		env.st.ok.Render(fmt.Sprintf("session mode → %s", m))}}
}

func cmdRecent(args []string, env *Env) Outcome {
	st := env.st
	if len(args) == 0 {
		all := recentSessions(env.Cfg.VerseDir)
		if len(all) == 0 {
			return Outcome{OK: true, Lines: []string{
				st.dim.Render("no past sessions yet")}}
		}
		if len(all) > 12 {
			all = all[:12]
		}
		lines := []string{
			st.dim.Render(fmt.Sprintf("%-10s %-20s %-11s %-6s %s",
				"SESSION", "STARTED", "MODE", "CMDS", "LAST")),
			st.dim.Render(strings.Repeat("─", 64)),
		}
		for _, m := range all {
			last := m.LastCommand
			if len(last) > 28 {
				last = last[:27] + "…"
			}
			lines = append(lines, fmt.Sprintf("%s %-20s %-11s %-6d %s",
				st.sessionID.Render(m.ID),
				m.StartedAt.Format("2006-01-02 15:04:05"),
				m.Mode, m.Commands, last))
		}
		return Outcome{OK: true, Lines: lines}
	}

	meta, ok := findSession(env.Cfg.VerseDir, args[0])
	if !ok {
		return Outcome{OK: false, Lines: []string{
			st.fail.Render(fmt.Sprintf("session %q not found (ambiguous or missing)", args[0]))}}
	}
	events := sessionEvents(meta.Path)
	lines := []string{
		st.periwinkle.Render(fmt.Sprintf("session %s · %s · %s · %d commands",
			meta.ID, meta.StartedAt.Format("2006-10-02 15:04:05"), meta.Mode, meta.Commands)),
	}
	for _, ev := range events {
		switch ev.Type {
		case "command":
			ts := ""
			if t, err := time.Parse(time.RFC3339, ev.TS); err == nil {
				ts = t.Format("15:04:05")
			}
			lines = append(lines, fmt.Sprintf("%s %s",
				st.timestamp.Render(ts), st.accentText.Render(ev.Raw)))
		case "result":
			mark := st.ok.Render("✔")
			if ev.OK != nil && !*ev.OK {
				mark = st.fail.Render("✘")
			}
			lines = append(lines, fmt.Sprintf("  %s %.1fs", mark,
				float64(ev.DurationMS)/1000.0))
		case "session_end":
			lines = append(lines, st.dim.Render(
				fmt.Sprintf("— ended · %d commands —", ev.Commands)))
		}
	}
	return Outcome{OK: true, Lines: lines}
}

func cmdHelp(_ []string, env *Env) Outcome {
	st := env.st
	lines := []string{
		st.header.Render("Termity Base CLI — commands"),
		"",
	}
	for _, c := range registry {
		lines = append(lines, fmt.Sprintf("  %s  %s",
			st.accentText.Render(fmt.Sprintf("%-34s", c.Usage)), st.dim.Render(c.Desc)))
	}
	lines = append(lines,
		"",
		st.dim.Render("  ↑/↓ history · Tab complete · Ctrl+C interrupt/exit · /exit quit"),
		st.dim.Render("  scripts keep the argument form: versetool start dev"),
	)
	return Outcome{OK: true, Lines: lines}
}

func cmdExit(_ []string, _ *Env) Outcome { return Outcome{OK: true} }

// splitCommand parses "/verb arg arg" into verb + args.
func splitCommand(line string) (string, []string) {
	fields := strings.Fields(line)
	if len(fields) == 0 {
		return "", nil
	}
	verb := strings.TrimPrefix(fields[0], "/")
	return verb, fields[1:]
}
