package service

import (
	"errors"
	"time"

	dto "github.com/CyaniAgent/Asagity/core/internal/module/note/dto"
	notemodel "github.com/CyaniAgent/Asagity/core/internal/module/note/model"
	noterepo "github.com/CyaniAgent/Asagity/core/internal/module/note/repository"
	usermodel "github.com/CyaniAgent/Asagity/core/internal/module/user/model"
	"github.com/CyaniAgent/Asagity/core/internal/platform/queue"
	"github.com/CyaniAgent/Asagity/core/internal/platform/search"
)

type NoteService struct {
	repo         *noterepo.NoteRepository
	queueClient  *queue.Client
	searchEngine *search.BleveEngine
}

func NewNoteService(repo *noterepo.NoteRepository) *NoteService {
	return &NoteService{repo: repo}
}

func NewNoteServiceWithDeps(repo *noterepo.NoteRepository, queueClient *queue.Client, searchEngine *search.BleveEngine) *NoteService {
	return &NoteService{
		repo:         repo,
		queueClient:  queueClient,
		searchEngine: searchEngine,
	}
}

// CreateNote creates a new note
func (s *NoteService) CreateNote(req *dto.CreateNoteRequest, userID string) (*notemodel.Note, error) {
	note := req.ToModel(userID)

	if err := s.validateContent(note.Content); err != nil {
		return nil, err
	}

	if req.Poll != nil {
		if len(req.Poll.Options) < 2 {
			return nil, errors.New("poll requires at least 2 options")
		}
		if len(req.Poll.Options) > 20 {
			return nil, errors.New("poll supports at most 20 options")
		}
	}

	if err := s.repo.Create(note); err != nil {
		return nil, err
	}

	if req.Poll != nil {
		poll := &notemodel.Poll{
			NoteID:   note.ID,
			Multiple: req.Poll.Multiple,
		}

		if req.Poll.ExpiresAt != nil {
			expiresAt, err := parseTime(*req.Poll.ExpiresAt)
			if err != nil {
				return nil, errors.New("invalid expires_at format, use RFC3339")
			}
			poll.ExpiresAt = &expiresAt
		}

		if err := s.repo.CreatePoll(poll); err != nil {
			return nil, err
		}

		for _, optText := range req.Poll.Options {
			option := &notemodel.PollOption{
				PollID: poll.ID,
				Text:   optText,
			}
			if err := s.repo.CreatePollOption(option); err != nil {
				return nil, err
			}
		}
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

	// Async: Index to search engine & Federate to Asagity NET
	go s.triggerPostCreateTasks(note)

	return note, nil
}

func (s *NoteService) triggerPostCreateTasks(note *notemodel.Note) {
	tags := search.ExtractTags(note.Content)
	tagsStr := ""
	if len(tags) > 0 {
		tagsStr = tags[0]
		for i := 1; i < len(tags) && i < 5; i++ {
			tagsStr += "," + tags[i]
		}
	}

	// Index to Bleve (async via queue)
	if s.queueClient != nil {
		s.queueClient.EnqueueIndexNote(queue.IndexNotePayload{
			NoteID:  note.ID,
			PubID:   note.PubID,
			UserID:  note.UserID,
			Content: note.Content,
			Cw:      "",
			Tags:    tagsStr,
			Lang:    "",
			Source:  "",
		})

		// Federate to Asagity NET
		s.queueClient.EnqueueFederateNote(queue.FederateNotePayload{
			NoteID:  note.ID,
			PubID:   note.PubID,
			UserID:  note.UserID,
			Content: note.Content,
			Cw:      "",
			URL:     "",
		})
	} else if s.searchEngine != nil {
		// Fallback: direct indexing if queue not available
		doc := map[string]interface{}{
			"id":         note.ID,
			"pubid":      note.PubID,
			"user_id":    note.UserID,
			"content":    note.Content,
			"visibility": string(note.Visibility),
			"created_at": note.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		}
		s.searchEngine.Index(note.ID, doc)
	}
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

	err := s.repo.SoftDelete(id)
	if err == nil {
		go s.triggerPostDeleteTasks(id)
	}
	return err
}

func (s *NoteService) triggerPostDeleteTasks(noteID string) {
	if s.queueClient != nil {
		s.queueClient.EnqueueDeleteNoteIndex(noteID)
	} else if s.searchEngine != nil {
		s.searchEngine.Delete(noteID)
	}
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
		notes, _, err := s.repo.ListPublicWithUsers(limit, req.Cursor)
		return notes, err
	case "local":
		notes, _, err := s.repo.ListLocalWithUsers(limit, req.Cursor)
		return notes, err
	case "public":
		notes, _, err := s.repo.ListPublicWithUsers(limit, req.Cursor)
		return notes, err
	default:
		notes, _, err := s.repo.ListPublicWithUsers(limit, req.Cursor)
		return notes, err
	}
}

