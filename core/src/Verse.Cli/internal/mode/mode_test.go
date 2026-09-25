package mode

import "testing"

func TestAlias(t *testing.T) {
	cases := map[string]Mode{
		"prod":       Production,
		"PROD":       Production,
		"dev":        Lite,
		"dbless":     Databaseless,
		"lite":       Lite,
		"production": Production,
		"  dev  ":    Lite,
	}
	for in, want := range cases {
		if got, ok := Alias(in); !ok || got != want {
			t.Errorf("Alias(%q) = %v,%v; want %v,true", in, got, ok, want)
		}
	}
	for _, in := range []string{"", "engine", "all", "bogus"} {
		if _, ok := Alias(in); ok {
			t.Errorf("Alias(%q) unexpectedly matched", in)
		}
	}
}
