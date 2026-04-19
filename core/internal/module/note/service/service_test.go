package service

import (
	"os"
	"testing"
	"time"

	followmodel "github.com/CyaniAgent/Asagity/core/internal/module/follow/model"
	followrepo "github.com/CyaniAgent/Asagity/core/internal/module/follow/repository"
	dto "github.com/CyaniAgent/Asagity/core/internal/module/note/dto"
	notemodel "github.com/CyaniAgent/Asagity/core/internal/module/note/model"
	"github.com/CyaniAgent/Asagity/core/internal/module/note/repository"
	"github.com/CyaniAgent/Asagity/core/internal/platform/search"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupTestDB(t *testing.T) *gorm.DB {
	t.Helper()

	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to connect to test database: %v", err)
	}

	err = db.AutoMigrate(
		&notemodel.Note{},
		&notemodel.NoteMedia{},
		&notemodel.NoteEdit{},
		&notemodel.NoteReaction{},
		&notemodel.Poll{},
		&notemodel.PollOption{},
		&notemodel.PollVote{},
		&followmodel.Follow{},
	)
	if err != nil {
		t.Fatalf("failed to migrate test database: %v", err)
	}

	return db
}

func setupNoteService(t *testing.T) (*NoteService, func()) {
	t.Helper()

	db := setupTestDB(t)
	repo := repository.NewNoteRepository(db)
	followRepo := followrepo.NewFollowRepository(db)

	svc := NewNoteServiceWithDeps(repo, followRepo, nil, nil, nil)

	cleanup := func() {
		sqlDB, _ := db.DB()
		if sqlDB != nil {
			sqlDB.Close()
		}
	}

	return svc, cleanup
}

func TestCreateNote(t *testing.T) {
	svc, cleanup := setupNoteService(t)
	defer cleanup()

	req := &dto.CreateNoteRequest{
		Content:    "Hello, Asagity!",
		Visibility: "public",
	}

	note, err := svc.CreateNote(req, "user1")
	if err != nil {
		t.Fatalf("CreateNote failed: %v", err)
	}

	if note.Content != "Hello, Asagity!" {
		t.Errorf("expected content 'Hello, Asagity!', got '%s'", note.Content)
	}

	if note.UserID != "user1" {
		t.Errorf("expected user_id 'user1', got '%s'", note.UserID)
	}

	if note.Visibility != notemodel.NoteVisibilityPublic {
		t.Errorf("expected visibility 'public', got '%s'", note.Visibility)
	}
}

func TestCreateNoteWithEmptyContent(t *testing.T) {
	svc, cleanup := setupNoteService(t)
	defer cleanup()

	req := &dto.CreateNoteRequest{
		Content:    "",
		Visibility: "public",
	}

	_, err := svc.CreateNote(req, "user1")
	if err == nil {
		t.Error("expected error for empty content, got nil")
	}
}

func TestCreateNoteWithTooLongContent(t *testing.T) {
	svc, cleanup := setupNoteService(t)
	defer cleanup()

	longContent := ""
	for i := 0; i < 10001; i++ {
		longContent += "a"
	}

	req := &dto.CreateNoteRequest{
		Content:    longContent,
		Visibility: "public",
	}

	_, err := svc.CreateNote(req, "user1")
	if err == nil {
		t.Error("expected error for too long content, got nil")
	}
}

func TestCreateNoteWithPoll(t *testing.T) {
	svc, cleanup := setupNoteService(t)
	defer cleanup()

	req := &dto.CreateNoteRequest{
		Content:    "What's your favorite color?",
		Visibility: "public",
		Poll: &dto.CreatePollRequest{
			Options:  []string{"Red", "Blue", "Green"},
			Multiple: false,
		},
	}

	note, err := svc.CreateNote(req, "user1")
	if err != nil {
		t.Fatalf("CreateNote with poll failed: %v", err)
	}

	if note == nil {
		t.Fatal("expected note to be created")
	}
}

