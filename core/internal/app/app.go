package app

import (
	"net/http"

	authmodule "github.com/CyaniAgent/Asagity/core/internal/module/auth"
	instancemodule "github.com/CyaniAgent/Asagity/core/internal/module/instance"
	usermodule "github.com/CyaniAgent/Asagity/core/internal/module/user"
	"github.com/CyaniAgent/Asagity/core/internal/platform/config"
	"github.com/CyaniAgent/Asagity/core/internal/platform/database"
	"github.com/CyaniAgent/Asagity/core/internal/platform/httpx"
)

type App struct {
	mux *http.ServeMux
	cfg config.Config
}

func New(cfg config.Config, clients *database.Clients) *App {
	mux := http.NewServeMux()

	mux.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		httpx.WriteJSON(w, http.StatusOK, map[string]string{
			"status": "ok",
		})
	})

	instancemodule.Register(mux, cfg, clients)
	authmodule.Register(mux, cfg, clients)
	usermodule.Register(mux, cfg, clients)

	return &App{mux: mux, cfg: cfg}
}

func (a *App) Router() http.Handler {
	handler := httpx.Auth(a.cfg.JwtSecret)(a.mux)
	handler = httpx.Cors(handler)
	return handler
}
