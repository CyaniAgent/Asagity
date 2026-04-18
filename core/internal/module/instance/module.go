package instance

import (
	"github.com/go-chi/chi/v5"

	"github.com/CyaniAgent/Asagity/core/internal/module/instance/handler"
	"github.com/CyaniAgent/Asagity/core/internal/module/instance/repository"
	"github.com/CyaniAgent/Asagity/core/internal/module/instance/service"
	"github.com/CyaniAgent/Asagity/core/internal/platform/config"
	"github.com/CyaniAgent/Asagity/core/internal/platform/database"
)

func Register(r *chi.Mux, cfg config.Config, clients *database.Clients) {
	repo := repository.New(clients)
	svc := service.New(repo, cfg)
	h := handler.New(svc)

	r.Get("/", h.Root)
	r.Get("/healthz", h.Health)
	r.Get("/api/meta/version", h.Version)
	r.Get("/api/meta/instance", h.Meta)

	r.Get("/api/admin/system/instance", h.AdminInstanceSettings)
	r.Get("/api/admin/system/database", h.AdminDatabaseStats)
	r.Get("/api/system/environment", h.SystemEnvironment)
}
