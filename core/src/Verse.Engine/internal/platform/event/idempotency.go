package event

import (
	"container/list"
	"sync"
)

// IdempotencyStore is a bounded LRU cache of recently seen idempotency keys.
// When capacity is reached the least-recently-used key is evicted, and a
// repeated key is moved to the front so frequently re-emitted events stay
// resident instead of being churned out in FIFO order.
type IdempotencyStore struct {
	mu       sync.RWMutex
	seen     map[string]*list.Element
	order    *list.List
	capacity int
}

func NewIdempotencyStore(capacity int) *IdempotencyStore {
	return &IdempotencyStore{
		seen:     make(map[string]*list.Element, capacity),
		order:    list.New(),
		capacity: capacity,
	}
}

func (s *IdempotencyStore) Mark(key string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	if elem, ok := s.seen[key]; ok {
		s.order.MoveToFront(elem)
		return false
	}

	if s.order.Len() >= s.capacity {
		if oldest := s.order.Back(); oldest != nil {
			delete(s.seen, oldest.Value.(string))
			s.order.Remove(oldest)
		}
	}

	s.seen[key] = s.order.PushFront(key)
	return true
}

func (s *IdempotencyStore) Has(key string) bool {
	s.mu.RLock()
	defer s.mu.RUnlock()
	_, ok := s.seen[key]
	return ok
}

func (s *IdempotencyStore) Size() int {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.order.Len()
}
