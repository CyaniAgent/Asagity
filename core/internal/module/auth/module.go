package auth

import (
	"net/http"

	authrepository "github.com/CyaniAgent/Asagity/core/internal/module/auth/repository"
	"github.com/CyaniAgent/Asagity/core/internal/module/auth/service"
	userrepository "github.com/CyaniAgent/Asagity/core/internal/module/user/repository"
	"github.com/CyaniAgent/Asagity/core/internal/platform/config"
	"github.com/CyaniAgent/Asagity/core/internal/platform/database"
)

func Register(mux *http.ServeMux, cfg config.Config, clients *database.Clients) {
	authRepo := authrepository.New(clients)
	userRepo := userrepository.New(clients)
	svc := service.New(authRepo, userRepo, cfg)
	h := handler.New(svc)

	mux.HandleFunc("/api/auth/register", h.Register)
	mux.HandleFunc("/api/auth/register/verify-email", h.VerifyRegisterEmail)
	mux.HandleFunc("/api/auth/login", h.Login)
	mux.HandleFunc("/api/auth/login/verify-email", h.VerifyLoginEmail)
	mux.HandleFunc("/api/auth/refresh", h.Refresh)
	mux.HandleFunc("/api/auth/logout", h.Logout)
	mux.HandleFunc("/api/auth/logout-all", h.LogoutAll)
	mux.HandleFunc("/api/auth/me", h.Me)
}
