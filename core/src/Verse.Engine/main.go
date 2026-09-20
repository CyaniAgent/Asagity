package main

import (
	"log"

	"github.com/CyaniAgent/Asagity/core/src/Verse.Engine/cmd/api"
)

func main() {
	if err := api.Run(); err != nil {
		log.Fatalf("failed to start api: %v", err)
	}
}
