package search

import (
	"os"
	"path/filepath"
	"strings"
	"sync"

	"github.com/blevesearch/bleve/v2"
)

// Engine is the search engine interface
type Engine interface {
	Index(id string, doc interface{}) error
	Search(query string, from, size int) (*Result, error)
	Delete(id string) error
	Close() error
}

// Result represents search results
type Result struct {
	Hits  []Hit  `json:"hits"`
	Total uint64 `json:"total"`
}

type Hit struct {
	ID    string  `json:"id"`
	Score float64 `json:"score"`
}

// NoteDoc represents a note document for indexing
type NoteDoc struct {
	ID         string `json:"id"`
	PubID      string `json:"pubid"`
	UserID     string `json:"user_id"`
	Username   string `json:"username"`
	Content    string `json:"content"`
	Cw         string `json:"cw,omitempty"`
	Tags       string `json:"tags"`
	Language   string `json:"lang"`
	CreatedAt  string `json:"created_at"`
	Visibility string `json:"visibility"`
}

// Config holds search configuration
type Config struct {
	IndexPath string
	IndexName string
}

// BleveEngine implements the search engine using Bleve
type BleveEngine struct {
	index  bleve.Index
	config Config
	mu     sync.RWMutex
}

// NewBleveEngine creates a new Bleve search engine
func NewBleveEngine(cfg Config) (*BleveEngine, error) {
	if err := os.MkdirAll(cfg.IndexPath, 0755); err != nil {
		return nil, err
	}

	indexPath := filepath.Join(cfg.IndexPath, cfg.IndexName+".bleve")

	var index bleve.Index
	var err error

	if _, statErr := os.Stat(indexPath); statErr == nil {
		index, err = bleve.Open(indexPath)
		if err != nil {
			return nil, err
		}
	} else {
		index, err = createIndex(indexPath)
		if err != nil {
			return nil, err
		}
	}

	return &BleveEngine{
		index:  index,
		config: cfg,
	}, nil
}

func createIndex(path string) (bleve.Index, error) {
	mapping := bleve.NewIndexMapping()
	docMapping := bleve.NewDocumentMapping()

	contentField := bleve.NewTextFieldMapping()
	contentField.Analyzer = "standard"
	docMapping.AddFieldMappingsAt("content", contentField)

	tagsField := bleve.NewTextFieldMapping()
	tagsField.Analyzer = "standard"
	docMapping.AddFieldMappingsAt("tags", tagsField)

	visField := bleve.NewTextFieldMapping()
	visField.Analyzer = "keyword"
	docMapping.AddFieldMappingsAt("visibility", visField)

	dateField := bleve.NewDateTimeFieldMapping()
	docMapping.AddFieldMappingsAt("created_at", dateField)

	mapping.AddDocumentMapping("note", docMapping)

	return bleve.New(path, mapping)
}

// Index indexes a document
func (e *BleveEngine) Index(id string, doc interface{}) error {
	e.mu.Lock()
	defer e.mu.Unlock()
	return e.index.Index(id, doc)
}

// Search performs a search query
func (e *BleveEngine) Search(query string, from, size int) (*Result, error) {
	e.mu.RLock()
	defer e.mu.RUnlock()

	q := bleve.NewQueryStringQuery(query)
	req := bleve.NewSearchRequest(q)
	req.From = from
	req.Size = size

	searchResult, err := e.index.Search(req)
	if err != nil {
		return nil, err
	}

	result := &Result{
		Hits:  make([]Hit, 0, len(searchResult.Hits)),
		Total: searchResult.Total,
	}

	for _, hit := range searchResult.Hits {
		result.Hits = append(result.Hits, Hit{
			ID:    hit.ID,
			Score: hit.Score,
		})
	}

	return result, nil
}

// Delete removes a document from the index
func (e *BleveEngine) Delete(id string) error {
	e.mu.Lock()
	defer e.mu.Unlock()
	return e.index.Delete(id)
}

// Close closes the search engine
func (e *BleveEngine) Close() error {
	e.mu.Lock()
	defer e.mu.Unlock()
	return e.index.Close()
}

// ExtractTags extracts hashtags from content
func ExtractTags(content string) []string {
	var tags []string
	words := strings.Fields(content)
	for _, w := range words {
		if strings.HasPrefix(w, "#") {
			tag := strings.TrimPrefix(w, "#")
			tag = strings.Trim(tag, ".,!?;:")
			if len(tag) > 0 {
				tags = append(tags, tag)
			}
		}
	}
	return tags
}
