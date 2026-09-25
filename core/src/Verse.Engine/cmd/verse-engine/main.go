package main

import (
	"log"
	"os"

	"github.com/CyaniAgent/Asagity/core/src/Verse.Engine/internal/runtime"
)

// verse-engine is the unified Verse Engine daemon entrypoint.
// It hosts the HTTP API, event bus, websocket push and search in one process,
// and selects the stack from --mode / ASAGITY_MODE (default production).
func main() {
	log.Println("[verse-engine] Asagity Verse Engine daemon starting...")
	if err := runtime.Run(os.Args[1:]); err != nil {
		log.Fatalf("[verse-engine] %v", err)
	}
}
