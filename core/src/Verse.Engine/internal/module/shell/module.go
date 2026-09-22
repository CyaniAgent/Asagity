package shell

import (
	"github.com/go-chi/chi/v5"

	"github.com/CyaniAgent/Asagity/core/src/Verse.Engine/internal/module/shell/handler"
	"github.com/CyaniAgent/Asagity/core/src/Verse.Engine/internal/platform/config"
	"github.com/CyaniAgent/Asagity/core/src/Verse.Engine/internal/platform/event"
)

// Register exposes the Termity platform-shell read-only surface on the Go engine:
//   - GET /api/shell/ping  backend-measured RTT target for `vnet ping`
//   - GET /api/shell/vnet   engine health + EventBus stats for `vnet status/config`
func Register(r *chi.Mux, cfg config.Config, eventBus *event.Bus) {
	h := handler.New(cfg, eventBus)

	r.Get("/api/shell/ping", h.Ping)
	r.Get("/api/shell/vnet", h.Vnet)
}
