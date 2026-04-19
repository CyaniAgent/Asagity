package note

import (
	"github.com/go-chi/chi/v5"

	followrepo "github.com/CyaniAgent/Asagity/core/internal/module/follow/repository"
	"github.com/CyaniAgent/Asagity/core/internal/module/note/handler"
	"github.com/CyaniAgent/Asagity/core/internal/module/note/repository"
	"github.com/CyaniAgent/Asagity/core/internal/module/note/service"
	"github.com/CyaniAgent/Asagity/core/internal/platform/config"
	"github.com/CyaniAgent/Asagity/core/internal/platform/database"
	"github.com/CyaniAgent/Asagity/core/internal/platform/search"
)

func Register(r *chi.Mux, cfg config.Config, clients *database.Clients, searchEngine *search.BleveEngine) {
	repo := repository.NewNoteRepository(clients.DB)
	followRepo := followrepo.NewFollowRepository(clients.DB)

	if err := repo.AutoMigrate(); err != nil {
		panic("note module migration failed: " + err.Error())
	}

	svc := service.NewNoteServiceWithDeps(repo, followRepo, nil, searchEngine, clients.Redis)
	h := handler.NewNoteHandler(svc)

	r.Post("/api/notes", h.CreateNote)
	r.Get("/api/notes/{id}", h.GetNote)
	r.Patch("/api/notes/{id}", h.UpdateNote)
	r.Delete("/api/notes/{id}", h.DeleteNote)

	r.Get("/api/timeline/{type}", h.ListTimeline)

	r.Post("/api/notes/{id}/react", h.AddReaction)
	r.Delete("/api/notes/{id}/react", h.RemoveReaction)

	r.Post("/api/notes/{id}/vote", h.VoteOnPoll)
	r.Get("/api/notes/{id}/poll", h.GetPollResults)

	r.Get("/api/notes/{id}/edits", h.GetNoteEdits)

	r.Get("/api/search/notes", h.SearchNotes)
	r.Get("/api/search/suggest", h.SuggestSearch)
	r.Get("/api/search/notes/regexp", h.SearchNotesRegexp)
}
