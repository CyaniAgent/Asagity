package model

import "time"

type User struct {
	ID          string    `gorm:"primaryKey;type:varchar(64)"`
	PubID       string    `gorm:"uniqueIndex;type:char(12);not null"`
	Name        string    `gorm:"type:varchar(255)"`
	Username    string    `gorm:"uniqueIndex;type:varchar(64);not null"`
	Email       *string   `gorm:"uniqueIndex;type:varchar(320)"`
	PasswdHash  string    `gorm:"type:text;not null"`
	AvatarURL   string    `gorm:"type:text"`
	Description string    `gorm:"type:text"`
	UserGroupID string    `gorm:"index;type:varchar(64);not null"`
	CreatedAt   time.Time `gorm:"not null"`
}

type UserGroup struct {
	ID          string    `gorm:"primaryKey;type:varchar(64)"`
	Name        string    `gorm:"type:varchar(255);not null"`
	Code        string    `gorm:"uniqueIndex;type:varchar(64);not null"`
	Description string    `gorm:"type:text"`
	CreatedAt   time.Time `gorm:"not null"`
}

type PubIDChange struct {
	ID        string    `gorm:"primaryKey;type:varchar(64)"`
	UserID    string    `gorm:"index;type:varchar(64);not null"`
	OldPubID  string    `gorm:"type:char(12);not null"`
	NewPubID  string    `gorm:"type:char(12);not null"`
	ChangedAt time.Time `gorm:"index;not null"`
}
