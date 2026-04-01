package database

import (
	"context"
	"fmt"

	authmodel "github.com/CyaniAgent/Asagity/core/internal/module/auth/model"
	instancemodel "github.com/CyaniAgent/Asagity/core/internal/module/instance/model"
	usermodel "github.com/CyaniAgent/Asagity/core/internal/module/user/model"
	"github.com/CyaniAgent/Asagity/core/internal/platform/config"
	"github.com/redis/go-redis/v9"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type Clients struct {
	DB    *gorm.DB
	Redis *redis.Client
}

func Open(cfg config.Config) (*Clients, error) {
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
	); err != nil {
		return nil, err
	}

	return &Clients{DB: db, Redis: rdb}, nil
}
