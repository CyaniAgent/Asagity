package asset

import (
	"github.com/go-chi/chi/v5"

	"github.com/CyaniAgent/Asagity/core/internal/module/asset/handler"
	"github.com/CyaniAgent/Asagity/core/internal/module/asset/service"
	"github.com/CyaniAgent/Asagity/core/internal/platform/config"
	"github.com/CyaniAgent/Asagity/core/internal/platform/database"
)

func Register(r *chi.Mux, cfg config.Config, clients *database.Clients) {
	svc := service.New(cfg)
	h := handler.New(svc)

	r.Get("/api/asset/icon", h.Icon)
}
