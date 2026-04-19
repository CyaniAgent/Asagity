package follow

import (
	"github.com/go-chi/chi/v5"

	"github.com/CyaniAgent/Asagity/core/internal/module/follow/handler"
	"github.com/CyaniAgent/Asagity/core/internal/module/follow/repository"
	"github.com/CyaniAgent/Asagity/core/internal/module/follow/service"
	"github.com/CyaniAgent/Asagity/core/internal/platform/config"
	"github.com/CyaniAgent/Asagity/core/internal/platform/database"
)

func Register(r *chi.Mux, cfg config.Config, clients *database.Clients) {
	repo := repository.NewFollowRepository(clients.DB)

	if err := repo.AutoMigrate(); err != nil {
		panic("follow module migration failed: " + err.Error())
	}

	svc := service.NewFollowService(repo)
	h := handler.NewHandler(svc)

	r.Post("/api/users/{id}/follow", h.FollowUser)
	r.Delete("/api/users/{id}/follow", h.UnfollowUser)

	r.Get("/api/users/{id}/followers", h.GetFollowers)
	r.Get("/api/users/{id}/following", h.GetFollowing)
	r.Get("/api/users/{id}/follow-count", h.GetFollowCount)

	r.Get("/api/follow/requests/pending", h.GetPendingRequests)
	r.Post("/api/follow/requests/{id}/accept", h.AcceptFollowRequest)
	r.Post("/api/follow/requests/{id}/reject", h.RejectFollowRequest)
}
