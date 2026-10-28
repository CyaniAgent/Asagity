// Package termity implements the Termity Base CLI: the interactive REPL
// front-end of versetool (semantic /commands, session journal, themed TUI).
package termity

import (
	"os"
	"strings"

	"charm.land/lipgloss/v2"
)

// Theme palette: Yukinoshita Glacier (2026.Q4 season) — the same tokens the
// web frontend loads from src/theme/yukinoshita-glacier. Values here are the
// resolved hexes of the semantic token arrays [light, dark]; the CLI is
// dark-first (terminals), override with TERMITY_TUI_THEME=light|dark.
type palette struct {
	accent        string
	textPrimary   string
	textSecondary string
	success       string
	danger        string
	warning       string
	surface       string
	body          string
	periwinkle    string
	border        string
}

var (
	glacierDark = palette{
		accent:        "#7fc9f0", // glacier 75
		textPrimary:   "#dee3e9", // frost 90
		textSecondary: "#8a9299", // frost 60
		success:       "#52d2a4", // aurora 70
		danger:        "#f58ca5", // berry 80
		warning:       "#f2be5a", // melt 75
		surface:       "#001f2f", // glacier 10
		body:          "#001421", // glacier 5
		periwinkle:    "#acb2f2", // periwinkle 80
		border:        "#00415c", // glacier 25
	}
	glacierLight = palette{
		accent:        "#2e76b8", // glacier 60
		textPrimary:   "#0f1114", // frost 5
		textSecondary: "#595f66", // frost 40
		success:       "#19795a", // aurora 50
		danger:        "#c73e5f", // berry 60
		warning:       "#b26018", // melt 65
		surface:       "#ffffff",
		body:          "#eef2f6", // frost 95 (approx)
		periwinkle:    "#6a6dbc", // periwinkle 50
		border:        "#cfd5db", // frost 85
	}
)

// styles holds the resolved lipgloss styles for the active palette.
type styles struct {
	pal        palette
	prompt     lipgloss.Style // ▸ input caret prefix
	input      lipgloss.Style
	border     lipgloss.Style
	header     lipgloss.Style
	timestamp  lipgloss.Style
	dim        lipgloss.Style
	ok         lipgloss.Style
	warn       lipgloss.Style
	fail       lipgloss.Style
	skip       lipgloss.Style
	accentText lipgloss.Style
	periwinkle lipgloss.Style
	confirm    lipgloss.Style
	sessionID  lipgloss.Style
}

// newStyles resolves the palette. TERMITY_TUI_THEME=light|dark forces a side;
// default is dark (terminal-first). Unknown values fall back to dark.
func newStyles() styles {
	pal := glacierDark
	switch strings.ToLower(os.Getenv("TERMITY_TUI_THEME")) {
	case "light":
		pal = glacierLight
	}
	s := styles{pal: pal}
	s.prompt = lipgloss.NewStyle().Foreground(lipgloss.Color(pal.accent)).Bold(true)
	s.input = lipgloss.NewStyle().Foreground(lipgloss.Color(pal.textPrimary))
	s.border = lipgloss.NewStyle().Foreground(lipgloss.Color(pal.border))
	s.header = lipgloss.NewStyle().Foreground(lipgloss.Color(pal.accent)).Bold(true)
	s.timestamp = lipgloss.NewStyle().Foreground(lipgloss.Color(pal.textSecondary))
	s.dim = lipgloss.NewStyle().Foreground(lipgloss.Color(pal.textSecondary))
	s.ok = lipgloss.NewStyle().Foreground(lipgloss.Color(pal.success))
	s.warn = lipgloss.NewStyle().Foreground(lipgloss.Color(pal.warning))
	s.fail = lipgloss.NewStyle().Foreground(lipgloss.Color(pal.danger))
	s.skip = lipgloss.NewStyle().Foreground(lipgloss.Color(pal.textSecondary))
	s.accentText = lipgloss.NewStyle().Foreground(lipgloss.Color(pal.accent))
	s.periwinkle = lipgloss.NewStyle().Foreground(lipgloss.Color(pal.periwinkle))
	s.confirm = lipgloss.NewStyle().Foreground(lipgloss.Color(pal.warning)).Bold(true)
	s.sessionID = lipgloss.NewStyle().Foreground(lipgloss.Color(pal.periwinkle))
	return s
}

// colorizeRunnerLine paints the runner's "[TAG] ..." prefixes.
func (s styles) colorizeRunnerLine(line string) string {
	trimmed := strings.TrimLeft(line, " ")
	switch {
	case strings.HasPrefix(trimmed, "[OK]"), strings.HasPrefix(trimmed, "[PASS]"):
		return s.ok.Render(line)
	case strings.HasPrefix(trimmed, "[WARN]"):
		return s.warn.Render(line)
	case strings.HasPrefix(trimmed, "[KILL]"), strings.HasPrefix(trimmed, "[FAIL]"):
		return s.fail.Render(line)
	case strings.HasPrefix(trimmed, "[SKIP]"):
		return s.skip.Render(line)
	case strings.HasPrefix(trimmed, "[STOP]"), strings.HasPrefix(trimmed, "[DB]"):
		return s.accentText.Render(line)
	default:
		return line
	}
}
