package service

import (
	"github.com/CyaniAgent/Asagity/core/internal/module/auth/dto"
	"github.com/CyaniAgent/Asagity/core/internal/module/auth/repository"
	"github.com/CyaniAgent/Asagity/core/internal/platform/config"
)

type Service struct {
	repo repository.Repository
	cfg  config.Config
}

func New(repo repository.Repository, cfg config.Config) *Service {
	return &Service{repo: repo, cfg: cfg}
}

func (s *Service) RegisterPlaceholder() dto.MessageResponse {
	return dto.MessageResponse{Message: "auth register is not implemented yet"}
}

func (s *Service) VerifyRegisterEmailPlaceholder() dto.MessageResponse {
	return dto.MessageResponse{Message: "auth register email verification is not implemented yet"}
}

func (s *Service) LoginPlaceholder() dto.MessageResponse {
	return dto.MessageResponse{Message: "auth login is not implemented yet"}
}

func (s *Service) VerifyLoginEmailPlaceholder() dto.MessageResponse {
	return dto.MessageResponse{Message: "auth login email verification is not implemented yet"}
}

func (s *Service) RefreshPlaceholder() dto.MessageResponse {
	return dto.MessageResponse{Message: "auth refresh is not implemented yet"}
}

func (s *Service) LogoutPlaceholder() dto.MessageResponse {
	return dto.MessageResponse{Message: "auth logout is not implemented yet"}
}

func (s *Service) LogoutAllPlaceholder() dto.MessageResponse {
	return dto.MessageResponse{Message: "auth logout-all is not implemented yet"}
}

func (s *Service) MePlaceholder() dto.MessageResponse {
	return dto.MessageResponse{Message: "auth me is not implemented yet"}
}
