package app

import (
	"net/http"

	authmodule "github.com/CyaniAgent/Asagity/core/internal/module/auth"
	instancemodule "github.com/CyaniAgent/Asagity/core/internal/module/instance"
	usermodule "github.com/CyaniAgent/Asagity/core/internal/module/user"
	"github.com/CyaniAgent/Asagity/core/internal/platform/config"
	"github.com/CyaniAgent/Asagity/core/internal/platform/database"
)

type App struct {
	mux *http.ServeMux
}

func New(cfg config.Config, clients *database.Clients) *App {
	mux := http.NewServeMux()

	instancemodule.Register(mux, cfg, clients)
	authmodule.Register(mux, cfg, clients)
	usermodule.Register(mux, cfg, clients)

	return &App{mux: mux}
}

func (a *App) Router() http.Handler {
	return a.mux
}
