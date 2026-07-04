package event

const (
	SourceLocal       = "local"
	SourceActivityPub = "activitypub"
	SourceNeoLinkage  = "neolinkage"
)

const (
	NoteCreated       = "note.created"
	NoteUpdated       = "note.updated"
	NoteDeleted       = "note.deleted"
	NoteReactionAdded = "note.reaction_added"
	NoteReactionRemoved = "note.reaction_removed"
	NotePollVoted     = "note.poll_voted"

	UserRegistered = "user.registered"
	UserPubIDChanged = "user.pubid_changed"

	AuthLogin    = "auth.login"
	AuthRefresh  = "auth.refresh"
	AuthLogout   = "auth.logout"

	FollowRequested = "follow.requested"
	FollowAccepted  = "follow.accepted"
	FollowRejected  = "follow.rejected"
	FollowRemoved   = "follow.removed"

	FileUploaded   = "file.uploaded"
	FileDeleted    = "file.deleted"
	FolderCreated  = "folder.created"
	FolderDeleted  = "folder.deleted"

	InstanceUpdated = "instance.updated"

	NotificationCreated = "notification.created"
)

var AllLocalEventTypes = []string{
	NoteCreated, NoteUpdated, NoteDeleted, NoteReactionAdded, NoteReactionRemoved, NotePollVoted,
	UserRegistered, UserPubIDChanged,
	AuthLogin, AuthRefresh, AuthLogout,
	FollowRequested, FollowAccepted, FollowRejected, FollowRemoved,
	FileUploaded, FileDeleted, FolderCreated, FolderDeleted,
	InstanceUpdated,
	NotificationCreated,
}
