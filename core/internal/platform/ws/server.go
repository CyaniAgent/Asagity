package ws

import (
	"context"
	"encoding/json"
	"log"
	"sync"
	"time"

	"github.com/CyaniAgent/Asagity/core/internal/platform/event"
	"github.com/gorilla/websocket"
)

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 4096
)

type Server struct {
	mu       sync.RWMutex
	clients  map[string]*Client
	bus      *event.Bus
	ctx      context.Context
	cancel   context.CancelFunc
	wg       sync.WaitGroup
}

func NewServer(bus *event.Bus) *Server {
	ctx, cancel := context.WithCancel(context.Background())
	return &Server{
		clients: make(map[string]*Client),
		bus:     bus,
		ctx:     ctx,
		cancel:  cancel,
	}
}

func (s *Server) Start() {
	s.bus.Subscribe(&event.Subscriber{
		ID:     "ws:server",
		Topics: []string{"#"},
		Async:  false,
		Handler: func(ctx context.Context, evt event.Event) error {
			s.broadcast(evt)
			return nil
		},
	})

	log.Println("[WS] WebSocket server started, listening on EventBus")
}

func (s *Server) Stop() {
	s.cancel()
	s.bus.Unsubscribe("ws:server")

	s.mu.Lock()
	for _, client := range s.clients {
		client.conn.Close()
	}
	s.clients = make(map[string]*Client)
	s.mu.Unlock()

	s.wg.Wait()
	log.Println("[WS] WebSocket server stopped")
}

func (s *Server) Register(conn *websocket.Conn, userPubID string) *Client {
	s.mu.Lock()
	defer s.mu.Unlock()

	client := newClient(s, conn, userPubID)
	s.clients[client.id] = client

	s.wg.Add(2)
	go client.writePump()
	go client.readPump()

	return client
}

func (s *Server) unregister(client *Client) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, ok := s.clients[client.id]; ok {
		delete(s.clients, client.id)
		client.conn.Close()
	}
}

func (s *Server) ActiveConnections() int {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return len(s.clients)
}

func (s *Server) broadcast(evt event.Event) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	for _, client := range s.clients {
		if client.matchesEvent(evt.Type) {
			select {
			case client.send <- evt:
			default:
				go s.unregister(client)
			}
		}
	}
}

type WSEvent struct {
	Type      string      `json:"type"`
	Payload   interface{} `json:"payload"`
	Timestamp time.Time   `json:"timestamp"`
	TraceID   string      `json:"trace_id"`
}

func NewWSEvent(evt event.Event) WSEvent {
	return WSEvent{
		Type:      evt.Type,
		Payload:   evt.Payload,
		Timestamp: evt.Timestamp,
		TraceID:   evt.TraceID,
	}
}

func MarshalEvent(evt event.Event) ([]byte, error) {
	wsEvt := NewWSEvent(evt)
	return json.Marshal(wsEvt)
}