func TestCreateNoteWithInsufficientPollOptions(t *testing.T) {
	svc, cleanup := setupNoteService(t)
	defer cleanup()

	req := &dto.CreateNoteRequest{
		Content:    "Poll with one option",
		Visibility: "public",
		Poll: &dto.CreatePollRequest{
			Options:  []string{"Only Option"},
			Multiple: false,
		},
	}

	_, err := svc.CreateNote(req, "user1")
	if err == nil {
		t.Error("expected error for poll with less than 2 options, got nil")
	}
}

func TestCreateReplyWithRootID(t *testing.T) {
	svc, cleanup := setupNoteService(t)
	defer cleanup()

	parentReq := &dto.CreateNoteRequest{
		Content:    "Parent note",
		Visibility: "public",
	}

	parentNote, err := svc.CreateNote(parentReq, "user1")
	if err != nil {
		t.Fatalf("failed to create parent note: %v", err)
	}

	replyReq := &dto.CreateNoteRequest{
		Content:    "Reply to parent",
		Visibility: "public",
		ParentID:   &parentNote.ID,
	}

	replyNote, err := svc.CreateNote(replyReq, "user2")
	if err != nil {
		t.Fatalf("failed to create reply: %v", err)
	}

	if replyNote.ParentID == nil || *replyNote.ParentID != parentNote.ID {
		t.Errorf("expected parent_id '%s', got '%v'", parentNote.ID, replyNote.ParentID)
	}

	if replyNote.RootID == nil || *replyNote.RootID != parentNote.ID {
		t.Errorf("expected root_id '%s', got '%v'", parentNote.ID, replyNote.RootID)
	}
}

func TestGetNoteByID(t *testing.T) {
	svc, cleanup := setupNoteService(t)
	defer cleanup()

	req := &dto.CreateNoteRequest{
		Content:    "Test note content",
		Visibility: "public",
	}

	createdNote, err := svc.CreateNote(req, "user1")
	if err != nil {
		t.Fatalf("failed to create note: %v", err)
	}

	retrievedNote, err := svc.GetNoteByID(createdNote.ID)
	if err != nil {
		t.Fatalf("GetNoteByID failed: %v", err)
	}

	if retrievedNote.ID != createdNote.ID {
		t.Errorf("expected ID '%s', got '%s'", createdNote.ID, retrievedNote.ID)
	}

	if retrievedNote.Content != createdNote.Content {
		t.Errorf("expected content '%s', got '%s'", createdNote.Content, retrievedNote.Content)
	}
}

func TestGetNoteByIDNotFound(t *testing.T) {
	svc, cleanup := setupNoteService(t)
	defer cleanup()

	_, err := svc.GetNoteByID("nonexistent-id")
	if err == nil {
		t.Error("expected error for non-existent note, got nil")
	}
}

func TestDeleteNote(t *testing.T) {
	svc, cleanup := setupNoteService(t)
	defer cleanup()

	req := &dto.CreateNoteRequest{
		Content:    "Note to delete",
		Visibility: "public",
	}

	note, err := svc.CreateNote(req, "user1")
	if err != nil {
		t.Fatalf("failed to create note: %v", err)
	}

	err = svc.DeleteNote(note.ID, "user1")
	if err != nil {
		t.Fatalf("DeleteNote failed: %v", err)
	}

	_, err = svc.GetNoteByID(note.ID)
	if err == nil {
		t.Error("expected error after deleting note, got nil")
	}
}

func TestDeleteNoteByOtherUser(t *testing.T) {
	svc, cleanup := setupNoteService(t)
	defer cleanup()

	req := &dto.CreateNoteRequest{
		Content:    "Note to delete",
		Visibility: "public",
	}

	note, err := svc.CreateNote(req, "user1")
	if err != nil {
		t.Fatalf("failed to create note: %v", err)
	}

	err = svc.DeleteNote(note.ID, "user2")
	if err == nil {
		t.Error("expected error when deleting other user's note, got nil")
	}
}

