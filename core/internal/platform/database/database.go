package database

import (
	"context"
	"errors"
	"fmt"
	"net"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	authmodel "github.com/CyaniAgent/Asagity/core/internal/module/auth/model"
	drivemodel "github.com/CyaniAgent/Asagity/core/internal/module/drive/model"
	instancemodel "github.com/CyaniAgent/Asagity/core/internal/module/instance/model"
	usermodel "github.com/CyaniAgent/Asagity/core/internal/module/user/model"
	"github.com/CyaniAgent/Asagity/core/internal/platform/config"
	"github.com/redis/go-redis/v9"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type Clients struct {
	DB    *gorm.DB
	Redis *redis.Client
}

func Open(cfg config.Config) (*Clients, error) {
	if err := ensureServices(cfg); err != nil {
		return nil, err
	}

	db, err := openPostgres(cfg)
	if err != nil {
		return nil, err
	}

	rdb := redis.NewClient(&redis.Options{
		Addr:     cfg.RedisAddr,
		Password: cfg.RedisPassword,
		DB:       cfg.RedisDB,
	})

	if err := rdb.Ping(context.Background()).Err(); err != nil {
		return nil, err
	}

	if err := db.AutoMigrate(
		&instancemodel.InstanceSetting{},
		&usermodel.User{},
		&usermodel.UserGroup{},
		&usermodel.PubIDChange{},
		&authmodel.Device{},
		&authmodel.RefreshToken{},
		&authmodel.EmailChallenge{},
		&drivemodel.DriveFile{},
		&drivemodel.DriveUsage{},
	); err != nil {
		return nil, err
	}

	if err := seedInitialData(db); err != nil {
		return nil, err
	}

	return &Clients{DB: db, Redis: rdb}, nil
}

func seedInitialData(db *gorm.DB) error {
	var count int64
	db.Model(&usermodel.UserGroup{}).Count(&count)
	if count == 0 {
		userGroups := []usermodel.UserGroup{
			{ID: "admin", Name: "Administrator", Code: "admin", Description: "System administrators", CreatedAt: time.Now()},
			{ID: "moderator", Name: "Moderator", Code: "moderator", Description: "Content moderators", CreatedAt: time.Now()},
			{ID: "default", Name: "User", Code: "user", Description: "Regular users", CreatedAt: time.Now()},
		}
		if err := db.Create(&userGroups).Error; err != nil {
			return err
		}
	}

	var userCount int64
	db.Model(&usermodel.User{}).Count(&userCount)
	if userCount == 0 {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte("Asagity1234"), bcrypt.DefaultCost)
		if err != nil {
			return err
		}

		instanceUser := &usermodel.User{
			ID:          "00000000000000000000000000000001",
			PubID:       "usr_instance",
			Username:    "instance",
			Email:       stringPtr("instance@asagity.local"),
			PasswdHash:  string(hashedPassword),
			UserGroupID: "admin",
			Name:        "Instance Administrator",
			CreatedAt:   time.Now(),
		}
		if err := db.Create(instanceUser).Error; err != nil {
			return err
		}
	}

	return nil
}

func stringPtr(s string) *string {
	return &s
}

func ensureServices(cfg config.Config) error {
	pgErr := probePostgres(cfg)
	redisErr := probeRedis(cfg)
	if pgErr == nil && redisErr == nil {
		return nil
	}

	pgHost, pgPort := normalizeHostPort(cfg.DBHost, cfg.DBPort)
	redisHost, redisPort := splitRedisAddr(cfg.RedisAddr)

	pgPortBusy := pgErr != nil && isTCPPortBusy(pgHost, pgPort)
	redisPortBusy := redisErr != nil && isTCPPortBusy(redisHost, redisPort)
	if pgPortBusy || redisPortBusy {
		scriptHint := "scripts/initDatabase.sh"
		if isWindows() {
			scriptHint = "scripts/initDatabase.ps1"
		}

		return fmt.Errorf(
			"detected an existing service on the configured database ports, but Asagity could not use it: postgres=%v redis=%v; configure alternate project ports with %s and then restart",
			pgErr,
			redisErr,
			scriptHint,
		)
	}

	projectRoot, err := findProjectRoot()
	if err != nil {
		return err
	}

	composeCommand, err := detectComposeCommand()
	if err != nil {
		scriptHint := filepath.Join(projectRoot, "scripts", "initDatabase.sh")
		if isWindows() {
			scriptHint = filepath.Join(projectRoot, "scripts", "initDatabase.ps1")
		}

		return fmt.Errorf(
			"postgres/redis are unavailable and Docker is not ready: %w; install Docker or configure the database manually with %s",
			err,
			scriptHint,
		)
	}

	if err := runComposeUp(projectRoot, composeCommand); err != nil {
		return err
	}

	deadline := time.Now().Add(90 * time.Second)
	for time.Now().Before(deadline) {
		if probePostgres(cfg) == nil && probeRedis(cfg) == nil {
			return nil
		}

		time.Sleep(3 * time.Second)
	}

	return errors.New("docker compose started, but PostgreSQL/Redis did not become ready in time")
}

