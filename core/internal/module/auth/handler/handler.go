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

	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    res.RefreshToken,
		Path:     "/",
		MaxAge:   int(30 * 24 * 60 * 60),
		Secure:   true,
		HttpOnly: true,
		SameSite: http.SameSiteStrictMode,
	})

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

	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    res.RefreshToken,
		Path:     "/",
		MaxAge:   int(30 * 24 * 60 * 60),
		Secure:   true,
		HttpOnly: true,
		SameSite: http.SameSiteStrictMode,
	})

	httpx.WriteJSON(w, http.StatusOK, res)
}

func (h *Handler) Refresh(w http.ResponseWriter, r *http.Request) {
	refreshToken := ""

	cookie, err := r.Cookie("refresh_token")
	if err == nil {
		refreshToken = cookie.Value
	}

	if refreshToken == "" {
		var req dto.RefreshRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			httpx.WriteError(w, http.StatusBadRequest, "INVALID_REQUEST", err.Error())
			return
		}
		refreshToken = req.RefreshToken
	}

	res, err := h.service.Refresh(refreshToken)
	if err != nil {
		httpx.WriteError(w, http.StatusUnauthorized, "REFRESH_FAILED", err.Error())
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    res.RefreshToken,
		Path:     "/",
		MaxAge:   int(30 * 24 * 60 * 60),
		Secure:   true,
		HttpOnly: true,
		SameSite: http.SameSiteStrictMode,
	})

	httpx.WriteJSON(w, http.StatusOK, res)
}

func (h *Handler) Logout(w http.ResponseWriter, r *http.Request) {
	userID := httpx.FromContext(r.Context())
	if userID == "" {
		httpx.WriteError(w, http.StatusUnauthorized, "UNAUTHORIZED", "User not authenticated")
		return
	}

	refreshToken := ""
	cookie, err := r.Cookie("refresh_token")
	if err == nil {
		refreshToken = cookie.Value
	}

	if refreshToken != "" {
		if err := h.service.Logout(refreshToken); err != nil {
			httpx.WriteError(w, http.StatusInternalServerError, "LOGOUT_FAILED", err.Error())
			return
		}
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		Secure:   true,
		HttpOnly: true,
		SameSite: http.SameSiteStrictMode,
	})

	httpx.WriteJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *Handler) LogoutAll(w http.ResponseWriter, r *http.Request) {
	userID := httpx.FromContext(r.Context())
	if userID == "" {
		httpx.WriteError(w, http.StatusUnauthorized, "UNAUTHORIZED", "User not authenticated")
		return
	}

	if err := h.service.LogoutAll(userID); err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "LOGOUT_ALL_FAILED", err.Error())
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		Secure:   true,
		HttpOnly: true,
		SameSite: http.SameSiteStrictMode,
	})

	httpx.WriteJSON(w, http.StatusOK, map[string]string{"status": "ok"})
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
	var req dto.VerifyEmailRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "INVALID_REQUEST", err.Error())
		return
	}

	res, err := h.service.VerifyRegisterEmail(req)
	if err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "VERIFICATION_FAILED", err.Error())
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    res.RefreshToken,
		Path:     "/",
		MaxAge:   int(30 * 24 * 60 * 60),
		Secure:   true,
		HttpOnly: true,
		SameSite: http.SameSiteStrictMode,
	})

	httpx.WriteJSON(w, http.StatusOK, res)
}

func (h *Handler) RegisterWithEmail(w http.ResponseWriter, r *http.Request) {
	var req dto.RegisterWithEmailRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "INVALID_REQUEST", err.Error())
		return
	}

	res, err := h.service.RegisterWithEmail(req)
	if err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "REGISTRATION_FAILED", err.Error())
		return
	}

	httpx.WriteJSON(w, http.StatusOK, res)
}

func (h *Handler) VerifyLoginEmail(w http.ResponseWriter, r *http.Request) {
	var req dto.VerifyEmailRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "INVALID_REQUEST", err.Error())
		return
	}

	deviceFingerprint := r.Header.Get("X-Device-Fingerprint")
	deviceName := r.Header.Get("X-Device-Name")

	res, err := h.service.VerifyLoginEmail(req, deviceFingerprint, deviceName)
	if err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "VERIFICATION_FAILED", err.Error())
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    res.RefreshToken,
		Path:     "/",
		MaxAge:   int(30 * 24 * 60 * 60),
		Secure:   true,
		HttpOnly: true,
		SameSite: http.SameSiteStrictMode,
	})

	httpx.WriteJSON(w, http.StatusOK, res)
}
