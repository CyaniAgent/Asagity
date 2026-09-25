// Package runner starts, stops and inspects services per runtime mode.
//
// Managed processes:
//
//	engine - Go verse-engine daemon (HTTP on SERVER_PORT)
//	api    - C# Verse.Api via dotnet (HTTP on VERSE_API_PORT)
//	db     - postgres container (production only)
//	redis  - redis container (production only)
package runner

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"time"

	"github.com/CyaniAgent/Asagity/core/src/Verse.Cli/internal/config"
	"github.com/CyaniAgent/Asagity/core/src/Verse.Cli/internal/mode"
	"github.com/CyaniAgent/Asagity/core/src/Verse.Cli/internal/process"
)

// Service names.
const (
	Engine = "engine"
	API    = "api"
	DB     = "db"
	Redis  = "redis"
)

// All lists every manageable service.
var All = []string{Engine, API, DB, Redis}

// ForMode lists the services that should run under md.
func ForMode(md mode.Mode) []string {
	switch md {
	case mode.Databaseless:
		return []string{Engine}
	case mode.Lite:
		return []string{Engine, API}
	default:
		return []string{DB, Redis, Engine, API}
	}
}

// Runner supervises services for one config.
type Runner struct {
	cfg  *config.Config
	proc *process.Manager
}

// New creates a runner (creating .verse pid/log dirs).
func New(cfg *config.Config) (*Runner, error) {
	proc, err := process.New(cfg.VerseDir)
	if err != nil {
		return nil, err
	}
	return &Runner{cfg: cfg, proc: proc}, nil
}

// Proc exposes the process manager (logs/status reuse it).
func (r *Runner) Proc() *process.Manager { return r.proc }

// EngineURL is the engine base URL.
func (r *Runner) EngineURL() string { return "http://127.0.0.1:" + r.cfg.EnginePort }

// APIURL is the Verse.Api base URL.
func (r *Runner) APIURL() string { return "http://127.0.0.1:" + r.cfg.APIPort }

// Start boots svc (or every service for md when svc is "all"/"").
func (r *Runner) Start(svc string, md mode.Mode) error {
	targets := ForMode(md)
	if svc != "" && svc != "all" {
		targets = []string{svc}
	}
	var failed []string
	for _, t := range targets {
		if err := r.startOne(t, md); err != nil {
			fmt.Printf("[FAIL] %s: %v\n", t, err)
			failed = append(failed, t)
			continue
		}
	}
	if len(failed) > 0 {
		return fmt.Errorf("failed: %s", join(failed))
	}
	return nil
}

func (r *Runner) startOne(svc string, md mode.Mode) error {
	switch svc {
	case Engine:
		return r.startEngine(md)
	case API:
		return r.startAPI(md)
	case DB:
		return r.composeUp("postgres")
	case Redis:
		return r.composeUp("redis")
	default:
		return fmt.Errorf("unknown service %q (want all|engine|api|db|redis)", svc)
	}
}

// startEngine builds the daemon once and runs the single binary directly
// (never `go run`: its child would outlive the supervised parent).
func (r *Runner) startEngine(md mode.Mode) error {
	dir := filepath.Join(r.cfg.ProjectRoot, "core", "src", "Verse.Engine")
	if _, err := os.Stat(dir); err != nil {
		return fmt.Errorf("engine dir missing: %s", dir)
	}
	bin := filepath.Join(r.cfg.VerseDir, "bin", "verse-engine")
	if out, err := buildCmd(dir, "go", "build", "-o", bin, "./cmd/verse-engine"); err != nil {
		return fmt.Errorf("build verse-engine: %v\n%s", err, out)
	}
	pid, err := r.proc.Spawn(Engine, dir, map[string]string{
		"ASAGITY_MODE":     md.String(),
		"SERVER_PORT":      r.cfg.EnginePort,
		"LITE_SQLITE_PATH": filepath.Join(r.cfg.VerseDir, "lite", "asagity.db"),
	}, bin, "--mode", md.String())
	if err != nil {
		return err
	}
	fmt.Printf("[OK] engine starting (pid %d, :%s, mode=%s)\n", pid, r.cfg.EnginePort, md)
	return waitPort(r.cfg.EnginePort, 45*time.Second, Engine)
}

// startAPI builds Verse.Api once and runs the dll in-process
// (never `dotnet run`: same orphan-child problem as `go run`).
func (r *Runner) startAPI(md mode.Mode) error {
	srcDir := filepath.Join(r.cfg.ProjectRoot, "core", "src")
	apiDir := filepath.Join(srcDir, "Verse.Api")
	if _, err := os.Stat(filepath.Join(apiDir, "Verse.Api.csproj")); err != nil {
		return fmt.Errorf("Verse.Api missing under %s", srcDir)
	}
	if out, err := buildCmd(srcDir, "dotnet", "build", "Verse.Api", "-v", "q", "--nologo"); err != nil {
		return fmt.Errorf("build Verse.Api: %v\n%s", err, out)
	}
	dll := filepath.Join(apiDir, "bin", "Debug", "net10.0", "Verse.Api.dll")
	pid, err := r.proc.Spawn(API, apiDir, map[string]string{
		"ASAGITY_MODE":   md.String(),
		"VERSE_API_PORT": r.cfg.APIPort,
	}, "dotnet", dll)
	if err != nil {
		return err
	}
	fmt.Printf("[OK] api starting (pid %d, :%s)\n", pid, r.cfg.APIPort)
	return waitPort(r.cfg.APIPort, 90*time.Second, API)
}

