package termity

import (
	"testing"
)

// TestThemeSnapshots pins the Yukinoshita Glacier hexes to prevent palette
// drift between the web theme and the CLI. Values come from
// web/src/theme/yukinoshita-glacier/glacier.palette.ts.
func TestThemeSnapshots(t *testing.T) {
	dark := glacierDark
	wantDark := map[string]string{
		"accent":        "#7fc9f0", // glacier 75
		"textPrimary":   "#dee3e9", // frost 90
		"textSecondary": "#8a9299", // frost 60
		"success":       "#52d2a4", // aurora 70
		"danger":        "#f58ca5", // berry 80
		"warning":       "#f2be5a", // melt 75
		"surface":       "#001f2f", // glacier 10
		"body":          "#001421", // glacier 5
		"periwinkle":    "#acb2f2", // periwinkle 80
	}
	gotDark := map[string]string{
		"accent":        dark.accent,
		"textPrimary":   dark.textPrimary,
		"textSecondary": dark.textSecondary,
		"success":       dark.success,
		"danger":        dark.danger,
		"warning":       dark.warning,
		"surface":       dark.surface,
		"body":          dark.body,
		"periwinkle":    dark.periwinkle,
	}
	for k, want := range wantDark {
		if gotDark[k] != want {
			t.Errorf("dark.%s = %q, want %q", k, gotDark[k], want)
		}
	}

	// Light side sanity: distinct from dark, non-empty hexes.
	light := glacierLight
	for name, dv := range gotDark {
		lv := map[string]string{
			"accent": light.accent, "textPrimary": light.textPrimary,
			"textSecondary": light.textSecondary, "success": light.success,
			"danger": light.danger, "warning": light.warning,
			"surface": light.surface, "body": light.body,
			"periwinkle": light.periwinkle,
		}[name]
		if lv == "" || lv == dv {
			t.Errorf("light.%s = %q (dark %q) — must be a distinct hex", name, lv, dv)
		}
	}
}

// TestThemeSelection checks TERMITY_TUI_THEME switching.
func TestThemeSelection(t *testing.T) {
	t.Setenv("TERMITY_TUI_THEME", "light")
	if s := newStyles(); s.pal.accent != glacierLight.accent {
		t.Errorf("light theme not selected: accent %q", s.pal.accent)
	}

	t.Setenv("TERMITY_TUI_THEME", "dark")
	if s := newStyles(); s.pal.accent != glacierDark.accent {
		t.Errorf("dark theme not selected: accent %q", s.pal.accent)
	}

	// Unknown/absent → dark (terminal-first default).
	t.Setenv("TERMITY_TUI_THEME", "banana")
	if s := newStyles(); s.pal.accent != glacierDark.accent {
		t.Errorf("unknown theme should fall back to dark: accent %q", s.pal.accent)
	}
}

// TestColorizeTags verifies each runner tag maps to the intended style.
func TestColorizeTags(t *testing.T) {
	s := newStyles()
	// Style identity: compare Render output of the tag against the style's own render.
	if got, want := s.colorizeRunnerLine("[OK] up"), s.ok.Render("[OK] up"); got != want {
		t.Error("[OK] should render with the success style")
	}
	if got, want := s.colorizeRunnerLine("[WARN] hmm"), s.warn.Render("[WARN] hmm"); got != want {
		t.Error("[WARN] should render with the warning style")
	}
	if got, want := s.colorizeRunnerLine("[FAIL] boom"), s.fail.Render("[FAIL] boom"); got != want {
		t.Error("[FAIL] should render with the fail style")
	}
	if got := s.colorizeRunnerLine("no tag here"); got != "no tag here" {
		t.Errorf("plain line should pass through, got %q", got)
	}
}
