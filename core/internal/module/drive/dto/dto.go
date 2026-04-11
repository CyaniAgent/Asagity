package dto

import (
	"time"

	"github.com/CyaniAgent/Asagity/core/internal/module/drive/model"
	"github.com/google/uuid"
)

type FileResponse struct {
	ID             uuid.UUID            `json:"id"`
	ParentID       *uuid.UUID           `json:"parent_id"`
	Name           string               `json:"name"`
	Type           model.FileType       `json:"type"`
	MimeType       string               `json:"mime_type,omitempty"`
	Size           int64                `json:"size"`
	Hash           string               `json:"hash,omitempty"`
	StorageBackend model.StorageBackend `json:"storage_backend"`
	Visibility     model.Visibility     `json:"visibility"`
	CreatedAt      time.Time            `json:"created_at"`
	UpdatedAt      time.Time            `json:"updated_at"`
}

type FolderResponse struct {
	ID        uuid.UUID  `json:"id"`
	ParentID  *uuid.UUID `json:"parent_id"`
	Name      string     `json:"name"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
}

type ListFilesRequest struct {
	ParentID *uuid.UUID `query:"parent_id"`
	Type     string     `query:"type"`
	Search   string     `query:"search"`
	Sort     string     `query:"sort"`
	Order    string     `query:"order"`
	Limit    int        `query:"limit"`
	Offset   int        `query:"offset"`
}

type ListFilesResponse struct {
	Files   []FileResponse   `json:"files"`
	Folders []FolderResponse `json:"folders"`
	Total   int64            `json:"total"`
	HasMore bool             `json:"has_more"`
}

type CreateFolderRequest struct {
	Name     string     `json:"name" form:"name"`
	ParentID *uuid.UUID `json:"parent_id" form:"parent_id"`
}

type CreateFolderResponse struct {
	Folder FolderResponse `json:"folder"`
}

type UpdateFileRequest struct {
	Name       *string           `json:"name,omitempty"`
	ParentID   *uuid.UUID        `json:"parent_id,omitempty"`
	Visibility *model.Visibility `json:"visibility,omitempty"`
}

type MoveFileRequest struct {
	TargetParentID *uuid.UUID `json:"target_parent_id"`
}

type UsageResponse struct {
	UsedBytes    int64   `json:"used_bytes"`
	MaxBytes     int64   `json:"max_bytes"`
	UsedPercent  float64 `json:"used_percent"`
	TotalFiles   int64   `json:"total_files"`
	TotalFolders int64   `json:"total_folders"`
}

type UploadInitRequest struct {
	Filename    string           `json:"filename" form:"filename"`
	Size        int64            `json:"size" form:"size"`
	MimeType    string           `json:"mime_type" form:"mime_type"`
	ParentID    *uuid.UUID       `json:"parent_id" form:"parent_id"`
	Visibility  model.Visibility `json:"visibility" form:"visibility"`
	Chunked     bool             `json:"chunked"`
	ChunkSize   int64            `json:"chunk_size,omitempty"`
	TotalChunks int              `json:"total_chunks,omitempty"`
}

type UploadInitResponse struct {
	FileID    uuid.UUID `json:"file_id"`
	UploadID  uuid.UUID `json:"upload_id"`
	ChunkSize int64     `json:"chunk_size"`
	ExpiresAt time.Time `json:"expires_at"`
}

func ToFileResponse(f *model.DriveFile) FileResponse {
	return FileResponse{
		ID:             f.ID,
		ParentID:       f.ParentID,
		Name:           f.Name,
		Type:           f.Type,
		MimeType:       f.MimeType,
		Size:           f.Size,
		Hash:           f.Hash,
		StorageBackend: f.StorageBackend,
		Visibility:     f.Visibility,
		CreatedAt:      f.CreatedAt,
		UpdatedAt:      f.UpdatedAt,
	}
}

func ToFolderResponse(f *model.DriveFile) FolderResponse {
	return FolderResponse{
		ID:        f.ID,
		ParentID:  f.ParentID,
		Name:      f.Name,
		CreatedAt: f.CreatedAt,
		UpdatedAt: f.UpdatedAt,
	}
}
