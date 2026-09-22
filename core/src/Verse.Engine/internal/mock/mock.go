// Package mock serves the Databaseless runtime mode.
//
// It exposes the same route shapes and {ok,data} envelope as the real API
// but answers with fixed in-memory data. Writes are echoed back with fake
// IDs and kept in memory for the process lifetime, so UI designers can walk
// through full flows against the debugger without any database.
package mock

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"

	"github.com/CyaniAgent/Asagity/core/src/Verse.Engine/internal/platform/httpx"
)

// tiny transparent 1x1 PNG served by the asset mock.
var pixelPNG = mustDecodePNG(
	"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
)

func mustDecodePNG(s string) []byte {
	b, err := base64.StdEncoding.DecodeString(s)
	if err != nil {
		panic(err)
	}
	return b
}

type mockUser struct {
	ID        string `json:"id"`
	PubID     string `json:"pub_id"`
	Username  string `json:"username"`
	Name      string `json:"name"`
	AvatarURL string `json:"avatar_url"`
}

type mockNote struct {
	ID         string   `json:"id"`
	PubID      string   `json:"pubid"`
	Content    string   `json:"content"`
	Visibility string   `json:"visibility"`
	Type       string   `json:"type"`
	CreatedAt  string   `json:"created_at"`
	User       mockUser `json:"user"`
}

// Server holds databaseless session state.
type Server struct {
	mu    sync.RWMutex
	notes []mockNote
	seq   atomic.Int64
	user  mockUser
}

// NewServer seeds one demo user and one welcome note.
func NewServer() *Server {
	s := &Server{
		user: mockUser{
			ID:        "00000000000000000000000000000001",
			PubID:     "usr_asagity0",
			Username:  "asagity_admin",
			Name:      "Asagity Administrator",
			AvatarURL: "",
		},
	}
	s.notes = append(s.notes, mockNote{
		ID:         "mock-note-0001",
		PubID:      "nt_mock0001",
		Content:    "欢迎来到青之城邦! (databaseless mock)",
		Visibility: "public",
		Type:       "note",
		CreatedAt:  time.Now().UTC().Format(time.RFC3339),
		User:       s.user,
	})
	s.seq.Store(1)
	return s
}

func (s *Server) fakeAuth() map[string]any {
	return map[string]any{
		"access_token":  "mock-access-token",
		"refresh_token": "mock-refresh-token",
		"user":          s.user,
	}
}

func (s *Server) nextNoteID() (string, string) {
	n := s.seq.Add(1)
	return fmt.Sprintf("mock-note-%04d", n), fmt.Sprintf("nt_mock%04d", n)
}

