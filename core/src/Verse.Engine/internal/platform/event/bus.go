package event

import (
	"context"
	"log"
	"strings"
	"sync"
)

type Handler func(ctx context.Context, event Event) error

type Subscriber struct {
	ID      string
	Topics  []string
	Handler Handler
	Async   bool
}

type BusConfig struct {
	AsyncWorkers int
}

type Bus struct {
	mu          sync.RWMutex
	subscribers map[string]*Subscriber
	eventCh     chan Event
	ctx         context.Context
	cancel      context.CancelFunc
	wg          sync.WaitGroup
	idempotency *IdempotencyStore
}

func NewBus(cfg BusConfig) *Bus {
	if cfg.AsyncWorkers <= 0 {
		cfg.AsyncWorkers = 16
	}
	ctx, cancel := context.WithCancel(context.Background())

	bus := &Bus{
		subscribers: make(map[string]*Subscriber),
		eventCh:     make(chan Event, 1024),
		ctx:         ctx,
		cancel:      cancel,
		idempotency: NewIdempotencyStore(100000),
	}

	for i := 0; i < cfg.AsyncWorkers; i++ {
		bus.wg.Add(1)
		go bus.worker()
	}

	return bus
}

func (b *Bus) Subscribe(sub *Subscriber) string {
	b.mu.Lock()
	defer b.mu.Unlock()

	if sub.ID == "" {
		sub.ID = "sub_" + randString(12)
	}
	b.subscribers[sub.ID] = sub
	return sub.ID
}

func (b *Bus) Unsubscribe(id string) {
	b.mu.Lock()
	defer b.mu.Unlock()
	delete(b.subscribers, id)
}

func (b *Bus) Emit(ctx context.Context, event Event) {
	if !b.idempotency.Mark(event.IdempotencyKey()) {
		return
	}

	select {
	case b.eventCh <- event:
	case <-b.ctx.Done():
		return
	default:
		log.Printf("[EventBus] event channel full, dropping event: %s", event.Type)
	}
}

func (b *Bus) EmitSync(ctx context.Context, event Event) error {
	if !b.idempotency.Mark(event.IdempotencyKey()) {
		return nil
	}

	b.mu.RLock()
	subs := b.matchSubscribers(event.Type)
	b.mu.RUnlock()

	for _, sub := range subs {
		if err := sub.Handler(ctx, event); err != nil {
			log.Printf("[EventBus] handler error for %s (sub=%s): %v", event.Type, sub.ID, err)
		}
	}
	return nil
}

func (b *Bus) SubscriberCount() int {
	b.mu.RLock()
	defer b.mu.RUnlock()
	return len(b.subscribers)
}

func (b *Bus) Shutdown() {
	b.cancel()
	b.wg.Wait()
}

func (b *Bus) worker() {
	defer b.wg.Done()
	for {
		select {
		case <-b.ctx.Done():
			return
		case event := <-b.eventCh:
			b.dispatch(event)
		}
	}
}

func (b *Bus) dispatch(event Event) {
	b.mu.RLock()
	subs := b.matchSubscribers(event.Type)
	b.mu.RUnlock()

	for _, sub := range subs {
		if sub.Async {
			go func(s *Subscriber) {
				if err := s.Handler(b.ctx, event); err != nil {
					log.Printf("[EventBus] async handler error for %s (sub=%s): %v", event.Type, s.ID, err)
				}
			}(sub)
		} else {
			if err := sub.Handler(b.ctx, event); err != nil {
				log.Printf("[EventBus] handler error for %s (sub=%s): %v", event.Type, sub.ID, err)
			}
		}
	}
}

func (b *Bus) matchSubscribers(eventType string) []*Subscriber {
	var matched []*Subscriber
	for _, sub := range b.subscribers {
		if matchTopic(sub.Topics, eventType) {
			matched = append(matched, sub)
		}
	}
	return matched
}

func matchTopic(topics []string, eventType string) bool {
	for _, topic := range topics {
		if topic == "*" || topic == "#" {
			return true
		}
		if topic == eventType {
			return true
		}
		if strings.HasSuffix(topic, ".*") {
			prefix := strings.TrimSuffix(topic, ".*")
			if strings.HasPrefix(eventType, prefix+".") || eventType == prefix {
				return true
			}
		}
		if strings.HasSuffix(topic, ".#") {
			prefix := strings.TrimSuffix(topic, ".#")
			if strings.HasPrefix(eventType, prefix) {
				return true
			}
		}
	}
	return false
}

var randChars = []byte("abcdefghijklmnopqrstuvwxyz0123456789")

func randString(n int) string {
	b := make([]byte, n)
	for i := range b {
		b[i] = randChars[seededInt()%len(randChars)]
	}
	return string(b)
}

var seededMu sync.Mutex
var seededCounter int

func seededInt() int {
	seededMu.Lock()
	defer seededMu.Unlock()
	seededCounter++
	return seededCounter
}
