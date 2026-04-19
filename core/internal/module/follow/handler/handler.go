package handler

import (
	"net/http"
	"strconv"

	followdto "github.com/CyaniAgent/Asagity/core/internal/module/follow/dto"
	followservice "github.com/CyaniAgent/Asagity/core/internal/module/follow/service"
	"github.com/CyaniAgent/Asagity/core/internal/platform/httpx"
)

type Handler struct {
	service *followservice.FollowService
}

func NewHandler(service *followservice.FollowService) *Handler {
	return &Handler{service: service}
}

// FollowUser - 关注用户
func (h *Handler) FollowUser(w http.ResponseWriter, r *http.Request) {
	userID := httpx.GetUserID(r.Context())
	if userID == "" {
		httpx.WriteError(w, http.StatusUnauthorized, "UNAUTHORIZED", "User not authenticated")
		return
	}

	targetUserID := httpx.GetPathParam(r, "id")
	if targetUserID == "" {
		httpx.WriteError(w, http.StatusBadRequest, "INVALID_ID", "User ID required")
		return
	}

	follow, err := h.service.FollowUser(userID, targetUserID)
	if err != nil {
		if err.Error() == followdto.ErrCannotFollowSelf {
			httpx.WriteError(w, http.StatusBadRequest, followdto.ErrCannotFollowSelf, "Cannot follow yourself")
		} else if err.Error() == followdto.ErrAlreadyFollowing {
			httpx.WriteError(w, http.StatusBadRequest, followdto.ErrAlreadyFollowing, "Already following this user")
		} else {
			httpx.WriteError(w, http.StatusInternalServerError, "FOLLOW_FAILED", err.Error())
		}
		return
	}

	httpx.WriteJSON(w, http.StatusCreated, map[string]interface{}{
		"id":     follow.ID,
		"status": follow.Status,
	})
}

// UnfollowUser - 取消关注
func (h *Handler) UnfollowUser(w http.ResponseWriter, r *http.Request) {
	userID := httpx.GetUserID(r.Context())
	if userID == "" {
		httpx.WriteError(w, http.StatusUnauthorized, "UNAUTHORIZED", "User not authenticated")
		return
	}

	targetUserID := httpx.GetPathParam(r, "id")
	if targetUserID == "" {
		httpx.WriteError(w, http.StatusBadRequest, "INVALID_ID", "User ID required")
		return
	}

	if err := h.service.UnfollowUser(userID, targetUserID); err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "UNFOLLOW_FAILED", err.Error())
		return
	}

	httpx.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
	})
}

// AcceptFollowRequest - 接受关注请求
func (h *Handler) AcceptFollowRequest(w http.ResponseWriter, r *http.Request) {
	userID := httpx.GetUserID(r.Context())
	if userID == "" {
		httpx.WriteError(w, http.StatusUnauthorized, "UNAUTHORIZED", "User not authenticated")
		return
	}

	followID := httpx.GetPathParam(r, "id")
	if followID == "" {
		httpx.WriteError(w, http.StatusBadRequest, "INVALID_ID", "Follow ID required")
		return
	}

	if err := h.service.AcceptFollowRequest(userID, followID); err != nil {
		if err.Error() == followdto.ErrFollowRequestNotFound {
			httpx.WriteError(w, http.StatusNotFound, followdto.ErrFollowRequestNotFound, "Follow request not found")
		} else {
			httpx.WriteError(w, http.StatusInternalServerError, "ACCEPT_FAILED", err.Error())
		}
		return
	}

	httpx.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
	})
}

// RejectFollowRequest - 拒绝关注请求
func (h *Handler) RejectFollowRequest(w http.ResponseWriter, r *http.Request) {
	userID := httpx.GetUserID(r.Context())
	if userID == "" {
		httpx.WriteError(w, http.StatusUnauthorized, "UNAUTHORIZED", "User not authenticated")
		return
	}

	followID := httpx.GetPathParam(r, "id")
	if followID == "" {
		httpx.WriteError(w, http.StatusBadRequest, "INVALID_ID", "Follow ID required")
		return
	}

	if err := h.service.RejectFollowRequest(userID, followID); err != nil {
		if err.Error() == followdto.ErrFollowRequestNotFound {
			httpx.WriteError(w, http.StatusNotFound, followdto.ErrFollowRequestNotFound, "Follow request not found")
		} else {
			httpx.WriteError(w, http.StatusInternalServerError, "REJECT_FAILED", err.Error())
		}
		return
	}

	httpx.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
	})
}

// GetFollowers - 获取粉丝列表
func (h *Handler) GetFollowers(w http.ResponseWriter, r *http.Request) {
	userID := httpx.GetPathParam(r, "id")
	if userID == "" {
		httpx.WriteError(w, http.StatusBadRequest, "INVALID_ID", "User ID required")
		return
	}

	currentUserID := httpx.GetUserID(r.Context())
	cursor := r.URL.Query().Get("cursor")
	limitStr := r.URL.Query().Get("limit")
	limit := 20
	if limitStr != "" {
		parsedLimit, err := strconv.Atoi(limitStr)
		if err == nil && parsedLimit > 0 && parsedLimit <= 100 {
			limit = parsedLimit
		}
	}

	followers, nextCursor, err := h.service.GetFollowers(userID, currentUserID, cursor, limit)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "FETCH_FAILED", err.Error())
		return
	}

	httpx.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"users":       followers,
		"next_cursor": nextCursor,
	})
}

// GetFollowing - 获取关注列表
func (h *Handler) GetFollowing(w http.ResponseWriter, r *http.Request) {
	userID := httpx.GetPathParam(r, "id")
	if userID == "" {
		httpx.WriteError(w, http.StatusBadRequest, "INVALID_ID", "User ID required")
		return
	}

	currentUserID := httpx.GetUserID(r.Context())
	cursor := r.URL.Query().Get("cursor")
	limitStr := r.URL.Query().Get("limit")
	limit := 20
	if limitStr != "" {
		parsedLimit, err := strconv.Atoi(limitStr)
		if err == nil && parsedLimit > 0 && parsedLimit <= 100 {
			limit = parsedLimit
		}
	}

	following, nextCursor, err := h.service.GetFollowing(userID, currentUserID, cursor, limit)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "FETCH_FAILED", err.Error())
		return
	}

	httpx.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"users":       following,
		"next_cursor": nextCursor,
	})
}

// GetPendingRequests - 获取待处理的关注请求
func (h *Handler) GetPendingRequests(w http.ResponseWriter, r *http.Request) {
	userID := httpx.GetUserID(r.Context())
	if userID == "" {
		httpx.WriteError(w, http.StatusUnauthorized, "UNAUTHORIZED", "User not authenticated")
		return
	}

	requests, err := h.service.GetPendingRequests(userID)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "FETCH_FAILED", err.Error())
		return
	}

	httpx.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"requests": requests,
	})
}

// GetFollowCount - 获取关注统计
func (h *Handler) GetFollowCount(w http.ResponseWriter, r *http.Request) {
	userID := httpx.GetPathParam(r, "id")
	if userID == "" {
		httpx.WriteError(w, http.StatusBadRequest, "INVALID_ID", "User ID required")
		return
	}

	count, err := h.service.GetFollowCount(userID)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "FETCH_FAILED", err.Error())
		return
	}

	httpx.WriteJSON(w, http.StatusOK, count)
}
