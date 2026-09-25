// Package runtime boots the Verse Engine in one of the three runtime modes.
//
//	databaseless - mock HTTP API, no database, for UI design/debugger use.
//	lite         - SQLite + in-process memory cache, zero external processes.
//	production   - PostgreSQL + Redis (default), with container self-healing.
//
// Both cmd/api and cmd/verse-engine delegate here so the boot logic exists once.
package runtime

import (
	"bufio"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/go-chi/chi/v5"

	"github.com/CyaniAgent/Asagity/core/src/Verse.Engine/internal/app"
	"github.com/CyaniAgent/Asagity/core/src/Verse.Engine/internal/mock"
	"github.com/CyaniAgent/Asagity/core/src/Verse.Engine/internal/platform/config"
	"github.com/CyaniAgent/Asagity/core/src/Verse.Engine/internal/platform/database"
	"github.com/CyaniAgent/Asagity/core/src/Verse.Engine/internal/platform/mode"
)

// Run parses argv (--mode), loads config and serves the resolved mode.
func Run(argv []string) error {
	fs := flag.NewFlagSet("verse", flag.ContinueOnError)
	modeFlag := mode.RegisterFlag(fs)
	if err := fs.Parse(argv); err != nil {
		return err
	}

	cfg, err := config.Load()
	if err != nil {
		return err
	}

	return Serve(cfg, mode.Resolve(*modeFlag, cfg.Mode))
}

// Serve starts the HTTP server for md.
func Serve(cfg config.Config, md mode.Mode) error {
	addr := ":" + cfg.ServerPort
	switch md {
	case mode.Databaseless:
		log.Printf("[runtime] mode=databaseless: mock API without database on %s", addr)
		return http.ListenAndServe(addr, mock.NewServer().Router())
	case mode.Lite:
		log.Printf("[runtime] mode=lite: SQLite (%s) + memory cache on %s", cfg.SQLitePath, addr)
		clients, err := database.OpenLite(cfg)
		if err != nil {
			return fmt.Errorf("open lite stack: %w", err)
		}
		defer closeClients(clients)
		return serveApp(cfg, clients, addr)
	default:
		log.Printf("[runtime] mode=production: PostgreSQL + Redis on %s", addr)
		return serveProduction(cfg, addr)
	}
}

func serveApp(cfg config.Config, clients *database.Clients, addr string) error {
	application := app.New(cfg, clients)

	r := chi.NewRouter()
	r.Mount("/", application.Router())

	log.Printf("[runtime] Asagity API listening on %s", addr)
	return http.ListenAndServe(addr, r)
}

func closeClients(clients *database.Clients) {
	if clients.Cache != nil {
		_ = clients.Cache.Close()
	}
	if clients.Redis != nil {
		_ = clients.Redis.Close()
	}
	if clients.DB != nil {
		if sqlDB, err := clients.DB.DB(); err == nil {
			_ = sqlDB.Close()
		}
	}
}

func serveProduction(cfg config.Config, addr string) error {
	clients, err := database.Open(cfg)
	if err != nil {
		log.Printf("[runtime] Database connection failed: %v", err)

		pgErr := database.ProbePostgres(cfg)
		redisErr := database.ProbeRedis(cfg)

		if pgErr != nil || redisErr != nil {
			log.Printf("[runtime] Database services not ready, attempting auto-installation...")
			if !runInitDatabase("1") {
				log.Printf("[runtime] Auto-installation failed")
				return fmt.Errorf("failed to initialize database: %w; please run scripts/container/initDatabase.sh manually", err)
			}

			log.Printf("[runtime] Database installed, retrying connection...")
			clients, err = database.Open(cfg)
			if err != nil {
				return fmt.Errorf("failed to connect after installation: %w", err)
			}
		} else {
			log.Printf("[runtime] Database is online but credentials may be incorrect")

			log.Printf("[runtime] Running database verification...")
			if !runInitDatabase("2") {
				return fmt.Errorf("database verification failed: %w; please run scripts/container/initDatabase.sh to configure", err)
			}

			log.Printf("[runtime] Database verified, reloading config and retrying...")
			cfg, err = config.Load()
			if err != nil {
				return fmt.Errorf("failed to reload config: %w", err)
			}

			clients, err = database.Open(cfg)
			if err != nil {
				return fmt.Errorf("failed to connect after verification: %w", err)
			}
		}
	}
	defer closeClients(clients)

	return serveApp(cfg, clients, addr)
}

func runInitDatabase(initMode string) bool {
	projectRoot, err := findProjectRoot()
	if err != nil {
		log.Printf("[runtime] Cannot find project root: %v", err)
		return false
	}

	initScript := filepath.Join(projectRoot, "scripts", "container", "initDatabase.sh")
	if _, err := os.Stat(initScript); os.IsNotExist(err) {
		log.Printf("[runtime] initDatabase.sh not found at %s", initScript)
		return false
	}

	cmd := exec.Command("bash", initScript)
	cmd.Dir = projectRoot
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	cmd.Env = append(os.Environ(), "INITDB_MODE="+initMode)

	if err := cmd.Run(); err != nil {
		log.Printf("[runtime] initDatabase.sh execution failed: %v", err)
		return false
	}

	resultFile := filepath.Join(projectRoot, ".initdb_result")
	if _, err := os.Stat(resultFile); err == nil {
		dbReady, dbHost, dbPort := parseInitResult(resultFile)
		os.Remove(resultFile)
		if dbReady {
			log.Printf("[runtime] Database verification successful (host=%s port=%s)", dbHost, dbPort)
			return true
		}
	}

	log.Printf("[runtime] Database initialization completed")
	return true
}

func parseInitResult(path string) (ready bool, host, port string) {
	file, err := os.Open(path)
	if err != nil {
		return false, "", ""
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := scanner.Text()
		switch {
		case strings.HasPrefix(line, "ASAGITY_DB_READY="):
			ready = strings.Contains(line, "true")
		case strings.HasPrefix(line, "ASAGITY_DB_HOST="):
			host = strings.TrimPrefix(line, "ASAGITY_DB_HOST=")
		case strings.HasPrefix(line, "ASAGITY_DB_PORT="):
			port = strings.TrimPrefix(line, "ASAGITY_DB_PORT=")
		}
	}
	return ready, host, port
}

func findProjectRoot() (string, error) {
	cwd, err := os.Getwd()
	if err != nil {
		return "", err
	}

	for i := 0; i < 6; i++ {
		if _, err := os.Stat(filepath.Join(cwd, "container")); err == nil {
			return cwd, nil
		}
		parent := filepath.Dir(cwd)
		if parent == cwd {
			break
		}
		cwd = parent
	}

	return "", fmt.Errorf("project root not found")
}
