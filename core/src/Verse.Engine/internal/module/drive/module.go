package drive

import (
	"github.com/go-chi/chi/v5"

	"github.com/CyaniAgent/Asagity/core/src/Verse.Engine/internal/module/drive/handler"
	"github.com/CyaniAgent/Asagity/core/src/Verse.Engine/internal/module/drive/repository"
	"github.com/CyaniAgent/Asagity/core/src/Verse.Engine/internal/module/drive/service"
	"github.com/CyaniAgent/Asagity/core/src/Verse.Engine/internal/platform/authz"
	"github.com/CyaniAgent/Asagity/core/src/Verse.Engine/internal/platform/config"
	"github.com/CyaniAgent/Asagity/core/src/Verse.Engine/internal/platform/database"
)

func Register(r *chi.Mux, cfg config.Config, clients *database.Clients) {
	repo := repository.New(clients)
	svc := service.New(repo, cfg)
	h := handler.New(svc)

	r.With(authz.Require("drive:read")).Get("/api/drive/files", h.ListFiles)
	r.With(authz.Require("drive:read")).Get("/api/drive/files/{id}", h.GetFile)
	r.With(authz.Require("drive:write")).Post("/api/drive/folders", h.CreateFolder)
	r.With(authz.Require("drive:write")).Patch("/api/drive/files/{id}", h.UpdateFile)
	r.With(authz.Require("drive:write")).Delete("/api/drive/files/{id}", h.DeleteFile)
	r.With(authz.Require("drive:write")).Post("/api/drive/files/{id}/move", h.MoveFile)
	r.With(authz.Require("drive:read")).Get("/api/drive/usage", h.GetUsage)
}
