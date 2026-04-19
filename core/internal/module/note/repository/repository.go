package repository

import (
	"errors"
	"strings"

	notemodel "github.com/CyaniAgent/Asagity/core/internal/module/note/model"
	usermodel "github.com/CyaniAgent/Asagity/core/internal/module/user/model"
	"gorm.io/gorm"
)

type NoteRepository struct {
	db *gorm.DB
}

func NewNoteRepository(db *gorm.DB) *NoteRepository {
	return &NoteRepository{db: db}
}

func (r *NoteRepository) Create(note *notemodel.Note) error {
	return r.db.Create(note).Error
}

func (r *NoteRepository) GetByID(id string) (*notemodel.Note, error) {
	var note notemodel.Note
	err := r.db.Where("id = ?", id).First(&note).Error
	if err != nil {
		return nil, err
	}
	return &note, nil
}

func (r *NoteRepository) GetByPubID(pubid string) (*notemodel.Note, error) {
	var note notemodel.Note
	err := r.db.Where("pub_id = ?", pubid).First(&note).Error
	if err != nil {
		return nil, err
	}
	return &note, nil
}

func (r *NoteRepository) Update(note *notemodel.Note) error {
	return r.db.Save(note).Error
}

func (r *NoteRepository) SoftDelete(id string) error {
	return r.db.Model(&notemodel.Note{}).
		Where("id = ?", id).
		Update("is_deleted", true).Error
}

// applyCursorPagination applies cursor-based pagination using created_at + id composite
func (r *NoteRepository) applyCursorPagination(query *gorm.DB, cursor string) *gorm.DB {
	if cursor == "" {
		return query
	}

	// Cursor format: "timestamp_id" (e.g., "2024-01-15T10:30:00Z_abc123")
	parts := strings.SplitN(cursor, "_", 2)
	if len(parts) == 2 {
		createdAt := parts[0]
		id := parts[1]
		// Composite cursor: (created_at < cursor_time) OR (created_at = cursor_time AND id < cursor_id)
		query = query.Where("(created_at < ? OR (created_at = ? AND id < ?))", createdAt, createdAt, id)
	} else {
		// Fallback to old format (just id)
		query = query.Where("id < ?", cursor)
	}

	return query
}

func (r *NoteRepository) ListByUser(userID string, limit int, cursor string) ([]notemodel.Note, error) {
	var notes []notemodel.Note
	query := r.db.Where("user_id = ? AND is_deleted = false", userID).
		Order("created_at DESC, id DESC")

	query = r.applyCursorPagination(query, cursor)

	err := query.Limit(limit + 1).Find(&notes).Error
	return notes, err
}

func (r *NoteRepository) ListPublic(limit int, cursor string) ([]notemodel.Note, error) {
	var notes []notemodel.Note
	query := r.db.Where("visibility IN ? AND is_deleted = false",
		[]string{"public", "unlisted"}).
		Order("created_at DESC, id DESC")

	query = r.applyCursorPagination(query, cursor)

	err := query.Limit(limit + 1).Find(&notes).Error
	return notes, err
}

func (r *NoteRepository) ListPublicWithUsers(limit int, cursor string) ([]notemodel.Note, []usermodel.User, error) {
	var notes []notemodel.Note
	query := r.db.Where("visibility IN ? AND is_deleted = false",
		[]string{"public", "unlisted"}).
		Order("created_at DESC, id DESC")

	query = r.applyCursorPagination(query, cursor)

	err := query.Limit(limit + 1).Find(&notes).Error
	if err != nil || len(notes) == 0 {
		return notes, nil, err
	}

	userIDs := make([]string, 0, len(notes))
	for _, note := range notes {
		userIDs = append(userIDs, note.UserID)
	}

	var users []usermodel.User
	if len(userIDs) > 0 {
		r.db.Where("id IN ?", userIDs).Find(&users)
	}

	return notes, users, nil
}

func (r *NoteRepository) ListLocal(limit int, cursor string) ([]notemodel.Note, error) {
	var notes []notemodel.Note
	query := r.db.Where("visibility IN ? AND is_deleted = false AND source IS NULL",
		[]string{"public", "unlisted"}).
		Order("created_at DESC, id DESC")

	query = r.applyCursorPagination(query, cursor)

	err := query.Limit(limit + 1).Find(&notes).Error
	return notes, err
}

func (r *NoteRepository) ListLocalWithUsers(limit int, cursor string) ([]notemodel.Note, []usermodel.User, error) {
	var notes []notemodel.Note
	query := r.db.Where("visibility IN ? AND is_deleted = false AND source IS NULL",
		[]string{"public", "unlisted"}).
		Order("created_at DESC, id DESC")

	query = r.applyCursorPagination(query, cursor)

	err := query.Limit(limit + 1).Find(&notes).Error
	if err != nil || len(notes) == 0 {
		return notes, nil, err
	}

	userIDs := make([]string, 0, len(notes))
	for _, note := range notes {
		userIDs = append(userIDs, note.UserID)
	}

	var users []usermodel.User
	if len(userIDs) > 0 {
		r.db.Where("id IN ?", userIDs).Find(&users)
	}

	return notes, users, nil
}

