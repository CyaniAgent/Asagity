package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"github.com/CyaniAgent/Asagity/core/internal/module/drive/dto"
	"github.com/CyaniAgent/Asagity/core/internal/platform/httpx"
	"github.com/google/uuid"
)

type Handler struct {
	service DriveService
}

type DriveService interface {
	ListFiles(userID uuid.UUID, req dto.ListFilesRequest) (*dto.ListFilesResponse, error)
	GetFile(userID, fileID uuid.UUID) (*dto.FileResponse, error)
	CreateFolder(userID uuid.UUID, req dto.CreateFolderRequest) (*dto.CreateFolderResponse, error)
	UpdateFile(userID, fileID uuid.UUID, req dto.UpdateFileRequest) (*dto.FileResponse, error)
	DeleteFile(userID, fileID uuid.UUID) error
	MoveFile(userID, fileID uuid.UUID, req dto.MoveFileRequest) error
	GetUsage(userID uuid.UUID) (*dto.UsageResponse, error)
}

func New(service DriveService) *Handler {
	return &Handler{service: service}
}

func getUserIDFromContext(r *http.Request) (uuid.UUID, error) {
	userIDStr := r.Context().Value("user_id")
	if userIDStr == nil {
		return uuid.Nil, errors.New("user not authenticated")
	}
	return uuid.Parse(userIDStr.(string))
}

func (h *Handler) ListFiles(w http.ResponseWriter, r *http.Request) {
	userID, err := getUserIDFromContext(r)
	if err != nil {
		httpx.WriteError(w, http.StatusUnauthorized, "UNAUTHORIZED", "user not authenticated")
		return
	}

	req := dto.ListFilesRequest{}
	if parentIDStr := r.URL.Query().Get("parent_id"); parentIDStr != "" {
		parentID, err := uuid.Parse(parentIDStr)
		if err == nil {
			req.ParentID = &parentID
		}
	}
	req.Type = r.URL.Query().Get("type")
	req.Search = r.URL.Query().Get("search")
	req.Sort = r.URL.Query().Get("sort")
	req.Order = r.URL.Query().Get("order")

	resp, err := h.service.ListFiles(userID, req)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}

	httpx.WriteJSON(w, http.StatusOK, resp)
}

func (h *Handler) GetFile(w http.ResponseWriter, r *http.Request) {
	userID, err := getUserIDFromContext(r)
	if err != nil {
		httpx.WriteError(w, http.StatusUnauthorized, "UNAUTHORIZED", "user not authenticated")
		return
	}

	fileIDStr := strings.TrimPrefix(r.URL.Path, "/api/drive/files/")
	fileID, err := uuid.Parse(fileIDStr)
	if err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "INVALID_FILE_ID", "invalid file ID")
		return
	}

	resp, err := h.service.GetFile(userID, fileID)
	if err != nil {
		httpx.WriteError(w, http.StatusNotFound, "FILE_NOT_FOUND", "file not found")
		return
	}

	httpx.WriteJSON(w, http.StatusOK, resp)
}

func (h *Handler) CreateFolder(w http.ResponseWriter, r *http.Request) {
	userID, err := getUserIDFromContext(r)
	if err != nil {
		httpx.WriteError(w, http.StatusUnauthorized, "UNAUTHORIZED", "user not authenticated")
		return
	}

	var req dto.CreateFolderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "INVALID_REQUEST", "invalid request body")
		return
	}

	resp, err := h.service.CreateFolder(userID, req)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}

	httpx.WriteJSON(w, http.StatusCreated, resp)
}

func (h *Handler) UpdateFile(w http.ResponseWriter, r *http.Request) {
	userID, err := getUserIDFromContext(r)
	if err != nil {
		httpx.WriteError(w, http.StatusUnauthorized, "UNAUTHORIZED", "user not authenticated")
		return
	}

	fileIDStr := strings.TrimPrefix(r.URL.Path, "/api/drive/files/")
	fileID, err := uuid.Parse(fileIDStr)
	if err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "INVALID_FILE_ID", "invalid file ID")
		return
	}

	var req dto.UpdateFileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "INVALID_REQUEST", "invalid request body")
		return
	}

	resp, err := h.service.UpdateFile(userID, fileID, req)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}

	httpx.WriteJSON(w, http.StatusOK, resp)
}

func (h *Handler) DeleteFile(w http.ResponseWriter, r *http.Request) {
	userID, err := getUserIDFromContext(r)
	if err != nil {
		httpx.WriteError(w, http.StatusUnauthorized, "UNAUTHORIZED", "user not authenticated")
		return
	}

	fileIDStr := strings.TrimPrefix(r.URL.Path, "/api/drive/files/")
	fileID, err := uuid.Parse(fileIDStr)
	if err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "INVALID_FILE_ID", "invalid file ID")
		return
	}

	if err := h.service.DeleteFile(userID, fileID); err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}

	httpx.WriteJSON(w, http.StatusNoContent, nil)
}

func (h *Handler) MoveFile(w http.ResponseWriter, r *http.Request) {
	userID, err := getUserIDFromContext(r)
	if err != nil {
		httpx.WriteError(w, http.StatusUnauthorized, "UNAUTHORIZED", "user not authenticated")
		return
	}

	fileIDStr := strings.TrimPrefix(r.URL.Path, "/api/drive/files/")
	fileID, err := uuid.Parse(fileIDStr)
	if err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "INVALID_FILE_ID", "invalid file ID")
		return
	}

	var req dto.MoveFileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "INVALID_REQUEST", "invalid request body")
		return
	}

	if err := h.service.MoveFile(userID, fileID, req); err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}

	httpx.WriteJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *Handler) GetUsage(w http.ResponseWriter, r *http.Request) {
	userID, err := getUserIDFromContext(r)
	if err != nil {
		httpx.WriteError(w, http.StatusUnauthorized, "UNAUTHORIZED", "user not authenticated")
		return
	}

	resp, err := h.service.GetUsage(userID)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}

	httpx.WriteJSON(w, http.StatusOK, resp)
}
