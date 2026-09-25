package main

import (
	"testing"

	"github.com/CyaniAgent/Asagity/core/src/Verse.Cli/internal/mode"
)

func TestResolveStart(t *testing.T) {
	cases := []struct {
		name string
		args []string
		flag string
		svc  string
		md   mode.Mode
	}{
		{"bare start is production", nil, "", "all", mode.Production},
		{"start prod", []string{"prod"}, "", "all", mode.Production},
		{"start dev", []string{"dev"}, "", "all", mode.Lite},
		{"start dbless", []string{"dbless"}, "", "all", mode.Databaseless},
		{"start dev api", []string{"dev", "api"}, "", "api", mode.Lite},
		{"start engine keeps production", []string{"engine"}, "", "engine", mode.Production},
		{"flag wins over alias", []string{"dbless"}, "lite", "all", mode.Lite},
		{"flag alone", nil, "databaseless", "all", mode.Databaseless},
		{"bad flag falls back to alias", []string{"dev"}, "bogus", "all", mode.Lite},
	}
	for _, c := range cases {
		svc, md := resolveStart(c.args, c.flag)
		if svc != c.svc || md != c.md {
			t.Errorf("%s: got (%q,%v); want (%q,%v)", c.name, svc, md, c.svc, c.md)
		}
	}
}