func TestUpdateNote(t *testing.T) {
	svc, cleanup := setupNoteService(t)
	defer cleanup()

	req := &dto.CreateNoteRequest{
		Content:    "Original content",
		Visibility: "public",
	}

	note, err := svc.CreateNote(req, "user1")
	if err != nil {
		t.Fatalf("failed to create note: %v", err)
	}

	updateReq := &dto.UpdateNoteRequest{
		Content: "Updated content",
	}

	updatedNote, err := svc.UpdateNote(note.ID, "user1", updateReq)
	if err != nil {
		t.Fatalf("UpdateNote failed: %v", err)
	}

	if updatedNote.Content != "Updated content" {
		t.Errorf("expected content 'Updated content', got '%s'", updatedNote.Content)
	}
}

func TestUpdateNoteByOtherUser(t *testing.T) {
	svc, cleanup := setupNoteService(t)
	defer cleanup()

	req := &dto.CreateNoteRequest{
		Content:    "Original content",
		Visibility: "public",
	}

	note, err := svc.CreateNote(req, "user1")
	if err != nil {
		t.Fatalf("failed to create note: %v", err)
	}

	updateReq := &dto.UpdateNoteRequest{
		Content: "Attempted update",
	}

	_, err = svc.UpdateNote(note.ID, "user2", updateReq)
	if err == nil {
		t.Error("expected error when updating other user's note, got nil")
	}
}

func TestAddReaction(t *testing.T) {
	svc, cleanup := setupNoteService(t)
	defer cleanup()

	req := &dto.CreateNoteRequest{
		Content:    "Test note",
		Visibility: "public",
	}

	note, err := svc.CreateNote(req, "user1")
	if err != nil {
		t.Fatalf("failed to create note: %v", err)
	}

	err = svc.AddReaction(note.ID, "user2", "❤️")
	if err != nil {
		t.Fatalf("AddReaction failed: %v", err)
	}
}

func TestAddDuplicateReaction(t *testing.T) {
	svc, cleanup := setupNoteService(t)
	defer cleanup()

	req := &dto.CreateNoteRequest{
		Content:    "Test note",
		Visibility: "public",
	}

	note, err := svc.CreateNote(req, "user1")
	if err != nil {
		t.Fatalf("failed to create note: %v", err)
	}

	err = svc.AddReaction(note.ID, "user2", "❤️")
	if err != nil {
		t.Fatalf("first AddReaction failed: %v", err)
	}

	err = svc.AddReaction(note.ID, "user2", "❤️")
	if err != nil {
		t.Fatalf("duplicate AddReaction failed (should be silent no-op): %v", err)
	}
}

func TestRemoveReaction(t *testing.T) {
	svc, cleanup := setupNoteService(t)
	defer cleanup()

	req := &dto.CreateNoteRequest{
		Content:    "Test note",
		Visibility: "public",
	}

	note, err := svc.CreateNote(req, "user1")
	if err != nil {
		t.Fatalf("failed to create note: %v", err)
	}

	err = svc.AddReaction(note.ID, "user2", "❤️")
	if err != nil {
		t.Fatalf("AddReaction failed: %v", err)
	}

	err = svc.RemoveReaction(note.ID, "user2", "❤️")
	if err != nil {
		t.Fatalf("RemoveReaction failed: %v", err)
	}
}

func TestVoteOnPoll(t *testing.T) {
	svc, cleanup := setupNoteService(t)
	defer cleanup()

	req := &dto.CreateNoteRequest{
		Content:    "Poll question",
		Visibility: "public",
		Poll: &dto.CreatePollRequest{
			Options:  []string{"Option A", "Option B"},
			Multiple: false,
		},
	}

	note, err := svc.CreateNote(req, "user1")
	if err != nil {
		t.Fatalf("failed to create note with poll: %v", err)
	}

	poll, err := svc.GetPollResults(note.ID, "user2")
	if err != nil {
		t.Fatalf("failed to get poll: %v", err)
	}

	if len(poll.Options) != 2 {
		t.Fatalf("expected 2 poll options, got %d", len(poll.Options))
	}

	optionID := poll.Options[0].ID

	err = svc.VoteOnPoll(note.ID, "user2", []string{optionID})
	if err != nil {
		t.Fatalf("VoteOnPoll failed: %v", err)
	}
}

