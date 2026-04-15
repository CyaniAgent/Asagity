package queue

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/hibiken/asynq"
)

const (
	TypeIndexNote       = "index:note"
	TypeFederateNote    = "federate:note"
	TypeDeleteNoteIndex = "delete:note_index"
)

type IndexNotePayload struct {
	NoteID  string `json:"note_id"`
	PubID   string `json:"pubid"`
	UserID  string `json:"user_id"`
	Content string `json:"content"`
	Cw      string `json:"cw,omitempty"`
	Tags    string `json:"tags"`
	Lang    string `json:"lang"`
	Source  string `json:"source,omitempty"`
}

type FederateNotePayload struct {
	NoteID  string `json:"note_id"`
	PubID   string `json:"pubid"`
	UserID  string `json:"user_id"`
	Content string `json:"content"`
	Cw      string `json:"cw,omitempty"`
	URL     string `json:"url"`
}

type DeleteNoteIndexPayload struct {
	NoteID string `json:"note_id"`
}

type Client struct {
	client *asynq.Client
}

func NewClient(redisAddr string, password string) *Client {
	opt := asynq.RedisClientOpt{
		Addr:     redisAddr,
		Password: password,
	}
	client := asynq.NewClient(opt)
	return &Client{client: client}
}

func (c *Client) EnqueueIndexNote(payload IndexNotePayload) error {
	data, _ := json.Marshal(payload)
	task := asynq.NewTask(TypeIndexNote, data)
	_, err := c.client.Enqueue(task, asynq.ProcessIn(100*time.Millisecond))
	return err
}

func (c *Client) EnqueueFederateNote(payload FederateNotePayload) error {
	data, _ := json.Marshal(payload)
	task := asynq.NewTask(TypeFederateNote, data)
	_, err := c.client.Enqueue(task, asynq.ProcessIn(100*time.Millisecond))
	return err
}

func (c *Client) EnqueueDeleteNoteIndex(noteID string) error {
	data, _ := json.Marshal(DeleteNoteIndexPayload{NoteID: noteID})
	task := asynq.NewTask(TypeDeleteNoteIndex, data)
	_, err := c.client.Enqueue(task, asynq.ProcessIn(100*time.Millisecond))
	return err
}

func (c *Client) Close() error {
	return c.client.Close()
}

type Worker struct {
	server   *asynq.Server
	mux      *asynq.ServeMux
	search   SearchIndexer
	federate Federator
}

type SearchIndexer interface {
	IndexNote(id string, doc interface{}) error
	DeleteNote(id string) error
}

type Federator interface {
	FederateNote(noteID string) error
}

func NewWorker(redisAddr string, password string, search SearchIndexer, federate Federator) *Worker {
	opt := asynq.RedisClientOpt{
		Addr:     redisAddr,
		Password: password,
	}
	config := asynq.Config{
		Concurrency: 10,
	}
	server := asynq.NewServer(opt, config)

	mux := asynq.NewServeMux()
	mux.HandleFunc(TypeIndexNote, handleIndexNote(search))
	mux.HandleFunc(TypeFederateNote, handleFederateNote(federate))
	mux.HandleFunc(TypeDeleteNoteIndex, handleDeleteNoteIndex(search))

	return &Worker{
		server:   server,
		mux:      mux,
		search:   search,
		federate: federate,
	}
}

func (w *Worker) Start() error {
	return w.server.Run(w.mux)
}

func (w *Worker) Stop() {
	w.server.Shutdown()
}

func handleIndexNote(search SearchIndexer) func(context.Context, *asynq.Task) error {
	return func(ctx context.Context, t *asynq.Task) error {
		var payload IndexNotePayload
		if err := json.Unmarshal(t.Payload(), &payload); err != nil {
			log.Printf("Failed to parse index note payload: %v", err)
			return err
		}

		log.Printf("Indexing note: %s", payload.NoteID)

		if search == nil {
			log.Println("Search indexer not available, skipping index")
			return nil
		}

		doc := map[string]interface{}{
			"id":         payload.NoteID,
			"pubid":      payload.PubID,
			"user_id":    payload.UserID,
			"content":    payload.Content,
			"cw":         payload.Cw,
			"tags":       payload.Tags,
			"lang":       payload.Lang,
			"visibility": "public",
			"created_at": time.Now().Format("2006-01-02T15:04:05Z07:00"),
		}

		return search.IndexNote(payload.NoteID, doc)
	}
}

func handleFederateNote(federate Federator) func(context.Context, *asynq.Task) error {
	return func(ctx context.Context, t *asynq.Task) error {
		var payload FederateNotePayload
		if err := json.Unmarshal(t.Payload(), &payload); err != nil {
			log.Printf("Failed to parse federate note payload: %v", err)
			return err
		}

		log.Printf("Federating note: %s", payload.NoteID)

		if federate == nil {
			log.Println("Federator not available, skipping federation")
			return nil
		}

		return federate.FederateNote(payload.NoteID)
	}
}

func handleDeleteNoteIndex(search SearchIndexer) func(context.Context, *asynq.Task) error {
	return func(ctx context.Context, t *asynq.Task) error {
		var payload DeleteNoteIndexPayload
		if err := json.Unmarshal(t.Payload(), &payload); err != nil {
			log.Printf("Failed to parse delete note index payload: %v", err)
			return err
		}

		log.Printf("Deleting note index: %s", payload.NoteID)

		if search == nil {
			return nil
		}

		return search.DeleteNote(payload.NoteID)
	}
}
