package model

import (
	"time"

	"github.com/CyaniAgent/Asagity/core/internal/platform/id"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type NoteType string

const (
	NoteTypeNote   NoteType = "note"   // 普通帖子
	NoteTypeReply  NoteType = "reply"  // 回复
	NoteTypeRepost NoteType = "repost" // 纯转发
	NoteTypeQuote  NoteType = "quote"  // 引用转发
)

type NoteVisibility string

const (
	NoteVisibilityPublic   NoteVisibility = "public"   // 公开
	NoteVisibilityUnlisted NoteVisibility = "unlisted" // 未列出（仅url可见）
	NoteVisibilityPrivate  NoteVisibility = "private"  // 仅自己可见
	NoteVisibilityDirect   NoteVisibility = "direct"   // 仅提及者可见
)

type Note struct {
	ID         string         `gorm:"type:char(26);primaryKey" json:"id"`
	PubID      string         `gorm:"type:varchar(16);uniqueIndex" json:"pubid"`
	UserID     string         `gorm:"type:char(26);index;not null" json:"user_id"`
	RootID     *string        `gorm:"type:char(26);index" json:"root_id"`   // 根帖子ID（用于回复链追溯）
	ParentID   *string        `gorm:"type:char(26);index" json:"parent_id"` // 直接父帖子ID
	Type       NoteType       `gorm:"type:varchar(16);not null" json:"type"`
	Content    string         `gorm:"type:text;not null" json:"content"`
	Cw         *string        `gorm:"type:text" json:"cw"` // 内容警告（Content Warning）
	Visibility NoteVisibility `gorm:"type:varchar(16);not null" json:"visibility"`
	Source     *string        `gorm:"type:varchar(255)" json:"source"` // 发布源（用于联合广播）
	IsDraft    bool           `gorm:"default:false" json:"is_draft"`
	IsDeleted  bool           `gorm:"default:false" json:"is_deleted"`
	DeletedAt  *time.Time     `json:"deleted_at"`
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
}

func (n *Note) BeforeCreate(tx *gorm.DB) error {
	if n.ID == "" {
		n.ID = uuid.New().String()
	}
	if n.PubID == "" {
		n.PubID = id.GenerateNotePubID()
	}
	return nil
}

type NoteEdit struct {
	ID        string    `gorm:"type:char(26);primaryKey" json:"id"`
	NoteID    string    `gorm:"type:char(26);index;not null" json:"note_id"`
	Content   string    `gorm:"type:text;not null" json:"content"`
	Cw        *string   `gorm:"type:text" json:"cw"`
	CreatedAt time.Time `json:"created_at"`
}

func (ne *NoteEdit) BeforeCreate(tx *gorm.DB) error {
	if ne.ID == "" {
		ne.ID = uuid.New().String()
	}
	return nil
}

type NoteReaction struct {
	ID        string    `gorm:"type:char(26);primaryKey" json:"id"`
	NoteID    string    `gorm:"type:char(26);index;not null" json:"note_id"`
	UserID    string    `gorm:"type:char(26);index;not null" json:"user_id"`
	Emoji     string    `gorm:"type:varchar(64);not null" json:"emoji"`
	CreatedAt time.Time `json:"created_at"`
}

func (nr *NoteReaction) BeforeCreate(tx *gorm.DB) error {
	if nr.ID == "" {
		nr.ID = uuid.New().String()
	}
	return nil
}

type NoteMedia struct {
	ID          string    `gorm:"type:char(26);primaryKey" json:"id"`
	NoteID      string    `gorm:"type:char(26);index;not null" json:"note_id"`
	FileID      string    `gorm:"type:char(26);index;not null" json:"file_id"`
	Type        string    `gorm:"type:varchar(32);not null" json:"type"` // image, video, audio, poll
	Alt         *string   `gorm:"type:text" json:"alt"`                  // 备用描述
	IsSensitive bool      `gorm:"default:false" json:"is_sensitive"`
	Position    int       `gorm:"default:0" json:"position"` // 排序位置
	CreatedAt   time.Time `json:"created_at"`
}

func (nm *NoteMedia) BeforeCreate(tx *gorm.DB) error {
	if nm.ID == "" {
		nm.ID = uuid.New().String()
	}
	return nil
}

type Poll struct {
	ID        string     `gorm:"type:char(26);primaryKey" json:"id"`
	NoteID    string     `gorm:"type:char(26);index;not null" json:"note_id"`
	Multiple  bool       `gorm:"default:false" json:"multiple"` // 多选
	ExpiresAt *time.Time `json:"expires_at"`                    // 过期时间（nil=永久）
	HideUntil *time.Time `json:"hide_until"`                    // 隐藏结果直到过期
	CreatedAt time.Time  `json:"created_at"`
}

func (p *Poll) BeforeCreate(tx *gorm.DB) error {
	if p.ID == "" {
		p.ID = uuid.New().String()
	}
	return nil
}

type PollOption struct {
	ID     string `gorm:"type:char(26);primaryKey" json:"id"`
	PollID string `gorm:"type:char(26);index;not null" json:"poll_id"`
	Text   string `gorm:"type:varchar(200);not null" json:"text"`
	Votes  int    `gorm:"default:0" json:"votes"`
}

func (po *PollOption) BeforeCreate(tx *gorm.DB) error {
	if po.ID == "" {
		po.ID = uuid.New().String()
	}
	return nil
}

type PollVote struct {
	ID        string    `gorm:"type:char(26);primaryKey" json:"id"`
	PollID    string    `gorm:"type:char(26);index;not null" json:"poll_id"`
	OptionID  string    `gorm:"type:char(26);index;not null" json:"option_id"`
	UserID    string    `gorm:"type:char(26);index;not null" json:"user_id"`
	CreatedAt time.Time `json:"created_at"`
}

func (pv *PollVote) BeforeCreate(tx *gorm.DB) error {
	if pv.ID == "" {
		pv.ID = uuid.New().String()
	}
	return nil
}
