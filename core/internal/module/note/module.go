package note

import (
	"net/http"

	"github.com/CyaniAgent/Asagity/core/internal/module/note/handler"
	"github.com/CyaniAgent/Asagity/core/internal/module/note/repository"
	"github.com/CyaniAgent/Asagity/core/internal/module/note/service"
	"github.com/CyaniAgent/Asagity/core/internal/platform/config"
	"github.com/CyaniAgent/Asagity/core/internal/platform/database"
)

func Register(mux *http.ServeMux, cfg config.Config, clients *database.Clients) {
	repo := repository.NewNoteRepository(clients.DB)

	if err := repo.AutoMigrate(); err != nil {
		panic("note module migration failed: " + err.Error())
	}

	svc := service.NewNoteService(repo)
	h := handler.NewNoteHandler(svc)

	mux.HandleFunc("POST /api/notes", h.CreateNote)
	mux.HandleFunc("GET /api/notes/", h.GetNote)
	mux.HandleFunc("PATCH /api/notes/", h.UpdateNote)
	mux.HandleFunc("DELETE /api/notes/", h.DeleteNote)

	mux.HandleFunc("GET /api/timeline/home", h.ListTimeline)
	mux.HandleFunc("GET /api/timeline/local", h.ListTimeline)
	mux.HandleFunc("GET /api/timeline/public", h.ListTimeline)

	mux.HandleFunc("POST /api/notes/", h.AddReaction)
	mux.HandleFunc("DELETE /api/notes/", h.RemoveReaction)

	mux.HandleFunc("GET /api/search/notes", h.SearchNotes)
}
