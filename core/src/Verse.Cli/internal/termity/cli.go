package termity

import (
	"bytes"
	"fmt"
	"io"
	"os"
	"sort"
	"strings"
	"time"

	"charm.land/bubbles/v2/spinner"
	"charm.land/bubbles/v2/textinput"
	tea "charm.land/bubbletea/v2"
	"github.com/CyaniAgent/Asagity/core/src/Verse.Cli/internal/config"
	"github.com/CyaniAgent/Asagity/core/src/Verse.Cli/internal/mode"
	"github.com/CyaniAgent/Asagity/core/src/Verse.Cli/internal/runner"
)

// maxTranscript bounds the rendered history (older lines drop off-screen but
// stay in the session journal).
const maxTranscript = 500

// resultMsg carries an async command outcome back into the render loop.
type resultMsg struct {
	raw     string
	outcome Outcome
	took    time.Duration
}

// liveMsg is one streamed line: runner progress during a command, or a
// service log line from an attached follow tail.
type liveMsg struct {
	svc  string // "" for runner progress, service name for log tails
	line string // RAW (uncolored) line — styling happens on the render side
}

// model is the REPL state.
type model struct {
	env *Env
	st  styles

	input     textinput.Model
	spin      spinner.Model
	spinnerOn bool

	transcript []string
	history    []string // input history of THIS session only
	histIdx    int      // -1 = not navigating

	confirm     *command // pending destructive command awaiting y/N
	confirmArgs []string

	running      bool
	runningLabel string // "/verb" shown next to the spinner
	interrupt    bool   // Ctrl+C pressed while a command runs

	// Live log follow (Supervisor-style): attached service tails. Each
	// entry owns a stop channel; closing it ends that tail goroutine.
	following map[string]chan struct{}

	session *Session
	send    func(tea.Msg) // inject a message into the program from any goroutine

	width, height int
	quitting      bool
}

// Run launches the Termity Base CLI. Returns after /exit or Ctrl+C/D.
func Run(cfg *config.Config, r *runner.Runner, md mode.Mode) error {
	st := newStyles()

	sess, err := beginSession(cfg.VerseDir, time.Now(), md.String(), cfg.EnginePort, cfg.APIPort)
	if err != nil {
		return fmt.Errorf("session journal: %w", err)
	}

	ti := textinput.New()
	ti.Placeholder = "/help"
	ti.Prompt = ""
	ti.ShowSuggestions = true
	ti.SetSuggestions(slashedSuggestions())
	// Focus is a pointer method: it must run on the struct BEFORE the program
	// takes its first copy. Calling it inside Init() (value receiver) would
	// only set focus on a stack copy, and textinput drops every key while
	// unfocused.
	ti.Focus()

	sp := spinner.New(spinner.WithSpinner(spinner.Dot))
	sp.Style = st.accentText

	// The program is captured by reference so the model copy living INSIDE
	// bubbletea can still inject messages from handler/tail goroutines —
	// its own program field is nil (the struct was copied before assignment).
	var prog *tea.Program
	send := func(msg tea.Msg) {
		if prog != nil {
			prog.Send(msg)
		}
	}

	m := &model{
		env:       &Env{Cfg: cfg, Runner: r, Mode: md, st: st},
		st:        st,
		input:     ti,
		spin:      sp,
		histIdx:   -1,
		session:   sess,
		following: map[string]chan struct{}{},
		send:      send,
		width:     80,
		height:    24,
	}
	m.env.LiveRunner = func(line string) { send(liveMsg{line: line}) }
	m.env.LiveLog = func(svc, line string) { send(liveMsg{svc: svc, line: line}) }

	// Lock the TUI renderer onto the real stdout BEFORE any command swaps
	// os.Stdout for output capture (capture() must not swallow TUI frames).
	prog = tea.NewProgram(*m, tea.WithOutput(os.Stdout))

	m.println(m.banner())
	m.println(st.dim.Render("  type /help for commands · session " + st.sessionID.Render(sess.ID)))

	if _, err := prog.Run(); err != nil {
		m.stopAllFollow()
		sess.Close()
		return err
	}
	m.stopAllFollow()
	sess.Close()
	// Epilogue on the real terminal, outside the alt-screen-free renderer.
	fmt.Printf("\n%s session %s · %d commands · /recent to revisit\n",
		m.st.dim.Render("bye ·"), m.st.sessionID.Render(sess.ID), sess.Commands())
	return nil
}

