package service

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/CyaniAgent/Asagity/core/internal/module/drive/dto"
	"github.com/CyaniAgent/Asagity/core/internal/module/drive/model"
	"github.com/CyaniAgent/Asagity/core/internal/module/drive/repository"
	"github.com/CyaniAgent/Asagity/core/internal/platform/config"
	"github.com/google/uuid"
)

type Service struct {
	repo       repository.Repository
	cfg        config.Config
	storageDir string
}

func New(repo repository.Repository, cfg config.Config) *Service {
	storageDir := cfg.DriveStoragePath
	if storageDir == "" {
		storageDir = "./storage/drive"
	}
	if err := os.MkdirAll(storageDir, 0755); err != nil {
		panic(fmt.Sprintf("failed to create storage directory: %v", err))
	}
	return &Service{repo: repo, cfg: cfg, storageDir: storageDir}
}

func (s *Service) ListFiles(userID uuid.UUID, req dto.ListFilesRequest) (*dto.ListFilesResponse, error) {
	if req.Limit <= 0 {
		req.Limit = 50
	}
	if req.Limit > 100 {
		req.Limit = 100
	}

	files, total, err := s.repo.ListFiles(userID, req.ParentID, req.Type, req.Search, req.Sort, req.Order, req.Limit, req.Offset)
	if err != nil {
		return nil, err
	}

	var fileResponses []dto.FileResponse
	var folderResponses []dto.FolderResponse

	for i := range files {
		if files[i].Type == model.FileTypeFolder {
			folderResponses = append(folderResponses, dto.ToFolderResponse(&files[i]))
		} else {
			fileResponses = append(fileResponses, dto.ToFileResponse(&files[i]))
		}
	}

	return &dto.ListFilesResponse{
		Files:   fileResponses,
		Folders: folderResponses,
		Total:   total,
		HasMore: int64(req.Offset+len(files)) < total,
	}, nil
}

func (s *Service) GetFile(userID, fileID uuid.UUID) (*dto.FileResponse, error) {
	file, err := s.repo.GetFileByID(fileID)
	if err != nil {
		return nil, err
	}
	if file.UserID != userID {
		return nil, fmt.Errorf("access denied")
	}
	resp := dto.ToFileResponse(file)
	return &resp, nil
}

func (s *Service) CreateFolder(userID uuid.UUID, req dto.CreateFolderRequest) (*dto.CreateFolderResponse, error) {
	if req.Name == "" {
		return nil, fmt.Errorf("folder name is required")
	}

	if req.ParentID != nil {
		parent, err := s.repo.GetFolderByID(*req.ParentID)
		if err != nil {
			return nil, fmt.Errorf("parent folder not found")
		}
		if parent.UserID != userID {
			return nil, fmt.Errorf("access denied")
		}
	}

	folder := &model.DriveFile{
		ID:       uuid.New(),
		UserID:   userID,
		ParentID: req.ParentID,
		Name:     req.Name,
		Type:     model.FileTypeFolder,
	}

	if err := s.repo.CreateFolder(folder); err != nil {
		return nil, err
	}

	if err := s.repo.UpdateUserUsage(userID); err != nil {
		return nil, err
	}

	return &dto.CreateFolderResponse{
		Folder: dto.ToFolderResponse(folder),
	}, nil
}

func (s *Service) UpdateFile(userID, fileID uuid.UUID, req dto.UpdateFileRequest) (*dto.FileResponse, error) {
	file, err := s.repo.GetFileByID(fileID)
	if err != nil {
		return nil, err
	}
	if file.UserID != userID {
		return nil, fmt.Errorf("access denied")
	}

	if req.Name != nil && *req.Name != "" {
		file.Name = *req.Name
	}
	if req.ParentID != nil {
		file.ParentID = req.ParentID
	}
	if req.Visibility != nil {
		file.Visibility = *req.Visibility
	}

	if err := s.repo.UpdateFile(file); err != nil {
		return nil, err
	}

	resp := dto.ToFileResponse(file)
	return &resp, nil
}

func (s *Service) DeleteFile(userID, fileID uuid.UUID) error {
	file, err := s.repo.GetFileByID(fileID)
	if err != nil {
		return err
	}
	if file.UserID != userID {
		return fmt.Errorf("access denied")
	}

	if file.Type == model.FileTypeFile && file.StorageKey != "" {
		if err := s.deletePhysicalFile(file.StorageKey); err != nil {
		}
	}

	if err := s.repo.SoftDeleteFile(fileID); err != nil {
		return err
	}

	return s.repo.UpdateUserUsage(userID)
}

func (s *Service) MoveFile(userID, fileID uuid.UUID, req dto.MoveFileRequest) error {
	file, err := s.repo.GetFileByID(fileID)
	if err != nil {
		return err
	}
	if file.UserID != userID {
		return fmt.Errorf("access denied")
	}

	if req.TargetParentID != nil {
		target, err := s.repo.GetFolderByID(*req.TargetParentID)
		if err != nil {
			return fmt.Errorf("target folder not found")
		}
		if target.UserID != userID {
			return fmt.Errorf("access denied")
		}
	}

	return s.repo.MoveFile(fileID, *req.TargetParentID)
}

func (s *Service) GetUsage(userID uuid.UUID) (*dto.UsageResponse, error) {
	usage, err := s.repo.GetUserUsage(userID)
	if err != nil {
		usage = &model.DriveUsage{
			UserID:   userID,
			MaxBytes: 16 * 1024 * 1024 * 1024,
		}
	}

	usedPercent := 0.0
	if usage.MaxBytes > 0 {
		usedPercent = float64(usage.UsedBytes) / float64(usage.MaxBytes) * 100
	}

	return &dto.UsageResponse{
		UsedBytes:    usage.UsedBytes,
		MaxBytes:     usage.MaxBytes,
		UsedPercent:  usedPercent,
		TotalFiles:   usage.TotalFiles,
		TotalFolders: usage.TotalFolders,
	}, nil
}

func (s *Service) GetStoragePath(userID uuid.UUID, fileID uuid.UUID) string {
	return filepath.Join(s.storageDir, userID.String(), fileID.String())
}

func (s *Service) deletePhysicalFile(storageKey string) error {
	fullPath := filepath.Join(s.storageDir, storageKey)
	return os.Remove(fullPath)
}
