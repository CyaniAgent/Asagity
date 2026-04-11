package service

import (
	"github.com/CyaniAgent/Asagity/core/internal/module/instance/dto"
	"github.com/CyaniAgent/Asagity/core/internal/module/instance/model"
	"github.com/CyaniAgent/Asagity/core/internal/module/instance/repository"
	"github.com/CyaniAgent/Asagity/core/internal/platform/config"
)

type Service struct {
	repo repository.Repository
	cfg  config.Config
}

func New(repo repository.Repository, cfg config.Config) *Service {
	return &Service{repo: repo, cfg: cfg}
}

func (s *Service) Version() dto.VersionResponse {
	return dto.VersionResponse{Name: "Asagity Core", Version: "dev"}
}

func (s *Service) Meta() dto.MetaResponse {
	return dto.MetaResponse{
		Name:        "Asagity",
		Alias:       "",
		Description: "Asagity instance metadata is not configured yet.",
	}
}

func (s *Service) GetAllSettings() ([]model.InstanceSetting, error) {
	return s.repo.GetAllSettings()
}

func (s *Service) GetDatabaseStats() ([]repository.DatabaseStat, error) {
	return s.repo.GetDatabaseStats()
}
