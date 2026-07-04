package event

import (
	"time"

	"github.com/google/uuid"
)

type Event struct {
	ID        string      `json:"id"`
	Type      string      `json:"type"`
	Source    string      `json:"source"`
	Version   int         `json:"version"`
	TraceID   string      `json:"trace_id"`
	Timestamp time.Time   `json:"timestamp"`
	Actor     string      `json:"actor"`
	Payload   interface{} `json:"payload"`
}

func NewEvent(eventType, source, actor string, version int, traceID string, payload interface{}) Event {
	if traceID == "" {
		traceID = uuid.New().String()
	}
	return Event{
		ID:        uuid.New().String(),
		Type:      eventType,
		Source:    source,
		Version:   version,
		TraceID:   traceID,
		Timestamp: time.Now(),
		Actor:     actor,
		Payload:   payload,
	}
}

func (e Event) IsLocal() bool {
	return e.Source == SourceLocal
}

func (e Event) IsFederated() bool {
	return e.Source == SourceActivityPub || e.Source == SourceNeoLinkage
}

func (e Event) IdempotencyKey() string {
	return e.ID + ":" + e.Source
}
