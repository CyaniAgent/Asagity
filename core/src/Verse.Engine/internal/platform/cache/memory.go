package cache

import (
	"context"
	"strings"
	"sync"
	"time"
)

type entry struct {
	value     string
	expiresAt time.Time // zero means no expiry
}

func (e entry) expired(now time.Time) bool {
	return !e.expiresAt.IsZero() && !now.Before(e.expiresAt)
}

// MemoryCache is a process-internal Cache with TTL and lazy+periodic expiry.
// It replaces Redis in lite/databaseless modes; contents are lost on restart.
type MemoryCache struct {
	mu       sync.RWMutex
	items    map[string]entry
	stop     chan struct{}
	stopOnce sync.Once
	wg       sync.WaitGroup
}

// NewMemoryCache creates a cache with a background janitor running every cleanupInterval.
// A non-positive interval disables the janitor (lazy expiry on access still applies).
func NewMemoryCache(cleanupInterval time.Duration) *MemoryCache {
	c := &MemoryCache{
		items: make(map[string]entry),
		stop:  make(chan struct{}),
	}
	if cleanupInterval > 0 {
		c.wg.Add(1)
		go c.janitor(cleanupInterval)
	}
	return c
}

func (c *MemoryCache) janitor(interval time.Duration) {
	defer c.wg.Done()
	ticker := time.NewTicker(interval)
	defer ticker.Stop()
	for {
		select {
		case <-c.stop:
			return
		case now := <-ticker.C:
			c.mu.Lock()
			for k, e := range c.items {
				if e.expired(now) {
					delete(c.items, k)
				}
			}
			c.mu.Unlock()
		}
	}
}

// Set stores value with ttl. A ttl <= 0 means no expiry.
func (c *MemoryCache) Set(_ context.Context, key, value string, ttl time.Duration) error {
	var expiresAt time.Time
	if ttl > 0 {
		expiresAt = time.Now().Add(ttl)
	}
	c.mu.Lock()
	c.items[key] = entry{value: value, expiresAt: expiresAt}
	c.mu.Unlock()
	return nil
}

// Get returns the value or ErrNotFound when missing/expired.
func (c *MemoryCache) Get(_ context.Context, key string) (string, error) {
	now := time.Now()
	c.mu.RLock()
	e, ok := c.items[key]
	c.mu.RUnlock()
	if !ok || e.expired(now) {
		if ok {
			c.mu.Lock()
			// Re-check under write lock before deleting.
			if cur, still := c.items[key]; still && cur.expired(time.Now()) {
				delete(c.items, key)
			}
			c.mu.Unlock()
		}
		return "", ErrNotFound
	}
	return e.value, nil
}

// Del removes key. Deleting a missing key is not an error.
func (c *MemoryCache) Del(_ context.Context, key string) error {
	c.mu.Lock()
	delete(c.items, key)
	c.mu.Unlock()
	return nil
}

// Keys supports exact keys and "prefix*" patterns.
func (c *MemoryCache) Keys(_ context.Context, pattern string) ([]string, error) {
	now := time.Now()
	var out []string
	c.mu.RLock()
	if strings.HasSuffix(pattern, "*") {
		prefix := strings.TrimSuffix(pattern, "*")
		for k, e := range c.items {
			if !e.expired(now) && strings.HasPrefix(k, prefix) {
				out = append(out, k)
			}
		}
	} else if e, ok := c.items[pattern]; ok && !e.expired(now) {
		out = append(out, pattern)
	}
	c.mu.RUnlock()
	return out, nil
}

// Ping always succeeds for the in-process cache.
func (c *MemoryCache) Ping(_ context.Context) error {
	return nil
}

// Close stops the janitor and drops all entries.
func (c *MemoryCache) Close() error {
	c.stopOnce.Do(func() { close(c.stop) })
	c.wg.Wait()
	c.mu.Lock()
	c.items = make(map[string]entry)
	c.mu.Unlock()
	return nil
}
