package dto

import (
	notemodel "github.com/CyaniAgent/Asagity/core/internal/module/note/model"
)

// CreateNoteRequest - 创建帖子请求
type CreateNoteRequest struct {
	Content    string             `json:"content" validate:"required,max=10000"`
	Type       string             `json:"type,default=note"` // note, reply, repost, quote
	Visibility string             `json:"visibility,default=public"`
	Cw         *string            `json:"cw"`
	MediaIDs   []string           `json:"media_ids"`
	Poll       *CreatePollRequest `json:"poll"`
	ParentID   *string            `json:"parent_id"`
	RootID     *string            `json:"root_id"`
}

type CreatePollRequest struct {
	Multiple  bool     `json:"multiple"`
	ExpiresAt *string  `json:"expires_at"` // RFC3339 format
	Options   []string `json:"options" validate:"required,min=1,max=20"`
}

// UpdateNoteRequest - 更新帖子请求
type UpdateNoteRequest struct {
	Content string  `json:"content" validate:"required,max=10000"`
	Cw      *string `json:"cw"`
}

// NoteResponse - 帖子响应
type NoteResponse struct {
	ID          string            `json:"id"`
	PubID       string            `json:"pubid"`
	User        *UserBasic        `json:"user"`
	Content     string            `json:"content"`
	Cw          *string           `json:"cw"`
	Visibility  string            `json:"visibility"`
	Type        string            `json:"type"`
	RootID      *string           `json:"root_id"`
	ParentID    *string           `json:"parent_id"`
	Media       []MediaResponse   `json:"media"`
	Poll        *PollResponse     `json:"poll"`
	Reactions   []ReactionSummary `json:"reactions"`
	Metrics     NoteMetrics       `json:"metrics"`
	CreatedAt   string            `json:"created_at"`
	EditedAt    *string           `json:"edited_at"`
	ReplyCount  int               `json:"reply_count"`
	RepostCount int               `json:"repost_count"`
}

type UserBasic struct {
	ID          string `json:"id"`
	PubID       string `json:"pubid"`
	Username    string `json:"username"`
	DisplayName string `json:"display_name"`
	Avatar      string `json:"avatar"`
}

type MediaResponse struct {
	ID        string  `json:"id"`
	Type      string  `json:"type"`
	URL       string  `json:"url"`
	Thumbnail *string `json:"thumbnail"`
	Alt       *string `json:"alt"`
	Sensitive bool    `json:"sensitive"`
}

type PollResponse struct {
	Multiple   bool               `json:"multiple"`
	ExpiresAt  *string            `json:"expires_at"`
	Options    []PollOptionResult `json:"options"`
	Voted      []string           `json:"voted"`
	TotalVotes int                `json:"total_votes"`
}

type PollOptionResult struct {
	ID      string  `json:"id"`
	Text    string  `json:"text"`
	Votes   int     `json:"votes"`
	Percent float64 `json:"percent"`
}

type ReactionSummary struct {
	Emoji string   `json:"emoji"`
	Count int      `json:"count"`
	Users []string `json:"users"` // Top reactors
}

type NoteMetrics struct {
	Replies int `json:"replies"`
	Reposts int `json:"reposts"`
	Likes   int `json:"likes"`
}

// ReactionRequest - 添加Reaction请求
type ReactionRequest struct {
	Emoji string `json:"emoji" validate:"required"`
}

// VoteRequest - 投票请求
type VoteRequest struct {
	OptionIDs []string `json:"option_ids" validate:"required,min=1,max=20"`
}

// NoteEditResponse - 编辑历史响应
type NoteEditResponse struct {
	ID        string `json:"id"`
	Content   string `json:"content"`
	Cw        string `json:"cw"`
	CreatedAt string `json:"created_at"`
}

// TimelineRequest - 时间线请求参数
type TimelineRequest struct {
	Limit  int    `query:"limit,default=20"`
	Cursor string `query:"cursor"`
	Since  string `query:"since"` // For newer timeline
	Until  string `query:"until"` // For older timeline
}

// NoteListResponse - 帖子列表响应
type NoteListResponse struct {
	Notes      []NoteResponse `json:"notes"`
	NextCursor *string        `json:"next_cursor"`
	PrevCursor *string        `json:"prev_cursor"`
}

// TimelineNoteResponse - 时间线帖子响应（含用户信息）
type TimelineNoteResponse struct {
	ID         string      `json:"id"`
	PubID      string      `json:"pubid"`
	Content    string      `json:"content"`
	Cw         *string     `json:"cw"`
	Visibility string      `json:"visibility"`
	Type       string      `json:"type"`
	RootID     *string     `json:"root_id"`
	ParentID   *string     `json:"parent_id"`
	Source     *string     `json:"source"`
	CreatedAt  string      `json:"created_at"`
	UpdatedAt  string      `json:"updated_at"`
	User       *UserBasic  `json:"author"`
	Metrics    NoteMetrics `json:"metrics"`
}

// NoteSearchRequest - 搜索请求
type NoteSearchRequest struct {
	Query    string `query:"q" validate:"required"`
	Limit    int    `query:"limit,default=20"`
	Cursor   string `query:"cursor"`
	User     string `query:"user"`  // Filter by user
	Media    string `query:"media"` // Filter by media type
	Language string `query:"lang"`  // Filter by language
}

// Error responses
type NoteError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

const (
	ErrNoteNotFound   = "NOTE_NOT_FOUND"
	ErrNoteDeleted    = "NOTE_DELETED"
	ErrNoteForbidden  = "NOTE_FORBIDDEN"
	ErrInvalidContent = "INVALID_CONTENT"
	ErrInvalidPoll    = "INVALID_POLL"
)

func (e *NoteError) Error() string {
	return e.Message
}

// Helper functions
func NewNoteError(code, message string) *NoteError {
	return &NoteError{Code: code, Message: message}
}

// ToModel converts DTO to model
func (r *CreateNoteRequest) ToModel(userID string) *notemodel.Note {
	note := &notemodel.Note{
		UserID:     userID,
		Content:    r.Content,
		Visibility: notemodel.NoteVisibility(r.Visibility),
		Type:       notemodel.NoteType(r.Type),
		Cw:         r.Cw,
		IsDraft:    false,
		IsDeleted:  false,
	}

	switch r.Type {
	case "reply":
		note.Type = notemodel.NoteTypeReply
		note.ParentID = r.ParentID
		note.RootID = r.RootID
	case "repost":
		note.Type = notemodel.NoteTypeRepost
	case "quote":
		note.Type = notemodel.NoteTypeQuote
	}

	return note
}