func slashedSuggestions() []string {
	out := make([]string, 0, len(registry))
	for _, c := range registry {
		out = append(out, "/"+c.Name)
	}
	return out
}

// startFollow attaches a Supervisor-style live tail of a service's log file.
// Idempotent: an already-tailed service is left alone. The tail goroutine
// polls (no fsnotify dependency), tolerates the file not existing yet, and
// resets on truncation/rotation.
func (m *model) startFollow(svc string) {
	if m.following == nil {
		m.following = map[string]chan struct{}{}
	}
	if _, live := m.following[svc]; live {
		return
	}
	stop := make(chan struct{})
	m.following[svc] = stop
	path := m.env.Runner.Proc().LogFile(svc)
	send := m.send
	st := m.st
	m.println(st.dim.Render(fmt.Sprintf("— following %s log (Ctrl+C or /logs off to stop) —", svc)))
	go tailFile(path, svc, stop, func(line string) {
		send(liveMsg{svc: svc, line: line}) // styled on the render side
	})
}

// stopFollow detaches one service tail.
func (m *model) stopFollow(svc string) {
	if stop, ok := m.following[svc]; ok {
		close(stop)
		delete(m.following, svc)
		m.println(m.st.dim.Render(fmt.Sprintf("— detached %s log —", svc)))
	}
}

// stopAllFollow detaches every tail (called on exit paths).
func (m *model) stopAllFollow() {
	for svc, stop := range m.following {
		close(stop)
		delete(m.following, svc)
	}
}

// followingList returns the attached services in stable order for the
// status row.
func (m *model) followingList() []string {
	if len(m.following) == 0 {
		return nil
	}
	out := make([]string, 0, len(m.following))
	for svc := range m.following {
		out = append(out, svc)
	}
	sort.Strings(out)
	return out
}

// tailFile streams newly appended lines of path to emit, starting at the
// current end of file. Polls every 300ms; exits when stop closes. Rotation
// is detected via inode identity (os.SameFile) — size comparison alone
// misses the case where the new file is LARGER than the old offset — and
// in-place truncation via the size shrinking below the offset.
func tailFile(path, svc string, stop <-chan struct{}, emit func(string)) {
	var offset int64
	var identity os.FileInfo // inode of the file currently being tailed
	if fi, err := os.Stat(path); err == nil {
		identity = fi
		offset = fi.Size() // follow new output only; use /logs for history
	}
	tick := time.NewTicker(300 * time.Millisecond)
	defer tick.Stop()
	var partial []byte // remainder of a line split across reads
	for {
		select {
		case <-stop:
			return
		case <-tick.C:
		}
		fi, err := os.Stat(path)
		if err != nil {
			continue // not created yet — keep waiting
		}
		rotated := identity != nil && !os.SameFile(identity, fi)
		if rotated || fi.Size() < offset {
			offset, partial = 0, nil // rotated (new inode) or truncated
		}
		identity = fi
		if fi.Size() == offset {
			continue
		}
		f, err := os.Open(path)
		if err != nil {
			continue
		}
		if _, err := f.Seek(offset, io.SeekStart); err == nil {
			chunk := make([]byte, fi.Size()-offset)
			if n, _ := f.Read(chunk); n > 0 {
				offset += int64(n)
				partial = append(partial, chunk[:n]...)
				for {
					i := bytes.IndexByte(partial, '\n')
					if i < 0 {
						break
					}
					line := strings.TrimRight(string(partial[:i]), "\r")
					partial = partial[i+1:]
					if line != "" {
						emit(line)
					}
				}
			}
		}
		_ = f.Close()
	}
}

// banner is the startup header.
func (m model) banner() string {
	head := fmt.Sprintf("Termity Base CLI · asagity verse tool · mode=%s · engine :%s · api :%s",
		m.env.Mode, m.env.Cfg.EnginePort, m.env.Cfg.APIPort)
	return m.st.header.Render(head)
}

// println appends rendered lines to the transcript (bounded).
func (m *model) println(lines ...string) {
	m.transcript = append(m.transcript, lines...)
	if len(m.transcript) > maxTranscript {
		m.transcript = m.transcript[len(m.transcript)-maxTranscript:]
	}
}

// Init starts the cursor blink (focus was already set on the input at
// construction time — see Run).
func (m model) Init() tea.Cmd {
	return textinput.Blink
}

