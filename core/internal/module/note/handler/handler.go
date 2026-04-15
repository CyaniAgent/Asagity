package handler

import (
	"encoding/json"
	"net/http"

	notedto "github.com/CyaniAgent/Asagity/core/internal/module/note/dto"
	"github.com/CyaniAgent/Asagity/core/internal/module/note/service"
	"github.com/CyaniAgent/Asagity/core/internal/platform/httpx"
)

type NoteHandler struct {
	svc *service.NoteService
}

func NewNoteHandler(svc *service.NoteService) *NoteHandler {
	return &NoteHandler{svc: svc}
}

// CreateNote - POST /api/notes
func (h *NoteHandler) CreateNote(w http.ResponseWriter, r *http.Request) {
	userID := httpx.GetUserID(r.Context())
	if userID == "" {
		httpx.WriteError(w, http.StatusUnauthorized, "UNAUTHORIZED", "User not authenticated")
		return
	}

	var req notedto.CreateNoteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, notedto.ErrInvalidContent, "Invalid request body")
		return
	}

	note, err := h.svc.CreateNote(&req, userID)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "CREATE_FAILED", err.Error())
		return
	}

	httpx.WriteJSON(w, http.StatusCreated, note)
}

// GetNote - GET /api/notes/:id
func (h *NoteHandler) GetNote(w http.ResponseWriter, r *http.Request) {
	id := httpx.GetPathParam(r, "id")
	if id == "" {
		httpx.WriteError(w, http.StatusBadRequest, "INVALID_ID", "Note ID required")
		return
	}

	note, err := h.svc.GetNoteByID(id)
	if err != nil {
		httpx.WriteError(w, http.StatusNotFound, notedto.ErrNoteNotFound, "Note not found")
		return
	}

	httpx.WriteJSON(w, http.StatusOK, note)
}

// UpdateNote - PATCH /api/notes/:id
func (h *NoteHandler) UpdateNote(w http.ResponseWriter, r *http.Request) {
	userID := httpx.GetUserID(r.Context())
	if userID == "" {
		httpx.WriteError(w, http.StatusUnauthorized, "UNAUTHORIZED", "User not authenticated")
		return
	}

	id := httpx.GetPathParam(r, "id")
	if id == "" {
		httpx.WriteError(w, http.StatusBadRequest, "INVALID_ID", "Note ID required")
		return
	}

	var req notedto.UpdateNoteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, notedto.ErrInvalidContent, "Invalid request body")
		return
	}

	note, err := h.svc.UpdateNote(id, &req, userID)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "UPDATE_FAILED", err.Error())
		return
	}

	httpx.WriteJSON(w, http.StatusOK, note)
}

// DeleteNote - DELETE /api/notes/:id
func (h *NoteHandler) DeleteNote(w http.ResponseWriter, r *http.Request) {
	userID := httpx.GetUserID(r.Context())
	if userID == "" {
		httpx.WriteError(w, http.StatusUnauthorized, "UNAUTHORIZED", "User not authenticated")
		return
	}

	id := httpx.GetPathParam(r, "id")
	if id == "" {
		httpx.WriteError(w, http.StatusBadRequest, "INVALID_ID", "Note ID required")
		return
	}

	err := h.svc.DeleteNote(id, userID)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "DELETE_FAILED", err.Error())
		return
	}

	httpx.WriteJSON(w, http.StatusOK, map[string]string{"status": "deleted"})
}

// ListTimeline - GET /api/timeline/:type
func (h *NoteHandler) ListTimeline(w http.ResponseWriter, r *http.Request) {
	timelineType := httpx.GetPathParam(r, "type")
	if timelineType == "" {
		timelineType = "public"
	}

	var req notedto.TimelineRequest
	req.Limit = 20
	if cursor := r.URL.Query().Get("cursor"); cursor != "" {
		req.Cursor = cursor
	}

	notes, err := h.svc.ListTimelineWithUsers(timelineType, &req)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "LIST_FAILED", err.Error())
		return
	}

	httpx.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"notes": notes,
	})
}

// AddReaction - POST /api/notes/:id/react
func (h *NoteHandler) AddReaction(w http.ResponseWriter, r *http.Request) {
	userID := httpx.GetUserID(r.Context())
	if userID == "" {
		httpx.WriteError(w, http.StatusUnauthorized, "UNAUTHORIZED", "User not authenticated")
		return
	}

	noteID := httpx.GetPathParam(r, "id")
	if noteID == "" {
		httpx.WriteError(w, http.StatusBadRequest, "INVALID_ID", "Note ID required")
		return
	}

	var req notedto.ReactionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "INVALID_REQUEST", "Invalid request body")
		return
	}

	err := h.svc.AddReaction(noteID, userID, req.Emoji)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "REACTION_FAILED", err.Error())
		return
	}

	httpx.WriteJSON(w, http.StatusOK, map[string]string{"status": "reacted"})
}

// RemoveReaction - DELETE /api/notes/:id/react
func (h *NoteHandler) RemoveReaction(w http.ResponseWriter, r *http.Request) {
	userID := httpx.GetUserID(r.Context())
	if userID == "" {
		httpx.WriteError(w, http.StatusUnauthorized, "UNAUTHORIZED", "User not authenticated")
		return
	}

	noteID := httpx.GetPathParam(r, "id")
	emoji := r.URL.Query().Get("emoji")

	err := h.svc.RemoveReaction(noteID, userID, emoji)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "REACTION_FAILED", err.Error())
		return
	}

	httpx.WriteJSON(w, http.StatusOK, map[string]string{"status": "unreacted"})
}

// SearchNotes - GET /api/search/notes
func (h *NoteHandler) SearchNotes(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q")
	if query == "" {
		httpx.WriteError(w, http.StatusBadRequest, "INVALID_QUERY", "Search query required")
		return
	}

	var req notedto.NoteSearchRequest
	req.Query = query
	if cursor := r.URL.Query().Get("cursor"); cursor != "" {
		req.Cursor = cursor
	}

	notes, err := h.svc.SearchNotes(&req)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "SEARCH_FAILED", err.Error())
		return
	}

	httpx.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"notes": notes,
	})
}