func TestVoteOnExpiredPoll(t *testing.T) {
	svc, cleanup := setupNoteService(t)
	defer cleanup()

	expiresAt := time.Now().Add(-1 * time.Hour).Format(time.RFC3339)
	req := &dto.CreateNoteRequest{
		Content:    "Expired poll question",
		Visibility: "public",
		Poll: &dto.CreatePollRequest{
			Options:   []string{"Option A", "Option B"},
			Multiple:  false,
			ExpiresAt: &expiresAt,
		},
	}

	note, err := svc.CreateNote(req, "user1")
	if err != nil {
		t.Fatalf("failed to create note with poll: %v", err)
	}

	poll, err := svc.GetPollResults(note.ID, "user2")
	if err != nil {
		t.Fatalf("failed to get poll: %v", err)
	}

	if len(poll.Options) == 0 {
		t.Fatal("expected poll options")
	}

	optionID := poll.Options[0].ID

	err = svc.VoteOnPoll(note.ID, "user2", []string{optionID})
	if err == nil {
		t.Error("expected error when voting on expired poll, got nil")
	}
}

func TestGetNoteEdits(t *testing.T) {
	svc, cleanup := setupNoteService(t)
	defer cleanup()

	req := &dto.CreateNoteRequest{
		Content:    "Original content",
		Visibility: "public",
	}

	note, err := svc.CreateNote(req, "user1")
	if err != nil {
		t.Fatalf("failed to create note: %v", err)
	}

	updateReq := &dto.UpdateNoteRequest{
		Content: "Updated content",
	}

	_, err = svc.UpdateNote(note.ID, "user1", updateReq)
	if err != nil {
		t.Fatalf("UpdateNote failed: %v", err)
	}

	edits, err := svc.GetNoteEdits(note.ID)
	if err != nil {
		t.Fatalf("GetNoteEdits failed: %v", err)
	}

	if len(edits) != 1 {
		t.Fatalf("expected 1 edit history, got %d", len(edits))
	}

	if edits[0].Content != "Original content" {
		t.Errorf("expected edit content 'Original content', got '%s'", edits[0].Content)
	}
}

func TestVisibilityPrivate(t *testing.T) {
	svc, cleanup := setupNoteService(t)
	defer cleanup()

	req := &dto.CreateNoteRequest{
		Content:    "Private note",
		Visibility: "private",
	}

	note, err := svc.CreateNote(req, "user1")
	if err != nil {
		t.Fatalf("failed to create private note: %v", err)
	}

	detail, err := svc.GetNoteDetail(note.ID, "user1")
	if err != nil {
		t.Fatalf("owner should be able to view private note: %v", err)
	}

	if detail.Content != "Private note" {
		t.Errorf("expected content 'Private note', got '%s'", detail.Content)
	}

	_, err = svc.GetNoteDetail(note.ID, "user2")
	if err == nil {
		t.Error("expected error when other user views private note, got nil")
	}
}

func TestGetNoteMetrics(t *testing.T) {
	svc, cleanup := setupNoteService(t)
	defer cleanup()

	req := &dto.CreateNoteRequest{
		Content:    "Test note for metrics",
		Visibility: "public",
	}

	note, err := svc.CreateNote(req, "user1")
	if err != nil {
		t.Fatalf("failed to create note: %v", err)
	}

	metrics, err := svc.GetNoteMetrics(note.ID)
	if err != nil {
		t.Fatalf("GetNoteMetrics failed: %v", err)
	}

	if metrics.Replies != 0 {
		t.Errorf("expected 0 replies, got %d", metrics.Replies)
	}

	if metrics.Reposts != 0 {
		t.Errorf("expected 0 reposts, got %d", metrics.Reposts)
	}

	if metrics.Likes != 0 {
		t.Errorf("expected 0 likes, got %d", metrics.Likes)
	}
}

