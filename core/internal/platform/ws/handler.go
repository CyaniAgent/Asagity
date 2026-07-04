package ws

import (
	"log"
	"net/http"

	"github.com/CyaniAgent/Asagity/core/internal/platform/httpx"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func NewHandler(server *Server, requiredChannels ...string) http.HandlerFunc {
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
