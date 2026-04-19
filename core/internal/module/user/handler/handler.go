package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/CyaniAgent/Asagity/core/internal/module/user/dto"
	"github.com/CyaniAgent/Asagity/core/internal/module/user/service"
	"github.com/CyaniAgent/Asagity/core/internal/platform/httpx"
)

type Handler struct {
	service *service.Service
}

func New(svc *service.Service) *Handler {
	return &Handler{service: svc}
}

func (h *Handler) Me(w http.ResponseWriter, r *http.Request) {
	httpx.WriteJSON(w, http.StatusNotImplemented, h.service.MePlaceholder())
}

func (h *Handler) ChangePubID(w http.ResponseWriter, r *http.Request) {
	userID := httpx.GetUserID(r.Context())
	currentPubID := httpx.GetUserPubID(r.Context())

	if userID == "" {
		httpx.WriteError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required")
		return
	}

	var req dto.ChangePubIDRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "INVALID_REQUEST", "Invalid request body")
		return
	}

	if req.NewPubID == "" {
		httpx.WriteError(w, http.StatusBadRequest, "MISSING_PUBID", "new_pub_id is required")
		return
	}

	resp, err := h.service.ChangePubID(userID, currentPubID, req.NewPubID)
	if err != nil {
		switch err.Error() {
		case "invalid pub_id format":
			httpx.WriteError(w, http.StatusBadRequest, "INVALID_PUBID_FORMAT", "PubID must be 1-30 characters (alphanumeric, _, -, . only)")
		case "new_pub_id is the same as current pub_id":
			httpx.WriteError(w, http.StatusBadRequest, "SAME_PUBID", err.Error())
		case "pub_id already taken":
			httpx.WriteError(w, http.StatusConflict, "PUBID_CONFLICT", err.Error())
		case "monthly pub_id change limit reached":
			httpx.WriteError(w, http.StatusTooManyRequests, "RATE_LIMITED", err.Error())
		default:
			httpx.WriteError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		}
		return
	}

	httpx.WriteJSON(w, http.StatusOK, resp)
}

func (h *Handler) GetPubIDChangeHistory(w http.ResponseWriter, r *http.Request) {
	userID := httpx.GetUserID(r.Context())
	if userID == "" {
		httpx.WriteError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required")
		return
	}

	limit := 20
	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
			limit = l
		}
	}

	resp, err := h.service.GetPubIDChangeHistory(userID, limit)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}

	httpx.WriteJSON(w, http.StatusOK, resp)
}
