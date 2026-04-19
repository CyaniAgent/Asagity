package handler

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/CyaniAgent/Asagity/core/internal/module/note/dto"
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

	currentUserID := httpx.GetUserID(r.Context())

	note, err := h.svc.GetNoteDetail(id, currentUserID)
	if err != nil {
		if err.Error() == dto.ErrNoteNotFound {
			httpx.WriteError(w, http.StatusNotFound, notedto.ErrNoteNotFound, "Note not found")
		} else if err.Error() == dto.ErrNoteDeleted {
			httpx.WriteError(w, http.StatusGone, notedto.ErrNoteDeleted, "Note has been deleted")
		} else if err.Error() == dto.ErrNoteForbidden {
			httpx.WriteError(w, http.StatusForbidden, notedto.ErrNoteForbidden, "You don't have permission to view this note")
		} else {
			httpx.WriteError(w, http.StatusInternalServerError, "FETCH_FAILED", err.Error())
		}
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

	note, err := h.svc.UpdateNote(id, userID, &req)
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

	userID := httpx.GetUserID(r.Context())

	var req notedto.TimelineRequest
	req.Limit = 20
	if cursor := r.URL.Query().Get("cursor"); cursor != "" {
		req.Cursor = cursor
	}

	notes, nextCursor, err := h.svc.ListTimelineWithUsers(timelineType, userID, &req)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "LIST_FAILED", err.Error())
		return
	}

	httpx.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"notes":       notes,
		"next_cursor": nextCursor,
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

	if h.svc.GetSearchEngine() == nil {
		httpx.WriteError(w, http.StatusServiceUnavailable, "SEARCH_UNAVAILABLE", "Search engine not available")
		return
	}

	page := 1
	if p := r.URL.Query().Get("page"); p != "" {
		fmt.Sscanf(p, "%d", &page)
	}
	limit := 20
	if l := r.URL.Query().Get("limit"); l != "" {
		fmt.Sscanf(l, "%d", &limit)
	}
	if limit > 50 {
		limit = 50
	}

	from := (page - 1) * limit
	result, err := h.svc.GetSearchEngine().Search(query, from, limit)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "SEARCH_FAILED", err.Error())
		return
	}

	httpx.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"total": result.Total,
		"hits":  result.Hits,
		"page":  page,
	})
}

// SuggestSearch - GET /api/search/suggest
func (h *NoteHandler) SuggestSearch(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q")
	if query == "" {
		httpx.WriteError(w, http.StatusBadRequest, "INVALID_QUERY", "Search query required")
		return
	}

	if h.svc.GetSearchEngine() == nil {
		httpx.WriteError(w, http.StatusServiceUnavailable, "SEARCH_UNAVAILABLE", "Search engine not available")
		return
	}

	suggestions, err := h.svc.GetSearchEngine().Suggest(query, "content", 10)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "SUGGEST_FAILED", err.Error())
		return
	}

	httpx.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"suggestions": suggestions,
	})
}

// SearchNotesRegexp - GET /api/search/notes/regexp
func (h *NoteHandler) SearchNotesRegexp(w http.ResponseWriter, r *http.Request) {
	pattern := r.URL.Query().Get("pattern")
	if pattern == "" {
		httpx.WriteError(w, http.StatusBadRequest, "INVALID_PATTERN", "Regex pattern required")
		return
	}

	if h.svc.GetSearchEngine() == nil {
		httpx.WriteError(w, http.StatusServiceUnavailable, "SEARCH_UNAVAILABLE", "Search engine not available")
		return
	}

	page := 1
	if p := r.URL.Query().Get("page"); p != "" {
		fmt.Sscanf(p, "%d", &page)
	}
	limit := 20
	if l := r.URL.Query().Get("limit"); l != "" {
		fmt.Sscanf(l, "%d", &limit)
	}
	if limit > 50 {
		limit = 50
	}

	from := (page - 1) * limit
	result, err := h.svc.GetSearchEngine().SearchRegexp(pattern, from, limit)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "SEARCH_FAILED", err.Error())
		return
	}

	httpx.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"total": result.Total,
		"hits":  result.Hits,
		"page":  page,
	})
}

// GetNoteEdits - GET /api/notes/:id/edits
func (h *NoteHandler) GetNoteEdits(w http.ResponseWriter, r *http.Request) {
	noteID := httpx.GetPathParam(r, "id")
	if noteID == "" {
		httpx.WriteError(w, http.StatusBadRequest, "INVALID_ID", "Note ID required")
		return
	}

	currentUserID := httpx.GetUserID(r.Context())

	note, err := h.svc.GetNoteByID(noteID)
	if err != nil {
		httpx.WriteError(w, http.StatusNotFound, notedto.ErrNoteNotFound, "Note not found")
		return
	}

	if note.IsDeleted {
		httpx.WriteError(w, http.StatusGone, notedto.ErrNoteDeleted, "Note has been deleted")
		return
	}

	if !h.svc.IsOwner(noteID, currentUserID) && !h.svc.CanViewNote(note, currentUserID) {
		httpx.WriteError(w, http.StatusForbidden, notedto.ErrNoteForbidden, "You don't have permission to view this note")
		return
	}

	edits, err := h.svc.GetNoteEdits(noteID)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "FETCH_FAILED", err.Error())
		return
	}

	httpx.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"edits": edits,
	})
}

// VoteOnPoll - POST /api/notes/:id/vote
func (h *NoteHandler) VoteOnPoll(w http.ResponseWriter, r *http.Request) {
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

	var req notedto.VoteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "INVALID_REQUEST", "Invalid request body")
		return
	}

	err := h.svc.VoteOnPoll(noteID, userID, req.OptionIDs)
	if err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "VOTE_FAILED", err.Error())
		return
	}

	httpx.WriteJSON(w, http.StatusOK, map[string]string{"status": "voted"})
}

// GetPollResults - GET /api/notes/:id/poll
func (h *NoteHandler) GetPollResults(w http.ResponseWriter, r *http.Request) {
	userID := httpx.GetUserID(r.Context())

	noteID := httpx.GetPathParam(r, "id")
	if noteID == "" {
		httpx.WriteError(w, http.StatusBadRequest, "INVALID_ID", "Note ID required")
		return
	}

	results, err := h.svc.GetPollResults(noteID, userID)
	if err != nil {
		httpx.WriteError(w, http.StatusNotFound, "POLL_NOT_FOUND", err.Error())
		return
	}

	httpx.WriteJSON(w, http.StatusOK, results)
}
