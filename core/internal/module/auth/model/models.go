package model

import "time"

type Device struct {
	ID                string    `gorm:"primaryKey;type:varchar(64)"`
	UserID            string    `gorm:"index;type:varchar(64);not null"`
	DeviceFingerprint string    `gorm:"index;type:varchar(255);not null"`
	DeviceName        string    `gorm:"type:varchar(255)"`
	UserAgent         string    `gorm:"type:text"`
	IPAddress         string    `gorm:"type:varchar(64)"`
	LastSeenAt        time.Time `gorm:"not null"`
	TrustedAt         *time.Time
	CreatedAt         time.Time `gorm:"not null"`
}

type RefreshToken struct {
	ID                string    `gorm:"primaryKey;type:varchar(64)"`
	UserID            string    `gorm:"index;type:varchar(64);not null"`
	DeviceID          string    `gorm:"index;type:varchar(64);not null"`
	TokenHash         string    `gorm:"type:text;not null"`
	ExpiresAt         time.Time `gorm:"not null"`
	CreatedAt         time.Time `gorm:"not null"`
	RevokedAt         *time.Time
	ReplacedByTokenID *string `gorm:"type:varchar(64)"`
}

type EmailChallenge struct {
	ID                string     `gorm:"primaryKey;type:varchar(64)"`
	UserID            string     `gorm:"index;type:varchar(64)"`
	DeviceFingerprint string     `gorm:"index;type:varchar(255);not null"`
	Email             string     `gorm:"index;type:varchar(320);not null"`
	CodeHash          string     `gorm:"type:text;not null"`
	Purpose           string     `gorm:"index;type:varchar(64);not null"`
	AttemptCount      int        `gorm:"not null;default:0"`
	CooldownUntil     *time.Time `gorm:"index"`
	ResendAvailableAt *time.Time
	ExpiresAt         time.Time `gorm:"not null"`
	VerifiedAt        *time.Time
	CreatedAt         time.Time `gorm:"not null"`
}
