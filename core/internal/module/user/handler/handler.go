package handler

import (
	"net/http"

	"github.com/CyaniAgent/Asagity/core/internal/module/user/service"
	"github.com/CyaniAgent/Asagity/core/internal/platform/httpx"
)

type Handler struct {
	service *service.Service
}

func New(service *service.Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) Me(w http.ResponseWriter, r *http.Request) {
	httpx.WriteJSON(w, http.StatusNotImplemented, h.service.MePlaceholder())
}
