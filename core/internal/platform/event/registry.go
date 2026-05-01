package event

import (
	"fmt"
	"sync"
)

type EventTypeInfo struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Version     int    `json:"version"`
	Module      string `json:"module"`
}

type Registry struct {
	mu       sync.RWMutex
	types    map[string]EventTypeInfo
	handlers map[string][]Handler
}

var defaultRegistry = &Registry{
	types:    make(map[string]EventTypeInfo),
	handlers: make(map[string][]Handler),
}

func DefaultRegistry() *Registry {
	return defaultRegistry
}

func (r *Registry) RegisterEventType(info EventTypeInfo) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, exists := r.types[info.Name]; exists {
		return fmt.Errorf("event type %q already registered by module %q", info.Name, info.Module)
	}

	r.types[info.Name] = info
	return nil
}

func (r *Registry) UnregisterEventType(name string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, exists := r.types[name]; !exists {
		return fmt.Errorf("event type %q not registered", name)
	}

	delete(r.types, name)
	delete(r.handlers, name)
	return nil
}

func (r *Registry) GetEventType(name string) (EventTypeInfo, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	info, ok := r.types[name]
	return info, ok
}

func (r *Registry) ListEventTypes() []EventTypeInfo {
	r.mu.RLock()
	defer r.mu.RUnlock()

	result := make([]EventTypeInfo, 0, len(r.types))
	for _, info := range r.types {
		result = append(result, info)
	}
	return result
}

func (r *Registry) ListByModule(module string) []EventTypeInfo {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var result []EventTypeInfo
	for _, info := range r.types {
		if info.Module == module {
			result = append(result, info)
		}
	}
	return result
}

func (r *Registry) RegisterHandler(eventType string, handler Handler) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, exists := r.types[eventType]; !exists {
		r.types[eventType] = EventTypeInfo{
			Name:    eventType,
			Version: 1,
			Module:  "dynamic",
		}
	}

	r.handlers[eventType] = append(r.handlers[eventType], handler)
	return nil
}

func (r *Registry) GetHandlers(eventType string) []Handler {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.handlers[eventType]
}

func (r *Registry) HasEventType(name string) bool {
	r.mu.RLock()
	defer r.mu.RUnlock()
	_, ok := r.types[name]
	return ok
}