// Update is the message pump.
func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.width, m.height = msg.Width, msg.Height
		return m, nil

	case resultMsg:
		m.running = false
		m.runningLabel = ""
		m.spinnerOn = false
		m.interrupt = false
		m.session.LogResult(msg.raw, msg.outcome.OK, msg.took)
		if len(msg.outcome.Lines) > 0 {
			m.println(msg.outcome.Lines...)
		}
		// Supervisor-style: a successful /start (or /logs -f) attaches live
		// log tails; /stop /destroy detach them.
		if msg.outcome.OK {
			for _, svc := range msg.outcome.Follow {
				m.startFollow(svc)
			}
			if msg.outcome.Unfollow {
				m.stopAllFollow()
			}
		}
		m.println("")
		return m, textinput.Blink

	case liveMsg:
		if msg.svc != "" {
			m.println(m.st.colorizeServiceLine(msg.svc, msg.line))
		} else {
			m.println(m.st.colorizeRunnerLine(msg.line))
		}
		return m, nil

	case spinner.TickMsg:
		if !m.spinnerOn {
			return m, nil
		}
		var cmd tea.Cmd
		m.spin, cmd = m.spin.Update(msg)
		return m, cmd

	case tea.KeyPressMsg:
		return m.handleKey(msg)
	}
	return m, nil
}

// handleKey routes keyboard input between REPL states.
func (m model) handleKey(msg tea.KeyPressMsg) (tea.Model, tea.Cmd) {
	// Global: Ctrl+D quits when idle; Ctrl+C interrupts running work first.
	if msg.String() == "ctrl+d" && !m.running {
		m.quitting = true
		return m, tea.Quit
	}
	if msg.String() == "ctrl+c" {
		if m.running && !m.interrupt {
			m.interrupt = true
			m.println(m.st.warn.Render(
				"⚠ command still running — its result will be discarded; Ctrl+C again to force quit"))
			return m, nil
		}
		// Idle with live log tails: first Ctrl+C detaches them (Supervisor
		// style), second one quits.
		if !m.running && len(m.following) > 0 {
			svcs := m.followingList()
			m.stopAllFollow()
			m.println(m.st.dim.Render("— detached " + strings.Join(svcs, ", ") + " log(s) —"))
			return m, nil
		}
		m.quitting = true
		return m, tea.Quit
	}

	if m.running {
		return m, nil // swallow input while a command runs
	}

	if m.confirm != nil {
		return m.handleConfirm(msg)
	}

	switch msg.String() {
	case "enter":
		return m.submit()
	case "up":
		return m.historyMove(-1)
	case "down":
		return m.historyMove(1)
	case "tab":
		return m.complete(), nil
	}

	var cmd tea.Cmd
	m.input, cmd = m.input.Update(msg)
	return m, cmd
}

// handleConfirm evaluates the y/N answer for a destructive command.
func (m model) handleConfirm(msg tea.KeyPressMsg) (tea.Model, tea.Cmd) {
	switch msg.String() {
	case "enter":
		answer := strings.ToLower(strings.TrimSpace(m.input.Value()))
		m.input.Reset()
		m.input.ShowSuggestions = true
		pending, args := m.confirm, m.confirmArgs
		m.confirm, m.confirmArgs = nil, nil
		if answer == "y" || answer == "yes" {
			return m.dispatch(pending, args)
		}
		m.println(m.st.dim.Render("aborted"))
		m.println("")
		return m, textinput.Blink
	case "esc":
		m.confirm, m.confirmArgs = nil, nil
		m.input.Reset()
		m.input.ShowSuggestions = true
		m.println(m.st.dim.Render("aborted"))
		return m, textinput.Blink
	}
	var cmd tea.Cmd
	m.input, cmd = m.input.Update(msg)
	return m, cmd
}

