package service

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"time"

	"github.com/CyaniAgent/Asagity/core/internal/module/auth/dto"
	"github.com/CyaniAgent/Asagity/core/internal/module/auth/model"
	authrepo "github.com/CyaniAgent/Asagity/core/internal/module/auth/repository"
	usermodel "github.com/CyaniAgent/Asagity/core/internal/module/user/model"
	userrepo "github.com/CyaniAgent/Asagity/core/internal/module/user/repository"
	"github.com/CyaniAgent/Asagity/core/internal/platform/config"
	"github.com/CyaniAgent/Asagity/core/internal/platform/mail"
	"github.com/golang-jwt/jwt/v5"
	"github.com/redis/go-redis/v9"
	"golang.org/x/crypto/bcrypt"
)

const (
	AccessTokenDuration          = 30 * time.Minute
	RefreshTokenDuration         = 30 * 24 * time.Hour
	VerificationCodeExpiry       = 15 * time.Minute
	MaxVerificationAttempts      = 5
	VerificationCooldownDuration = 15 * time.Minute
)

type Service struct {
	authRepo authrepo.Repository
	userRepo *userrepo.Repository
	redis    *redis.Client
	cfg      config.Config
	mail     *mail.Service
}

func New(authRepo authrepo.Repository, userRepo *userrepo.Repository, redis *redis.Client, cfg config.Config, mail *mail.Service) *Service {
	return &Service{authRepo: authRepo, userRepo: userRepo, redis: redis, cfg: cfg, mail: mail}
}

