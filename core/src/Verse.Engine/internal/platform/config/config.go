package config

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"

	"github.com/joho/godotenv"

	"github.com/CyaniAgent/Asagity/core/src/Verse.Engine/internal/platform/mode"
)

type Config struct {
	ServerPort string
	// Mode is the raw ASAGITY_MODE value; resolved to mode.Mode at boot.
	// Empty means production. The --mode flag overrides it.
	Mode             string
	SQLitePath       string
	DBHost           string
	DBPort           string
	DBUser           string
	DBPassword       string
	DBName           string
	RedisAddr        string
	RedisPassword    string
	RedisDB          int
	JwtSecret        string
	DriveStoragePath string
	HostHostname     string
	HostOS           string
	HostOSVersion    string
	HostArch         string
	HostCPU          string
	HostMemory       string
	AppVersion       string
	MailSMTPHost     string
	MailSMTPPort     string
	MailSMTPUser     string
	MailSMTPPassword string
	MailFrom         string
	MailFromName     string
	// CORSAllowedOrigins drives httpx.Cors; comma-separated from CORS_ALLOWED_ORIGINS.
	CORSAllowedOrigins []string
	// WSAllowedOrigins drives ws upgrader CheckOrigin; falls back to CORSAllowedOrigins.
	WSAllowedOrigins []string
	// TimeZone for PostgreSQL connection, from TZ env, default UTC.
	TimeZone string
}

// weakSecrets is the set of JWT secrets that are rejected in production.
var weakSecrets = map[string]bool{"asagity_secret_miku_39": true, "": true}

func Load() (Config, error) {
	loadEnv()

	cfg := Config{
		ServerPort:       envOrDefault("SERVER_PORT", "2048"),
		Mode:             os.Getenv("ASAGITY_MODE"),
		SQLitePath:       envOrDefault("LITE_SQLITE_PATH", "./data/lite/asagity.db"),
		DBHost:           envOrDefault("DB_HOST", "localhost"),
		DBPort:           envOrDefault("DB_PORT", "5432"),
		DBUser:           envOrDefault("DB_USER", "asagity"),
		DBPassword:       envOrDefault("DB_PASSWORD", "example_password"),
		DBName:           envOrDefault("DB_NAME", "asagity_db"),
		RedisAddr:        envOrDefault("REDIS_ADDR", "localhost:6379"),
		RedisPassword:    os.Getenv("REDIS_PASSWORD"),
		RedisDB:          0,
		JwtSecret:        os.Getenv("JWT_SECRET"),
		DriveStoragePath: envOrDefault("DRIVE_STORAGE_PATH", "./storage/drive"),
		HostHostname:     os.Getenv("HOST_HOSTNAME"),
		HostOS:           os.Getenv("HOST_OS"),
		HostOSVersion:    os.Getenv("HOST_OS_VERSION"),
		HostArch:         os.Getenv("HOST_ARCH"),
		HostCPU:          os.Getenv("HOST_CPU"),
		HostMemory:       os.Getenv("HOST_MEMORY"),
		AppVersion:       envOrDefault("APP_VERSION", "dev"),
		MailSMTPHost:     envOrDefault("MAIL_SMTP_HOST", "smtp.gmail.com"),
		MailSMTPPort:     envOrDefault("MAIL_SMTP_PORT", "587"),
		MailSMTPUser:     os.Getenv("MAIL_SMTP_USER"),
		MailSMTPPassword: os.Getenv("MAIL_SMTP_PASSWORD"),
		MailFrom:         envOrDefault("MAIL_FROM", "noreply@asagity.net"),
		MailFromName:     envOrDefault("MAIL_FROM_NAME", "Asagity"),
		TimeZone:         envOrDefault("TZ", "UTC"),
	}

	cfg.CORSAllowedOrigins = parseOrigins(os.Getenv("CORS_ALLOWED_ORIGINS"))
	cfg.WSAllowedOrigins = parseOrigins(os.Getenv("WS_ALLOWED_ORIGINS"))
	if len(cfg.WSAllowedOrigins) == 0 {
		cfg.WSAllowedOrigins = cfg.CORSAllowedOrigins
	}

	resolvedMode := mode.Resolve("", cfg.Mode)

	// Dev-mode defaults for CORS/WS whitelist.
	if resolvedMode != mode.Production && len(cfg.CORSAllowedOrigins) == 0 {
		cfg.CORSAllowedOrigins = []string{"http://localhost:2000", "http://127.0.0.1:2000"}
		cfg.WSAllowedOrigins = cfg.CORSAllowedOrigins
	}

	// JWT secret validation.
	if weakSecrets[cfg.JwtSecret] {
		if resolvedMode == mode.Production {
			return Config{}, fmt.Errorf("JWT_SECRET must be set to a strong value in production")
		}
		cfg.JwtSecret = "asagity_secret_miku_39"
		log.Println("[config] WARNING: using default JWT_SECRET (dev only)")
	}
	if resolvedMode == mode.Production && len(cfg.JwtSecret) < 32 {
		return Config{}, fmt.Errorf("JWT_SECRET must be at least 32 bytes in production")
	}

	// Production requires explicit CORS whitelist.
	if resolvedMode == mode.Production && len(cfg.CORSAllowedOrigins) == 0 {
		return Config{}, fmt.Errorf("CORS_ALLOWED_ORIGINS must be set in production")
	}

	return cfg, nil
}

// parseOrigins splits a comma-separated origin list into a slice, trimming
// whitespace and dropping empty entries.
func parseOrigins(raw string) []string {
	if raw == "" {
		return nil
	}
	parts := strings.Split(raw, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		if v := strings.TrimSpace(p); v != "" {
			out = append(out, v)
		}
	}
	return out
}

func envOrDefault(key string, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}

	return fallback
}

func loadEnv() {
	candidates := []string{".env"}

	if cwd, err := os.Getwd(); err == nil {
		candidates = append(candidates,
			filepath.Join(cwd, ".env"),
			filepath.Join(cwd, "..", ".env"),
			filepath.Join(cwd, "..", "..", ".env"),
			// Engine now lives at core/src/Verse.Engine: repo-root .env is 3 levels up.
			filepath.Join(cwd, "..", "..", "..", ".env"),
		)

		absParent, _ := filepath.Abs(filepath.Join(cwd, ".."))
		if filepath.Base(absParent) == "core" {
			candidates = append(candidates, filepath.Join(absParent, ".env"))
		}
	}

	for _, path := range candidates {
		absPath, _ := filepath.Abs(path)
		if _, err := os.Stat(absPath); err == nil {
			// godotenv.Load does not override real environment variables, so
			// per-run injections (the Verse tool sets SERVER_PORT and
			// LITE_SQLITE_PATH) keep priority over the .env file.
			fmt.Printf("[config] Loading .env from: %s\n", absPath)
			_ = godotenv.Load(absPath)
			return
		}
	}
}
