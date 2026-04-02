package repository

import (
	"github.com/CyaniAgent/Asagity/core/internal/module/auth/model"
	"github.com/CyaniAgent/Asagity/core/internal/platform/database"
	"gorm.io/gorm"
)

type Repository interface {
	CreateRefreshToken(token *model.RefreshToken) error
	GetRefreshToken(id string) (*model.RefreshToken, error)
	RevokeRefreshToken(id string) error
	CreateEmailChallenge(challenge *model.EmailChallenge) error
	GetLatestEmailChallenge(email string, purpose string) (*model.EmailChallenge, error)
	MarkEmailChallengeVerified(id string) error
}

type repository struct {
	db *gorm.DB
}

func New(clients *database.Clients) Repository {
	return &repository{db: clients.DB}
}

func (r *repository) CreateRefreshToken(token *model.RefreshToken) error {
	return r.db.Create(token).Error
}

func (r *repository) GetRefreshToken(id string) (*model.RefreshToken, error) {
	var token model.RefreshToken
	if err := r.db.Where("id = ? AND revoked_at IS NULL", id).First(&token).Error; err != nil {
		return nil, err
	}
	return &token, nil
}

func (r *repository) RevokeRefreshToken(id string) error {
	return r.db.Model(&model.RefreshToken{}).Where("id = ?", id).Update("revoked_at", gorm.Expr("NOW()")).Error
}

func (r *repository) CreateEmailChallenge(challenge *model.EmailChallenge) error {
	return r.db.Create(challenge).Error
}

func (r *repository) GetLatestEmailChallenge(email string, purpose string) (*model.EmailChallenge, error) {
	var challenge model.EmailChallenge
	err := r.db.Where("email = ? AND purpose = ?", email, purpose).
		Order("created_at DESC").
		First(&challenge).Error
	if err != nil {
		return nil, err
	}
	return &challenge, nil
}

func (r *repository) MarkEmailChallengeVerified(id string) error {
	return r.db.Model(&model.EmailChallenge{}).Where("id = ?", id).Update("verified_at", gorm.Expr("NOW()")).Error
}
