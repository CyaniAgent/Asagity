package service

import (
	"errors"

	dto "github.com/CyaniAgent/Asagity/core/internal/module/note/dto"
	notemodel "github.com/CyaniAgent/Asagity/core/internal/module/note/model"
	noterepo "github.com/CyaniAgent/Asagity/core/internal/module/note/repository"
)

type NoteService struct {
	repo *noterepo.NoteRepository
}

func NewNoteService(repo *noterepo.NoteRepository) *NoteService {
	return &NoteService{repo: repo}
}

// CreateNote creates a new note
func (s *NoteService) CreateNote(req *dto.CreateNoteRequest, userID string) (*notemodel.Note, error) {
	note := req.ToModel(userID)

	if err := s.validateContent(note.Content); err != nil {
		return nil, err
	}

	if err := s.repo.Create(note); err != nil {
		return nil, err
	}

	// Handle media attachments
	for i, mediaID := range req.MediaIDs {
		media := &notemodel.NoteMedia{
			NoteID:   note.ID,
			FileID:   mediaID,
			Type:     "image",
			Position: i,
		}
		s.repo.AddMedia(media)
	}

	// Handle reply chain
	if req.ParentID != nil && *req.ParentID != "" {
		parentNote, err := s.repo.GetByID(*req.ParentID)
		if err == nil {
			note.RootID = parentNote.RootID
			if note.RootID == nil {
				note.RootID = req.ParentID
			}
			s.repo.Update(note)
		}
	}

	return note, nil
}

// GetNoteByID gets a note by ID
func (s *NoteService) GetNoteByID(id string) (*notemodel.Note, error) {
	note, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}

	if note.IsDeleted {
		return nil, errors.New(dto.ErrNoteDeleted)
	}

	return note, nil
}

// UpdateNote updates a note
func (s *NoteService) UpdateNote(id string, req *dto.UpdateNoteRequest, userID string) (*notemodel.Note, error) {
	if !s.repo.IsOwner(id, userID) {
		return nil, errors.New(dto.ErrNoteForbidden)
	}

	note, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}

	if err := s.validateContent(req.Content); err != nil {
		return nil, err
	}

	// Save edit history
	edit := &notemodel.NoteEdit{
		NoteID:  note.ID,
		Content: note.Content,
		Cw:      note.Cw,
	}
	s.repo.CreateEdit(edit)

	// Update note
	note.Content = req.Content
	note.Cw = req.Cw

	if err := s.repo.Update(note); err != nil {
		return nil, err
	}

	return note, nil
}

// DeleteNote soft deletes a note
func (s *NoteService) DeleteNote(id string, userID string) error {
	if !s.repo.IsOwner(id, userID) {
		return errors.New(dto.ErrNoteForbidden)
	}

	return s.repo.SoftDelete(id)
}

// ListTimeline returns notes for timeline
func (s *NoteService) ListTimeline(timelineType string, userID string, req *dto.TimelineRequest) ([]notemodel.Note, error) {
	limit := req.Limit
	if limit <= 0 || limit > 100 {
		limit = 20
	}

	switch timelineType {
	case "home":
		// For home timeline, we need followed users - placeholder for now
		return s.repo.ListPublic(limit, req.Cursor)
	case "local":
		return s.repo.ListLocal(limit, req.Cursor)
	case "public":
		return s.repo.ListPublic(limit, req.Cursor)
	default:
		return s.repo.ListPublic(limit, req.Cursor)
	}
}

// AddReaction adds a reaction to a note
func (s *NoteService) AddReaction(noteID, userID, emoji string) error {
	// Check if already reacted
	existing, _ := s.repo.GetUserReaction(noteID, userID)
	if existing != nil {
		return nil // Already reacted
	}

	reaction := &notemodel.NoteReaction{
		NoteID: noteID,
		UserID: userID,
		Emoji:  emoji,
	}

	return s.repo.AddReaction(reaction)
}

// RemoveReaction removes a reaction
func (s *NoteService) RemoveReaction(noteID, userID, emoji string) error {
	return s.repo.RemoveReaction(noteID, userID, emoji)
}

// GetReactions gets all reactions for a note
func (s *NoteService) GetReactions(noteID string) ([]notemodel.NoteReaction, error) {
	return s.repo.GetReactions(noteID)
}

// SearchNotes searches notes
func (s *NoteService) SearchNotes(req *dto.NoteSearchRequest) ([]notemodel.Note, error) {
	limit := req.Limit
	if limit <= 0 || limit > 100 {
		limit = 20
	}

	return s.repo.Search(req.Query, limit, req.Cursor)
}

// GetNoteMetrics gets metrics for a note
func (s *NoteService) GetNoteMetrics(noteID string) (*dto.NoteMetrics, error) {
	replies, _ := s.repo.CountReplies(noteID)
	reposts, _ := s.repo.CountReposts(noteID)
	likes, _ := s.repo.CountReactions(noteID)

	return &dto.NoteMetrics{
		Replies: int(replies),
		Reposts: int(reposts),
		Likes:   int(likes),
	}, nil
}

// Validate content
func (s *NoteService) validateContent(content string) error {
	if content == "" {
		return errors.New(dto.ErrInvalidContent)
	}
	if len(content) > 10000 {
		return errors.New(dto.ErrInvalidContent)
	}
	return nil
}
