// Package mode mirrors the Engine runtime modes for the verse CLI.
//
// It is intentionally duplicated from
// core/src/Verse.Engine/internal/platform/mode: Verse.Cli is a separate Go
// module with zero third-party dependencies, so it cannot import Engine code.
// Keep the two in sync when adding modes.
package mode

import (
	"os"
	"strings"
)

// Mode is a server runtime mode.
type Mode string

const (
	// Databaseless runs the mock API without any database.
	Databaseless Mode = "databaseless"
	// Lite runs SQLite plus the in-process memory cache.
	Lite Mode = "lite"
	// Production runs PostgreSQL plus Redis (default).
	Production Mode = "production"
)

// EnvKey selects the mode from the environment.
const EnvKey = "ASAGITY_MODE"

// Default applies when nothing valid is configured.
const Default = Production

// Parse normalizes s into a Mode.
func Parse(s string) (Mode, bool) {
	switch Mode(strings.ToLower(strings.TrimSpace(s))) {
	case Databaseless:
		return Databaseless, true
	case Lite:
		return Lite, true
	case Production:
		return Production, true
	default:
		return Default, false
	}
}

// Start aliases accepted by `versetool start` (and restart).
var startAliases = map[string]Mode{
	"prod":   Production,
	"dev":    Lite,
	"dbless": Databaseless,
}

// Alias resolves a start-mode argument: full names plus prod/dev/dbless.
func Alias(s string) (Mode, bool) {
	if m, ok := Parse(s); ok {
		return m, true
	}
	if m, ok := startAliases[strings.ToLower(strings.TrimSpace(s))]; ok {
		return m, true
	}
	return Default, false
}

// Resolve prefers flagValue, then raw (config file value), then the
// environment, then the default.
func Resolve(flagValue, raw string) Mode {
	if m, ok := Parse(flagValue); ok {
		return m
	}
	if m, ok := Parse(raw); ok {
		return m
	}
	if m, ok := Parse(os.Getenv(EnvKey)); ok {
		return m
	}
	return Default
}

// NeedsExternalServices reports whether dockerized PostgreSQL/Redis are used.
func (m Mode) NeedsExternalServices() bool {
	return m == Production
}

// String returns the wire value.
func (m Mode) String() string {
	return string(m)
}
