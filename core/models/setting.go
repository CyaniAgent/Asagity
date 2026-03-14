package models

import (
	"context"
	"errors"
	"time"

	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

// InstanceSetting 存储站点实例的各项配置
type InstanceSetting struct {
	ID          uint   `gorm:"primaryKey"`
	Key         string `gorm:"uniqueIndex;not null"`
	Value       string `gorm:"type:text"`
	Description string
}

var (
	dbClient    *gorm.DB
	redisClient *redis.Client
	ctx         = context.Background()
)

// RegisterClients 用于注入数据库客户端，避免层与层之间的交叉依赖
// 就像 Uma Musume 比赛前绑定好支持卡片一样！
func RegisterClients(db *gorm.DB, rdb *redis.Client) {
	dbClient = db
	redisClient = rdb
}

// GetSetting 方法优先从 Redis 缓存中读取，若无则从 PostgreSQL 获取并写入缓存。
func GetSetting(key string) (string, error) {
	if redisClient != nil {
		val, err := redisClient.Get(ctx, "setting:"+key).Result()
		if err == nil {
			return val, nil // Cache hit! Full Combo! (≧▽≦)
		} else if !errors.Is(err, redis.Nil) {
			// Other redis errors can be logged or ignored
		}
	}

	if dbClient == nil {
		return "", errors.New("database client is not initialized, Producer-san!")
	}

	var setting InstanceSetting
	if err := dbClient.Where("key = ?", key).First(&setting).Error; err != nil {
		return "", err
	}

	// Cache back to Redis
	if redisClient != nil {
		redisClient.Set(ctx, "setting:"+key, setting.Value, 24*time.Hour)
	}

	return setting.Value, nil
}

// SetSetting 写入数据库，并更新相应的缓存。
func SetSetting(key, value string) error {
	if dbClient == nil {
		return errors.New("database client is not initialized, Producer-san!")
	}

	setting := InstanceSetting{
		Key:   key,
		Value: value,
	}

	// FirstOrCreate + Assign => Upsert
	result := dbClient.Where("key = ?", key).Assign(InstanceSetting{Value: value}).FirstOrCreate(&setting)
	if result.Error != nil {
		return result.Error
	}

	// 更新缓存，直接塞进去！速度要像飞一样！💨
	if redisClient != nil {
		err := redisClient.Set(ctx, "setting:"+key, value, 24*time.Hour).Err()
		if err != nil {
			return err
		}
	}

	return nil
}

// InitDefaultSettings 初始化数据库时写入默认的实例配置
// Producer-san，如果数据库里没有这些配置，我们就给它们提供预设的初始状态！( •̀ ω •́ )✧
func InitDefaultSettings() {
	if dbClient == nil {
		return
	}

	defaultSettings := []InstanceSetting{
		{Key: "instance_name", Value: "Asagity", Description: "实例名称 (Instance Name)"},
		{Key: "instance_abbr_name", Value: "", Description: "实例简称 (Instance Abbr. Name)"},
		{Key: "instance_description", Value: "A modern decentralized social platform.", Description: "实例简介 (Instance Descriptions)"},
		{Key: "instance_privacy_policy_url", Value: "", Description: "隐私政策地址 (Instance Privacy Policy Url)"},
		{Key: "instance_terms_of_service_url", Value: "", Description: "服务条款地址 (Instance Terms of Service Url)"},
		{Key: "contact_forum_uri", Value: "", Description: "联络论坛地址 (Contact Forum Uri)"},
	}

	for _, setting := range defaultSettings {
		var existing InstanceSetting
		if err := dbClient.Where("key = ?", setting.Key).First(&existing).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				// 没找到？那就是全新的空白记录啦！直接插入！Full Combo! 🎉
				dbClient.Create(&setting)
				
				// 同步到缓存！
				if redisClient != nil {
					redisClient.Set(ctx, "setting:"+setting.Key, setting.Value, 24*time.Hour)
				}
			}
		}
	}
}