func TestListTimelinePublic(t *testing.T) {
	svc, cleanup := setupNoteService(t)
	defer cleanup()

	for i := 0; i < 5; i++ {
		req := &dto.CreateNoteRequest{
			Content:    "Public note",
			Visibility: "public",
		}
		_, err := svc.CreateNote(req, "user1")
		if err != nil {
			t.Fatalf("failed to create note %d: %v", i+1, err)
		}
	}

	req := &dto.TimelineRequest{
		Limit: 3,
	}

	notes, _, err := svc.ListTimeline("public", "user1", req)
	if err != nil {
		t.Fatalf("ListTimeline failed: %v", err)
	}

	if len(notes) > 3 {
		t.Errorf("expected at most 3 notes, got %d", len(notes))
	}
}

func TestValidateContent(t *testing.T) {
	svc, cleanup := setupNoteService(t)
	defer cleanup()

	tests := []struct {
		name    string
		content string
		wantErr bool
	}{
		{"valid content", "Hello world", false},
		{"empty content", "", true},
		{"too long content", string(make([]byte, 10001)), true},
		{"unicode content", "你好世界", false},
		{"emoji content", "Hello 🌍", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := svc.validateContent(tt.content)
			if (err != nil) != tt.wantErr {
				t.Errorf("validateContent() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestCreateNoteWithCW(t *testing.T) {
	svc, cleanup := setupNoteService(t)
	defer cleanup()

	cw := "Spoiler alert"
	req := &dto.CreateNoteRequest{
		Content:    "Hidden content behind CW",
		Visibility: "public",
		Cw:         &cw,
	}

	note, err := svc.CreateNote(req, "user1")
	if err != nil {
		t.Fatalf("CreateNote with CW failed: %v", err)
	}

	if note.Cw == nil || *note.Cw != "Spoiler alert" {
		t.Errorf("expected CW 'Spoiler alert', got '%v'", note.Cw)
	}
}

func TestUpdateNoteWithCW(t *testing.T) {
	svc, cleanup := setupNoteService(t)
	defer cleanup()

	req := &dto.CreateNoteRequest{
		Content:    "Original content",
		Visibility: "public",
	}

	note, err := svc.CreateNote(req, "user1")
	if err != nil {
		t.Fatalf("failed to create note: %v", err)
	}

	newCw := "New CW"
	updateReq := &dto.UpdateNoteRequest{
		Content: "Updated content",
		Cw:      &newCw,
	}

	updatedNote, err := svc.UpdateNote(note.ID, "user1", updateReq)
	if err != nil {
		t.Fatalf("UpdateNote failed: %v", err)
	}

	if updatedNote.Cw == nil || *updatedNote.Cw != "New CW" {
		t.Errorf("expected CW 'New CW', got '%v'", updatedNote.Cw)
	}
}

func TestSearchEngineIndexing(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "bleve_test")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tmpDir)

	searchEngine, err := search.NewBleveEngine(search.Config{
		IndexPath: tmpDir,
		IndexName: "test_notes",
	})
	if err != nil {
		t.Fatalf("failed to create search engine: %v", err)
	}
	defer searchEngine.Close()

	doc := search.NoteDoc{
		ID:       "note1",
		Content:  "Hello world from Asagity",
		Username: "testuser",
		Pinyin:   "ni hao shi jie",
		Tags:     "test,hello",
	}

	err = searchEngine.Index("note1", doc)
	if err != nil {
		t.Fatalf("failed to index document: %v", err)
	}

	result, err := searchEngine.Search("Hello", 0, 10)
	if err != nil {
		t.Fatalf("search failed: %v", err)
	}

	if result.Total != 1 {
		t.Errorf("expected 1 result, got %d", result.Total)
	}
}
