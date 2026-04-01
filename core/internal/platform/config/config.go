package config

import (
	"os"

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
}

func Load() (Config, error) {
	_ = godotenv.Load()

	return Config{
		ServerPort:    envOrDefault("SERVER_PORT", "2048"),
		DBHost:        envOrDefault("DB_HOST", "localhost"),
		DBPort:        envOrDefault("DB_PORT", "5432"),
		DBUser:        envOrDefault("DB_USER", "postgres"),
		DBPassword:    os.Getenv("DB_PASSWORD"),
		DBName:        envOrDefault("DB_NAME", "asagity"),
		RedisAddr:     envOrDefault("REDIS_ADDR", "localhost:6379"),
		RedisPassword: os.Getenv("REDIS_PASSWORD"),
		RedisDB:       0,
	}, nil
}

func envOrDefault(key string, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}

	return fallback
}
