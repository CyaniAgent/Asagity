package config

import (
	"os"
	"path/filepath"

	"github.com/joho/godotenv"
)

type Config struct {
	ServerPort    string
	DBHost        string
	DBPort        string
	DBUser        string
	DBPassword    string
	DBName        string
	RedisAddr     string
	RedisPassword string
	RedisDB       int
	JwtSecret     string
}

func Load() (Config, error) {
	loadEnv()

	return Config{
		ServerPort:    envOrDefault("SERVER_PORT", "2048"),
		DBHost:        envOrDefault("DB_HOST", "localhost"),
		DBPort:        envOrDefault("DB_PORT", "5432"),
		DBUser:        envOrDefault("DB_USER", "asagity"),
		DBPassword:    envOrDefault("DB_PASSWORD", "example_password"),
		DBName:        envOrDefault("DB_NAME", "asagity_db"),
		RedisAddr:     envOrDefault("REDIS_ADDR", "localhost:6379"),
		RedisPassword: os.Getenv("REDIS_PASSWORD"),
		RedisDB:       0,
		JwtSecret:     envOrDefault("JWT_SECRET", "asagity_secret_miku_39"),
	}, nil
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
		candidates = append(candidates, filepath.Join(cwd, ".env"))
		candidates = append(candidates, filepath.Join(cwd, "..", ".env"))
	}

	for _, path := range candidates {
		if _, err := os.Stat(path); err == nil {
			_ = godotenv.Overload(path)
			return
		}
	}
}
