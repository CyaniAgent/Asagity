package app

import (
	"log"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"

	assetmodule "github.com/CyaniAgent/Asagity/core/internal/module/asset"
	authmodule "github.com/CyaniAgent/Asagity/core/internal/module/auth"
	drivemodule "github.com/CyaniAgent/Asagity/core/internal/module/drive"
	followmodule "github.com/CyaniAgent/Asagity/core/internal/module/follow"
	instancemodule "github.com/CyaniAgent/Asagity/core/internal/module/instance"
	notemodule "github.com/CyaniAgent/Asagity/core/internal/module/note"
	usermodule "github.com/CyaniAgent/Asagity/core/internal/module/user"
	"github.com/CyaniAgent/Asagity/core/internal/platform/config"
	"github.com/CyaniAgent/Asagity/core/internal/platform/database"
	"github.com/CyaniAgent/Asagity/core/internal/platform/httpx"
	"github.com/CyaniAgent/Asagity/core/internal/platform/search"
)

type App struct {
	mux *chi.Mux
	cfg config.Config
}

func New(cfg config.Config, clients *database.Clients) *App {
	mux := chi.NewRouter()

	mux.Use(middleware.Recoverer)
	mux.Use(middleware.RequestID)
	mux.Use(httpx.Cors)
	mux.Use(httpx.Auth(cfg.JwtSecret))

	searchEngine, err := search.NewBleveEngine(search.Config{
		IndexPath: "./data/search",
		IndexName: "notes",
	})
	if err != nil {
		log.Printf("[app] Search engine initialization failed: %v (search will be unavailable)", err)
		searchEngine = nil
	}

	instancemodule.Register(mux, cfg, clients)
	authmodule.Register(mux, cfg, clients)
	usermodule.Register(mux, cfg, clients)
	assetmodule.Register(mux, cfg, clients)
	drivemodule.Register(mux, cfg, clients)
	followmodule.Register(mux, cfg, clients)
	notemodule.Register(mux, cfg, clients, searchEngine)

	return &App{mux: mux, cfg: cfg}
}

func (a *App) Router() *chi.Mux {
	return a.mux
}
