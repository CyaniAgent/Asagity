// Package mode defines the Asagity server runtime modes.
//
// Three modes are supported:
//
//	databaseless - UI design / debugger use, no database at all.
//	lite         - developer debugging, SQLite + in-process memory cache.
//	production   - regular deployment, PostgreSQL + Redis (default).
//
// The mode is resolved from the --mode flag first, then the ASAGITY_MODE
// environment variable, and falls back to production when unset or invalid.
package mode

import (
	"flag"
	"os"
	"strings"
)

// Mode is a server runtime mode.
type Mode string

const (
	// Databaseless runs without any database; the mock API serves fixed data.
	Databaseless Mode = "databaseless"
	// Lite runs with SQLite and an in-process memory cache; zero external processes.
	Lite Mode = "lite"
	// Production runs with PostgreSQL and Redis.
	Production Mode = "production"
)

// EnvKey is the environment variable that selects the runtime mode.
const EnvKey = "ASAGITY_MODE"

// FlagName is the CLI flag that overrides the environment variable.
const FlagName = "mode"

// Default is used when no mode is configured or the value is invalid.
const Default = Production

// Parse normalizes s into a Mode. It reports false for unknown values.
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

// FromEnv resolves the mode from the environment, defaulting to production.
func FromEnv() Mode {
	if m, ok := Parse(os.Getenv(EnvKey)); ok {
		return m
	}
	return Default
}

// Resolve prefers flagValue over raw (usually config-loaded env), then the
// environment, and finally the default. Empty and invalid values fall through.
func Resolve(flagValue, raw string) Mode {
	if m, ok := Parse(flagValue); ok {
		return m
	}
	if m, ok := Parse(raw); ok {
		return m
	}
	return FromEnv()
}

// RegisterFlag registers the --mode flag on fs and returns its pointer.
func RegisterFlag(fs *flag.FlagSet) *string {
	return fs.String(FlagName, "", "runtime mode: databaseless|lite|production (overrides "+EnvKey+")")
}

// RequiresDatabase reports whether the mode needs any database at all.
func (m Mode) RequiresDatabase() bool {
	return m != Databaseless
}

// NeedsExternalServices reports whether the mode needs PostgreSQL/Redis processes.
func (m Mode) NeedsExternalServices() bool {
	return m == Production
}

// String returns the wire value of the mode.
func (m Mode) String() string {
	return string(m)
}
