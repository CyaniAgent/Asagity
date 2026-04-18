package note

import (
	"github.com/go-chi/chi/v5"

	"github.com/CyaniAgent/Asagity/core/internal/module/note/handler"
	"github.com/CyaniAgent/Asagity/core/internal/module/note/repository"
	"github.com/CyaniAgent/Asagity/core/internal/module/note/service"
	"github.com/CyaniAgent/Asagity/core/internal/platform/config"
	"github.com/CyaniAgent/Asagity/core/internal/platform/database"
)

func Register(r *chi.Mux, cfg config.Config, clients *database.Clients) {
	repo := repository.NewNoteRepository(clients.DB)

	if err := repo.AutoMigrate(); err != nil {
		panic("note module migration failed: " + err.Error())
	}

	svc := service.NewNoteService(repo)
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

	r.Get("/api/search/notes", h.SearchNotes)
}
