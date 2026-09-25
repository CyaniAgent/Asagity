// Command versetool (Verse tool) manages the Asagity server lifecycle.
//
// Dual form: with arguments it runs one command and exits (script-friendly);
// without arguments it opens an interactive menu.
//
// Global flag:
//
//	--mode=databaseless|lite|production   overrides everything for this run.
//
// Services: engine (Go daemon :SERVER_PORT), api (C# :VERSE_API_PORT),
// db/redis containers (production only).
package main

import (
	"bufio"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/CyaniAgent/Asagity/core/src/Verse.Cli/internal/config"
	"github.com/CyaniAgent/Asagity/core/src/Verse.Cli/internal/doctor"
	"github.com/CyaniAgent/Asagity/core/src/Verse.Cli/internal/mode"
	"github.com/CyaniAgent/Asagity/core/src/Verse.Cli/internal/modulemgr"
	"github.com/CyaniAgent/Asagity/core/src/Verse.Cli/internal/process"
	"github.com/CyaniAgent/Asagity/core/src/Verse.Cli/internal/runner"
)

const usage = `versetool - Verse tool, the Asagity server manager

Usage:
  versetool [--mode=<databaseless|lite|production>] <command> [args]

Commands:
  start [prod|dev|dbless] [service]   start services (default: prod, all)
  stop [all|engine|api|db|redis]      stop services (default: all)
  restart [prod|dev|dbless] [service] restart services (default: prod, all)
  status                              three-level status: process, port, /healthz
  logs <service>                      print last 50 log lines (engine|api)
  health                              check engine + api /healthz
  doctor                              environment and service diagnostics
  app list                            list installed .aap applications
  app enable <name>                   enable an application
  app disable <name>                  disable an application
  help                                show this help

Start shorthands (service defaults to all):
  start          production
  start prod     production (PostgreSQL + Redis via docker)
  start dev      developing lite (SQLite + in-process cache)
  start dbless   databaseless mock API (UI design / debugger)
  start dev api  lite mode, api service only

Mode precedence: --mode flag > start shorthand > ASAGITY_MODE > production.
status/logs/health/doctor resolve the mode the usual way (--mode > ASAGITY_MODE > production).

Ports: engine :SERVER_PORT (default 2048), api :VERSE_API_PORT (default 2050).
`

func main() {
	if err := run(os.Args[1:]); err != nil {
		fmt.Fprintln(os.Stderr, "versetool: "+err.Error())
		os.Exit(1)
	}
}

func run(argv []string) error {
	modeFlag, rest := splitModeFlag(argv)
	if len(rest) == 0 {
		return interactive(modeFlag)
	}

	cfg, err := config.Load()
	if err != nil {
		return err
	}
	md := mode.Resolve(modeFlag, cfg.Env["ASAGITY_MODE"])
	r, err := runner.New(cfg)
	if err != nil {
		return err
	}

	switch rest[0] {
	case "start":
		svc, md := resolveStart(rest[1:], modeFlag)
		return r.Start(svc, md)
	case "stop":
		r.Stop(svcArg(rest))
		return nil
	case "restart":
		svc, md := resolveStart(rest[1:], modeFlag)
		return r.Restart(svc, md)
	case "status":
		return cmdStatus(r)
	case "logs":
		if len(rest) < 2 {
			return fmt.Errorf("usage: versetool logs <engine|api>")
		}
		return cmdLogs(r, rest[1])
	case "health":
		return cmdHealth(r)
	case "doctor":
		checks := doctor.Run(cfg, r, md)
		doctor.Print(checks)
		if !doctor.Overall(checks) {
			return fmt.Errorf("doctor found failing checks (mode=%s)", md)
		}
		return nil
	case "app":
		return cmdApp(cfg, rest[1:])
	case "help", "-h", "--help":
		fmt.Print(usage)
		return nil
	default:
		return fmt.Errorf("unknown command %q\n\n%s", rest[0], usage)
	}
}

// resolveStart parses [mode-alias] [service] after start/restart.
// Bare start/restart means production + all services; an explicit --mode
// flag always wins; ASAGITY_MODE is intentionally not consulted here so the
// start line alone fully determines the mode.
func resolveStart(args []string, flagVal string) (svc string, md mode.Mode) {
	svc, md = "all", mode.Production
	validFlag := false
	if m, ok := mode.Parse(flagVal); ok {
		md, validFlag = m, true
	}
	rest := args
	if len(rest) > 0 {
		if m, ok := mode.Alias(rest[0]); ok {
			if !validFlag {
				md = m
			}
			rest = rest[1:]
		}
	}
	if len(rest) > 0 {
		svc = rest[0]
	}
	return svc, md
}

// splitModeFlag extracts --mode=x / --mode x from the front of argv.
func splitModeFlag(argv []string) (string, []string) {
	var flagVal string
	var rest []string
	for i := 0; i < len(argv); i++ {
		a := argv[i]
		if a == "--mode" && i+1 < len(argv) {
			flagVal = argv[i+1]
			i++
			continue
		}
		if v, ok := strings.CutPrefix(a, "--mode="); ok {
			flagVal = v
			continue
		}
		rest = append(rest, a)
	}
	return flagVal, rest
}

