package handler

import (
	"net/http"

	"github.com/CyaniAgent/Asagity/core/internal/module/instance/service"
	"github.com/CyaniAgent/Asagity/core/internal/platform/httpx"
)

type Handler struct {
	service *service.Service
}

func New(service *service.Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) Root(w http.ResponseWriter, r *http.Request) {
	httpx.WriteJSON(w, http.StatusOK, map[string]any{
		"name": "Asagity Core",
		"mode": "bootstrap",
	})
}

func (h *Handler) Health(w http.ResponseWriter, r *http.Request) {
	httpx.WriteJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *Handler) Version(w http.ResponseWriter, r *http.Request) {
	httpx.WriteJSON(w, http.StatusOK, h.service.Version())
}

func (h *Handler) Meta(w http.ResponseWriter, r *http.Request) {
	httpx.WriteJSON(w, http.StatusOK, h.service.Meta())
}

func (h *Handler) AdminInstanceSettings(w http.ResponseWriter, r *http.Request) {
	settings, err := h.service.GetAllSettings()
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}
	httpx.WriteJSON(w, http.StatusOK, settings)
}

func (h *Handler) AdminDatabaseStats(w http.ResponseWriter, r *http.Request) {
	stats, err := h.service.GetDatabaseStats()
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}
	httpx.WriteJSON(w, http.StatusOK, stats)
}
