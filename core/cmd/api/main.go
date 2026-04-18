package api

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/CyaniAgent/Asagity/core/internal/app"
	"github.com/CyaniAgent/Asagity/core/internal/platform/config"
	"github.com/CyaniAgent/Asagity/core/internal/platform/database"
	"github.com/go-chi/chi/v5"
)

func Run() error {
	cfg, err := config.Load()
	if err != nil {
		return err
	}

	log.Printf("[api] Starting Asagity API server...")

	clients, err := database.Open(cfg)
	if err != nil {
		log.Printf("[api] Database connection failed: %v", err)

		pgErr := database.ProbePostgres(cfg)
		redisErr := database.ProbeRedis(cfg)

		if pgErr != nil || redisErr != nil {
			log.Printf("[api] Database services not ready, attempting auto-installation...")
			if installErr := runInstallDB(); installErr != nil {
				log.Printf("[api] Auto-installation failed: %v", installErr)
				return fmt.Errorf("failed to initialize database: %w; please run scripts/initDatabase.sh manually", err)
			}

			log.Printf("[api] Database installed, retrying connection...")
			clients, err = database.Open(cfg)
			if err != nil {
				return fmt.Errorf("failed to connect after installation: %w", err)
			}
		} else {
			log.Printf("[api] Database is online but credentials mismatched")
			log.Printf("[api] Running configuration utility...")

			if reconfigErr := runInitDatabase(); reconfigErr != nil {
				log.Printf("[api] Configuration failed: %v", reconfigErr)
				return fmt.Errorf("database credentials mismatch: %w; please run scripts/initDatabase.sh to verify configuration", err)
			}

			log.Printf("[api] Configuration updated, reloading config and retrying...")
			cfg, err = config.Load()
			if err != nil {
				return fmt.Errorf("failed to reload config: %w", err)
			}

			clients, err = database.Open(cfg)
			if err != nil {
				return fmt.Errorf("failed to connect after reconfiguration: %w", err)
			}
		}
	}

	application := app.New(cfg, clients)

	r := chi.NewRouter()
	r.Mount("/", application.Router())

	addr := ":" + cfg.ServerPort

	log.Printf("Asagity API listening on %s", addr)
	return http.ListenAndServe(addr, r)
}

func runInstallDB() error {
	projectRoot, err := findProjectRoot()
	if err != nil {
		return fmt.Errorf("cannot find project root: %w", err)
	}

	installScript := filepath.Join(projectRoot, "scripts", "InstallDB.sh")
	if _, err := os.Stat(installScript); os.IsNotExist(err) {
		installScript = filepath.Join(projectRoot, "scripts", "container", "initDatabase.sh")
		if _, err := os.Stat(installScript); os.IsNotExist(err) {
			return fmt.Errorf("InstallDB.sh or initDatabase.sh not found")
		}
	}

	cmd := exec.Command("bash", installScript)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Dir = projectRoot
	cmd.Stdin = os.Stdin

	if err := cmd.Run(); err != nil {
		return fmt.Errorf("install script execution failed: %w", err)
	}

	log.Printf("[api] Database installation completed")
	return nil
}

func runInitDatabase() error {
	projectRoot, err := findProjectRoot()
	if err != nil {
		return fmt.Errorf("cannot find project root: %w", err)
	}

	initScript := filepath.Join(projectRoot, "scripts", "container", "initDatabase.sh")
	if _, err := os.Stat(initScript); os.IsNotExist(err) {
		return fmt.Errorf("initDatabase.sh not found at %s", initScript)
	}

	cmd := exec.Command("bash", initScript)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Dir = projectRoot
	cmd.Stdin = os.Stdin

	if err := cmd.Run(); err != nil {
		return fmt.Errorf("initDatabase script failed: %w", err)
	}

	log.Printf("[api] Configuration updated")
	return nil
}

func findProjectRoot() (string, error) {
	cwd, err := os.Getwd()
	if err != nil {
		return "", err
	}

	for i := 0; i < 4; i++ {
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

func isWindows() bool {
	return strings.Contains(strings.ToLower(os.Getenv("OS")), "windows")
}