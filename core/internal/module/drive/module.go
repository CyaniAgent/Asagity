package drive

import (
	"github.com/go-chi/chi/v5"

	"github.com/CyaniAgent/Asagity/core/internal/module/drive/handler"
	"github.com/CyaniAgent/Asagity/core/internal/module/drive/repository"
	"github.com/CyaniAgent/Asagity/core/internal/module/drive/service"
	"github.com/CyaniAgent/Asagity/core/internal/platform/config"
	"github.com/CyaniAgent/Asagity/core/internal/platform/database"
)

func Register(r *chi.Mux, cfg config.Config, clients *database.Clients) {
	repo := repository.New(clients)
	svc := service.New(repo, cfg)
	h := handler.New(svc)

	r.Get("/api/drive/files", h.ListFiles)
	r.Get("/api/drive/files/{id}", h.GetFile)
	r.Post("/api/drive/folders", h.CreateFolder)
	r.Patch("/api/drive/files/{id}", h.UpdateFile)
	r.Delete("/api/drive/files/{id}", h.DeleteFile)
	r.Post("/api/drive/files/{id}/move", h.MoveFile)
	r.Get("/api/drive/usage", h.GetUsage)
}