// submit parses the input line and dispatches or rejects it.
func (m model) submit() (tea.Model, tea.Cmd) {
	line := strings.TrimSpace(m.input.Value())
	if line == "" {
		return m, nil
	}
	m.input.Reset()
	m.histIdx = -1
	m.history = append(m.history, line)
	m.println(fmt.Sprintf("%s %s", m.st.timestamp.Render(nowClock()),
		m.st.accentText.Render(line)))

	if !strings.HasPrefix(line, "/") {
		m.println(m.st.warn.Render("unknown command — type /help (commands start with /)"))
		m.println("")
		return m, textinput.Blink
	}

	verb, args := splitCommand(line)
	if verb == "exit" {
		m.quitting = true
		return m, tea.Quit
	}
	cmd := lookup(verb)
	if cmd == nil {
		if s := suggest(verb); s != "" {
			m.println(m.st.warn.Render(fmt.Sprintf("unknown command /%s — did you mean /%s ?", verb, s)))
		} else {
			m.println(m.st.warn.Render(fmt.Sprintf("unknown command /%s — type /help", verb)))
		}
		m.println("")
		return m, textinput.Blink
	}

	if cmd.Confirm {
		m.confirm, m.confirmArgs = cmd, args
		m.input.Reset()
		// Hide command suggestions while answering y/N — otherwise the ghost
		// text of the first suggestion leaks into the confirm prompt.
		m.input.ShowSuggestions = false
		m.println(m.st.confirm.Render(
			fmt.Sprintf("force-kill %s — no graceful shutdown. type y to confirm, esc to abort",
				serviceOrAll(args))))
		return m, textinput.Blink
	}
	return m.dispatch(cmd, args)
}

// dispatch runs the command handler on a goroutine and spins meanwhile.
// The handler swaps os.Stdout for capture; the renderer is pinned to the
// original stdout so TUI frames never leak into the pipe.
func (m model) dispatch(cmd *command, args []string) (tea.Model, tea.Cmd) {
	raw := "/" + cmd.Name
	if len(args) > 0 {
		raw += " " + strings.Join(args, " ")
	}
	m.session.LogCommand(raw)
	m.running = true
	m.runningLabel = raw
	m.spinnerOn = true

	env := m.env
	work := func() tea.Msg {
		start := time.Now()
		outcome := cmd.Run(args, env)
		return resultMsg{raw: raw, outcome: outcome, took: time.Since(start)}
	}
	return m, tea.Batch(m.spin.Tick, work)
}

// serviceOrAll renders the /destroy confirmation target.
func serviceOrAll(args []string) string {
	if len(args) == 0 {
		return "all services"
	}
	return args[0]
}

// historyMove walks this session's input history (fresh on every CLI start).
func (m model) historyMove(delta int) (tea.Model, tea.Cmd) {
	if len(m.history) == 0 {
		return m, nil
	}
	idx := m.histIdx + delta
	switch {
	case idx < -1:
		return m, nil
	case idx >= len(m.history):
		return m, nil
	}
	m.histIdx = idx
	if idx == -1 {
		m.input.SetValue("")
	} else {
		m.input.SetValue(m.history[len(m.history)-1-idx])
	}
	return m, nil
}

// complete expands the input to the single matching suggestion.
func (m model) complete() tea.Model {
	val := m.input.Value()
	if val == "" || !strings.HasPrefix(val, "/") {
		return m
	}
	var match string
	count := 0
	for _, s := range commandNames() {
		name := "/" + s
		if strings.HasPrefix(name, val) {
			match = name
			count++
		}
	}
	if count == 1 {
		m.input.SetValue(match)
	}
	return m
}

// View renders: header, transcript (bottom-anchored), then confirm/input row.
func (m model) View() tea.View {
	if m.quitting {
		return tea.NewView("")
	}
	var b strings.Builder
	b.WriteString(m.banner())
	b.WriteString("\n\n")

	visible := m.height - 6
	if visible < 5 {
		visible = 5
	}
	lines := m.transcript
	if len(lines) > visible {
		lines = lines[len(lines)-visible:]
	}
	for _, ln := range lines {
		b.WriteString(ln)
		b.WriteString("\n")
	}

	b.WriteString(m.st.border.Render(strings.Repeat("─", max(8, m.width-1))))
	b.WriteString("\n")

	if m.confirm != nil {
		b.WriteString(m.st.confirm.Render("confirm ▸ "))
		b.WriteString(m.input.View())
		b.WriteString(m.st.dim.Render("  [y/N/esc]"))
	} else if m.running {
		b.WriteString(m.spin.View() + " ")
		b.WriteString(m.st.dim.Render(m.runningLabel))
	} else {
		b.WriteString(m.st.prompt.Render("▸ "))
		b.WriteString(m.input.View())
	}
	if svcs := m.followingList(); len(svcs) > 0 {
		b.WriteString("\n")
		b.WriteString(m.st.dim.Render("  ⚡ live: " + strings.Join(svcs, " · ") + "  (Ctrl+C detaches)"))
	}
	return tea.NewView(b.String())
}

// nowClock formats the transcript timestamp.
func nowClock() string {
	return time.Now().Format("15:04:05")
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}