func svcArg(rest []string) string {
	if len(rest) > 1 {
		return rest[1]
	}
	return "all"
}

func cmdStatus(r *runner.Runner) error {
	st := r.Status()
	fmt.Printf("%-8s %-9s %-7s %-7s\n", "SERVICE", "PROCESS", "PORT", "HEALTH")
	fmt.Println(strings.Repeat("-", 40))
	for _, svc := range runner.All {
		lv := st[svc]
		fmt.Printf("%-8s %-9s %-7s %-7s\n", svc, yesNo(lv.Process), yesNo(lv.Port), healthCell(svc, lv.Health))
	}
	return nil
}

func healthCell(svc string, ok bool) string {
	if svc == runner.DB || svc == runner.Redis {
		return "-"
	}
	return yesNo(ok)
}

func yesNo(ok bool) string {
	if ok {
		return "UP"
	}
	return "DOWN"
}

func cmdLogs(r *runner.Runner, svc string) error {
	if svc != runner.Engine && svc != runner.API {
		return fmt.Errorf("usage: versetool logs <engine|api>")
	}
	out, err := process.Tail(r.Proc().LogFile(svc), 50)
	if err != nil {
		return fmt.Errorf("no logs for %s yet: %w", svc, err)
	}
	fmt.Print(out)
	return nil
}

func cmdHealth(r *runner.Runner) error {
	eng := process.HealthOK(r.EngineURL()+"/healthz", 3*time.Second)
	api := process.HealthOK(r.APIURL()+"/healthz", 3*time.Second)
	fmt.Printf("engine %s (%s/healthz)\n", yesNo(eng), r.EngineURL())
	fmt.Printf("api    %s (%s/healthz)\n", yesNo(api), r.APIURL())
	if !eng {
		return fmt.Errorf("engine unhealthy")
	}
	return nil
}

func cmdApp(cfg *config.Config, args []string) error {
	mgr, err := modulemgr.New(cfg.AppsDir)
	if err != nil {
		return err
	}
	if len(args) == 0 || args[0] == "list" {
		apps, err := mgr.List()
		if err != nil {
			return err
		}
		if len(apps) == 0 {
			fmt.Printf("no .aap applications installed under %s\n", cfg.AppsDir)
			return nil
		}
		for _, a := range apps {
			state := "enabled"
			if !a.Enabled {
				state = "disabled"
			}
			fmt.Printf("%-24s %-10s %s\n", a.Name, a.Version, state)
		}
		return nil
	}
	if len(args) < 2 {
		return fmt.Errorf("usage: versetool app <list|enable|disable> [name]")
	}
	switch args[0] {
	case "enable":
		if err := mgr.Enable(args[1]); err != nil {
			return err
		}
		fmt.Printf("[OK] app %s enabled\n", args[1])
		return nil
	case "disable":
		if err := mgr.Disable(args[1]); err != nil {
			return err
		}
		fmt.Printf("[OK] app %s disabled\n", args[1])
		return nil
	default:
		return fmt.Errorf("usage: versetool app <list|enable|disable> [name]")
	}
}

// interactive runs the numbered menu when no command is given.
func interactive(modeFlag string) error {
	cfg, err := config.Load()
	if err != nil {
		return err
	}
	md := mode.Resolve(modeFlag, cfg.Env["ASAGITY_MODE"])
	r, err := runner.New(cfg)
	if err != nil {
		return err
	}

	in := bufio.NewReader(os.Stdin)
	for {
		fmt.Printf("\nversetool - Asagity server manager (mode=%s, engine :%s, api :%s)\n",
			md, cfg.EnginePort, cfg.APIPort)
		fmt.Println("  1) start all    2) stop all      3) restart all")
		fmt.Println("  4) status       5) health        6) doctor")
		fmt.Println("  7) logs engine  8) logs api      9) app list")
		fmt.Println("  m) switch mode (prod/dev/dbless)")
		fmt.Println("  0) exit")
		fmt.Print("select> ")

		line, _ := in.ReadString('\n')
		switch strings.TrimSpace(line) {
		case "1":
			_ = r.Start("all", md)
		case "2":
			r.Stop("all")
		case "3":
			_ = r.Restart("all", md)
		case "4":
			_ = cmdStatus(r)
		case "5":
			_ = cmdHealth(r)
		case "6":
			checks := doctor.Run(cfg, r, md)
			doctor.Print(checks)
		case "7":
			_ = cmdLogs(r, runner.Engine)
		case "8":
			_ = cmdLogs(r, runner.API)
		case "9":
			_ = cmdApp(cfg, []string{"list"})
		case "m":
			fmt.Print("mode [prod|dev|dbless]> ")
			mline, _ := in.ReadString('\n')
			if m, ok := mode.Alias(strings.TrimSpace(mline)); ok {
				md = m
				fmt.Printf("mode switched to %s\n", md)
			} else {
				fmt.Println("unknown mode (want prod|dev|dbless)")
			}
		case "0", "exit", "quit", "q":
			return nil
		default:
			fmt.Println("unknown choice (type `versetool help` for commands)")
		}
	}
}
