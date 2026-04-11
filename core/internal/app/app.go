package app

import (
	"net/http"

	assetmodule "github.com/CyaniAgent/Asagity/core/internal/module/asset"
	authmodule "github.com/CyaniAgent/Asagity/core/internal/module/auth"
	drivemodule "github.com/CyaniAgent/Asagity/core/internal/module/drive"
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

	instancemodule.Register(mux, cfg, clients)
	authmodule.Register(mux, cfg, clients)
	usermodule.Register(mux, cfg, clients)
	assetmodule.Register(mux, cfg, clients)
	drivemodule.Register(mux, cfg, clients)

	return &App{mux: mux, cfg: cfg}
}

func (a *App) Router() http.Handler {
	handler := httpx.Auth(a.cfg.JwtSecret)(a.mux)
	handler = httpx.Cors(handler)
	return handler
}
