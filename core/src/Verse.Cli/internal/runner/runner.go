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
	"github.com/CyaniAgent/Asagity/core/src/Verse.Cli/internal/engineapi"
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

// LiteDeveloperPassword is the fixed, dev-only password of the account that
// the engine seeds into the lite SQLite database. The engine owns the
// authoritative copy (core/src/Verse.Engine/internal/platform/database/seed.go);
// keep both in sync.
const LiteDeveloperPassword = "Asagity-dev1234"

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
		"LITE_SQLITE_PATH": r.cfg.LiteDBPath(),
	}, bin, "--mode", md.String())
	if err != nil {
		return err
	}
	fmt.Printf("[OK] engine starting (pid %d, :%s, mode=%s)\n", pid, r.cfg.EnginePort, md)
	if err := waitPort(r.cfg.EnginePort, 45*time.Second, Engine); err != nil {
		return err
	}
	r.printDeveloperHint(md)
	return nil
}

// printDeveloperHint shows the seeded developer account after the engine
// came up in lite mode, so a fresh checkout knows how to log in.
func (r *Runner) printDeveloperHint(md mode.Mode) {
	if md != mode.Lite {
		return
	}
	acc, err := engineapi.FetchDeveloperAccount(r.EngineURL(), 3*time.Second)
	if err != nil || !acc.Exists {
		return
	}
	fmt.Println()
	fmt.Println("  ┌─ lite developer account ─────────────────────────")
	fmt.Printf("  │ username : %s\n", acc.Username)
	fmt.Printf("  │ email    : %s\n", acc.Email)
	fmt.Printf("  │ group    : %s\n", acc.Group)
	fmt.Printf("  │ password : %s\n", LiteDeveloperPassword)
	fmt.Println("  └──────────────────────────────────────────────────")
	fmt.Println()
}

// startAPI builds Verse.Api once and runs the dll in-process
// (never `dotnet run`: same orphan-child problem as `go run`).
//
// The API is published in Release with ReadyToRun so the runtime does not pay
// JIT cost on every boot; the build falls back to a plain Debug build when
// publishing is unavailable (e.g. missing crossgen2 pack).
func (r *Runner) startAPI(md mode.Mode) error {
	srcDir := filepath.Join(r.cfg.ProjectRoot, "core", "src")
	apiDir := filepath.Join(srcDir, "Verse.Api")
	if _, err := os.Stat(filepath.Join(apiDir, "Verse.Api.csproj")); err != nil {
		return fmt.Errorf("Verse.Api missing under %s", srcDir)
	}

	dll, err := r.publishAPI(srcDir)
	if err != nil {
		return err
	}

	env := map[string]string{
		"ASAGITY_MODE":   md.String(),
		"VERSE_API_PORT": r.cfg.APIPort,
	}
	for k, v := range dotNetRuntimeEnv(md) {
		env[k] = v
	}

	pid, err := r.proc.Spawn(API, apiDir, env, "dotnet", dll)
	if err != nil {
		return err
	}
	fmt.Printf("[OK] api starting (pid %d, :%s)\n", pid, r.cfg.APIPort)
	return waitPort(r.cfg.APIPort, 90*time.Second, API)
}

// publishAPI publishes the API with ReadyToRun and returns the dll path.
func (r *Runner) publishAPI(srcDir string) (string, error) {
	publishDir := filepath.Join(r.cfg.VerseDir, "publish", "api")
	args := []string{
		"publish", "Verse.Api", "-c", "Release",
		"-o", publishDir,
		"-v", "q", "--nologo",
		"-p:PublishReadyToRun=true",
		"-p:PublishReadyToRunComposite=true",
	}
	if out, err := buildCmd(srcDir, "dotnet", args...); err != nil {
		// ReadyToRun needs a runtime identifier and the crossgen2 pack; fall
		// back to a plain Debug build so development still works offline.
		fmt.Printf("[WARN] ReadyToRun publish failed (%v), falling back to debug build\n%s\n", err, out)
		if buildOut, buildErr := buildCmd(srcDir, "dotnet", "build", "Verse.Api", "-v", "q", "--nologo"); buildErr != nil {
			return "", fmt.Errorf("build Verse.Api: %v\n%s", buildErr, buildOut)
		}
		return filepath.Join(srcDir, "Verse.Api", "bin", "Debug", "net10.0", "Verse.Api.dll"), nil
	}
	return filepath.Join(publishDir, "Verse.Api.dll"), nil
}

// dotNetRuntimeEnv returns the runtime knobs that keep the .NET process
// small and predictable (see docs/backend/dotnet-performance.md).
//
//	dev / databaseless : workstation GC (fewer GC heaps and threads),
//	                    a bounded heap limit, no tiered-PGO background work.
//	production         : server GC for throughput, heap limit left at the
//	                    container default (75%).
func dotNetRuntimeEnv(md mode.Mode) map[string]string {
	if md == mode.Production {
		return map[string]string{
			"DOTNET_gcServer": "1",
		}
	}

	return map[string]string{
		"DOTNET_gcServer":               "0",
		"DOTNET_GCHeapHardLimitPercent": "60",
		"DOTNET_TieredPGO":              "0",
		"DOTNET_TieredCompilation":      "1",
		"DOTNET_ReadyToRun":             "1",
	}
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

// Destroy force-kills svc (or all four when svc is "all"/""): SIGKILL with
// no grace period for engine/api, `docker compose kill` for db/redis.
// Emergency counterpart of Stop — a wedged process that ignores SIGTERM
// still goes down.
func (r *Runner) Destroy(svc string) {
	targets := []string{svc}
	if svc == "" || svc == "all" {
		targets = []string{Engine, API, Redis, DB}
	}
	for _, t := range targets {
		switch t {
		case Engine, API:
			if r.proc.PidOf(t) == 0 {
				fmt.Printf("[KILL] %s not running\n", t)
				continue
			}
			r.proc.Destroy(t)
			fmt.Printf("[KILL] %s force-killed\n", t)
		case DB, Redis:
			r.composeKill(t)
		default:
			fmt.Printf("[WARN] unknown service %q\n", t)
		}
	}
}

func (r *Runner) composeKill(svc string) {
	if !dockerOK() {
		fmt.Printf("[SKIP] %s: docker unavailable\n", svc)
		return
	}
	file, err := r.composeFile()
	if err != nil {
		return
	}
	cmd := exec.Command("docker", "compose", "-f", file, "kill", svc)
	cmd.Dir = r.cfg.ProjectRoot
	_ = cmd.Run()
	fmt.Printf("[KILL] %s container killed\n", svc)
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
	RSSKB   int  // resident set size in kB (0 when unknown)
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
		pid := r.proc.PidOf(svc)
		lv.Process = pid > 0
		lv.RSSKB = process.RSS(pid)
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
