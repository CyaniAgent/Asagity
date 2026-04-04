package handler

import (
	"encoding/json"
	"net/http"

	"github.com/CyaniAgent/Asagity/core/internal/module/auth/dto"
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
	var req dto.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "INVALID_REQUEST", err.Error())
		return
	}

	res, err := h.service.Register(req)
	if err != nil {
		httpx.WriteError(w, http.StatusConflict, "REGISTRATION_FAILED", err.Error())
		return
	}

	httpx.WriteJSON(w, http.StatusCreated, res)
}

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var req dto.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "INVALID_REQUEST", err.Error())
		return
	}

	res, err := h.service.Login(req)
	if err != nil {
		httpx.WriteError(w, http.StatusUnauthorized, "LOGIN_FAILED", err.Error())
		return
	}

	httpx.WriteJSON(w, http.StatusOK, res)
}

func (h *Handler) Me(w http.ResponseWriter, r *http.Request) {
	userID := httpx.FromContext(r.Context())
	if userID == "" {
		httpx.WriteError(w, http.StatusUnauthorized, "UNAUTHORIZED", "User not authenticated")
		return
	}

	res, err := h.service.Me(userID)
	if err != nil {
		httpx.WriteError(w, http.StatusNotFound, "USER_NOT_FOUND", "User profile could not be loaded")
		return
	}

	httpx.WriteJSON(w, http.StatusOK, res)
}

func (h *Handler) VerifyRegisterEmail(w http.ResponseWriter, r *http.Request) {
	httpx.WriteError(w, http.StatusNotImplemented, "NOT_IMPLEMENTED", "register email verification is not implemented yet")
}

func (h *Handler) VerifyLoginEmail(w http.ResponseWriter, r *http.Request) {
	httpx.WriteError(w, http.StatusNotImplemented, "NOT_IMPLEMENTED", "login email verification is not implemented yet")
}

func (h *Handler) Refresh(w http.ResponseWriter, r *http.Request) {
	httpx.WriteError(w, http.StatusNotImplemented, "NOT_IMPLEMENTED", "token refresh is not implemented yet")
}

func (h *Handler) Logout(w http.ResponseWriter, r *http.Request) {
	httpx.WriteError(w, http.StatusNotImplemented, "NOT_IMPLEMENTED", "logout is not implemented yet")
}

func (h *Handler) LogoutAll(w http.ResponseWriter, r *http.Request) {
	httpx.WriteError(w, http.StatusNotImplemented, "NOT_IMPLEMENTED", "logout-all is not implemented yet")
}
