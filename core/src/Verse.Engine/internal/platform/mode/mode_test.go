package mode

import (
	"flag"
	"testing"
)

func TestParse(t *testing.T) {
	cases := map[string]Mode{
		"databaseless": Databaseless,
		"Lite":         Lite,
		" PRODUCTION ": Production,
		"":             Default,
		"bogus":        Default,
	}
	for in, want := range cases {
		got, ok := Parse(in)
		if in == "" || in == "bogus" {
			if ok || got != Default {
				t.Errorf("Parse(%q) = %v,%v; want %v,false", in, got, ok, Default)
			}
			continue
		}
		if !ok || got != want {
			t.Errorf("Parse(%q) = %v,%v; want %v,true", in, got, ok, want)
		}
	}
}

func TestResolvePrecedence(t *testing.T) {
	t.Setenv(EnvKey, "lite")
	if got := Resolve("--unused--", ""); got != Lite {
		t.Errorf("Resolve env: got %v, want lite", got)
	}
	if got := Resolve("databaseless", "lite"); got != Databaseless {
		t.Errorf("Resolve flag wins: got %v, want databaseless", got)
	}
	if got := Resolve("", ""); got != Lite {
		t.Errorf("Resolve env fallback: got %v, want lite", got)
	}
	t.Setenv(EnvKey, "")
	if got := Resolve("", ""); got != Production {
		t.Errorf("Resolve default: got %v, want production", got)
	}
}

func TestRegisterFlag(t *testing.T) {
	fs := flag.NewFlagSet("test", flag.ContinueOnError)
	p := RegisterFlag(fs)
	if err := fs.Parse([]string{"--mode=lite"}); err != nil {
		t.Fatalf("Parse: %v", err)
	}
	if *p != "lite" {
		t.Errorf("flag value = %q, want lite", *p)
	}
}

func TestPredicates(t *testing.T) {
	if Databaseless.RequiresDatabase() {
		t.Error("databaseless must not require a database")
	}
	if !Lite.RequiresDatabase() || !Production.RequiresDatabase() {
		t.Error("lite/production must require a database")
	}
	if !Production.NeedsExternalServices() {
		t.Error("production must need external services")
	}
	if Lite.NeedsExternalServices() || Databaseless.NeedsExternalServices() {
		t.Error("lite/databaseless must not need external services")
	}
}
