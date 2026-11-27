package event

import (
	"context"
	"encoding/json"
	"log"
	"sync"

	"github.com/valkey-io/valkey-go"
	"github.com/valkey-io/valkey-go/valkeycompat"
)

const valkeyEventChannel = "asagity:events"

type Bridge struct {
	bus    *Bus
	rdb    valkeycompat.Cmdable
	ctx    context.Context
	cancel context.CancelFunc
	wg     sync.WaitGroup
}

// NewBridge adapts the native Valkey client to the go-redis-shaped Cmdable
// facade used by the Pub/Sub commands below.
func NewBridge(bus *Bus, client valkey.Client) *Bridge {
	ctx, cancel := context.WithCancel(context.Background())
	return &Bridge{
		bus:    bus,
		rdb:    valkeycompat.NewAdapter(client),
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

	log.Printf("[EventBridge] Valkey Pub/Sub bridge started (channel: %s)", valkeyEventChannel)
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

	return br.rdb.Publish(ctx, valkeyEventChannel, data).Err()
}

func (br *Bridge) subscribeFromRedis() {
	defer br.wg.Done()

	pubsub := br.rdb.Subscribe(br.ctx, valkeyEventChannel)
	defer pubsub.Close()

	ch := pubsub.Channel()

	log.Printf("[EventBridge] Listening on Valkey channel: %s", valkeyEventChannel)

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
				log.Printf("[EventBridge] failed to parse event from Valkey: %v", err)
				continue
			}
			br.bus.Emit(br.ctx, event)
		}
	}
}
