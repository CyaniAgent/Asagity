package service

import (
	"github.com/CyaniAgent/Asagity/core/src/Verse.Engine/internal/module/instance/dto"
	"github.com/CyaniAgent/Asagity/core/src/Verse.Engine/internal/module/instance/model"
	"github.com/CyaniAgent/Asagity/core/src/Verse.Engine/internal/module/instance/repository"
	"github.com/CyaniAgent/Asagity/core/src/Verse.Engine/internal/platform/config"
	"github.com/CyaniAgent/Asagity/core/src/Verse.Engine/internal/platform/database"
)

type Service struct {
	repo    repository.Repository
	cfg     config.Config
	clients *database.Clients
}

func New(repo repository.Repository, cfg config.Config) *Service {
	return &Service{repo: repo, cfg: cfg}
}

// NewWithClients binds the shared clients so the service can report the
// runtime mode and query the seeded administrator account.
func NewWithClients(repo repository.Repository, cfg config.Config, clients *database.Clients) *Service {
	return &Service{repo: repo, cfg: cfg, clients: clients}
}

func (s *Service) Version() dto.VersionResponse {
	return dto.VersionResponse{Name: "Asagity Core", Version: s.cfg.AppVersion}
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

func (s *Service) SystemEnvironment() dto.SystemEnvironmentResponse {
	return dto.SystemEnvironmentResponse{
		Hostname:    s.cfg.HostHostname,
		Platform:    s.cfg.HostOS,
		OSVersion:   s.cfg.HostOSVersion,
		Arch:        s.cfg.HostArch,
		CPU:         s.cfg.HostCPU,
		Memory:      s.cfg.HostMemory,
		IsContainer: s.cfg.HostHostname != "",
	}
}

// DeveloperAccount reports the seeded administrator account: the developer
// account in lite mode, the instance administrator in production.
func (s *Service) DeveloperAccount() dto.DeveloperAccountResponse {
	resp := dto.DeveloperAccountResponse{Mode: s.clients.Mode.String()}

	info, exists, err := s.repo.GetAdministrator()
	if err != nil {
		return resp
	}
	if !exists {
		return resp
	}

	resp.Exists = true
	resp.Username = info.Username
	resp.Email = info.Email
	resp.Name = info.Name
	resp.Group = info.GroupName
	resp.GroupID = info.GroupID
	resp.PubID = info.PubID
	resp.SeededBy = "database.SeedAdministrator"
	return resp
}
