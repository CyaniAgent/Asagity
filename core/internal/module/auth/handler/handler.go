package handler

import (
	"net/http"

	"github.com/CyaniAgent/Asagity/core/internal/module/auth/service"
	"github.com/CyaniAgent/Asagity/core/internal/platform/httpx"
)

type Handler struct {
	service *service.Service
}

func New(service *service.Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) Register(w http.ResponseWriter, r *http.Request) {
	httpx.WriteJSON(w, http.StatusNotImplemented, h.service.RegisterPlaceholder())
}

func (h *Handler) VerifyRegisterEmail(w http.ResponseWriter, r *http.Request) {
	httpx.WriteJSON(w, http.StatusNotImplemented, h.service.VerifyRegisterEmailPlaceholder())
}

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	httpx.WriteJSON(w, http.StatusNotImplemented, h.service.LoginPlaceholder())
}

func (h *Handler) VerifyLoginEmail(w http.ResponseWriter, r *http.Request) {
	httpx.WriteJSON(w, http.StatusNotImplemented, h.service.VerifyLoginEmailPlaceholder())
}

func (h *Handler) Refresh(w http.ResponseWriter, r *http.Request) {
	httpx.WriteJSON(w, http.StatusNotImplemented, h.service.RefreshPlaceholder())
}

func (h *Handler) Logout(w http.ResponseWriter, r *http.Request) {
	httpx.WriteJSON(w, http.StatusNotImplemented, h.service.LogoutPlaceholder())
}

func (h *Handler) LogoutAll(w http.ResponseWriter, r *http.Request) {
	httpx.WriteJSON(w, http.StatusNotImplemented, h.service.LogoutAllPlaceholder())
}

func (h *Handler) Me(w http.ResponseWriter, r *http.Request) {
	httpx.WriteJSON(w, http.StatusNotImplemented, h.service.MePlaceholder())
}
