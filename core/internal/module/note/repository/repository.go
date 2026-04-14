package repository

import (
	"time"

	notemodel "github.com/CyaniAgent/Asagity/core/internal/module/note/model"
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
		Update("is_deleted", true).
		Update("deleted_at", time.Now()).Error
}

func (r *NoteRepository) ListByUser(userID string, limit int, cursor string) ([]notemodel.Note, error) {
	var notes []notemodel.Note
	query := r.db.Where("user_id = ? AND is_deleted = false", userID).
		Order("created_at DESC")

	if cursor != "" {
		query = query.Where("id < ?", cursor)
	}

	err := query.Limit(limit + 1).Find(&notes).Error
	return notes, err
}

func (r *NoteRepository) ListPublic(limit int, cursor string) ([]notemodel.Note, error) {
	var notes []notemodel.Note
	query := r.db.Where("visibility IN ? AND is_deleted = false",
		[]string{"public", "unlisted"}).
		Order("created_at DESC")

	if cursor != "" {
		query = query.Where("id < ?", cursor)
	}

	err := query.Limit(limit + 1).Find(&notes).Error
	return notes, err
}

func (r *NoteRepository) ListLocal(limit int, cursor string) ([]notemodel.Note, error) {
	var notes []notemodel.Note
	query := r.db.Where("visibility IN ? AND is_deleted = false AND source IS NULL",
		[]string{"public", "unlisted"}).
		Order("created_at DESC")

	if cursor != "" {
		query = query.Where("id < ?", cursor)
	}

	err := query.Limit(limit + 1).Find(&notes).Error
	return notes, err
}

func (r *NoteRepository) ListFollowing(userID string, limit int, cursor string) ([]notemodel.Note, error) {
	var notes []notemodel.Note
	// TODO: Implement follow-based timeline with proper join
	query := r.db.Where("user_id IN (SELECT following_id FROM user_follows WHERE user_id = ?) AND is_deleted = false", userID).
		Order("created_at DESC")

	if cursor != "" {
		query = query.Where("id < ?", cursor)
	}

	err := query.Limit(limit + 1).Find(&notes).Error
	return notes, err
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
	// Basic text search - Bleve integration pending
	q := r.db.Where("content ILIKE ? AND visibility IN ? AND is_deleted = false",
		"%"+query+"%", []string{"public", "unlisted"}).
		Order("created_at DESC")

	if cursor != "" {
		q = q.Where("id < ?", cursor)
	}

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