func (r *NoteRepository) ListByUserIDs(userIDs []string, limit int, cursor string) ([]notemodel.Note, []usermodel.User, error) {
	var notes []notemodel.Note
	query := r.db.Where("user_id IN ? AND is_deleted = false", userIDs).
		Order("created_at DESC, id DESC")

	query = r.applyCursorPagination(query, cursor)

	err := query.Limit(limit + 1).Find(&notes).Error
	if err != nil || len(notes) == 0 {
		return notes, nil, err
	}

	userMap := make(map[string]bool)
	for _, note := range notes {
		userMap[note.UserID] = true
	}

	resultUserIDs := make([]string, 0, len(userMap))
	for id := range userMap {
		resultUserIDs = append(resultUserIDs, id)
	}

	var users []usermodel.User
	if len(resultUserIDs) > 0 {
		r.db.Where("id IN ?", resultUserIDs).Find(&users)
	}

	return notes, users, nil
}

func (r *NoteRepository) CountByUser(userID string) (int64, error) {
	var count int64
	err := r.db.Model(&notemodel.Note{}).
		Where("user_id = ? AND is_deleted = false", userID).
		Count(&count).Error
	return count, err
}

func (r *NoteRepository) CountReplies(noteID string) (int64, error) {
	var count int64
	err := r.db.Model(&notemodel.Note{}).
		Where("root_id = ? AND is_deleted = false", noteID).
		Count(&count).Error
	return count, err
}

func (r *NoteRepository) CountReposts(noteID string) (int64, error) {
	var count int64
	err := r.db.Model(&notemodel.Note{}).
		Where("root_id = ? AND type IN ? AND is_deleted = false",
			noteID, []string{"repost", "quote"}).
		Count(&count).Error
	return count, err
}

func (r *NoteRepository) Search(query string, limit int, cursor string) ([]notemodel.Note, error) {
	var notes []notemodel.Note
	q := r.db.Where("content ILIKE ? AND visibility IN ? AND is_deleted = false",
		"%"+query+"%", []string{"public", "unlisted"}).
		Order("created_at DESC, id DESC")

	q = r.applyCursorPagination(q, cursor)

	err := q.Limit(limit + 1).Find(&notes).Error
	return notes, err
}

// Reactions
func (r *NoteRepository) AddReaction(reaction *notemodel.NoteReaction) error {
	return r.db.Create(reaction).Error
}

func (r *NoteRepository) RemoveReaction(noteID, userID, emoji string) error {
	return r.db.Where("note_id = ? AND user_id = ? AND emoji = ?", noteID, userID, emoji).
		Delete(&notemodel.NoteReaction{}).Error
}

func (r *NoteRepository) GetReactions(noteID string) ([]notemodel.NoteReaction, error) {
	var reactions []notemodel.NoteReaction
	err := r.db.Where("note_id = ?", noteID).Find(&reactions).Error
	return reactions, err
}

func (r *NoteRepository) CountReactions(noteID string) (int64, error) {
	var count int64
	err := r.db.Model(&notemodel.NoteReaction{}).
		Where("note_id = ?", noteID).
		Count(&count).Error
	return count, err
}

func (r *NoteRepository) GetUserReaction(noteID, userID string) (*notemodel.NoteReaction, error) {
	var reaction notemodel.NoteReaction
	err := r.db.Where("note_id = ? AND user_id = ?", noteID, userID).First(&reaction).Error
	if err != nil {
		return nil, err
	}
	return &reaction, nil
}

// Media
func (r *NoteRepository) AddMedia(media *notemodel.NoteMedia) error {
	return r.db.Create(media).Error
}

func (r *NoteRepository) GetMedia(noteID string) ([]notemodel.NoteMedia, error) {
	var media []notemodel.NoteMedia
	err := r.db.Where("note_id = ?", noteID).Order("position").Find(&media).Error
	return media, err
}

func (r *NoteRepository) DeleteMedia(noteID string) error {
	return r.db.Where("note_id = ?", noteID).Delete(&notemodel.NoteMedia{}).Error
}

// Poll
func (r *NoteRepository) CreatePoll(poll *notemodel.Poll) error {
	return r.db.Create(poll).Error
}

func (r *NoteRepository) CreatePollOption(option *notemodel.PollOption) error {
	return r.db.Create(option).Error
}

func (r *NoteRepository) GetPollByNoteID(noteID string) (*notemodel.Poll, error) {
	var poll notemodel.Poll
	err := r.db.Where("note_id = ?", noteID).First(&poll).Error
	if err != nil {
		return nil, err
	}
	return &poll, nil
}

func (r *NoteRepository) GetPollOptionsByPollID(pollID string) ([]notemodel.PollOption, error) {
	var options []notemodel.PollOption
	err := r.db.Where("poll_id = ?", pollID).Order("created_at ASC").Find(&options).Error
	return options, err
}

func (r *NoteRepository) CreatePollVote(vote *notemodel.PollVote) error {
	return r.db.Create(vote).Error
}

