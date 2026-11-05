package termity

import (
	"fmt"
	"os"
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

	session *Session
	program *tea.Program

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

	m := &model{
		env:     &Env{Cfg: cfg, Runner: r, Mode: md, st: st},
		st:      st,
		input:   ti,
		spin:    sp,
		histIdx: -1,
		session: sess,
		width:   80,
		height:  24,
	}

	// Lock the TUI renderer onto the real stdout BEFORE any command swaps
	// os.Stdout for output capture (capture() must not swallow TUI frames).
	m.program = tea.NewProgram(*m, tea.WithOutput(os.Stdout))

	m.println(m.banner())
	m.println(st.dim.Render("  type /help for commands · session " + st.sessionID.Render(sess.ID)))

	if _, err := m.program.Run(); err != nil {
		sess.Close()
		return err
	}
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
		m.println("")
		return m, textinput.Blink

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
