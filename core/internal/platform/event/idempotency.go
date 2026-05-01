package event

import (
	"container/ring"
	"sync"
)

type IdempotencyStore struct {
	mu       sync.RWMutex
	seen     map[string]bool
	eviction *ring.Ring
	capacity int
}

func NewIdempotencyStore(capacity int) *IdempotencyStore {
	return &IdempotencyStore{
		seen:     make(map[string]bool, capacity),
		eviction: ring.New(capacity),
		capacity: capacity,
	}
}

func (s *IdempotencyStore) Mark(key string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.seen[key] {
		return false
	}

	if len(s.seen) >= s.capacity {
		oldest := s.eviction.Value
		if oldest != nil {
			delete(s.seen, oldest.(string))
		}
	}

	s.seen[key] = true
	s.eviction.Value = key
	s.eviction = s.eviction.Next()
	return true
}

func (s *IdempotencyStore) Has(key string) bool {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.seen[key]
}

func (s *IdempotencyStore) Size() int {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return len(s.seen)
}
