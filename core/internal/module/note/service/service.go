package service

import (
	"context"
	"encoding/json"
	"errors"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"

	followrepo "github.com/CyaniAgent/Asagity/core/internal/module/follow/repository"
	dto "github.com/CyaniAgent/Asagity/core/internal/module/note/dto"
	notemodel "github.com/CyaniAgent/Asagity/core/internal/module/note/model"
	"github.com/CyaniAgent/Asagity/core/internal/module/note/repository"
	noterepo "github.com/CyaniAgent/Asagity/core/internal/module/note/repository"
	usermodel "github.com/CyaniAgent/Asagity/core/internal/module/user/model"
	"github.com/CyaniAgent/Asagity/core/internal/platform/queue"
	"github.com/CyaniAgent/Asagity/core/internal/platform/search"
)

type NoteService struct {
	repo         *noterepo.NoteRepository
	followRepo   *followrepo.FollowRepository
	queueClient  *queue.Client
	searchEngine *search.BleveEngine
	redis        *redis.Client
}

func NewNoteService(repo *noterepo.NoteRepository) *NoteService {
	return &NoteService{repo: repo}
}

func NewNoteServiceWithDeps(repo *noterepo.NoteRepository, followRepo *followrepo.FollowRepository, queueClient *queue.Client, searchEngine *search.BleveEngine, redis *redis.Client) *NoteService {
	return &NoteService{
		repo:         repo,
		followRepo:   followRepo,
		queueClient:  queueClient,
		searchEngine: searchEngine,
		redis:        redis,
	}
}

// CreateNote creates a new note with full transaction support
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

	// Build poll and options if exists
	var poll *notemodel.Poll
	var pollOptions []*notemodel.PollOption

	if req.Poll != nil {
		poll = &notemodel.Poll{
			Multiple: req.Poll.Multiple,
		}

		if req.Poll.ExpiresAt != nil {
			expiresAt, err := parseTime(*req.Poll.ExpiresAt)
			if err != nil {
				return nil, errors.New("invalid expires_at format, use RFC3339")
			}
			poll.ExpiresAt = &expiresAt
		}

		for _, optText := range req.Poll.Options {
			pollOptions = append(pollOptions, &notemodel.PollOption{
				Text: optText,
			})
		}
	}

	// Build media list
	mediaList := make([]*notemodel.NoteMedia, 0, len(req.MediaIDs))
	for i, mediaID := range req.MediaIDs {
		mediaList = append(mediaList, &notemodel.NoteMedia{
			FileID:   mediaID,
			Type:     "image",
			Position: i,
		})
	}

	// Create with transaction (handles reply chain properly with parent validation)
	if err := s.repo.CreateNoteWithReply(note, poll, pollOptions, mediaList, req.ParentID); err != nil {
		return nil, err
	}

	// Async: Index to search engine & Federate to Asagity NET
	go s.triggerPostCreateTasks(note)

	// Index to search engine synchronously
	if s.searchEngine != nil {
		user, err := s.getUserByID(userID)
		if err == nil {
			pinyinContent := search.TextToPinyin(note.Content)
			doc := search.NoteDoc{
				ID:         note.ID,
				PubID:      note.PubID,
				UserID:     note.UserID,
				Username:   user.Username,
				Content:    note.Content,
				Cw:         "",
				Tags:       strings.Join(search.ExtractTags(note.Content), ","),
				Language:   "zh",
				CreatedAt:  note.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
				Visibility: string(note.Visibility),
				Pinyin:     pinyinContent,
			}
			if note.Cw != nil {
				doc.Cw = *note.Cw
			}
			_ = s.searchEngine.Index(note.ID, doc)
		}
	}

	return note, nil
}

func (s *NoteService) triggerPostCreateTasks(_ *notemodel.Note) {
	// TODO: Use Queue for federation
	if s.queueClient != nil {
		// queue.Enqueue(...)
	}
}