func (s *Service) Register(req dto.RegisterRequest) (*dto.AuthResponse, error) {
	if req.Email != "" {
		if _, err := s.userRepo.GetByEmail(req.Email); err == nil {
			return nil, errors.New("email already registered")
		}
	}
	if _, err := s.userRepo.GetByUsername(req.Username); err == nil {
		return nil, errors.New("username already taken")
	}

	if req.Email != "" {
		return nil, errors.New("email verification required")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	user := &usermodel.User{
		ID:          generateID(),
		PubID:       generatePubID(),
		Username:    req.Username,
		PasswdHash:  string(hashedPassword),
		UserGroupID: "default",
		CreatedAt:   time.Now(),
	}

	if err := s.userRepo.Create(user); err != nil {
		return nil, err
	}

	return s.generateAuthResponse(user)
}

func (s *Service) RegisterWithEmail(req dto.RegisterWithEmailRequest) (*dto.RegisterSendCodeResponse, error) {
	normalizedEmail := mail.NormalizeEmail(req.Email)

	if _, err := s.userRepo.GetByEmail(normalizedEmail); err == nil {
		return nil, errors.New("email already registered")
	}
	if _, err := s.userRepo.GetByUsername(req.Username); err == nil {
		return nil, errors.New("username already taken")
	}

	challengeID := generateID()
	code, err := s.mail.GenerateVerificationCode()
	if err != nil {
		return nil, err
	}

	codeHash, err := bcrypt.GenerateFromPassword([]byte(code), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	expiresAt := time.Now().Add(VerificationCodeExpiry)

	challenge := &model.EmailChallenge{
		ID:           challengeID,
		Email:        normalizedEmail,
		CodeHash:     string(codeHash),
		Purpose:      "register_with_email",
		AttemptCount: 0,
		ExpiresAt:    expiresAt,
		CreatedAt:    time.Now(),
	}

	if err := s.authRepo.CreateEmailChallenge(challenge); err != nil {
		return nil, err
	}

	ctx := context.Background()
	regData := map[string]string{
		"username":      req.Username,
		"email":         normalizedEmail,
		"password_hash": string(hashedPassword),
	}
	regJSON, _ := json.Marshal(regData)
	s.redis.Set(ctx, "register:"+challengeID, string(regJSON), VerificationCodeExpiry)

	if s.mail.IsEnabled() {
		if err := s.mail.SendVerificationEmail(normalizedEmail, code, "register_with_email"); err != nil {
			return nil, err
		}
	}

	return &dto.RegisterSendCodeResponse{
		ChallengeID: challengeID,
		ExpiresAt:   expiresAt.Format(time.RFC3339),
	}, nil
}

func (s *Service) Login(req dto.LoginRequest) (*dto.AuthResponse, error) {
	var user *usermodel.User
	var err error

	user, err = s.userRepo.GetByPubID(req.Identifier)
	if err != nil {
		user, err = s.userRepo.GetByEmail(req.Identifier)
	}
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

func (s *Service) VerifyRegisterEmail(req dto.VerifyEmailRequest) (*dto.AuthResponse, error) {
	challenge, err := s.authRepo.GetLatestEmailChallenge("", "register_with_email")
	if err != nil {
		return nil, errors.New("challenge not found")
	}

	if challenge.ID != req.ChallengeID {
		return nil, errors.New("invalid challenge id")
	}

	if time.Now().After(challenge.ExpiresAt) {
		return nil, errors.New("challenge expired")
	}

	if challenge.VerifiedAt != nil {
		return nil, errors.New("challenge already verified")
	}

	if challenge.AttemptCount >= MaxVerificationAttempts {
		return nil, errors.New("too many attempts")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(challenge.CodeHash), []byte(req.Code)); err != nil {
		challenge.AttemptCount++
		if challenge.AttemptCount >= MaxVerificationAttempts {
			cooldownUntil := time.Now().Add(VerificationCooldownDuration)
			challenge.CooldownUntil = &cooldownUntil
		}
		s.authRepo.CreateEmailChallenge(challenge)
		return nil, errors.New("invalid verification code")
	}

	ctx := context.Background()
	regDataStr, err := s.redis.Get(ctx, "register:"+challenge.ID).Result()
	if err != nil {
		return nil, errors.New("registration data not found")
	}

	var regData map[string]string
	if err := json.Unmarshal([]byte(regDataStr), &regData); err != nil {
		return nil, errors.New("invalid registration data")
	}

	s.redis.Del(ctx, "register:"+challenge.ID)

	user := &usermodel.User{
		ID:          generateID(),
		PubID:       generatePubID(),
		Username:    regData["username"],
		PasswdHash:  regData["password_hash"],
		UserGroupID: "default",
		CreatedAt:   time.Now(),
	}
	email := regData["email"]
	user.Email = &email

	if err := s.userRepo.Create(user); err != nil {
		return nil, err
	}

	challenge.VerifiedAt = &[]time.Time{time.Now()}[0]
	s.authRepo.MarkEmailChallengeVerified(challenge.ID)

	return s.generateAuthResponse(user)
}

func (s *Service) SendLoginVerificationEmail(userID, deviceFingerprint, deviceName string) (*dto.RegisterSendCodeResponse, error) {
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return nil, errors.New("user not found")
	}

	if user.Email == nil {
		return nil, errors.New("user has no email")
	}

	challengeID := generateID()
	code, err := s.mail.GenerateVerificationCode()
	if err != nil {
		return nil, err
	}

	codeHash, err := bcrypt.GenerateFromPassword([]byte(code), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	expiresAt := time.Now().Add(VerificationCodeExpiry)

	challenge := &model.EmailChallenge{
		ID:                challengeID,
		UserID:            userID,
		DeviceFingerprint: deviceFingerprint,
		Email:             *user.Email,
		CodeHash:          string(codeHash),
		Purpose:           "login_new_device",
		AttemptCount:      0,
		ExpiresAt:         expiresAt,
		CreatedAt:         time.Now(),
	}

	if err := s.authRepo.CreateEmailChallenge(challenge); err != nil {
		return nil, err
	}

	if s.mail.IsEnabled() {
		if err := s.mail.SendVerificationEmail(*user.Email, code, "login_new_device"); err != nil {
			return nil, err
		}
	}

	return &dto.RegisterSendCodeResponse{
		ChallengeID: challengeID,
		ExpiresAt:   expiresAt.Format(time.RFC3339),
	}, nil
}

func (s *Service) VerifyLoginEmail(req dto.VerifyEmailRequest, deviceFingerprint, deviceName string) (*dto.AuthResponse, error) {
	challenge, err := s.authRepo.GetLatestEmailChallenge("", "login_new_device")
	if err != nil {
		return nil, errors.New("challenge not found")
	}

	if challenge.ID != req.ChallengeID {
		return nil, errors.New("invalid challenge id")
	}

	if time.Now().After(challenge.ExpiresAt) {
		return nil, errors.New("challenge expired")
	}

	if challenge.AttemptCount >= MaxVerificationAttempts {
		return nil, errors.New("too many attempts")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(challenge.CodeHash), []byte(req.Code)); err != nil {
		challenge.AttemptCount++
		if challenge.AttemptCount >= MaxVerificationAttempts {
			cooldownUntil := time.Now().Add(VerificationCooldownDuration)
			challenge.CooldownUntil = &cooldownUntil
		}
		s.authRepo.CreateEmailChallenge(challenge)
		return nil, errors.New("invalid verification code")
	}

	if challenge.VerifiedAt != nil {
		return nil, errors.New("challenge already verified")
	}

	user, err := s.userRepo.GetByID(challenge.UserID)
	if err != nil {
		return nil, errors.New("user not found")
	}

	challenge.VerifiedAt = &[]time.Time{time.Now()}[0]
	s.authRepo.MarkEmailChallengeVerified(challenge.ID)

	authResponse, err := s.generateAuthResponse(user)
	if err != nil {
		return nil, err
	}

	return &dto.AuthResponse{
		AccessToken:  authResponse.AccessToken,
		RefreshToken: authResponse.RefreshToken,
		User:         authResponse.User,
	}, nil
}
