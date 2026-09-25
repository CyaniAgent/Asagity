package worker

import (
	"flag"
	"log"

	"github.com/CyaniAgent/Asagity/core/src/Verse.Engine/internal/platform/config"
	"github.com/CyaniAgent/Asagity/core/src/Verse.Engine/internal/platform/mode"
)

// Run starts the background worker. Queue-heavy jobs only exist in production
// (Asynq/Redis); in lite and databaseless modes background work runs
// in-process inside the engine, so the worker simply reports the mode.
func Run() error {
	var modeFlag string
	fs := flag.NewFlagSet("worker", flag.ContinueOnError)
	fs.StringVar(&modeFlag, mode.FlagName, "", "runtime mode: databaseless|lite|production")
	_ = fs.Parse([]string{})

	cfg, _ := config.Load()
	md := mode.Resolve(modeFlag, cfg.Mode)

	switch md {
	case mode.Databaseless:
		log.Println("[worker] mode=databaseless: no background jobs; everything is mocked in-process.")
	case mode.Lite:
		log.Println("[worker] mode=lite: background jobs run in-process inside verse-engine.")
	default:
		log.Println("[worker] mode=production: Asynq worker wiring is not implemented yet (pending Phase 4).")
	}
	return nil
}
