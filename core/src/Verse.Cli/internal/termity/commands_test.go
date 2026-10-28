package termity

import (
	"fmt"
	"os"
	"strings"
	"testing"

	"github.com/CyaniAgent/Asagity/core/src/Verse.Cli/internal/mode"
	"github.com/CyaniAgent/Asagity/core/src/Verse.Cli/internal/runner"
)

func TestSplitCommand(t *testing.T) {
	cases := []struct {
		in   string
		verb string
		args []string
	}{
		{"/start dev", "start", []string{"dev"}},
		{"/start dev api", "start", []string{"dev", "api"}},
		{"/status", "status", nil},
		{"  /logs   engine ", "logs", []string{"engine"}},
		{"", "", nil},
		{"   ", "", nil},
		{"start", "start", nil}, // tolerated: no slash still strips
	}
	for _, c := range cases {
		verb, args := splitCommand(c.in)
		if verb != c.verb {
			t.Errorf("splitCommand(%q) verb = %q, want %q", c.in, verb, c.verb)
		}
		if strings.Join(args, " ") != strings.Join(c.args, " ") {
			t.Errorf("splitCommand(%q) args = %v, want %v", c.in, args, c.args)
		}
	}
}

func TestResolveTarget(t *testing.T) {
	cases := []struct {
		args    []string
		def     mode.Mode
		wantSvc string
		wantMd  mode.Mode
		wantOK  bool
	}{
		{nil, mode.Lite, "all", mode.Lite, true},
		{[]string{"dev"}, mode.Production, "all", mode.Lite, true},
		{[]string{"prod"}, mode.Lite, "all", mode.Production, true},
		{[]string{"dbless"}, mode.Lite, "all", mode.Databaseless, true},
		{[]string{"api"}, mode.Lite, "api", mode.Lite, true},
		{[]string{"dev", "api"}, mode.Production, "api", mode.Lite, true},
		{[]string{"dbless", "engine"}, mode.Lite, "engine", mode.Databaseless, true},
		{[]string{"bogus"}, mode.Lite, "", mode.Lite, false},
		{[]string{"dev", "bogus"}, mode.Lite, "", mode.Lite, false},
	}
	for _, c := range cases {
		svc, md, ok := resolveTarget(c.args, c.def)
		if ok != c.wantOK || svc != c.wantSvc || md != c.wantMd {
			t.Errorf("resolveTarget(%v) = (%q, %v, %v), want (%q, %v, %v)",
				c.args, svc, md, ok, c.wantSvc, c.wantMd, c.wantOK)
		}
	}
}

func TestServiceArg(t *testing.T) {
	if svc, ok := serviceArg(nil); !ok || svc != "all" {
		t.Errorf("serviceArg(nil) = (%q, %v), want (all, true)", svc, ok)
	}
	for _, known := range runner.All {
		if svc, ok := serviceArg([]string{known}); !ok || svc != known {
			t.Errorf("serviceArg(%q) = (%q, %v)", known, svc, ok)
		}
	}
	if _, ok := serviceArg([]string{"bogus"}); ok {
		t.Error("serviceArg(bogus) should fail")
	}
}

func TestSuggest(t *testing.T) {
	cases := []struct{ in, want string }{
		{"stauts", "status"},
		{"statsu", "status"},
		{"strt", "start"},
		{"exi", "exit"},
		{"hlep", "help"},
		{"", ""},
		{"xyzzy", ""}, // edit distance 3+ → no suggestion
	}
	for _, c := range cases {
		if got := suggest(c.in); got != c.want {
			t.Errorf("suggest(%q) = %q, want %q", c.in, got, c.want)
		}
	}
}

func TestLevenshtein(t *testing.T) {
	cases := []struct {
		a, b string
		want int
	}{
		{"", "", 0},
		{"abc", "abc", 0},
		{"abc", "abd", 1},
		{"kitten", "sitting", 3},
		{"status", "stauts", 2},
		{"", "abc", 3},
	}
	for _, c := range cases {
		if got := levenshtein(c.a, c.b); got != c.want {
			t.Errorf("levenshtein(%q, %q) = %d, want %d", c.a, c.b, got, c.want)
		}
	}
}

