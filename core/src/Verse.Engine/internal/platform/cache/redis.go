package cache

import (
	"context"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
)

// RedisCache adapts *redis.Client to the Cache interface.
type RedisCache struct {
	client *redis.Client
}

// NewRedisCache wraps client. It does not take ownership; Close is a no-op.
func NewRedisCache(client *redis.Client) *RedisCache {
	return &RedisCache{client: client}
}

// Set stores value with ttl. A ttl <= 0 means persist (mirrors go-redis).
func (c *RedisCache) Set(ctx context.Context, key, value string, ttl time.Duration) error {
	return c.client.Set(ctx, key, value, ttl).Err()
}

// Get returns the value or ErrNotFound when the key is missing/expired.
func (c *RedisCache) Get(ctx context.Context, key string) (string, error) {
	val, err := c.client.Get(ctx, key).Result()
	if err == redis.Nil {
		return "", ErrNotFound
	}
	return val, err
}

// Del removes key. Deleting a missing key is not an error.
func (c *RedisCache) Del(ctx context.Context, key string) error {
	return c.client.Del(ctx, key).Err()
}

// Keys delegates to Redis KEYS (refresh-token scans only; not a hot path).
func (c *RedisCache) Keys(ctx context.Context, pattern string) ([]string, error) {
	return c.client.Keys(ctx, pattern).Result()
}

// Ping checks connectivity.
func (c *RedisCache) Ping(ctx context.Context) error {
	return c.client.Ping(ctx).Err()
}

// Close is a no-op; the client's lifecycle belongs to the database package.
func (c *RedisCache) Close() error {
	return nil
}

// SupportsPrefix reports whether pattern uses the supported "prefix*" form.
func SupportsPrefix(pattern string) bool {
	return strings.HasSuffix(pattern, "*")
}