// ListTimelineWithUsers returns timeline notes with user info
func (s *NoteService) ListTimelineWithUsers(timelineType string, req *dto.TimelineRequest) ([]dto.TimelineNoteResponse, error) {
	limit := req.Limit
	if limit <= 0 || limit > 100 {
		limit = 20
	}

	var notes []notemodel.Note
	var users []usermodel.User
	var err error

	switch timelineType {
	case "home", "public":
		notes, users, err = s.repo.ListPublicWithUsers(limit, req.Cursor)
	case "local":
		notes, users, err = s.repo.ListLocalWithUsers(limit, req.Cursor)
	default:
		notes, users, err = s.repo.ListPublicWithUsers(limit, req.Cursor)
	}

	if err != nil {
		return nil, err
	}

	userMap := make(map[string]usermodel.User)
	for _, u := range users {
		userMap[u.ID] = u
	}

	replies, _ := s.repo.CountReplies("")
	reposts, _ := s.repo.CountReposts("")
	likes, _ := s.repo.CountReactions("")

	result := make([]dto.TimelineNoteResponse, 0, len(notes))
	for _, note := range notes {
		user := userMap[note.UserID]
		result = append(result, dto.TimelineNoteResponse{
			ID:         note.ID,
			PubID:      note.PubID,
			Content:    note.Content,
			Cw:         note.Cw,
			Visibility: string(note.Visibility),
			Type:       string(note.Type),
			RootID:     note.RootID,
			ParentID:   note.ParentID,
			Source:     note.Source,
			CreatedAt:  note.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
			UpdatedAt:  note.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
			User: &dto.UserBasic{
				ID:          user.ID,
				PubID:       user.PubID,
				Username:    user.Username,
				DisplayName: user.Name,
				Avatar:      user.AvatarURL,
			},
			Metrics: dto.NoteMetrics{
				Replies: int(replies),
				Reposts: int(reposts),
				Likes:   int(likes),
			},
		})
	}

	return result, nil
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

// CreatePoll creates a poll for a note
func (s *NoteService) CreatePoll(noteID string, req *dto.CreatePollRequest) (*notemodel.Poll, error) {
	if len(req.Options) < 2 {
		return nil, errors.New(dto.ErrInvalidPoll)
	}
	if len(req.Options) > 20 {
		return nil, errors.New(dto.ErrInvalidPoll)
	}

	for _, opt := range req.Options {
		if len(opt) > 200 || len(opt) == 0 {
			return nil, errors.New(dto.ErrInvalidPoll)
		}
	}

	poll := &notemodel.Poll{
		NoteID:   noteID,
		Multiple: req.Multiple,
	}

	if req.ExpiresAt != nil {
		expiresAt, err := parseTime(*req.ExpiresAt)
		if err != nil {
			return nil, errors.New("invalid expires_at format, use RFC3339")
		}
		poll.ExpiresAt = &expiresAt
	}

	if err := s.repo.CreatePoll(poll); err != nil {
		return nil, err
	}

	for _, optText := range req.Options {
		option := &notemodel.PollOption{
			PollID: poll.ID,
			Text:   optText,
		}
		if err := s.repo.CreatePollOption(option); err != nil {
			return nil, err
		}
	}

	return poll, nil
}

// VoteOnPoll votes on a poll
func (s *NoteService) VoteOnPoll(noteID, userID string, optionIDs []string) error {
	poll, err := s.repo.GetPollByNoteID(noteID)
	if err != nil {
		return errors.New("poll not found")
	}

	if poll.ExpiresAt != nil && time.Now().After(*poll.ExpiresAt) {
		return errors.New("poll has expired")
	}

	options, err := s.repo.GetPollOptionsByPollID(poll.ID)
	if err != nil {
		return errors.New("failed to load poll options")
	}

	validOptionIDs := make(map[string]bool)
	for _, opt := range options {
		validOptionIDs[opt.ID] = true
	}

	for _, optID := range optionIDs {
		if !validOptionIDs[optID] {
			return errors.New("invalid option ID")
		}
	}

	if !poll.Multiple && len(optionIDs) > 1 {
		return errors.New("single choice poll, only one option allowed")
	}

	if len(optionIDs) == 0 {
		return errors.New("no options selected")
	}

	existingVotes, _ := s.repo.GetUserPollVotes(poll.ID, userID)
	if len(existingVotes) > 0 && !poll.Multiple {
		if err := s.repo.DeletePollVotesByUser(poll.ID, userID); err != nil {
			return err
		}
	}

	for _, optID := range optionIDs {
		vote := &notemodel.PollVote{
			PollID:   poll.ID,
			OptionID: optID,
			UserID:   userID,
		}
		if err := s.repo.CreatePollVote(vote); err != nil {
			return err
		}
	}

	return nil
}

// GetPollResults gets poll results for a note
func (s *NoteService) GetPollResults(noteID, userID string) (*dto.PollResponse, error) {
	poll, err := s.repo.GetPollByNoteID(noteID)
	if err != nil {
		return nil, errors.New("poll not found")
	}

	options, err := s.repo.GetPollOptionsByPollID(poll.ID)
	if err != nil {
		return nil, err
	}

	totalVotes, _ := s.repo.CountPollTotalVotes(poll.ID)
	votesByOption, _ := s.repo.CountPollVotesByOption(poll.ID)

	userVotes, _ := s.repo.GetUserPollVotes(poll.ID, userID)
	votedOptionIDs := make([]string, 0, len(userVotes))
	for _, v := range userVotes {
		votedOptionIDs = append(votedOptionIDs, v.OptionID)
	}

	optionResults := make([]dto.PollOptionResult, 0, len(options))
	for _, opt := range options {
		voteCount := int64(0)
		if count, ok := votesByOption[opt.ID]; ok {
			voteCount = count
		}

		percent := 0.0
		if totalVotes > 0 {
			percent = float64(voteCount) / float64(totalVotes) * 100
			percent = float64(int(percent*100)) / 100
		}

		optionResults = append(optionResults, dto.PollOptionResult{
			ID:      opt.ID,
			Text:    opt.Text,
			Votes:   int(voteCount),
			Percent: percent,
		})
	}

	var expiresAtStr *string
	if poll.ExpiresAt != nil {
		s := poll.ExpiresAt.Format(time.RFC3339)
		expiresAtStr = &s
	}

	return &dto.PollResponse{
		Multiple:   poll.Multiple,
		ExpiresAt:  expiresAtStr,
		Options:    optionResults,
		Voted:      votedOptionIDs,
		TotalVotes: int(totalVotes),
	}, nil
}

func parseTime(s string) (time.Time, error) {
	return time.Parse(time.RFC3339, s)
}
