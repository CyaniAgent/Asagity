package database

import (
	"context"
	"fmt"
	"log"
	"os"
	"strconv"

	"github.com/CyaniAgent/Asagity/core/models"
	"github.com/joho/godotenv"
	"github.com/redis/go-redis/v9"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var (
	DB    *gorm.DB
	Redis *redis.Client
)

// InitDB 初始化 PostgreSQL 与 Redis 的连接，并执行 Models 的 AutoMigrate
func InitDB() {
	// 加载 .env 环境变量
	err := godotenv.Load()
	if err != nil {
		log.Println("Notice: No .env file found or failed to load, relying on environment variables only. 0_0")
	}

	// PostgreSQL Database Connection
	host := os.Getenv("DB_HOST")
	portStr := os.Getenv("DB_PORT")
	user := os.Getenv("DB_USER")
	password := os.Getenv("DB_PASSWORD")
	dbname := os.Getenv("DB_NAME")

	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=Asia/Shanghai",
		host, user, password, dbname, portStr)

	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	log.Println("PostgreSQL connected successfully! Backend is stable... Ready to GOAL! (≧▽≦)")

	// Redis Cache Connection
	redisAddr := os.Getenv("REDIS_ADDR")
	redisPassword := os.Getenv("REDIS_PASSWORD")
	redisDBStr := os.Getenv("REDIS_DB")
	
	redisDB, _ := strconv.Atoi(redisDBStr)
	if redisAddr == "" {
		redisAddr = "localhost:6379" // Default fallback
	}

	Redis = redis.NewClient(&redis.Options{
		Addr:     redisAddr,
		Password: redisPassword,
		DB:       redisDB,
	})

	if err := Redis.Ping(context.Background()).Err(); err != nil {
		log.Fatalf("Failed to connect to Redis: %v", err)
	}
	log.Println("Redis connected successfully! Speed Star activated! 39! ( •̀ ω •́ )✧")

	// 注册 Client，避免 models -> database 循环依赖！
	// Producer-san，这招可是切断循环引用的大招哦！
	models.RegisterClients(DB, Redis)

	// 自动建表（Automigrate）
	log.Println("Running AutoMigrate for models...")
	err = DB.AutoMigrate(&models.InstanceSetting{})
	if err != nil {
		log.Fatalf("AutoMigrate failed! Arienai! : %v", err)
	}
	log.Println("Database migration completed! Target: SSS-rank performance!")

	// 注入默认的配置！冲刺啦！💨
	log.Println("Seeding default instance settings...")
	models.InitDefaultSettings()
}
