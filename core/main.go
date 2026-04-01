package main

import (
	"log"

	"github.com/CyaniAgent/Asagity/core/cmd/api"
)

func main() {
	if err := api.Run(); err != nil {
		log.Fatalf("failed to start api: %v", err)
	}
}
