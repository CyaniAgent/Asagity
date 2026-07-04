package event

import "time"

type NoteCreatedPayload struct {
	NoteID     string `json:"note_id"`
	PubID      string `json:"pubid"`
	Content    string `json:"content"`
	Visibility string `json:"visibility"`
	RootID     string `json:"root_id,omitempty"`
	ParentID   string `json:"parent_id,omitempty"`
}

type NoteUpdatedPayload struct {
	NoteID  string `json:"note_id"`
	PubID   string `json:"pubid"`
	Content string `json:"content"`
}

type NoteDeletedPayload struct {
	NoteID string `json:"note_id"`
	PubID  string `json:"pubid"`
}

type NoteReactionPayload struct {
	NoteID string `json:"note_id"`
	Emoji  string `json:"emoji"`
}

type NotePollVotedPayload struct {
	NoteID    string   `json:"note_id"`
	OptionIDs []string `json:"option_ids"`
}

type UserRegisteredPayload struct {
	UserID   string `json:"user_id"`
	PubID    string `json:"pubid"`
	Username string `json:"username"`
}

type UserPubIDChangedPayload struct {
	OldPubID string `json:"old_pubid"`
	NewPubID string `json:"new_pubid"`
}

type AuthPayload struct {
	UserID    string `json:"user_id"`
	PubID     string `json:"pubid"`
	Timestamp string `json:"timestamp"`
}

type FollowPayload struct {
	FollowID    string `json:"follow_id"`
	FollowerID  string `json:"follower_id"`
	FollowingID string `json:"following_id"`
	At          string `json:"at"`
}

type NotificationPayload struct {
	Type    string `json:"type"`
	UserID  string `json:"user_id"`
	Message string `json:"message"`
}

func Now() string {
	return time.Now().Format(time.RFC3339)
}
