package service

import (
	"errors"
	"time"

	"github.com/CyaniAgent/Asagity/core/internal/module/user/dto"
	"github.com/CyaniAgent/Asagity/core/internal/module/user/repository"
	"github.com/CyaniAgent/Asagity/core/internal/platform/config"
	"github.com/CyaniAgent/Asagity/core/internal/platform/id"
)

type Service struct {
	repo *repository.Repository
	cfg  config.Config
}

func New(repo *repository.Repository, cfg config.Config) *Service {
	return &Service{repo: repo, cfg: cfg}
}

func (s *Service) MePlaceholder() dto.MessageResponse {
	return dto.MessageResponse{Message: "user me is not implemented yet"}
}

func (s *Service) ChangePubID(userID, currentPubID, newPubID string) (*dto.ChangePubIDResponse, error) {
	if !id.ValidateCustomPubID(newPubID) {
		return nil, errors.New("invalid pub_id format")
	}

	if newPubID == currentPubID {
		return nil, errors.New("new_pub_id is the same as current pub_id")
	}

	exists, err := s.repo.CheckPubIDExists(newPubID)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, errors.New("pub_id already taken")
	}

	now := time.Now()
	startOfMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	endOfMonth := startOfMonth.AddDate(0, 1, 0)

	changeCount, err := s.repo.CountPubIDChangesInMonth(userID, startOfMonth, endOfMonth)
	if err != nil {
		return nil, err
	}

	if changeCount >= id.MaxPubIDChangesPerMonth {
		return nil, errors.New("monthly pub_id change limit reached")
	}

	if err := s.repo.UpdatePubIDWithHistory(userID, currentPubID, newPubID); err != nil {
		return nil, err
	}

	changesLeft := int(id.MaxPubIDChangesPerMonth) - int(changeCount) - 1

	return &dto.ChangePubIDResponse{
		PubID:       newPubID,
		ChangesLeft: changesLeft,
		ResetDate:   endOfMonth.Format(time.RFC3339),
	}, nil
}

func (s *Service) GetPubIDChangeHistory(userID string, limit int) (*dto.PubIDChangeHistoryResponse, error) {
	if limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}

	changes, err := s.repo.GetPubIDChangeHistory(userID, limit)
	if err != nil {
		return nil, err
	}

	history := make([]dto.PubIDChangeHistoryItem, len(changes))
	for i, change := range changes {
		history[i] = dto.PubIDChangeHistoryItem{
			OldPubID:  change.OldPubID,
			NewPubID:  change.NewPubID,
			ChangedAt: change.ChangedAt.Format(time.RFC3339),
		}
	}

	return &dto.PubIDChangeHistoryResponse{
		History: history,
		Total:   len(changes),
	}, nil
}