func (r *NoteRepository) DeletePollVotesByUser(pollID, userID string) error {
	return r.db.Where("poll_id = ? AND user_id = ?", pollID, userID).Delete(&notemodel.PollVote{}).Error
}

func (r *NoteRepository) GetUserPollVotes(pollID, userID string) ([]notemodel.PollVote, error) {
	var votes []notemodel.PollVote
	err := r.db.Where("poll_id = ? AND user_id = ?", pollID, userID).Find(&votes).Error
	return votes, err
}

func (r *NoteRepository) CountPollVotesByOption(pollID string) (map[string]int64, error) {
	type Result struct {
		OptionID string
		Count    int64
	}
	var results []Result
	err := r.db.Model(&notemodel.PollVote{}).
		Select("option_id, count(*) as count").
		Where("poll_id = ?", pollID).
		Group("option_id").
		Find(&results).Error
	if err != nil {
		return nil, err
	}

	countMap := make(map[string]int64)
	for _, r := range results {
		countMap[r.OptionID] = r.Count
	}
	return countMap, nil
}

func (r *NoteRepository) CountPollTotalVotes(pollID string) (int64, error) {
	var count int64
	err := r.db.Model(&notemodel.PollVote{}).Where("poll_id = ?", pollID).Count(&count).Error
	return count, err
}

// Edit History
func (r *NoteRepository) CreateEdit(edit *notemodel.NoteEdit) error {
	return r.db.Create(edit).Error
}

func (r *NoteRepository) GetEdits(noteID string) ([]notemodel.NoteEdit, error) {
	var edits []notemodel.NoteEdit
	err := r.db.Where("note_id = ?", noteID).Order("created_at DESC").Find(&edits).Error
	return edits, err
}

// Helper
func (r *NoteRepository) IsOwner(noteID, userID string) bool {
	var count int64
	r.db.Model(&notemodel.Note{}).Where("id = ? AND user_id = ?", noteID, userID).Count(&count)
	return count > 0
}

func (r *NoteRepository) GetUserByID(userID string) (*usermodel.User, error) {
	var user usermodel.User
	err := r.db.Where("id = ?", userID).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// AutoMigrate runs auto migration for all Note models
func (r *NoteRepository) AutoMigrate() error {
	return r.db.AutoMigrate(
		&notemodel.Note{},
		&notemodel.NoteEdit{},
		&notemodel.NoteReaction{},
		&notemodel.NoteMedia{},
		&notemodel.Poll{},
		&notemodel.PollOption{},
		&notemodel.PollVote{},
	)
}

// CreateNoteWithReply creates a note and sets root ID in a single transaction
func (r *NoteRepository) CreateNoteWithReply(note *notemodel.Note, poll *notemodel.Poll, pollOptions []*notemodel.PollOption, mediaList []*notemodel.NoteMedia, parentID *string) error {
	if parentID == nil || *parentID == "" {
		return r.createNoteWithExtras(note, poll, pollOptions, mediaList)
	}

	return r.db.Transaction(func(tx *gorm.DB) error {
		var parentNote notemodel.Note
		if err := tx.Set("gorm:query_option", "FOR UPDATE").Where("id = ?", *parentID).First(&parentNote).Error; err != nil {
			return errors.New("parent note not found")
		}

		if parentNote.IsDeleted {
			return errors.New("parent note is deleted")
		}

		rootID := parentNote.RootID
		if rootID == nil {
			rootID = parentID
		}
		note.RootID = rootID
		note.ParentID = parentID

		if err := tx.Create(note).Error; err != nil {
			return err
		}

		if poll != nil {
			poll.NoteID = note.ID
			if err := tx.Create(poll).Error; err != nil {
				return err
			}

			for _, opt := range pollOptions {
				opt.PollID = poll.ID
				if err := tx.Create(opt).Error; err != nil {
					return err
				}
			}
		}

		for _, m := range mediaList {
			m.NoteID = note.ID
			if err := tx.Create(m).Error; err != nil {
				return err
			}
		}

		return nil
	})
}

func (r *NoteRepository) createNoteWithExtras(note *notemodel.Note, poll *notemodel.Poll, pollOptions []*notemodel.PollOption, mediaList []*notemodel.NoteMedia) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(note).Error; err != nil {
			return err
		}

		if poll != nil {
			poll.NoteID = note.ID
			if err := tx.Create(poll).Error; err != nil {
				return err
			}

			for _, opt := range pollOptions {
				opt.PollID = poll.ID
				if err := tx.Create(opt).Error; err != nil {
					return err
				}
			}
		}

		for _, m := range mediaList {
			m.NoteID = note.ID
			if err := tx.Create(m).Error; err != nil {
				return err
			}
		}

		return nil
	})
}

// GenerateCursor generates a cursor string from a note
func GenerateCursor(note *notemodel.Note) string {
	return note.CreatedAt.Format("2006-01-02T15:04:05Z") + "_" + note.ID
}

// GenerateNextCursor generates the next cursor from a list of notes
func GenerateNextCursor(notes []notemodel.Note, limit int) *string {
	if len(notes) <= limit {
		return nil
	}
	lastNote := notes[limit]
	cursor := GenerateCursor(&lastNote)
	return &cursor
}
