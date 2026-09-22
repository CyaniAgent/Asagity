// Package doctor runs environment and service diagnostics.
package doctor

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/CyaniAgent/Asagity/core/src/Verse.Cli/internal/config"
	"github.com/CyaniAgent/Asagity/core/src/Verse.Cli/internal/mode"
	"github.com/CyaniAgent/Asagity/core/src/Verse.Cli/internal/process"
	"github.com/CyaniAgent/Asagity/core/src/Verse.Cli/internal/runner"
)

// Check is one diagnostic result.
type Check struct {
	Name   string
	OK     bool
	Detail string
}

// Run executes all checks relevant to md.
func Run(cfg *config.Config, r *runner.Runner, md mode.Mode) []Check {
	var out []Check
	add := func(name string, ok bool, detail string) {
		out = append(out, Check{Name: name, OK: ok, Detail: detail})
	}

	add("project-root", true, cfg.ProjectRoot)

	if _, err := os.Stat(filepath.Join(cfg.ProjectRoot, ".env")); err == nil {
		add(".env", true, "present (note: .env values override process env in the engine)")
	} else {
		add(".env", false, "missing; defaults will be used")
	}

	add("go-toolchain", toolOK("go", "version"), versionOf("go", "version"))
	add("dotnet-sdk", toolOK("dotnet", "--list-sdks"), firstLineOf("dotnet", "--list-sdks"))

	engineSrc := filepath.Join(cfg.ProjectRoot, "core", "src", "Verse.Engine")
	_, errEngine := os.Stat(filepath.Join(engineSrc, "go.mod"))
	add("verse-engine-src", errEngine == nil, engineSrc)

	_, errAPI := os.Stat(filepath.Join(cfg.ProjectRoot, "core", "src", "Verse.Api", "Verse.Api.csproj"))
	add("verse-api-src", errAPI == nil, "core/src/Verse.Api")

	if md.NeedsExternalServices() {
		add("docker", toolOK("docker", "info"), versionOf("docker", "version", "--format", "{{.Server.Version}}"))
		pgUp := process.PortOpen("127.0.0.1", dbPort(cfg), 500*time.Millisecond)
		add("postgres-tcp", pgUp, "127.0.0.1:"+dbPort(cfg))
		redisUp := process.PortOpen("127.0.0.1", "6379", 500*time.Millisecond)
		add("redis-tcp", redisUp, "127.0.0.1:6379")
	} else {
		add("external-db", true, "not required in mode="+md.String())
	}

	if md == mode.Lite {
		// Mirror the runner: LITE_SQLITE_PATH under .verse wins when set for
		// the child; otherwise resolve the engine default relative to its cwd.
		candidates := []string{filepath.Join(cfg.VerseDir, "lite", "asagity.db")}
		litePath := firstNonEmpty(cfg.Env["LITE_SQLITE_PATH"], "./data/lite/asagity.db")
		if !filepath.IsAbs(litePath) {
			litePath = filepath.Join(engineSrc, litePath)
		}
		candidates = append(candidates, litePath)
		found := ""
		for _, c := range candidates {
			if _, err := os.Stat(c); err == nil {
				found = c
				break
			}
		}
		if found != "" {
			add("lite-sqlite", true, found)
		} else {
			add("lite-sqlite", false, "not created yet ("+candidates[0]+"); starts on first `versetool start`")
		}
	}

	st := r.Status()
	engHealth := process.HealthOK(r.EngineURL()+"/healthz", 3*time.Second)
	add("engine-process", st[runner.Engine].Process, ":"+cfg.EnginePort)
	add("engine-health", engHealth, r.EngineURL()+"/healthz")

	if md != mode.Databaseless {
		apiHealth := process.HealthOK(r.APIURL()+"/healthz", 3*time.Second)
		add("api-health", apiHealth, r.APIURL()+"/healthz")
	}

	return out
}

// Overall reports whether every check passed.
func Overall(checks []Check) bool {
	for _, c := range checks {
		if !c.OK {
			return false
		}
	}
	return true
}

// Print renders the table; warnings for advisory rows stay visible.
func Print(checks []Check) {
	fmt.Printf("%-18s %-6s %s\n", "CHECK", "STATE", "DETAIL")
	fmt.Println(strings.Repeat("-", 70))
	for _, c := range checks {
		state := "OK"
		if !c.OK {
			state = "FAIL"
		}
		fmt.Printf("%-18s %-6s %s\n", c.Name, state, c.Detail)
	}
}

func toolOK(name string, args ...string) bool {
	return exec.Command(name, args...).Run() == nil
}

func versionOf(name string, args ...string) string {
	out, err := exec.Command(name, args...).Output()
	if err != nil {
		return "unavailable"
	}
	line, _, _ := strings.Cut(string(out), "\n")
	return strings.TrimSpace(line)
}

func firstLineOf(name string, args ...string) string {
	return versionOf(name, args...)
}

func dbPort(cfg *config.Config) string {
	if p, ok := cfg.Env["DB_PORT"]; ok && p != "" {
		return p
	}
	return "5432"
}

func firstNonEmpty(vals ...string) string {
	for _, v := range vals {
		if strings.TrimSpace(v) != "" {
			return v
		}
	}
	return ""
}
