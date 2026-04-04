package asset

import (
	"net/http"

	"github.com/CyaniAgent/Asagity/core/internal/module/asset/handler"
	"github.com/CyaniAgent/Asagity/core/internal/module/asset/service"
	"github.com/CyaniAgent/Asagity/core/internal/platform/config"
	"github.com/CyaniAgent/Asagity/core/internal/platform/database"
)

func Register(mux *http.ServeMux, cfg config.Config, clients *database.Clients) {
	svc := service.New(cfg)
	h := handler.New(svc)

	mux.HandleFunc("/api/asset/icon", h.Icon)
}
