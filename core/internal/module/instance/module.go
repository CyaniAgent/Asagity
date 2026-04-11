package instance

import (
	"net/http"

	"github.com/CyaniAgent/Asagity/core/internal/module/instance/handler"
	"github.com/CyaniAgent/Asagity/core/internal/module/instance/repository"
	"github.com/CyaniAgent/Asagity/core/internal/module/instance/service"
	"github.com/CyaniAgent/Asagity/core/internal/platform/config"
	"github.com/CyaniAgent/Asagity/core/internal/platform/database"
)

func Register(mux *http.ServeMux, cfg config.Config, clients *database.Clients) {
	repo := repository.New(clients)
	svc := service.New(repo, cfg)
	h := handler.New(svc)

	mux.HandleFunc("/", h.Root)
	mux.HandleFunc("/healthz", h.Health)
	mux.HandleFunc("/api/meta/version", h.Version)
	mux.HandleFunc("/api/meta/instance", h.Meta)

	mux.HandleFunc("GET /api/admin/system/instance", h.AdminInstanceSettings)
	mux.HandleFunc("GET /api/admin/system/database", h.AdminDatabaseStats)
	mux.HandleFunc("GET /api/system/environment", h.SystemEnvironment)
}
