package cache

import (
	"context"
	"testing"
	"time"
)

func exercise(t *testing.T, c Cache) {
	t.Helper()
	ctx := context.Background()

	if err := c.Ping(ctx); err != nil {
		t.Fatalf("Ping: %v", err)
	}

	if _, err := c.Get(ctx, "missing"); err != ErrNotFound {
		t.Fatalf("Get missing: got %v, want ErrNotFound", err)
	}

	if err := c.Set(ctx, "k", "v", 0); err != nil {
		t.Fatalf("Set: %v", err)
	}
	if got, err := c.Get(ctx, "k"); err != nil || got != "v" {
		t.Fatalf("Get: got %q,%v", got, err)
	}

	if err := c.Set(ctx, "tmp", "v", 30*time.Millisecond); err != nil {
		t.Fatalf("Set ttl: %v", err)
	}
	time.Sleep(60 * time.Millisecond)
	if _, err := c.Get(ctx, "tmp"); err != ErrNotFound {
		t.Fatalf("Get expired: got %v, want ErrNotFound", err)
	}

	if err := c.Set(ctx, "refresh:a", "1", 0); err != nil {
		t.Fatalf("Set: %v", err)
	}
	if err := c.Set(ctx, "refresh:b", "2", 0); err != nil {
		t.Fatalf("Set: %v", err)
	}
	keys, err := c.Keys(ctx, "refresh:*")
	if err != nil || len(keys) != 2 {
		t.Fatalf("Keys: got %v,%v", keys, err)
	}

	if err := c.Del(ctx, "refresh:a"); err != nil {
		t.Fatalf("Del: %v", err)
	}
	if _, err := c.Get(ctx, "refresh:a"); err != ErrNotFound {
		t.Fatalf("Get after Del: got %v, want ErrNotFound", err)
	}
	// Deleting a missing key is not an error.
	if err := c.Del(ctx, "refresh:a"); err != nil {
		t.Fatalf("Del missing: %v", err)
	}
}

func TestMemoryCache(t *testing.T) {
	c := NewMemoryCache(10 * time.Millisecond)
	defer func() { _ = c.Close() }()
	exercise(t, c)
}
