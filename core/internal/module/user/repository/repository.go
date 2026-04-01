package repository

import "github.com/CyaniAgent/Asagity/core/internal/platform/database"

type Repository interface{}

type repository struct {
	clients *database.Clients
}

func New(clients *database.Clients) Repository {
	return &repository{clients: clients}
}
