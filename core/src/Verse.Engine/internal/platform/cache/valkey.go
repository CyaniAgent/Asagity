package cache

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/valkey-io/valkey-go/valkeycompat"
)

// ValkeyCache adapts valkeycompat.Cmdable (the official Valkey Go client's
// go-redis-shaped facade) to the Cache interface. Asagity's cache server is
// Valkey; the adapter keeps the command surface identical to the previous
// go-redis implementation while the wire protocol stays RESP.
type ValkeyCache struct {
	client valkeycompat.Cmdable
}

// NewValkeyCache wraps client. It does not take ownership; Close is a no-op.
func NewValkeyCache(client valkeycompat.Cmdable) *ValkeyCache {
	return &ValkeyCache{client: client}
}

// Set stores value with ttl. A ttl <= 0 means persist (mirrors go-redis).
func (c *ValkeyCache) Set(ctx context.Context, key, value string, ttl time.Duration) error {
	return c.client.Set(ctx, key, value, ttl).Err()
}

// Get returns the value or ErrNotFound when the key is missing/expired.
func (c *ValkeyCache) Get(ctx context.Context, key string) (string, error) {
	val, err := c.client.Get(ctx, key).Result()
	if errors.Is(err, valkeycompat.Nil) {
		return "", ErrNotFound
	}
	return val, err
}

// Del removes key. Deleting a missing key is not an error.
func (c *ValkeyCache) Del(ctx context.Context, key string) error {
	return c.client.Del(ctx, key).Err()
}

// Keys delegates to Valkey KEYS (refresh-token scans only; not a hot path).
// Deprecated: use Scan.
func (c *ValkeyCache) Keys(ctx context.Context, pattern string) ([]string, error) {
	return c.client.Keys(ctx, pattern).Result()
}

// Scan iterates keys matching pattern using Valkey SCAN (non-blocking, cursor
// based, batch size 100). Calls fn for each key; stops early on error.
func (c *ValkeyCache) Scan(ctx context.Context, pattern string, fn func(key string) error) error {
	var cursor uint64
	for {
		keys, next, err := c.client.Scan(ctx, cursor, pattern, 100).Result()
		if err != nil {
			return err
		}
		for _, key := range keys {
			if err := fn(key); err != nil {
				return err
			}
		}
		cursor = next
		if cursor == 0 {
			return nil
		}
	}
}

// Ping checks connectivity.
func (c *ValkeyCache) Ping(ctx context.Context) error {
	return c.client.Ping(ctx).Err()
}

// Close is a no-op; the client's lifecycle belongs to the database package.
func (c *ValkeyCache) Close() error {
	return nil
}

// SupportsPrefix reports whether pattern uses the supported "prefix*" form.
func SupportsPrefix(pattern string) bool {
	return strings.HasSuffix(pattern, "*")
}
