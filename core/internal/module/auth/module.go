package auth

import (
	"github.com/go-chi/chi/v5"

	"github.com/CyaniAgent/Asagity/core/internal/module/auth/handler"
	authrepository "github.com/CyaniAgent/Asagity/core/internal/module/auth/repository"
	"github.com/CyaniAgent/Asagity/core/internal/module/auth/service"
	userrepository "github.com/CyaniAgent/Asagity/core/internal/module/user/repository"
	"github.com/CyaniAgent/Asagity/core/internal/platform/config"
	"github.com/CyaniAgent/Asagity/core/internal/platform/database"
	"github.com/CyaniAgent/Asagity/core/internal/platform/mail"
)

func Register(r *chi.Mux, cfg config.Config, clients *database.Clients) {
	authRepo := authrepository.New(clients)
	userRepo := userrepository.New(clients)
	mailSvc := mail.New(cfg)
	svc := service.New(authRepo, userRepo, clients.Redis, cfg, mailSvc)
	h := handler.New(svc)

	r.Post("/api/auth/register", h.Register)
	r.Post("/api/auth/register/with-email", h.RegisterWithEmail)
	r.Post("/api/auth/register/verify-email", h.VerifyRegisterEmail)
	r.Post("/api/auth/login", h.Login)
	r.Post("/api/auth/login/verify-email", h.VerifyLoginEmail)
	r.Post("/api/auth/refresh", h.Refresh)
	r.Post("/api/auth/logout", h.Logout)
	r.Post("/api/auth/logout-all", h.LogoutAll)
	r.Get("/api/auth/me", h.Me)
}