// buildCmd runs a build in dir and returns combined output on failure.
func buildCmd(dir, name string, args ...string) (string, error) {
	cmd := exec.Command(name, args...)
	cmd.Dir = dir
	out, err := cmd.CombinedOutput()
	return string(out), err
}

func waitPort(port string, timeout time.Duration, name string) error {
	deadline := time.Now().Add(timeout)
	for time.Now().Before(deadline) {
		if process.PortOpen("127.0.0.1", port, 500*time.Millisecond) {
			fmt.Printf("[OK] %s is listening on :%s\n", name, port)
			return nil
		}
		time.Sleep(500 * time.Millisecond)
	}
	return fmt.Errorf("%s did not listen on :%s within %s (see `versetool logs %s`)", name, port, timeout, name)
}

func (r *Runner) composeFile() (string, error) {
	candidates := []string{
		filepath.Join(r.cfg.ProjectRoot, "container", "docker", "docker-compose-only-db.yaml"),
		filepath.Join(r.cfg.ProjectRoot, "container", "docker", "docker-compose.yaml"),
	}
	for _, c := range candidates {
		if _, err := os.Stat(c); err == nil {
			return c, nil
		}
	}
	return "", fmt.Errorf("no docker compose file found under container/docker")
}

func (r *Runner) composeUp(svc string) error {
	file, err := r.composeFile()
	if err != nil {
		return err
	}
	cmd := exec.Command("docker", "compose", "-f", file, "up", "-d", svc)
	cmd.Dir = r.cfg.ProjectRoot
	if out, err := cmd.CombinedOutput(); err != nil {
		return fmt.Errorf("docker compose up %s: %v\n%s", svc, err, out)
	}
	fmt.Printf("[OK] %s container started\n", svc)
	return nil
}

func (r *Runner) composeStop(svc string) {
	if !dockerOK() {
		fmt.Printf("[SKIP] %s: docker unavailable\n", svc)
		return
	}
	file, err := r.composeFile()
	if err != nil {
		return
	}
	cmd := exec.Command("docker", "compose", "-f", file, "stop", svc)
	cmd.Dir = r.cfg.ProjectRoot
	_ = cmd.Run()
	fmt.Printf("[STOP] %s container stopped\n", svc)
}

// Stop halts svc (or all four when svc is "all"/"").
func (r *Runner) Stop(svc string) {
	targets := []string{svc}
	if svc == "" || svc == "all" {
		targets = []string{Engine, API, Redis, DB}
	}
	for _, t := range targets {
		switch t {
		case Engine, API:
			_ = r.proc.Kill(t)
			fmt.Printf("[STOP] %s stopped\n", t)
		case DB, Redis:
			r.composeStop(t)
		default:
			fmt.Printf("[WARN] unknown service %q\n", t)
		}
	}
}

// Restart stops then starts svc.
func (r *Runner) Restart(svc string, md mode.Mode) error {
	r.Stop(svc)
	time.Sleep(500 * time.Millisecond)
	return r.Start(svc, md)
}

// Level is one rung of the three-level status probe.
type Level struct {
	Process bool // pid alive (containers: compose ps)
	Port    bool // TCP connect
	Health  bool // /healthz 200 (engine/api only)
}

// Status probes every known service.
func (r *Runner) Status() map[string]Level {
	out := map[string]Level{}
	for _, svc := range All {
		out[svc] = r.probe(svc)
	}
	return out
}

func (r *Runner) probe(svc string) Level {
	var lv Level
	switch svc {
	case Engine, API:
		port := r.cfg.EnginePort
		base := r.EngineURL()
		if svc == API {
			port = r.cfg.APIPort
			base = r.APIURL()
		}
		lv.Process = r.proc.PidOf(svc) > 0
		lv.Port = process.PortOpen("127.0.0.1", port, 500*time.Millisecond)
		lv.Health = process.HealthOK(base+"/healthz", 3*time.Second)
	case DB:
		lv.Process = containerUp("asagity_postgres")
		lv.Port = process.PortOpen("127.0.0.1", dbPort(r.cfg), 500*time.Millisecond)
	case Redis:
		lv.Process = containerUp("asagity_redis")
		lv.Port = process.PortOpen("127.0.0.1", "6379", 500*time.Millisecond)
	}
	return lv
}

func dbPort(cfg *config.Config) string {
	if p, ok := cfg.Env["DB_PORT"]; ok && p != "" {
		return p
	}
	return "5432"
}

func containerUp(name string) bool {
	if !dockerOK() {
		return false
	}
	cmd := exec.Command("docker", "ps", "--filter", "name="+name, "--format", "{{.Names}}")
	out, err := cmd.Output()
	if err != nil {
		return false
	}
	return len(out) > 0
}

func dockerOK() bool {
	return exec.Command("docker", "info").Run() == nil
}

func join(xs []string) string {
	out := ""
	for i, x := range xs {
		if i > 0 {
			out += ", "
		}
		out += x
	}
	return out
}
