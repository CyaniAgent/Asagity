package repository

import (
	"github.com/CyaniAgent/Asagity/core/internal/module/drive/model"
	"github.com/CyaniAgent/Asagity/core/internal/platform/database"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Repository interface {
	CreateFile(file *model.DriveFile) error
	GetFileByID(id uuid.UUID) (*model.DriveFile, error)
	UpdateFile(file *model.DriveFile) error
	DeleteFile(id uuid.UUID) error
	SoftDeleteFile(id uuid.UUID) error

	ListFiles(userID uuid.UUID, parentID *uuid.UUID, fileType string, search string, sort, order string, limit, offset int) ([]model.DriveFile, int64, error)
	ListFolders(userID uuid.UUID, parentID *uuid.UUID) ([]model.DriveFile, error)
	CountFiles(userID uuid.UUID) (int64, error)
	CountFolders(userID uuid.UUID) (int64, error)
	GetUserUsage(userID uuid.UUID) (*model.DriveUsage, error)
	UpdateUserUsage(userID uuid.UUID) error

	CreateFolder(folder *model.DriveFile) error
	GetFolderByID(id uuid.UUID) (*model.DriveFile, error)
	MoveFile(fileID, targetParentID uuid.UUID) error

	GetTotalSize(userID uuid.UUID) (int64, error)
}

type repository struct {
	db *gorm.DB
}

func New(clients *database.Clients) Repository {
	return &repository{db: clients.DB}
}

func (r *repository) CreateFile(file *model.DriveFile) error {
	return r.db.Create(file).Error
}

func (r *repository) GetFileByID(id uuid.UUID) (*model.DriveFile, error) {
	var file model.DriveFile
	err := r.db.Where("id = ? AND is_deleted = false", id).First(&file).Error
	if err != nil {
		return nil, err
	}
	return &file, nil
}

func (r *repository) UpdateFile(file *model.DriveFile) error {
	return r.db.Save(file).Error
}

func (r *repository) DeleteFile(id uuid.UUID) error {
	return r.db.Unscoped().Delete(&model.DriveFile{}, "id = ?", id).Error
}

func (r *repository) SoftDeleteFile(id uuid.UUID) error {
	return r.db.Model(&model.DriveFile{}).Where("id = ?", id).Update("is_deleted", true).Error
}

func (r *repository) ListFiles(userID uuid.UUID, parentID *uuid.UUID, fileType string, search string, sort, order string, limit, offset int) ([]model.DriveFile, int64, error) {
	var files []model.DriveFile
	query := r.db.Model(&model.DriveFile{}).Where("user_id = ? AND is_deleted = false", userID)

	if parentID != nil {
		query = query.Where("parent_id = ?", parentID)
	} else {
		query = query.Where("parent_id IS NULL")
	}

	if fileType == "file" {
		query = query.Where("type = ?", model.FileTypeFile)
	} else if fileType == "folder" {
		query = query.Where("type = ?", model.FileTypeFolder)
	}

	if search != "" {
		query = query.Where("name ILIKE ?", "%"+search+"%")
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if sort == "" {
		sort = "created_at"
	}
	if order == "" {
		order = "desc"
	}
	if fileType != "folder" {
		query = query.Where("type = ?", model.FileTypeFile)
	}

	query = query.Order(sort + " " + order)

	if limit > 0 {
		query = query.Limit(limit).Offset(offset)
	}

	err := query.Find(&files).Error
	return files, total, err
}

func (r *repository) ListFolders(userID uuid.UUID, parentID *uuid.UUID) ([]model.DriveFile, error) {
	var folders []model.DriveFile
	query := r.db.Model(&model.DriveFile{}).Where("user_id = ? AND type = ? AND is_deleted = false", userID, model.FileTypeFolder)

	if parentID != nil {
		query = query.Where("parent_id = ?", parentID)
	} else {
		query = query.Where("parent_id IS NULL")
	}

	err := query.Order("name ASC").Find(&folders).Error
	return folders, err
}

func (r *repository) CountFiles(userID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.Model(&model.DriveFile{}).Where("user_id = ? AND type = ? AND is_deleted = false", userID, model.FileTypeFile).Count(&count).Error
	return count, err
}

func (r *repository) CountFolders(userID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.Model(&model.DriveFile{}).Where("user_id = ? AND type = ? AND is_deleted = false", userID, model.FileTypeFolder).Count(&count).Error
	return count, err
}

func (r *repository) GetUserUsage(userID uuid.UUID) (*model.DriveUsage, error) {
	var usage model.DriveUsage
	err := r.db.Where("user_id = ?", userID).First(&usage).Error
	if err == gorm.ErrRecordNotFound {
		usage = model.DriveUsage{
			UserID:   userID,
			MaxBytes: 16 * 1024 * 1024 * 1024,
		}
		err = r.db.Create(&usage).Error
	}
	if err != nil {
		return nil, err
	}
	return &usage, nil
}

func (r *repository) UpdateUserUsage(userID uuid.UUID) error {
	var totalSize int64
	if err := r.db.Model(&model.DriveFile{}).Where("user_id = ? AND type = ? AND is_deleted = false", userID, model.FileTypeFile).Select("COALESCE(SUM(size), 0)").Scan(&totalSize).Error; err != nil {
		return err
	}

	var totalFiles int64
	if err := r.db.Model(&model.DriveFile{}).Where("user_id = ? AND type = ? AND is_deleted = false", userID, model.FileTypeFile).Count(&totalFiles).Error; err != nil {
		return err
	}

	var totalFolders int64
	if err := r.db.Model(&model.DriveFile{}).Where("user_id = ? AND type = ? AND is_deleted = false", userID, model.FileTypeFolder).Count(&totalFolders).Error; err != nil {
		return err
	}

	return r.db.Model(&model.DriveUsage{}).Where("user_id = ?", userID).Updates(map[string]interface{}{
		"used_bytes":    totalSize,
		"total_files":   totalFiles,
		"total_folders": totalFolders,
	}).Error
}

func (r *repository) CreateFolder(folder *model.DriveFile) error {
	return r.db.Create(folder).Error
}

func (r *repository) GetFolderByID(id uuid.UUID) (*model.DriveFile, error) {
	var folder model.DriveFile
	err := r.db.Where("id = ? AND type = ? AND is_deleted = false", id, model.FileTypeFolder).First(&folder).Error
	if err != nil {
		return nil, err
	}
	return &folder, nil
}

func (r *repository) MoveFile(fileID, targetParentID uuid.UUID) error {
	return r.db.Model(&model.DriveFile{}).Where("id = ?", fileID).Update("parent_id", targetParentID).Error
}

func (r *repository) GetTotalSize(userID uuid.UUID) (int64, error) {
	var total int64
	err := r.db.Model(&model.DriveFile{}).Where("user_id = ? AND type = ? AND is_deleted = false", userID, model.FileTypeFile).Select("COALESCE(SUM(size), 0)").Scan(&total).Error
	return total, err
}
