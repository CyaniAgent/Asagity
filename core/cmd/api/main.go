package api

import (
	"log"
	"net/http"

	"github.com/CyaniAgent/Asagity/core/internal/app"
	"github.com/CyaniAgent/Asagity/core/internal/platform/config"
	"github.com/CyaniAgent/Asagity/core/internal/platform/database"
	"github.com/go-chi/chi/v5"
)

func Run() error {
	cfg, err := config.Load()
	if err != nil {
		return err
	}

	clients, err := database.Open(cfg)
	if err != nil {
		return err
	}

	application := app.New(cfg, clients)

	r := chi.NewRouter()
	r.Mount("/", application.Router())

	addr := ":" + cfg.ServerPort

	log.Printf("Asagity API listening on %s", addr)
	return http.ListenAndServe(addr, r)
}
