package repository

import (
	"time"

	"github.com/CyaniAgent/Asagity/core/internal/module/user/model"
	"github.com/CyaniAgent/Asagity/core/internal/platform/database"
	"gorm.io/gorm"
)

type Repository struct {
	db *gorm.DB
}

func New(clients *database.Clients) *Repository {
	return &Repository{db: clients.DB}
}

func (r *Repository) AutoMigrate() error {
	return r.db.AutoMigrate(&model.User{}, &model.PubIDChange{})
}

func (r *Repository) Create(user *model.User) error {
	return r.db.Create(user).Error
}

func (r *Repository) GetByEmail(email string) (*model.User, error) {
	var user model.User
	err := r.db.Where("email = ?", email).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *Repository) GetByUsername(username string) (*model.User, error) {
	var user model.User
	err := r.db.Where("username = ?", username).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *Repository) GetByPubID(pubID string) (*model.User, error) {
	var user model.User
	err := r.db.Where("pub_id = ?", pubID).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *Repository) GetByID(id string) (*model.User, error) {
	var user model.User
	err := r.db.Where("id = ?", id).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *Repository) CountPubIDChangesInMonth(userID string, startOfMonth, endOfMonth time.Time) (int64, error) {
	var count int64
	err := r.db.Model(&model.PubIDChange{}).
		Where("user_id = ? AND changed_at >= ? AND changed_at < ?", userID, startOfMonth, endOfMonth).
		Count(&count).Error
	return count, err
}

func (r *Repository) UpdatePubIDWithHistory(userID, oldPubID, newPubID string) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&model.User{}).Where("id = ? AND pub_id = ?", userID, oldPubID).
			Update("pub_id", newPubID).Error; err != nil {
			return err
		}

		change := &model.PubIDChange{
			UserID:    userID,
			OldPubID:  oldPubID,
			NewPubID:  newPubID,
			ChangedAt: time.Now(),
		}
		if err := tx.Create(change).Error; err != nil {
			return err
		}

		return nil
	})
}

func (r *Repository) GetPubIDChangeHistory(userID string, limit int) ([]model.PubIDChange, error) {
	var changes []model.PubIDChange
	err := r.db.Where("user_id = ?", userID).
		Order("changed_at DESC").
		Limit(limit).
		Find(&changes).Error
	return changes, err
}

func (r *Repository) CheckPubIDExists(pubID string) (bool, error) {
	var count int64
	err := r.db.Model(&model.User{}).Where("pub_id = ?", pubID).Count(&count).Error
	return count > 0, err
}

func (r *Repository) GetByIDs(ids []string) ([]model.User, error) {
	var users []model.User
	if err := r.db.Where("id IN ?", ids).Find(&users).Error; err != nil {
		return nil, err
	}
	return users, nil
}
