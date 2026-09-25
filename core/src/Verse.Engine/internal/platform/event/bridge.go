package event

import (
	"context"
	"encoding/json"
	"log"
	"sync"

	"github.com/redis/go-redis/v9"
)

const redisEventChannel = "asagity:events"

type Bridge struct {
	bus    *Bus
	rdb    *redis.Client
	ctx    context.Context
	cancel context.CancelFunc
	wg     sync.WaitGroup
}

func NewBridge(bus *Bus, rdb *redis.Client) *Bridge {
	ctx, cancel := context.WithCancel(context.Background())
	return &Bridge{
		bus:    bus,
		rdb:    rdb,
		ctx:    ctx,
		cancel: cancel,
	}
}

func (br *Bridge) Start() error {
	br.bus.Subscribe(&Subscriber{
		ID:      "bridge:local_to_redis",
		Topics:  []string{"#"},
		Async:   true,
		Handler: br.publishToRedis,
	})

	br.wg.Add(1)
	go br.subscribeFromRedis()

	log.Printf("[EventBridge] Redis Pub/Sub bridge started (channel: %s)", redisEventChannel)
	return nil
}

func (br *Bridge) Stop() {
	br.cancel()
	br.bus.Unsubscribe("bridge:local_to_redis")
	br.wg.Wait()
	log.Println("[EventBridge] Redis bridge stopped")
}

func (br *Bridge) publishToRedis(ctx context.Context, event Event) error {
	if !event.IsLocal() {
		return nil
	}

	data, err := json.Marshal(event)
	if err != nil {
		return err
	}

	return br.rdb.Publish(ctx, redisEventChannel, data).Err()
}

func (br *Bridge) subscribeFromRedis() {
	defer br.wg.Done()

	pubsub := br.rdb.Subscribe(br.ctx, redisEventChannel)
	defer pubsub.Close()

	ch := pubsub.Channel()

	log.Printf("[EventBridge] Listening on Redis channel: %s", redisEventChannel)

	for {
		select {
		case <-br.ctx.Done():
			return
		case msg, ok := <-ch:
			if !ok {
				return
			}
			var event Event
			if err := json.Unmarshal([]byte(msg.Payload), &event); err != nil {
				log.Printf("[EventBridge] failed to parse event from Redis: %v", err)
				continue
			}
			br.bus.Emit(br.ctx, event)
		}
	}
}
