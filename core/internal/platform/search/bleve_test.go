package search

import (
	"os"
	"testing"
)

func TestBleveSearch(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "bleve_test")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tmpDir)

	engine, err := NewBleveEngine(Config{
		IndexPath: tmpDir,
		IndexName: "test_notes",
	})
	if err != nil {
		t.Fatalf("failed to create search engine: %v", err)
	}
	defer engine.Close()

	t.Run("index and search basic", func(t *testing.T) {
		doc := NoteDoc{
			ID:       "note1",
			Content:  "Hello world from Asagity",
			Username: "testuser",
			Tags:     "test,hello",
		}

		err := engine.Index("note1", doc)
		if err != nil {
			t.Fatalf("failed to index document: %v", err)
		}

		result, err := engine.Search("Hello", 0, 10)
		if err != nil {
			t.Fatalf("search failed: %v", err)
		}

		if result.Total != 1 {
			t.Errorf("expected 1 result, got %d", result.Total)
		}
	})

	t.Run("search multiple documents", func(t *testing.T) {
		docs := []NoteDoc{
			{ID: "note2", Content: "Go programming language", Username: "gopher", Tags: "go,programming"},
			{ID: "note3", Content: "Bleve search engine", Username: "searcher", Tags: "bleve,search"},
			{ID: "note4", Content: "Asagity social platform", Username: "asagity", Tags: "asagity,social"},
		}

		for _, doc := range docs {
			err := engine.Index(doc.ID, doc)
			if err != nil {
				t.Fatalf("failed to index document %s: %v", doc.ID, err)
			}
		}

		result, err := engine.Search("search", 0, 10)
		if err != nil {
			t.Fatalf("search failed: %v", err)
		}

		if result.Total < 1 {
			t.Errorf("expected at least 1 result for 'search', got %d", result.Total)
		}
	})
}

func TestBleveSearchPrefix(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "bleve_prefix_test")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tmpDir)

	engine, err := NewBleveEngine(Config{
		IndexPath: tmpDir,
		IndexName: "prefix_test",
	})
	if err != nil {
		t.Fatalf("failed to create search engine: %v", err)
	}
	defer engine.Close()

	doc := NoteDoc{
		ID:       "note1",
		Content:  "Hello from Asagity",
		Username: "testuser",
	}

	err = engine.Index("note1", doc)
	if err != nil {
		t.Fatalf("failed to index document: %v", err)
	}

	result, err := engine.SearchPrefix("Hel", "content", 0, 10)
	if err != nil {
		t.Fatalf("prefix search failed: %v", err)
	}

	if result.Total != 1 {
		t.Errorf("expected 1 result for prefix 'Hel', got %d", result.Total)
	}
}

func TestBleveDelete(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "bleve_delete_test")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tmpDir)

	engine, err := NewBleveEngine(Config{
		IndexPath: tmpDir,
		IndexName: "delete_test",
	})
	if err != nil {
		t.Fatalf("failed to create search engine: %v", err)
	}
	defer engine.Close()

	doc := NoteDoc{
		ID:       "note_to_delete",
		Content:  "This will be deleted",
		Username: "testuser",
	}

	err = engine.Index("note_to_delete", doc)
	if err != nil {
		t.Fatalf("failed to index document: %v", err)
	}

	err = engine.Delete("note_to_delete")
	if err != nil {
		t.Fatalf("failed to delete document: %v", err)
	}

	result, err := engine.Search("deleted", 0, 10)
	if err != nil {
		t.Fatalf("search failed after delete: %v", err)
	}

	if result.Total != 0 {
		t.Errorf("expected 0 results after delete, got %d", result.Total)
	}
}

func TestExtractTags(t *testing.T) {
	tests := []struct {
		name    string
		content string
		want    []string
	}{
		{
			name:    "single tag",
			content: "Hello #world",
			want:    []string{"world"},
		},
		{
			name:    "multiple tags",
			content: "#Hello #world #test",
			want:    []string{"Hello", "world", "test"},
		},
		{
			name:    "tag with punctuation",
			content: "Check this #Go, it's great!",
			want:    []string{"Go"},
		},
		{
			name:    "no tags",
			content: "Just some text",
			want:    nil,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := ExtractTags(tt.content)
			if len(got) != len(tt.want) {
				t.Errorf("ExtractTags() got %d tags, want %d", len(got), len(tt.want))
				return
			}
			for i := range got {
				if got[i] != tt.want[i] {
					t.Errorf("ExtractTags()[%d] = %v, want %v", i, got[i], tt.want[i])
				}
			}
		})
	}
}
