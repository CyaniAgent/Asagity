package user

import (
	"github.com/go-chi/chi/v5"

	"github.com/CyaniAgent/Asagity/core/internal/module/user/handler"
	"github.com/CyaniAgent/Asagity/core/internal/module/user/repository"
	"github.com/CyaniAgent/Asagity/core/internal/module/user/service"
	"github.com/CyaniAgent/Asagity/core/internal/platform/config"
	"github.com/CyaniAgent/Asagity/core/internal/platform/database"
)

func Register(r *chi.Mux, cfg config.Config, clients *database.Clients) {
	repo := repository.New(clients)

	if err := repo.AutoMigrate(); err != nil {
		panic("user module migration failed: " + err.Error())
	}

	svc := service.New(repo, cfg)
	h := handler.New(svc)

	r.Get("/api/users/me", h.Me)
	r.Post("/api/users/me/pubid", h.ChangePubID)
	r.Get("/api/users/me/pubid/history", h.GetPubIDChangeHistory)
}
