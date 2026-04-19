package search

import (
	"os"
	"path/filepath"
	"strings"
	"sync"

	"github.com/blevesearch/bleve/v2"
	_ "github.com/blevesearch/bleve/v2/analysis/analyzer/custom"
	"github.com/blevesearch/bleve/v2/analysis/analyzer/keyword"
	_ "github.com/blevesearch/bleve/v2/analysis/token/edgengram"
	_ "github.com/blevesearch/bleve/v2/analysis/token/lowercase"
	_ "github.com/blevesearch/bleve/v2/analysis/tokenizer/letter"
	_ "github.com/blevesearch/bleve/v2/analysis/tokenizer/unicode"
)

// Engine is the search engine interface
type Engine interface {
	Index(id string, doc interface{}) error
	Search(query string, from, size int) (*Result, error)
	SearchRegexp(pattern string, from, size int) (*Result, error)
	SearchPrefix(prefix string, field string, from, size int) (*Result, error)
	SearchFuzzy(term string, fuzziness int, from, size int) (*Result, error)
	Suggest(text string, field string, limit int) ([]string, error)
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
	Pinyin     string `json:"pinyin,omitempty"`
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

	err := mapping.AddCustomTokenFilter("edge_ngram_filter", map[string]interface{}{
		"type": "edge_ngram",
		"min":  float64(1),
		"max":  float64(20),
	})
	if err != nil {
		return nil, err
	}

	err = mapping.AddCustomAnalyzer("autocomplete", map[string]interface{}{
		"type":      "custom",
		"tokenizer": "unicode",
		"token_filters": []string{
			"to_lower",
			"edge_ngram_filter",
		},
	})
	if err != nil {
		return nil, err
	}

	err = mapping.AddCustomAnalyzer("keyword_lower", map[string]interface{}{
		"type":      "custom",
		"tokenizer": "letter",
		"token_filters": []string{
			"to_lower",
		},
	})
	if err != nil {
		return nil, err
	}

	docMapping := bleve.NewDocumentMapping()

	contentField := bleve.NewTextFieldMapping()
	contentField.Analyzer = "standard"
	contentField.Store = true
	contentField.IncludeTermVectors = true
	docMapping.AddFieldMappingsAt("content", contentField)

	contentAutocomplete := bleve.NewTextFieldMapping()
	contentAutocomplete.Analyzer = "autocomplete"
	contentAutocomplete.Store = false
	docMapping.AddFieldMappingsAt("content_autocomplete", contentAutocomplete)

	tagsField := bleve.NewTextFieldMapping()
	tagsField.Analyzer = "keyword_lower"
	docMapping.AddFieldMappingsAt("tags", tagsField)

	visField := bleve.NewTextFieldMapping()
	visField.Analyzer = keyword.Name
	docMapping.AddFieldMappingsAt("visibility", visField)

	pinyinField := bleve.NewTextFieldMapping()
	pinyinField.Analyzer = "keyword_lower"
	pinyinField.Store = false
	docMapping.AddFieldMappingsAt("pinyin", pinyinField)

	usernameField := bleve.NewTextFieldMapping()
	usernameField.Analyzer = "standard"
	usernameField.Store = true
	docMapping.AddFieldMappingsAt("username", usernameField)

	cwField := bleve.NewTextFieldMapping()
	cwField.Analyzer = "standard"
	cwField.Store = true
	docMapping.AddFieldMappingsAt("cw", cwField)

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

// Search performs a full-text search query
func (e *BleveEngine) Search(query string, from, size int) (*Result, error) {
	e.mu.RLock()
	defer e.mu.RUnlock()

	contentMatch := bleve.NewMatchQuery(query)
	contentMatch.SetField("content")

	usernameMatch := bleve.NewMatchQuery(query)
	usernameMatch.SetField("username")

	pinyinPrefix := bleve.NewPrefixQuery(strings.ToLower(query))
	pinyinPrefix.SetField("pinyin")

	cwMatch := bleve.NewMatchQuery(query)
	cwMatch.SetField("cw")

	booleanQuery := bleve.NewDisjunctionQuery(contentMatch, usernameMatch, pinyinPrefix, cwMatch)

	req := bleve.NewSearchRequest(booleanQuery)
	req.From = from
	req.Size = size
	req.Fields = []string{"content", "username", "cw"}

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

// SearchRegexp performs a regular expression search
func (e *BleveEngine) SearchRegexp(pattern string, from, size int) (*Result, error) {
	e.mu.RLock()
	defer e.mu.RUnlock()

	regexpQuery := bleve.NewRegexpQuery(pattern)
	regexpQuery.FieldVal = "content"

	req := bleve.NewSearchRequest(regexpQuery)
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

// SearchPrefix performs a prefix-based search on a specific field
func (e *BleveEngine) SearchPrefix(prefix string, field string, from, size int) (*Result, error) {
	e.mu.RLock()
	defer e.mu.RUnlock()

	prefixQuery := bleve.NewPrefixQuery(strings.ToLower(prefix))
	prefixQuery.FieldVal = field

	req := bleve.NewSearchRequest(prefixQuery)
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

// SearchFuzzy performs a fuzzy search with configurable edit distance
func (e *BleveEngine) SearchFuzzy(term string, fuzziness int, from, size int) (*Result, error) {
	e.mu.RLock()
	defer e.mu.RUnlock()

	fuzzyQuery := bleve.NewFuzzyQuery(term)
	fuzzyQuery.FieldVal = "content"
	fuzzyQuery.Fuzziness = fuzziness

	req := bleve.NewSearchRequest(fuzzyQuery)
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

// Suggest provides autocomplete suggestions based on partial input
func (e *BleveEngine) Suggest(text string, field string, limit int) ([]string, error) {
	e.mu.RLock()
	defer e.mu.RUnlock()

	prefixQuery := bleve.NewPrefixQuery(strings.ToLower(text))
	prefixQuery.FieldVal = field

	req := bleve.NewSearchRequest(prefixQuery)
	req.Size = limit
	req.Fields = []string{field}

	searchResult, err := e.index.Search(req)
	if err != nil {
		return nil, err
	}

	suggestions := make([]string, 0, len(searchResult.Hits))
	seen := make(map[string]bool)

	for _, hit := range searchResult.Hits {
		for _, fv := range hit.Fields {
			if str, ok := fv.(string); ok {
				lowerStr := strings.ToLower(str)
				if !seen[lowerStr] && strings.Contains(lowerStr, strings.ToLower(text)) {
					seen[lowerStr] = true
					suggestions = append(suggestions, str)
					if len(suggestions) >= limit {
						break
					}
				}
			}
		}
		if len(suggestions) >= limit {
			break
		}
	}

	return suggestions, nil
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
