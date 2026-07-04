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
	"github.com/CyaniAgent/Asagity/core/internal/platform/event"
	"github.com/CyaniAgent/Asagity/core/internal/platform/httpx"
	"github.com/CyaniAgent/Asagity/core/internal/platform/search"
	"github.com/CyaniAgent/Asagity/core/internal/platform/ws"
)

type App struct {
	mux      *chi.Mux
	cfg      config.Config
	eventBus *event.Bus
	wsServer *ws.Server
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

	eventBus := event.NewBus(event.BusConfig{
		AsyncWorkers: 16,
	})
	log.Println("[app] Asagity NET Core EventBus initialized")

	wsServer := ws.NewServer(eventBus)
	wsServer.Start()

	if clients.Redis != nil {
		bridge := event.NewBridge(eventBus, clients.Redis)
		if err := bridge.Start(); err != nil {
			log.Printf("[app] EventBridge failed to start: %v", err)
		}
	}

	instancemodule.Register(mux, cfg, clients)
	authmodule.Register(mux, cfg, clients, eventBus)
	usermodule.Register(mux, cfg, clients, eventBus)
	assetmodule.Register(mux, cfg, clients)
	drivemodule.Register(mux, cfg, clients)
	followmodule.Register(mux, cfg, clients, eventBus)
	notemodule.Register(mux, cfg, clients, searchEngine, eventBus)

	mux.Get("/ws/timeline", ws.NewHandler(wsServer, ws.ChannelEventTypes(ws.ChannelTimeline)...))
	mux.Get("/ws/notifications", ws.NewHandler(wsServer, ws.ChannelEventTypes(ws.ChannelNotifications)...))
	mux.Get("/ws/global", ws.NewHandler(wsServer, ws.ChannelEventTypes(ws.ChannelGlobal)...))

	return &App{mux: mux, cfg: cfg, eventBus: eventBus, wsServer: wsServer}
}

func (a *App) Router() *chi.Mux {
	return a.mux
}

func (a *App) EventBus() *event.Bus {
	return a.eventBus
}

func (a *App) WSServer() *ws.Server {
	return a.wsServer
}
