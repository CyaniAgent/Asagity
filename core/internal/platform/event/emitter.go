package event

import (
	"context"
	"sync"

	"gorm.io/gorm"
)

type EmitFunc func()

type Emitter struct {
	mu       sync.Mutex
	bus      *Bus
	pending  []EmitFunc
	emitted  bool
}

func NewEmitter(bus *Bus) *Emitter {
	return &Emitter{bus: bus}
}

func (e *Emitter) AfterCommit(db *gorm.DB, event Event) {
	e.mu.Lock()
	defer e.mu.Unlock()

	e.pending = append(e.pending, func() {
		e.bus.Emit(context.Background(), event)
	})
}

func (e *Emitter) RunCallbacks() {
	e.mu.Lock()
	callbacks := e.pending
	e.pending = nil
	e.emitted = true
	e.mu.Unlock()

	for _, fn := range callbacks {
		fn()
	}
}

func (e *Emitter) Clear() {
	e.mu.Lock()
	defer e.mu.Unlock()
	e.pending = nil
	e.emitted = false
}

func EmitAfterTransaction(bus *Bus, event Event) func(*gorm.DB) {
	emitter := NewEmitter(bus)
	emitter.AfterCommit(nil, event)

	return func(tx *gorm.DB) {
		if tx.Error == nil {
			emitter.RunCallbacks()
		} else {
			emitter.Clear()
		}
	}
}
