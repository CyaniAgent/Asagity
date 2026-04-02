package service

import (
	"errors"
	"time"

	"github.com/CyaniAgent/Asagity/core/internal/module/auth/dto"
	"github.com/CyaniAgent/Asagity/core/internal/module/auth/model"
	authrepo "github.com/CyaniAgent/Asagity/core/internal/module/auth/repository"
	usermodel "github.com/CyaniAgent/Asagity/core/internal/module/user/model"
	userrepo "github.com/CyaniAgent/Asagity/core/internal/module/user/repository"
	"github.com/CyaniAgent/Asagity/core/internal/platform/config"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type Service struct {
	authRepo authrepo.Repository
	userRepo *userrepo.Repository
	cfg      config.Config
}

func New(authRepo authrepo.Repository, userRepo *userrepo.Repository, cfg config.Config) *Service {
	return &Service{authRepo: authRepo, userRepo: userRepo, cfg: cfg}
}

func (s *Service) Register(req dto.RegisterRequest) (*dto.AuthResponse, error) {
	// Check if user already exists
	if _, err := s.userRepo.GetByEmail(req.Email); err == nil {
		return nil, errors.New("email already registered")
	}
	if _, err := s.userRepo.GetByUsername(req.Username); err == nil {
		return nil, errors.New("username already taken")
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	// Create user
	user := &usermodel.User{
		ID:         uuid.New().String(),
		PubID:      generatePubID(), // Mock for now
		Username:   req.Username,
		Email:      &req.Email,
		PasswdHash: string(hashedPassword),
		CreatedAt:  time.Now(),
	}

	if err := s.userRepo.Create(user); err != nil {
		return nil, err
	}

	return s.generateAuthResponse(user)
}

func (s *Service) Login(req dto.LoginRequest) (*dto.AuthResponse, error) {
	var user *usermodel.User
	var err error

	// Try email first, then username
	user, err = s.userRepo.GetByEmail(req.Identifier)
	if err != nil {
		user, err = s.userRepo.GetByUsername(req.Identifier)
	}

	if err != nil {
		return nil, errors.New("invalid credentials")
	}

	// Verify password
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswdHash), []byte(req.Password)); err != nil {
		return nil, errors.New("invalid credentials")
	}

	return s.generateAuthResponse(user)
}

func (s *Service) generateAuthResponse(user *usermodel.User) (*dto.AuthResponse, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": user.ID,
		"exp": time.Now().Add(time.Hour * 72).Unix(),
	})

	tokenString, err := token.SignedString([]byte(s.cfg.JwtSecret))
	if err != nil {
		return nil, err
	}

	// Mock Refresh Token for now
	refreshToken := uuid.New().String()

	return &dto.AuthResponse{
		AccessToken:  tokenString,
		RefreshToken: refreshToken,
		User: dto.UserResponse{
			ID:        user.ID,
			PubID:     user.PubID,
			Username:  user.Username,
			Name:      user.Name,
			AvatarURL: user.AvatarURL,
		},
	}, nil
}

func (s *Service) Me(userID string) (*dto.UserResponse, error) {
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return nil, err
	}

	return &dto.UserResponse{
		ID:        user.ID,
		PubID:     user.PubID,
		Username:  user.Username,
		Name:      user.Name,
		AvatarURL: user.AvatarURL,
	}, nil
}

func generatePubID() string {
	return uuid.New().String()[:12]
}

// ... original placeholders (can be kept or removed if replaced)
