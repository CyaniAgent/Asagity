package handler

import (
	"net/http"
	"time"

	"github.com/CyaniAgent/Asagity/core/src/Verse.Engine/internal/platform/config"
	"github.com/CyaniAgent/Asagity/core/src/Verse.Engine/internal/platform/event"
	"github.com/CyaniAgent/Asagity/core/src/Verse.Engine/internal/platform/httpx"
)

// Handler backs Termity `vnet ping/config` with backend-measured data
// instead of frontend-local timers and Zustand flags.
type Handler struct {
	cfg config.Config
	bus *event.Bus
}

func New(cfg config.Config, bus *event.Bus) *Handler {
	return &Handler{cfg: cfg, bus: bus}
}

func (h *Handler) Ping(w http.ResponseWriter, _ *http.Request) {
	httpx.WriteJSON(w, http.StatusOK, map[string]any{
		"backend": "verse-engine",
		"pong":    true,
		"time":    time.Now().UTC().Format(time.RFC3339),
		"version": h.cfg.AppVersion,
	})
}

func (h *Handler) Vnet(w http.ResponseWriter, _ *http.Request) {
	subscribers := 0
	if h.bus != nil {
		subscribers = h.bus.SubscriberCount()
	}
	httpx.WriteJSON(w, http.StatusOK, map[string]any{
		"engine":               "online",
		"version":              h.cfg.AppVersion,
		"eventbus_subscribers": subscribers,
		"time":                 time.Now().UTC().Format(time.RFC3339),
	})
}
