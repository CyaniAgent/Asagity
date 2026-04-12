package auth

import (
	"net/http"

	"github.com/CyaniAgent/Asagity/core/internal/module/auth/handler"
	authrepository "github.com/CyaniAgent/Asagity/core/internal/module/auth/repository"
	"github.com/CyaniAgent/Asagity/core/internal/module/auth/service"
	userrepository "github.com/CyaniAgent/Asagity/core/internal/module/user/repository"
	"github.com/CyaniAgent/Asagity/core/internal/platform/config"
	"github.com/CyaniAgent/Asagity/core/internal/platform/database"
	"github.com/CyaniAgent/Asagity/core/internal/platform/mail"
)

func Register(mux *http.ServeMux, cfg config.Config, clients *database.Clients) {
	authRepo := authrepository.New(clients)
	userRepo := userrepository.New(clients)
	mailSvc := mail.New(cfg)
	svc := service.New(authRepo, userRepo, clients.Redis, cfg, mailSvc)
	h := handler.New(svc)

	mux.HandleFunc("/api/auth/register", h.Register)
	mux.HandleFunc("/api/auth/register/with-email", h.RegisterWithEmail)
	mux.HandleFunc("/api/auth/register/verify-email", h.VerifyRegisterEmail)
	mux.HandleFunc("/api/auth/login", h.Login)
	mux.HandleFunc("/api/auth/login/verify-email", h.VerifyLoginEmail)
	mux.HandleFunc("/api/auth/refresh", h.Refresh)
	mux.HandleFunc("/api/auth/logout", h.Logout)
	mux.HandleFunc("/api/auth/logout-all", h.LogoutAll)
	mux.HandleFunc("/api/auth/me", h.Me)
}
