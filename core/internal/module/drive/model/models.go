package model

import (
	"time"

	"github.com/google/uuid"
)

type FileType string

const (
	FileTypeFolder FileType = "folder"
	FileTypeFile   FileType = "file"
)

type Visibility string

const (
	VisibilityPrivate  Visibility = "private"
	VisibilityPublic   Visibility = "public"
	VisibilityInstance Visibility = "instance"
)

type StorageBackend string

const (
	StorageBackendLocal  StorageBackend = "local"
	StorageBackendS3     StorageBackend = "s3"
	StorageBackendWebDAV StorageBackend = "webdav"
)

type DriveFile struct {
	ID             uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID         uuid.UUID      `gorm:"type:uuid;not null;index" json:"user_id"`
	ParentID       *uuid.UUID     `gorm:"type:uuid;index" json:"parent_id"`
	Name           string         `gorm:"size:255;not null" json:"name"`
	Type           FileType       `gorm:"size:20;not null;default:'file'" json:"type"`
	MimeType       string         `gorm:"size:255" json:"mime_type"`
	Size           int64          `gorm:"default:0" json:"size"`
	Hash           string         `gorm:"size:64" json:"hash"`
	StorageBackend StorageBackend `gorm:"size:20;not null;default:'local'" json:"storage_backend"`
	StorageKey     string         `gorm:"size:512" json:"storage_key"`
	ThumbnailKey   string         `gorm:"size:512" json:"thumbnail_key"`
	Visibility     Visibility     `gorm:"size:20;not null;default:'private'" json:"visibility"`
	IsDeleted      bool           `gorm:"default:false" json:"is_deleted"`
	DeletedAt      *time.Time     `json:"deleted_at,omitempty"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
}

func (DriveFile) TableName() string {
	return "drive_files"
}

type DriveUsage struct {
	UserID       uuid.UUID `gorm:"type:uuid;primaryKey" json:"user_id"`
	TotalFiles   int64     `gorm:"default:0" json:"total_files"`
	TotalFolders int64     `gorm:"default:0" json:"total_folders"`
	UsedBytes    int64     `gorm:"default:0" json:"used_bytes"`
	MaxBytes     int64     `gorm:"default:17179869184" json:"max_bytes"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

func (DriveUsage) TableName() string {
	return "drive_usage"
}
