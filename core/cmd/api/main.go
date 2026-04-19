package api

import (
	"bufio"
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
			installOk := runInitDatabase("1")
			if !installOk {
				log.Printf("[api] Auto-installation failed")
				return fmt.Errorf("failed to initialize database: %w; please run scripts/container/initDatabase.sh manually", err)
			}

			log.Printf("[api] Database installed, retrying connection...")
			clients, err = database.Open(cfg)
			if err != nil {
				return fmt.Errorf("failed to connect after installation: %w", err)
			}
		} else {
			log.Printf("[api] Database is online but credentials may be incorrect")

			log.Printf("[api] Running database verification...")
			verifyOk := runInitDatabase("2")

			if verifyOk {
				log.Printf("[api] Database verified, reloading config and retrying...")
				cfg, err = config.Load()
				if err != nil {
					return fmt.Errorf("failed to reload config: %w", err)
				}

				clients, err = database.Open(cfg)
				if err != nil {
					return fmt.Errorf("failed to connect after verification: %w", err)
				}
			} else {
				return fmt.Errorf("database verification failed: %w; please run scripts/container/initDatabase.sh to configure", err)
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

func runInitDatabase(mode string) bool {
	projectRoot, err := findProjectRoot()
	if err != nil {
		log.Printf("[api] Cannot find project root: %v", err)
		return false
	}

	initScript := filepath.Join(projectRoot, "scripts", "container", "initDatabase.sh")
	if _, err := os.Stat(initScript); os.IsNotExist(err) {
		log.Printf("[api] initDatabase.sh not found at %s", initScript)
		return false
	}

	cmd := exec.Command("bash", initScript)
	cmd.Dir = projectRoot
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	env := os.Environ()
	env = append(env, "INITDB_MODE="+mode)
	cmd.Env = env

	if err := cmd.Run(); err != nil {
		log.Printf("[api] initDatabase.sh execution failed: %v", err)
		return false
	}

	resultFile := filepath.Join(projectRoot, ".initdb_result")
	if _, err := os.Stat(resultFile); err == nil {
		file, err := os.Open(resultFile)
		if err == nil {
			defer file.Close()
			scanner := bufio.NewScanner(file)
			dbReady := false
			dbHost := ""
			dbPort := ""

			for scanner.Scan() {
				line := scanner.Text()
				if strings.HasPrefix(line, "ASAGITY_DB_READY=") {
					dbReady = strings.Contains(line, "true")
				}
				if strings.HasPrefix(line, "ASAGITY_DB_HOST=") {
					dbHost = strings.TrimPrefix(line, "ASAGITY_DB_HOST=")
				}
				if strings.HasPrefix(line, "ASAGITY_DB_PORT=") {
					dbPort = strings.TrimPrefix(line, "ASAGITY_DB_PORT=")
				}
			}

			if dbReady {
				log.Printf("[api] Database verification successful (host=%s port=%s)", dbHost, dbPort)
				os.Remove(resultFile)
				return true
			}

			file.Close()
			os.Remove(resultFile)
		}
	}

	log.Printf("[api] Database initialization completed")
	return true
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