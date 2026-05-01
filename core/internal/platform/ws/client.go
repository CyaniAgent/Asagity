package ws

import (
	"encoding/json"
	"log"
	"strings"
	"sync"
	"time"

	"github.com/CyaniAgent/Asagity/core/internal/platform/event"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

type Client struct {
	id        string
	userPubID string
	server    *Server
	conn      *websocket.Conn
	send      chan event.Event
	mu        sync.RWMutex
	filters   []string
	closed    bool
}

func newClient(server *Server, conn *websocket.Conn, userPubID string) *Client {
	return &Client{
		id:        uuid.New().String(),
		userPubID: userPubID,
		server:    server,
		conn:      conn,
		send:      make(chan event.Event, 64),
		filters:   []string{"*"},
	}
}

func (c *Client) SetFilters(filters []string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.filters = filters
}

func (c *Client) GetFilters() []string {
	c.mu.RLock()
	defer c.mu.RUnlock()
	result := make([]string, len(c.filters))
	copy(result, c.filters)
	return result
}

func (c *Client) matchesEvent(eventType string) bool {
	c.mu.RLock()
	defer c.mu.RUnlock()

	for _, filter := range c.filters {
		if filter == "*" || filter == "#" {
			return true
		}
		if filter == eventType {
			return true
		}
		if strings.HasSuffix(filter, ".*") {
			prefix := strings.TrimSuffix(filter, ".*")
			if strings.HasPrefix(eventType, prefix+".") || eventType == prefix {
				return true
			}
		}
	}
	return false
}

func (c *Client) writePump() {
	defer func() {
		c.server.wg.Done()
		c.server.unregister(c)
	}()

	ticker := time.NewTicker(pingPeriod)
	defer ticker.Stop()

	for {
		select {
		case evt, ok := <-c.send:
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))

			data, err := MarshalEvent(evt)
			if err != nil {
				log.Printf("[WS] failed to marshal event: %v", err)
				continue
			}

			if err := c.conn.WriteMessage(websocket.TextMessage, data); err != nil {
				return
			}

		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

type clientMessage struct {
	Action  string   `json:"action"`
	Filters []string `json:"filters,omitempty"`
}

func (c *Client) readPump() {
	defer func() {
		c.server.wg.Done()
		c.server.unregister(c)
	}()

	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseNormalClosure) {
				log.Printf("[WS] read error: %v", err)
			}
			return
		}

		var msg clientMessage
		if err := json.Unmarshal(message, &msg); err != nil {
			log.Printf("[WS] invalid client message from %s: %v", c.userPubID, err)
			continue
		}

		switch msg.Action {
		case "subscribe":
			if len(msg.Filters) > 0 {
				c.SetFilters(msg.Filters)
				log.Printf("[WS] client %s subscribed to: %v", c.userPubID, msg.Filters)
			}
		case "unsubscribe":
			c.SetFilters(nil)
			log.Printf("[WS] client %s unsubscribed from all", c.userPubID)
		default:
			log.Printf("[WS] unknown action from %s: %s", c.userPubID, msg.Action)
		}
	}
}
