// Package cache abstracts the key/value store used by services.
//
// Production backs it with Redis; lite and databaseless modes use the
// in-process memory implementation so no external process is required.
package cache

import (
	"context"
	"errors"
	"time"
)

// ErrNotFound is returned when a key does not exist or has expired.
var ErrNotFound = errors.New("cache: key not found")

// Cache is the minimal KV surface services need (refresh tokens,
// registration challenges, metrics). TTL of 0 (or negative) means no expiry.
type Cache interface {
	Set(ctx context.Context, key, value string, ttl time.Duration) error
	Get(ctx context.Context, key string) (string, error)
	Del(ctx context.Context, key string) error
	// Keys lists keys matching pattern. Only exact keys and "prefix*" are supported.
	Keys(ctx context.Context, pattern string) ([]string, error)
	Ping(ctx context.Context) error
	Close() error
}
