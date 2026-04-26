package dto

// 错误常量
const (
	ErrInvalidCredentials = "ERR 14101"
	ErrInvalidRefreshToken = "ERR 14102"
)

type MessageResponse struct {
	Message string `json:"message"`
}

type RegisterRequest struct {
	Username string `json:"username" validate:"required,min=3,max=64"`
	Email    string `json:"email" validate:"omitempty,email"`
	Password string `json:"password" validate:"required,min=8"`
}

type LoginRequest struct {
	Identifier string `json:"identifier" validate:"required"`
	Password   string `json:"password" validate:"required"`
}

type RefreshRequest struct {
	RefreshToken string `json:"refresh_token" validate:"required"`
}

type LogoutRequest struct {
	RefreshToken string `json:"refresh_token" validate:"required"`
}

type AuthResponse struct {
	AccessToken  string       `json:"access_token"`
	RefreshToken string       `json:"refresh_token"`
	User         UserResponse `json:"user"`
}

type UserResponse struct {
	ID        string `json:"id"`
	PubID     string `json:"pub_id"`
	Username  string `json:"username"`
	Name      string `json:"name"`
	AvatarURL string `json:"avatar_url"`
}

type VerifyEmailRequest struct {
	ChallengeID string `json:"challenge_id" validate:"required"`
	Code        string `json:"code" validate:"required,len=6"`
}

type RegisterWithEmailRequest struct {
	Username string `json:"username" validate:"required,min=3,max=64"`
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=8"`
}

type RegisterSendCodeResponse struct {
	ChallengeID string `json:"challenge_id"`
	ExpiresAt   string `json:"expires_at"`
}

type LoginChallengeResponse struct {
	ChallengeID string `json:"challenge_id"`
	ExpiresAt   string `json:"expires_at"`
}
