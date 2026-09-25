package api

import (
	"os"

	"github.com/CyaniAgent/Asagity/core/src/Verse.Engine/internal/runtime"
)

// Run boots the API server. Kept for compatibility; new code should call
// runtime.Run directly (cmd/verse-engine does).
func Run() error {
	return runtime.Run(os.Args[1:])
}
