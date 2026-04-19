package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type FollowStatus string

const (
	FollowStatusPending  FollowStatus = "pending"
	FollowStatusAccepted FollowStatus = "accepted"
	FollowStatusRejected FollowStatus = "rejected"
)

type Follow struct {
	ID        string       `gorm:"type:uuid;primaryKey" json:"id"`
	FollowerID string      `gorm:"type:uuid;not null;index" json:"follower_id"`
	FollowingID string     `gorm:"type:uuid;not null;index" json:"following_id"`
	Status     FollowStatus `gorm:"type:varchar(20);default:'accepted';index" json:"status"`
	CreatedAt time.Time   `gorm:"autoCreateTime" json:"created_at"`

	// Indexes
	// Unique index on (follower_id, following_id)
	// Indexes on status for filtering
}

func (f *Follow) BeforeCreate(tx *gorm.DB) error {
	if f.ID == "" {
		f.ID = uuid.NewString()
	}
	return nil
}
