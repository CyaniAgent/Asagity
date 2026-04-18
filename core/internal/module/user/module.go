package user

import (
	"github.com/go-chi/chi/v5"

	"github.com/CyaniAgent/Asagity/core/internal/module/user/handler"
	"github.com/CyaniAgent/Asagity/core/internal/module/user/repository"
	"github.com/CyaniAgent/Asagity/core/internal/module/user/service"
	"github.com/CyaniAgent/Asagity/core/internal/platform/config"
	"github.com/CyaniAgent/Asagity/core/internal/platform/database"
)

func Register(r *chi.Mux, cfg config.Config, clients *database.Clients) {
	repo := repository.New(clients)
	svc := service.New(repo, cfg)
	h := handler.New(svc)

	r.Get("/api/users/me", h.Me)
}