// Router builds the mock chi router. Every response uses the shared envelope.
func (s *Server) Router() *chi.Mux {
	mux := chi.NewRouter()
	mux.Use(middleware.Recoverer)
	mux.Use(middleware.RequestID)
	mux.Use(httpx.Cors)

	mux.Get("/", func(w http.ResponseWriter, _ *http.Request) {
		httpx.WriteJSON(w, http.StatusOK, map[string]any{"name": "Asagity Core", "mode": "databaseless-mock"})
	})
	mux.Get("/healthz", func(w http.ResponseWriter, _ *http.Request) {
		httpx.WriteJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})
	mux.Get("/api/meta/version", func(w http.ResponseWriter, _ *http.Request) {
		httpx.WriteJSON(w, http.StatusOK, map[string]string{"name": "Asagity Core", "version": "mock"})
	})
	mux.Get("/api/meta/instance", func(w http.ResponseWriter, _ *http.Request) {
		httpx.WriteJSON(w, http.StatusOK, map[string]string{
			"name": "Asagity (mock)", "alias": "", "description": "Databaseless mock instance for UI design.",
		})
	})
	mux.Get("/api/system/environment", func(w http.ResponseWriter, _ *http.Request) {
		httpx.WriteJSON(w, http.StatusOK, map[string]any{
			"hostname": "mock", "platform": "databaseless", "os_version": "mock",
			"arch": "mock", "cpu": "mock", "memory": "mock", "is_container": false,
		})
	})

	// Auth: every flow succeeds with the fixed demo user.
	mux.Post("/api/auth/register", func(w http.ResponseWriter, _ *http.Request) {
		httpx.WriteJSON(w, http.StatusCreated, s.fakeAuth())
	})
	mux.Post("/api/auth/register/with-email", func(w http.ResponseWriter, _ *http.Request) {
		httpx.WriteJSON(w, http.StatusOK, map[string]string{
			"challenge_id": "mock-challenge", "expires_at": time.Now().Add(15 * time.Minute).UTC().Format(time.RFC3339),
		})
	})
	mux.Post("/api/auth/register/verify-email", func(w http.ResponseWriter, _ *http.Request) {
		httpx.WriteJSON(w, http.StatusOK, s.fakeAuth())
	})
	mux.Post("/api/auth/login", func(w http.ResponseWriter, _ *http.Request) {
		httpx.WriteJSON(w, http.StatusOK, s.fakeAuth())
	})
	mux.Post("/api/auth/login/verify-email", func(w http.ResponseWriter, _ *http.Request) {
		httpx.WriteJSON(w, http.StatusOK, s.fakeAuth())
	})
	mux.Post("/api/auth/refresh", func(w http.ResponseWriter, _ *http.Request) {
		httpx.WriteJSON(w, http.StatusOK, s.fakeAuth())
	})
	mux.Post("/api/auth/logout", func(w http.ResponseWriter, _ *http.Request) {
		httpx.WriteJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})
	mux.Post("/api/auth/logout-all", func(w http.ResponseWriter, _ *http.Request) {
		httpx.WriteJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})
	mux.Get("/api/auth/me", func(w http.ResponseWriter, _ *http.Request) {
		httpx.WriteJSON(w, http.StatusOK, s.user)
	})
	mux.Get("/api/users/me", func(w http.ResponseWriter, _ *http.Request) {
		httpx.WriteJSON(w, http.StatusOK, s.user)
	})
	mux.Post("/api/users/me/pubid", func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			NewPubID string `json:"new_pub_id"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.NewPubID == "" {
			httpx.WriteError(w, http.StatusBadRequest, "MISSING_PUBID", "new_pub_id is required")
			return
		}
		httpx.WriteJSON(w, http.StatusOK, map[string]any{
			"pub_id": req.NewPubID, "changes_left": 4,
			"reset_date": time.Now().AddDate(0, 1, 0).UTC().Format(time.RFC3339),
		})
	})
	mux.Get("/api/users/me/pubid/history", func(w http.ResponseWriter, _ *http.Request) {
		httpx.WriteJSON(w, http.StatusOK, map[string]any{"history": []any{}, "total": 0})
	})

	// Asset: serve a 1x1 PNG without touching the network.
	mux.Get("/api/asset/icon", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Query().Get("url") == "" {
			httpx.WriteError(w, http.StatusBadRequest, "MISSING_URL_PARAM", "Missing url parameter")
			return
		}
		w.Header().Set("Content-Type", "image/png")
		w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
		_, _ = w.Write(pixelPNG)
	})

	// Drive: empty library with echoing folder creation.
	mux.Get("/api/drive/files", func(w http.ResponseWriter, _ *http.Request) {
		httpx.WriteJSON(w, http.StatusOK, map[string]any{
			"files": []any{}, "folders": []any{}, "total": 0, "has_more": false,
		})
	})
	mux.Post("/api/drive/folders", func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			Name string `json:"name"`
		}
		_ = json.NewDecoder(r.Body).Decode(&req)
		name := req.Name
		if name == "" {
			name = "mock-folder"
		}
		now := time.Now().UTC().Format(time.RFC3339)
		httpx.WriteJSON(w, http.StatusOK, map[string]any{"folder": map[string]any{
			"id": "mock-folder-0001", "parent_id": nil, "name": name,
			"created_at": now, "updated_at": now,
		}})
	})
	mux.Get("/api/drive/usage", func(w http.ResponseWriter, _ *http.Request) {
		httpx.WriteJSON(w, http.StatusOK, map[string]any{
			"used_bytes": 0, "max_bytes": 17179869184, "used_percent": 0.0,
			"total_files": 0, "total_folders": 0,
		})
	})

	// Notes: in-memory CRUD + timeline + search.
	mux.Post("/api/notes", s.handleCreateNote)
	mux.Get("/api/notes/{id}", s.handleGetNote)
	mux.Patch("/api/notes/{id}", s.handleUpdateNote)
	mux.Delete("/api/notes/{id}", s.handleDeleteNote)
	mux.Get("/api/timeline/{type}", s.handleTimeline)
	mux.Post("/api/notes/{id}/react", okStatus("reacted"))
	mux.Delete("/api/notes/{id}/react", okStatus("unreacted"))
	mux.Post("/api/notes/{id}/vote", okStatus("voted"))
	mux.Get("/api/notes/{id}/poll", func(w http.ResponseWriter, _ *http.Request) {
		httpx.WriteJSON(w, http.StatusOK, map[string]any{
			"multiple": false, "expires_at": nil, "options": []any{},
			"voted": []any{}, "total_votes": 0,
		})
	})
	mux.Get("/api/notes/{id}/edits", func(w http.ResponseWriter, _ *http.Request) {
		httpx.WriteJSON(w, http.StatusOK, []any{})
	})
	mux.Get("/api/search/notes", s.handleSearch)
	mux.Get("/api/search/suggest", func(w http.ResponseWriter, _ *http.Request) {
		httpx.WriteJSON(w, http.StatusOK, []any{})
	})

	// Follow: echo accepted relationships, empty lists.
	mux.Post("/api/users/{id}/follow", func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		httpx.WriteJSON(w, http.StatusOK, map[string]any{
			"id":         "mock-follow-0001",
			"follower":   map[string]string{"id": s.user.ID, "pub_id": s.user.PubID, "username": s.user.Username},
			"following":  map[string]string{"id": id, "pub_id": id, "username": id},
			"status":     "accepted",
			"created_at": time.Now().UTC().Format(time.RFC3339),
		})
	})
	mux.Delete("/api/users/{id}/follow", func(w http.ResponseWriter, _ *http.Request) {
		httpx.WriteJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})
	mux.Get("/api/users/{id}/followers", func(w http.ResponseWriter, _ *http.Request) {
		httpx.WriteJSON(w, http.StatusOK, map[string]any{"users": []any{}, "next_cursor": nil})
	})
	mux.Get("/api/users/{id}/following", func(w http.ResponseWriter, _ *http.Request) {
		httpx.WriteJSON(w, http.StatusOK, map[string]any{"users": []any{}, "next_cursor": nil})
	})
	mux.Get("/api/users/{id}/follow-count", func(w http.ResponseWriter, _ *http.Request) {
		httpx.WriteJSON(w, http.StatusOK, map[string]int{"followers_count": 0, "following_count": 0})
	})
	mux.Get("/api/follow/requests/pending", func(w http.ResponseWriter, _ *http.Request) {
		httpx.WriteJSON(w, http.StatusOK, []any{})
	})
	mux.Post("/api/follow/requests/{id}/accept", func(w http.ResponseWriter, _ *http.Request) {
		httpx.WriteJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})
	mux.Post("/api/follow/requests/{id}/reject", func(w http.ResponseWriter, _ *http.Request) {
		httpx.WriteJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})

	return mux
}

func okStatus(status string) http.HandlerFunc {
	return func(w http.ResponseWriter, _ *http.Request) {
		httpx.WriteJSON(w, http.StatusOK, map[string]string{"status": status})
	}
}

func (s *Server) handleCreateNote(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Content    string `json:"content"`
		Type       string `json:"type"`
		Visibility string `json:"visibility"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || strings.TrimSpace(req.Content) == "" {
		httpx.WriteError(w, http.StatusBadRequest, "ERR 26110", "Invalid request body")
		return
	}
	if req.Type == "" {
		req.Type = "note"
	}
	if req.Visibility == "" {
		req.Visibility = "public"
	}
	id, pubID := s.nextNoteID()
	n := mockNote{
		ID: id, PubID: pubID, Content: req.Content,
		Visibility: req.Visibility, Type: req.Type,
		CreatedAt: time.Now().UTC().Format(time.RFC3339), User: s.user,
	}
	s.mu.Lock()
	s.notes = append([]mockNote{n}, s.notes...)
	s.mu.Unlock()
	httpx.WriteJSON(w, http.StatusCreated, n)
}

func (s *Server) findNote(id string) (mockNote, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	for _, n := range s.notes {
		if n.ID == id || n.PubID == id {
			return n, true
		}
	}
	return mockNote{}, false
}

func (s *Server) handleGetNote(w http.ResponseWriter, r *http.Request) {
	n, ok := s.findNote(chi.URLParam(r, "id"))
	if !ok {
		httpx.WriteError(w, http.StatusNotFound, "ERR 17311", "Note not found")
		return
	}
	httpx.WriteJSON(w, http.StatusOK, n)
}

func (s *Server) handleUpdateNote(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req struct {
		Content string `json:"content"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || strings.TrimSpace(req.Content) == "" {
		httpx.WriteError(w, http.StatusBadRequest, "ERR 26110", "Invalid request body")
		return
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	for i, n := range s.notes {
		if n.ID == id || n.PubID == id {
			s.notes[i].Content = req.Content
			httpx.WriteJSON(w, http.StatusOK, s.notes[i])
			return
		}
	}
	httpx.WriteError(w, http.StatusNotFound, "ERR 17311", "Note not found")
}

func (s *Server) handleDeleteNote(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	s.mu.Lock()
	defer s.mu.Unlock()
	for i, n := range s.notes {
		if n.ID == id || n.PubID == id {
			s.notes = append(s.notes[:i], s.notes[i+1:]...)
			httpx.WriteJSON(w, http.StatusOK, map[string]string{"status": "ok"})
			return
		}
	}
	httpx.WriteError(w, http.StatusNotFound, "ERR 17311", "Note not found")
}

func (s *Server) handleTimeline(w http.ResponseWriter, _ *http.Request) {
	s.mu.RLock()
	notes := append([]mockNote(nil), s.notes...)
	s.mu.RUnlock()
	httpx.WriteJSON(w, http.StatusOK, map[string]any{"notes": notes, "next_cursor": nil})
}

func (s *Server) handleSearch(w http.ResponseWriter, r *http.Request) {
	q := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("q")))
	if q == "" {
		httpx.WriteError(w, http.StatusBadRequest, "INVALID_QUERY", "Search query required")
		return
	}
	s.mu.RLock()
	var out []mockNote
	for _, n := range s.notes {
		if strings.Contains(strings.ToLower(n.Content), q) {
			out = append(out, n)
		}
	}
	s.mu.RUnlock()
	if out == nil {
		out = []mockNote{}
	}
	httpx.WriteJSON(w, http.StatusOK, out)
}
