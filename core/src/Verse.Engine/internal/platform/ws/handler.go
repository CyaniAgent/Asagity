package ws

import (
	"log"
	"net/http"

	"github.com/CyaniAgent/Asagity/core/src/Verse.Engine/internal/platform/httpx"
	"github.com/gorilla/websocket"
)

// newUpgrader constructs a websocket.Upgrader that only accepts connections
// whose Origin header is in allowedOrigins. An empty list (dev mode) accepts
// all origins; production must pass a non-empty list from config.
func newUpgrader(allowedOrigins []string) websocket.Upgrader {
	allowSet := make(map[string]bool, len(allowedOrigins))
	for _, o := range allowedOrigins {
		allowSet[o] = true
	}
	return websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
		CheckOrigin: func(r *http.Request) bool {
			if len(allowSet) == 0 {
				return true
			}
			return allowSet[r.Header.Get("Origin")]
		},
	}
}

func NewHandler(server *Server, allowedOrigins []string, requiredChannels ...string) http.HandlerFunc {
	upgrader := newUpgrader(allowedOrigins)
	return func(w http.ResponseWriter, r *http.Request) {
		userPubID := httpx.GetUserPubID(r.Context())
		if userPubID == "" {
			httpx.WriteError(w, http.StatusUnauthorized, "UNAUTHORIZED", "WebSocket requires authentication")
			return
		}

		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Printf("[WS] upgrade failed for %s: %v", userPubID, err)
			return
		}

		client := server.Register(conn, userPubID)

		if len(requiredChannels) > 0 {
			client.SetFilters(requiredChannels)
		}

		log.Printf("[WS] client connected: %s (user=%s, filters=%v)", client.id, userPubID, client.GetFilters())
	}
}