func TestRegistryShape(t *testing.T) {
	if len(registry) == 0 {
		t.Fatal("registry empty")
	}
	seen := map[string]bool{}
	for _, c := range registry {
		if c.Name == "" || c.Usage == "" || c.Desc == "" || c.Run == nil {
			t.Errorf("command %+v incomplete", c)
		}
		if seen[c.Name] {
			t.Errorf("duplicate command %q", c.Name)
		}
		seen[c.Name] = true
	}
	for _, want := range []string{"start", "stop", "restart", "destroy", "status",
		"health", "doctor", "logs", "app", "db", "mode", "recent", "help", "exit"} {
		if !seen[want] {
			t.Errorf("registry missing /%s", want)
		}
	}
	// destroy is the only inline-confirmed verb.
	for _, c := range registry {
		if c.Name == "destroy" && !c.Confirm {
			t.Error("/destroy must require confirmation")
		}
		if c.Name != "destroy" && c.Confirm {
			t.Errorf("/%s unexpectedly requires confirmation", c.Name)
		}
	}
}

func TestLookup(t *testing.T) {
	if c := lookup("status"); c == nil || c.Name != "status" {
		t.Error("lookup(status) failed")
	}
	if c := lookup("nope"); c != nil {
		t.Error("lookup(nope) should be nil")
	}
	// lookup is exact-match, no fuzzy.
	if c := lookup("stauts"); c != nil {
		t.Error("lookup must not fuzzy-match")
	}
}

func TestCapture(t *testing.T) {
	// fn prints to stdout/stderr; capture must collect both and restore the streams.
	old := os.Stdout
	lines := capture(func() {
		fmt.Println("hello [OK] world")
		fmt.Fprintln(os.Stderr, "second line")
	})
	if os.Stdout != old {
		t.Fatal("capture did not restore os.Stdout")
	}
	if len(lines) != 2 || lines[0] != "hello [OK] world" || lines[1] != "second line" {
		t.Errorf("capture = %q", lines)
	}
}

func TestColorizeRunnerLine(t *testing.T) {
	s := newStyles()
	// Unstyled terminals (tests) still return a string containing the tag.
	cases := []struct{ in, tag string }{
		{"[OK] engine up", "[OK]"},
		{"[WARN] port busy", "[WARN]"},
		{"[KILL] pid 42", "[KILL]"},
		{"[SKIP] redis", "[SKIP]"},
		{"plain output", "plain output"},
	}
	for _, c := range cases {
		if got := s.colorizeRunnerLine(c.in); !strings.Contains(got, c.tag) {
			t.Errorf("colorizeRunnerLine(%q) = %q, want to contain %q", c.in, got, c.tag)
		}
	}
}

func TestModeSwitchOutcome(t *testing.T) {
	st := newStyles()
	env := &Env{Mode: mode.Lite, st: st}

	out := cmdMode(nil, env)
	if !out.OK || !strings.Contains(strings.Join(out.Lines, ""), "lite") {
		t.Errorf("cmdMode(nil) = %+v", out)
	}

	out = cmdMode([]string{"prod"}, env)
	if !out.OK || env.Mode != mode.Production {
		t.Errorf("cmdMode(prod) did not switch: ok=%v mode=%v", out.OK, env.Mode)
	}

	out = cmdMode([]string{"bogus"}, env)
	if out.OK {
		t.Error("cmdMode(bogus) should fail")
	}
}

func TestHelpListsEveryCommand(t *testing.T) {
	st := newStyles()
	out := cmdHelp(nil, &Env{st: st})
	if !out.OK {
		t.Fatal("help failed")
	}
	body := strings.Join(out.Lines, "\n")
	for _, c := range registry {
		if !strings.Contains(body, "/"+c.Name) {
			t.Errorf("help output missing /%s", c.Name)
		}
	}
}

func TestSlashedSuggestions(t *testing.T) {
	got := slashedSuggestions()
	if len(got) != len(registry) {
		t.Fatalf("suggestions = %d, want %d", len(got), len(registry))
	}
	for _, s := range got {
		if !strings.HasPrefix(s, "/") {
			t.Errorf("suggestion %q lacks slash", s)
		}
	}
}