func openPostgres(cfg config.Config) (*gorm.DB, error) {
	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=Asia/Shanghai",
		cfg.DBHost,
		cfg.DBUser,
		cfg.DBPassword,
		cfg.DBName,
		cfg.DBPort,
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := sqlDB.PingContext(ctx); err != nil {
		return nil, err
	}

	return db, nil
}

func probePostgres(cfg config.Config) error {
	db, err := openPostgres(cfg)
	if err != nil {
		return err
	}

	sqlDB, err := db.DB()
	if err == nil {
		_ = sqlDB.Close()
	}

	return nil
}

func probeRedis(cfg config.Config) error {
	rdb := redis.NewClient(&redis.Options{
		Addr:     cfg.RedisAddr,
		Password: cfg.RedisPassword,
		DB:       cfg.RedisDB,
	})
	defer func() { _ = rdb.Close() }()

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	return rdb.Ping(ctx).Err()
}

func isTCPPortBusy(host string, port string) bool {
	address := net.JoinHostPort(host, port)
	conn, err := net.DialTimeout("tcp", address, 2*time.Second)
	if err != nil {
		return false
	}

	_ = conn.Close()
	return true
}

func splitRedisAddr(addr string) (string, string) {
	host, port, err := net.SplitHostPort(addr)
	if err == nil {
		return normalizeHostPort(host, port)
	}

	if strings.Count(addr, ":") == 1 {
		parts := strings.SplitN(addr, ":", 2)
		return normalizeHostPort(parts[0], parts[1])
	}

	return "127.0.0.1", "6379"
}

func normalizeHostPort(host string, port string) (string, string) {
	if host == "" || host == "localhost" {
		host = "127.0.0.1"
	}

	if port == "" {
		port = "0"
	}

	return host, port
}

func findProjectRoot() (string, error) {
	cwd, err := os.Getwd()
	if err != nil {
		return "", err
	}

	dir := cwd
	for {
		composePath := filepath.Join(dir, "docker-compose.yml")
		if _, err := os.Stat(composePath); err == nil {
			return dir, nil
		}

		parent := filepath.Dir(dir)
		if parent == dir {
			return "", errors.New("could not locate project root containing docker-compose.yml")
		}

		dir = parent
	}
}

func detectComposeCommand() ([]string, error) {
	if err := exec.Command("docker", "compose", "version").Run(); err == nil {
		if err := exec.Command("docker", "info").Run(); err != nil {
			return nil, fmt.Errorf("docker daemon is not available: %w", err)
		}

		return []string{"docker", "compose"}, nil
	}

	if err := exec.Command("docker-compose", "version").Run(); err == nil {
		if err := exec.Command("docker", "info").Run(); err != nil {
			return nil, fmt.Errorf("docker daemon is not available: %w", err)
		}

		return []string{"docker-compose"}, nil
	}

	return nil, errors.New("docker compose command was not found")
}

func runComposeUp(projectRoot string, baseCommand []string) error {
	args := append([]string{}, baseCommand[1:]...)
	args = append(args, "up", "-d", "postgres", "redis")

	cmd := exec.Command(baseCommand[0], args...)
	cmd.Dir = projectRoot
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("failed to start PostgreSQL/Redis with docker compose: %w: %s", err, strings.TrimSpace(string(output)))
	}

	return nil
}

func isWindows() bool {
	return os.PathSeparator == '\\'
}
