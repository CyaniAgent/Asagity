package app

import (
	"context"
	"log"
	"net/http"
	"sync"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"

	assetmodule "github.com/CyaniAgent/Asagity/core/src/Verse.Engine/internal/module/asset"
	authmodule "github.com/CyaniAgent/Asagity/core/src/Verse.Engine/internal/module/auth"
	drivemodule "github.com/CyaniAgent/Asagity/core/src/Verse.Engine/internal/module/drive"
	followmodule "github.com/CyaniAgent/Asagity/core/src/Verse.Engine/internal/module/follow"
	instancemodule "github.com/CyaniAgent/Asagity/core/src/Verse.Engine/internal/module/instance"
	notemodule "github.com/CyaniAgent/Asagity/core/src/Verse.Engine/internal/module/note"
	shellmodule "github.com/CyaniAgent/Asagity/core/src/Verse.Engine/internal/module/shell"
	usermodule "github.com/CyaniAgent/Asagity/core/src/Verse.Engine/internal/module/user"
	"github.com/CyaniAgent/Asagity/core/src/Verse.Engine/internal/platform/config"
	"github.com/CyaniAgent/Asagity/core/src/Verse.Engine/internal/platform/database"
	"github.com/CyaniAgent/Asagity/core/src/Verse.Engine/internal/platform/event"
	"github.com/CyaniAgent/Asagity/core/src/Verse.Engine/internal/platform/httpx"
	"github.com/CyaniAgent/Asagity/core/src/Verse.Engine/internal/platform/search"
	"github.com/CyaniAgent/Asagity/core/src/Verse.Engine/internal/platform/ws"
)

type App struct {
	mu         sync.Mutex
	mux        *chi.Mux
	cfg        config.Config
	eventBus   *event.Bus
	wsServer   *ws.Server
	bridge     *event.Bridge
	httpServer *http.Server
}

func New(cfg config.Config, clients *database.Clients) *App {
	mux := chi.NewRouter()

	mux.Use(middleware.Recoverer)
	mux.Use(middleware.RequestID)
	mux.Use(httpx.Cors(cfg.CORSAllowedOrigins))
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
	log.Println("[app] Asagity EventBus initialized")

	wsServer := ws.NewServer(eventBus)
	wsServer.Start()

	var bridge *event.Bridge
	if clients.Redis != nil {
		bridge = event.NewBridge(eventBus, clients.Redis)
		if err := bridge.Start(); err != nil {
			log.Printf("[app] EventBridge failed to start: %v", err)
			bridge = nil
		}
	}

	instancemodule.Register(mux, cfg, clients)
	authmodule.Register(mux, cfg, clients, eventBus)
	usermodule.Register(mux, cfg, clients, eventBus)
	assetmodule.Register(mux, cfg, clients)
	drivemodule.Register(mux, cfg, clients)
	followmodule.Register(mux, cfg, clients, eventBus)
	notemodule.Register(mux, cfg, clients, searchEngine, eventBus)
	shellmodule.Register(mux, cfg, eventBus)

	mux.Get("/ws/timeline", ws.NewHandler(wsServer, cfg.WSAllowedOrigins, ws.ChannelEventTypes(ws.ChannelTimeline)...))
	mux.Get("/ws/notifications", ws.NewHandler(wsServer, cfg.WSAllowedOrigins, ws.ChannelEventTypes(ws.ChannelNotifications)...))
	mux.Get("/ws/global", ws.NewHandler(wsServer, cfg.WSAllowedOrigins, ws.ChannelEventTypes(ws.ChannelGlobal)...))

	return &App{mux: mux, cfg: cfg, eventBus: eventBus, wsServer: wsServer, bridge: bridge}
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
func (a *App) Serve(addr string) error {
	a.mu.Lock()
	a.httpServer = &http.Server{Addr: addr, Handler: a.mux}
	a.mu.Unlock()

	log.Printf("[runtime] Asagity API listening on %s", addr)
	return a.httpServer.ListenAndServe()
}

func (a *App) Shutdown(ctx context.Context) error {
	a.mu.Lock()
	srv := a.httpServer
	a.mu.Unlock()

	if srv != nil {
		if err := srv.Shutdown(ctx); err != nil {
			log.Printf("[app] HTTP server shutdown error: %v", err)
		}
	}
	if a.wsServer != nil {
		a.wsServer.Stop()
	}
	if a.bridge != nil {
		a.bridge.Stop()
	}
	if a.eventBus != nil {
		a.eventBus.Shutdown()
	}
	return nil
}
