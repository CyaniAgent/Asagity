package auth

import (
	"github.com/go-chi/chi/v5"

	"github.com/CyaniAgent/Asagity/core/src/Verse.Engine/internal/module/auth/handler"
	authrepository "github.com/CyaniAgent/Asagity/core/src/Verse.Engine/internal/module/auth/repository"
	"github.com/CyaniAgent/Asagity/core/src/Verse.Engine/internal/module/auth/service"
	userrepository "github.com/CyaniAgent/Asagity/core/src/Verse.Engine/internal/module/user/repository"
	"github.com/CyaniAgent/Asagity/core/src/Verse.Engine/internal/platform/config"
	"github.com/CyaniAgent/Asagity/core/src/Verse.Engine/internal/platform/database"
	"github.com/CyaniAgent/Asagity/core/src/Verse.Engine/internal/platform/event"
	"github.com/CyaniAgent/Asagity/core/src/Verse.Engine/internal/platform/mail"
)

func Register(r *chi.Mux, cfg config.Config, clients *database.Clients, eventBus *event.Bus) {
	authRepo := authrepository.New(clients)
	userRepo := userrepository.New(clients)
	mailSvc := mail.New(cfg)
	svc := service.NewWithEventBus(authRepo, userRepo, clients.Redis, cfg, mailSvc, eventBus)
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
