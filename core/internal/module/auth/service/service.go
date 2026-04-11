package service

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"time"

	"github.com/CyaniAgent/Asagity/core/internal/module/auth/dto"
	authrepo "github.com/CyaniAgent/Asagity/core/internal/module/auth/repository"
	usermodel "github.com/CyaniAgent/Asagity/core/internal/module/user/model"
	userrepo "github.com/CyaniAgent/Asagity/core/internal/module/user/repository"
	"github.com/CyaniAgent/Asagity/core/internal/platform/config"
	"github.com/golang-jwt/jwt/v5"
	"github.com/redis/go-redis/v9"
	"golang.org/x/crypto/bcrypt"
)

const (
	AccessTokenDuration  = 30 * time.Minute
	RefreshTokenDuration = 30 * 24 * time.Hour
)

type Service struct {
	authRepo authrepo.Repository
	userRepo *userrepo.Repository
	redis    *redis.Client
	cfg      config.Config
}

func New(authRepo authrepo.Repository, userRepo *userrepo.Repository, redis *redis.Client, cfg config.Config) *Service {
	return &Service{authRepo: authRepo, userRepo: userRepo, redis: redis, cfg: cfg}
}

func (s *Service) Register(req dto.RegisterRequest) (*dto.AuthResponse, error) {
	if _, err := s.userRepo.GetByEmail(req.Email); err == nil {
		return nil, errors.New("email already registered")
	}
	if _, err := s.userRepo.GetByUsername(req.Username); err == nil {
		return nil, errors.New("username already taken")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	user := &usermodel.User{
		ID:          generateID(),
		PubID:       generatePubID(),
		Username:    req.Username,
		Email:       &req.Email,
		PasswdHash:  string(hashedPassword),
		UserGroupID: "default",
		CreatedAt:   time.Now(),
	}

	if err := s.userRepo.Create(user); err != nil {
		return nil, err
	}

	return s.generateAuthResponse(user)
}

func (s *Service) Login(req dto.LoginRequest) (*dto.AuthResponse, error) {
	var user *usermodel.User
	var err error

	user, err = s.userRepo.GetByEmail(req.Identifier)
	if err != nil {
		user, err = s.userRepo.GetByUsername(req.Identifier)
	}
	if err != nil {
		return nil, errors.New("invalid credentials")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswdHash), []byte(req.Password)); err != nil {
		return nil, errors.New("invalid credentials")
	}

	return s.generateAuthResponse(user)
}

func (s *Service) Refresh(refreshToken string) (*dto.AuthResponse, error) {
	ctx := context.Background()

	userID, err := s.redis.Get(ctx, "refresh:"+refreshToken).Result()
	if err == redis.Nil {
		return nil, errors.New("invalid refresh token")
	}
	if err != nil {
		return nil, err
	}

	s.redis.Del(ctx, "refresh:"+refreshToken)

	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return nil, err
	}

	return s.generateAuthResponse(user)
}

func (s *Service) Logout(refreshToken string) error {
	ctx := context.Background()
	return s.redis.Del(ctx, "refresh:"+refreshToken).Err()
}

func (s *Service) LogoutAll(userID string) error {
	ctx := context.Background()
	pattern := "refresh:*"
	keys, err := s.redis.Keys(ctx, pattern).Result()
	if err != nil {
		return err
	}

	for _, key := range keys {
		val, _ := s.redis.Get(ctx, key).Result()
		if val == userID {
			s.redis.Del(ctx, key)
		}
	}
	return nil
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

func (s *Service) generateAuthResponse(user *usermodel.User) (*dto.AuthResponse, error) {
	accessToken, err := s.generateAccessToken(user.ID)
	if err != nil {
		return nil, err
	}

	refreshToken, err := s.generateRefreshToken(user.ID)
	if err != nil {
		return nil, err
	}

	return &dto.AuthResponse{
		AccessToken:  accessToken,
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

func (s *Service) generateAccessToken(userID string) (string, error) {
	claims := jwt.MapClaims{
		"sub": userID,
		"exp": time.Now().Add(AccessTokenDuration).Unix(),
		"iat": time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.cfg.JwtSecret))
}

func (s *Service) generateRefreshToken(userID string) (string, error) {
	tokenBytes := make([]byte, 32)
	if _, err := rand.Read(tokenBytes); err != nil {
		return "", err
	}
	token := hex.EncodeToString(tokenBytes)

	ctx := context.Background()
	key := "refresh:" + token
	if err := s.redis.Set(ctx, key, userID, RefreshTokenDuration).Err(); err != nil {
		return "", err
	}

	return token, nil
}

func generateID() string {
	bytes := make([]byte, 16)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)
}

func generatePubID() string {
	bytes := make([]byte, 4)
	rand.Read(bytes)
	return "usr_" + hex.EncodeToString(bytes)
}