// UpdateNote updates a note's content
func (s *NoteService) UpdateNote(id, userID string, req *dto.UpdateNoteRequest) (*notemodel.Note, error) {
	note, err := s.repo.GetByID(id)
	if err != nil {
		return nil, errors.New(dto.ErrNoteNotFound)
	}

	if note.UserID != userID {
		return nil, errors.New(dto.ErrNoteForbidden)
	}

	if note.IsDeleted {
		return nil, errors.New(dto.ErrNoteDeleted)
	}

	// Save edit history
	if req.Content != "" && req.Content != note.Content {
		edit := &notemodel.NoteEdit{
			NoteID:  note.ID,
			Content: note.Content,
			Cw:      note.Cw,
		}
		s.repo.CreateEdit(edit)
	}

	// Apply updates
	if req.Content != "" {
		if err := s.validateContent(req.Content); err != nil {
			return nil, err
		}
		note.Content = req.Content
	}
	if req.Cw != nil {
		note.Cw = req.Cw
	}
	note.UpdatedAt = time.Now()

	if err := s.repo.Update(note); err != nil {
		return nil, err
	}

	return note, nil
}

// DeleteNote soft-deletes a note
func (s *NoteService) DeleteNote(id, userID string) error {
	note, err := s.repo.GetByID(id)
	if err != nil {
		return errors.New(dto.ErrNoteNotFound)
	}

	if note.UserID != userID {
		return errors.New(dto.ErrNoteForbidden)
	}

	if note.IsDeleted {
		return errors.New(dto.ErrNoteDeleted)
	}

	return s.repo.SoftDelete(id)
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

// GetNoteDetail gets a complete note with all related data
func (s *NoteService) GetNoteDetail(id string, currentUserID string) (*dto.NoteResponse, error) {
	note, err := s.repo.GetByID(id)
	if err != nil {
		return nil, errors.New(dto.ErrNoteNotFound)
	}

	if note.IsDeleted {
		return nil, errors.New(dto.ErrNoteDeleted)
	}

	// Check visibility permissions
	if !s.canViewNote(note, currentUserID) {
		return nil, errors.New(dto.ErrNoteForbidden)
	}

	// Get user info
	user, err := s.getUserByID(note.UserID)
	if err != nil {
		user = nil
	}

	// Get media attachments
	mediaList, _ := s.repo.GetMedia(id)
	mediaResponses := make([]dto.MediaResponse, 0, len(mediaList))
	for _, m := range mediaList {
		mediaResponses = append(mediaResponses, dto.MediaResponse{
			ID:        m.ID,
			Type:      m.Type,
			URL:       m.FileID,
			Alt:       m.Alt,
			Sensitive: m.IsSensitive,
		})
	}

	// Get poll if exists
	var pollResponse *dto.PollResponse
	_, err = s.repo.GetPollByNoteID(id)
	if err == nil {
		pollResponse, _ = s.GetPollResults(id, currentUserID)
	}

	// Get reactions
	reactions, _ := s.repo.GetReactions(id)
	reactionSummary := s.buildReactionSummary(reactions)

	// Get metrics (with Redis cache)
	metrics := s.getNoteMetricsWithCache(id)

	// Get edit history
	edits, _ := s.repo.GetEdits(id)
	var editedAt *string
	if len(edits) > 0 {
		lastEdit := edits[0].CreatedAt.Format("2006-01-02T15:04:05Z07:00")
		editedAt = &lastEdit
	}

	// Get reply and repost counts
	replyCount, _ := s.repo.CountReplies(id)
	repostCount, _ := s.repo.CountReposts(id)

	return &dto.NoteResponse{
		ID:          note.ID,
		PubID:       note.PubID,
		User:        user,
		Content:     note.Content,
		Cw:          note.Cw,
		Visibility:  string(note.Visibility),
		Type:        string(note.Type),
		RootID:      note.RootID,
		ParentID:    note.ParentID,
		Media:       mediaResponses,
		Poll:        pollResponse,
		Reactions:   reactionSummary,
		Metrics:     metrics,
		CreatedAt:   note.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		EditedAt:    editedAt,
		ReplyCount:  int(replyCount),
		RepostCount: int(repostCount),
	}, nil
}

// IsOwner checks if the user owns the note
func (s *NoteService) IsOwner(noteID, userID string) bool {
	return s.repo.IsOwner(noteID, userID)
}

// CanViewNote checks if the user can view the note based on visibility
func (s *NoteService) CanViewNote(note *notemodel.Note, currentUserID string) bool {
	return s.canViewNote(note, currentUserID)
}

// GetNoteEdits gets the edit history of a note
func (s *NoteService) GetNoteEdits(noteID string) ([]dto.NoteEditResponse, error) {
	edits, err := s.repo.GetEdits(noteID)
	if err != nil {
		return nil, err
	}

	responses := make([]dto.NoteEditResponse, 0, len(edits))
	for _, e := range edits {
		cwStr := ""
		if e.Cw != nil {
			cwStr = *e.Cw
		}
		responses = append(responses, dto.NoteEditResponse{
			ID:        e.ID,
			Content:   e.Content,
			Cw:        cwStr,
			CreatedAt: e.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		})
	}

	return responses, nil
}

func (s *NoteService) canViewNote(note *notemodel.Note, currentUserID string) bool {
	switch note.Visibility {
	case notemodel.NoteVisibilityPublic, notemodel.NoteVisibilityUnlisted:
		return true
	case notemodel.NoteVisibilityPrivate:
		return currentUserID == note.UserID
	case notemodel.NoteVisibilityDirect:
		return currentUserID == note.UserID
	default:
		return false
	}
}

func (s *NoteService) getUserByID(userID string) (*dto.UserBasic, error) {
	user, err := s.repo.GetUserByID(userID)
	if err != nil {
		return nil, err
	}

	return &dto.UserBasic{
		ID:          user.ID,
		PubID:       user.PubID,
		Username:    user.Username,
		DisplayName: user.Name,
		Avatar:      user.AvatarURL,
	}, nil
}

func (s *NoteService) buildReactionSummary(reactions []notemodel.NoteReaction) []dto.ReactionSummary {
	reactionMap := make(map[string]*dto.ReactionSummary)

	for _, r := range reactions {
		if _, ok := reactionMap[r.Emoji]; !ok {
			reactionMap[r.Emoji] = &dto.ReactionSummary{
				Emoji: r.Emoji,
				Count: 0,
				Users: make([]string, 0),
			}
		}
		reactionMap[r.Emoji].Count++
		if len(reactionMap[r.Emoji].Users) < 5 {
			reactionMap[r.Emoji].Users = append(reactionMap[r.Emoji].Users, r.UserID)
		}
	}

	result := make([]dto.ReactionSummary, 0, len(reactionMap))
	for _, summary := range reactionMap {
		result = append(result, *summary)
	}

	return result
}

func (s *NoteService) getNoteMetricsWithCache(noteID string) dto.NoteMetrics {
	cacheKey := "note:metrics:" + noteID
	ctx := context.Background()

	// Try Redis cache first
	if s.redis != nil {
		cached, err := s.redis.Get(ctx, cacheKey).Result()
		if err == nil && cached != "" {
			var metrics dto.NoteMetrics
			if err := json.Unmarshal([]byte(cached), &metrics); err == nil {
				return metrics
			}
		}
	}

	// Fallback to database
	metrics, _ := s.GetNoteMetrics(noteID)
	if metrics == nil {
		return dto.NoteMetrics{}
	}

	// Cache to Redis for 5 minutes
	if s.redis != nil {
		metricsJSON, _ := json.Marshal(*metrics)
		_ = s.redis.Set(ctx, cacheKey, metricsJSON, 5*time.Minute).Err()
	}

	return *metrics
}

// ListTimeline returns notes for timeline
func (s *NoteService) ListTimeline(timelineType string, userID string, req *dto.TimelineRequest) ([]notemodel.Note, []usermodel.User, error) {
	limit := req.Limit
	if limit <= 0 || limit > 100 {
		limit = 20
	}

	var notes []notemodel.Note
	var users []usermodel.User
	var err error

	switch timelineType {
	case "home":
		if s.followRepo == nil {
			notes, users, err = s.repo.ListPublicWithUsers(limit, req.Cursor)
		} else {
			var userIDs []string
			userIDs, err = s.followRepo.GetFollowingUserIDs(userID)
			if err != nil {
				return nil, nil, err
			}
			notes, users, err = s.repo.ListByUserIDs(userIDs, limit, req.Cursor)
		}
	case "local":
		notes, users, err = s.repo.ListLocalWithUsers(limit, req.Cursor)
	case "public":
		notes, users, err = s.repo.ListPublicWithUsers(limit, req.Cursor)
	default:
		notes, users, err = s.repo.ListPublicWithUsers(limit, req.Cursor)
	}

	if err != nil {
		return nil, nil, err
	}

	if len(notes) > limit {
		notes = notes[:limit]
	}

	return notes, users, nil
}

// ListTimelineRaw returns raw notes with one extra for cursor generation
func (s *NoteService) ListTimelineRaw(timelineType string, userID string, req *dto.TimelineRequest) ([]notemodel.Note, []usermodel.User, error) {
	limit := req.Limit + 1
	if limit <= 0 || limit > 101 {
		limit = 21
	}

	switch timelineType {
	case "home":
		if s.followRepo == nil {
			return s.repo.ListPublicWithUsers(limit, req.Cursor)
		}
		userIDs, err := s.followRepo.GetFollowingUserIDs(userID)
		if err != nil {
			return nil, nil, err
		}
		return s.repo.ListByUserIDs(userIDs, limit, req.Cursor)
	case "local":
		return s.repo.ListLocalWithUsers(limit, req.Cursor)
	case "public":
		return s.repo.ListPublicWithUsers(limit, req.Cursor)
	default:
		return s.repo.ListPublicWithUsers(limit, req.Cursor)
	}
}

func (s *NoteService) buildTimelineResponse(notes []notemodel.Note, users []usermodel.User) ([]dto.TimelineNoteResponse, error) {
	userMap := make(map[string]usermodel.User)
	for _, u := range users {
		userMap[u.ID] = u
	}

	result := make([]dto.TimelineNoteResponse, 0, len(notes))
	for _, note := range notes {
		user := userMap[note.UserID]
		replies, _ := s.repo.CountReplies(note.ID)
		reposts, _ := s.repo.CountReposts(note.ID)
		likes, _ := s.repo.CountReactions(note.ID)

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

// ListTimelineWithUsers returns timeline notes with user info and next cursor
func (s *NoteService) ListTimelineWithUsers(timelineType string, userID string, req *dto.TimelineRequest) ([]dto.TimelineNoteResponse, *string, error) {
	rawNotes, users, err := s.ListTimelineRaw(timelineType, userID, req)
	if err != nil {
		return nil, nil, err
	}

	// Trim to limit and generate next cursor
	hasMore := len(rawNotes) > req.Limit
	var notes []notemodel.Note
	if hasMore {
		notes = rawNotes[:req.Limit]
	} else {
		notes = rawNotes
	}

	var nextCursor *string
	if hasMore && len(notes) > 0 {
		cursor := repository.GenerateCursor(&notes[len(notes)-1])
		nextCursor = &cursor
	}

	responses, _ := s.buildTimelineResponse(notes, users)
	return responses, nextCursor, nil
}

// AddReaction adds a reaction to a note
func (s *NoteService) AddReaction(noteID, userID, emoji string) error {
	note, err := s.repo.GetByID(noteID)
	if err != nil {
		return errors.New(dto.ErrNoteNotFound)
	}

	if note.IsDeleted {
		return errors.New(dto.ErrNoteDeleted)
	}

	existing, _ := s.repo.GetUserReaction(noteID, userID)
	if existing != nil {
		return nil
	}

	reaction := &notemodel.NoteReaction{
		NoteID: noteID,
		UserID: userID,
		Emoji:  emoji,
	}

	return s.repo.AddReaction(reaction)
}

// RemoveReaction removes a reaction from a note
func (s *NoteService) RemoveReaction(noteID, userID, emoji string) error {
	return s.repo.RemoveReaction(noteID, userID, emoji)
}

// GetSearchEngine returns the search engine instance
func (s *NoteService) GetSearchEngine() *search.BleveEngine {
	return s.searchEngine
}

// SearchNotes searches for notes
func (s *NoteService) SearchNotes(req *dto.NoteSearchRequest) ([]notemodel.Note, error) {
	limit := req.Limit
	if limit <= 0 || limit > 50 {
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
