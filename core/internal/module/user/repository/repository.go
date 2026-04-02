package repository

import (
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

func (r *Repository) Create(user *model.User) error {
	return r.db.Create(user).Error
}

func (r *Repository) GetByEmail(email string) (*model.User, error) {
	var user model.User
	if err := r.db.Where("email = ?", email).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *Repository) GetByUsername(username string) (*model.User, error) {
	var user model.User
	if err := r.db.Where("username = ?", username).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *Repository) GetByID(id string) (*model.User, error) {
	var user model.User
	if err := r.db.Where("id = ?", id).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}
