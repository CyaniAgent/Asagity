package drive

import (
	"net/http"

	"github.com/CyaniAgent/Asagity/core/internal/module/drive/handler"
	"github.com/CyaniAgent/Asagity/core/internal/module/drive/repository"
	"github.com/CyaniAgent/Asagity/core/internal/module/drive/service"
	"github.com/CyaniAgent/Asagity/core/internal/platform/config"
	"github.com/CyaniAgent/Asagity/core/internal/platform/database"
)

func Register(mux *http.ServeMux, cfg config.Config, clients *database.Clients) {
	repo := repository.New(clients)
	svc := service.New(repo, cfg)
	h := handler.New(svc)

	mux.HandleFunc("GET /api/drive/files", h.ListFiles)
	mux.HandleFunc("GET /api/drive/files/", h.GetFile)
	mux.HandleFunc("POST /api/drive/folders", h.CreateFolder)
	mux.HandleFunc("PATCH /api/drive/files/", h.UpdateFile)
	mux.HandleFunc("DELETE /api/drive/files/", h.DeleteFile)
	mux.HandleFunc("POST /api/drive/files/", h.MoveFile)
	mux.HandleFunc("GET /api/drive/usage", h.GetUsage)
}
