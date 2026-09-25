package database

import (
	"fmt"
	"os"
	"path/filepath"
	"time"

	authmodel "github.com/CyaniAgent/Asagity/core/src/Verse.Engine/internal/module/auth/model"
	drivemodel "github.com/CyaniAgent/Asagity/core/src/Verse.Engine/internal/module/drive/model"
	instancemodel "github.com/CyaniAgent/Asagity/core/src/Verse.Engine/internal/module/instance/model"
	usermodel "github.com/CyaniAgent/Asagity/core/src/Verse.Engine/internal/module/user/model"
	"github.com/CyaniAgent/Asagity/core/src/Verse.Engine/internal/platform/cache"
	"github.com/CyaniAgent/Asagity/core/src/Verse.Engine/internal/platform/config"
	"github.com/CyaniAgent/Asagity/core/src/Verse.Engine/internal/platform/mode"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// OpenLite opens the Developing Lite stack: a file-backed SQLite database plus
// the in-process memory cache. No external process (PostgreSQL/Redis) is used.
//
// Portability note: models must avoid Postgres-only DDL (e.g. gen_random_uuid()
// column defaults); DriveFile IDs are always assigned by the service layer.
func OpenLite(cfg config.Config) (*Clients, error) {
	dbPath := cfg.SQLitePath
	if dbPath == "" {
		dbPath = "./data/lite/asagity.db"
	}

	if dir := filepath.Dir(dbPath); dir != "" && dir != "." {
		if err := os.MkdirAll(dir, 0o755); err != nil {
			return nil, fmt.Errorf("create sqlite dir: %w", err)
		}
	}

	db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
	if err != nil {
		return nil, fmt.Errorf("open sqlite %s: %w", dbPath, err)
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
		return nil, fmt.Errorf("lite automigrate: %w", err)
	}

	if err := seedInitialData(db); err != nil {
		return nil, fmt.Errorf("lite seed: %w", err)
	}

	return &Clients{
		DB:    db,
		Redis: nil,
		Cache: cache.NewMemoryCache(time.Minute),
		Mode:  mode.Lite,
	}, nil
}
