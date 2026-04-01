package service

import (
	"github.com/CyaniAgent/Asagity/core/internal/module/user/dto"
	"github.com/CyaniAgent/Asagity/core/internal/module/user/repository"
	"github.com/CyaniAgent/Asagity/core/internal/platform/config"
)

type Service struct {
	repo repository.Repository
	cfg  config.Config
}

func New(repo repository.Repository, cfg config.Config) *Service {
	return &Service{repo: repo, cfg: cfg}
}

func (s *Service) MePlaceholder() dto.MessageResponse {
	return dto.MessageResponse{Message: "user me is not implemented yet"}
}
