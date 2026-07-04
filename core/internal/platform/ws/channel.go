package ws

const (
	ChannelTimeline      = "timeline"
	ChannelNotifications = "notifications"
	ChannelGlobal        = "global"
)

type ChannelInfo struct {
	Name        string   `json:"name"`
	Description string   `json:"description"`
	EventTypes  []string `json:"event_types"`
}

var Channels = []ChannelInfo{
	{
		Name:        ChannelTimeline,
		Description: "Real-time timeline updates (note.created, note.deleted)",
		EventTypes:  []string{"note.created", "note.updated", "note.deleted"},
	},
	{
		Name:        ChannelNotifications,
		Description: "User notifications (follow.requested, follow.accepted, notification.created)",
		EventTypes:  []string{"follow.requested", "follow.accepted", "follow.rejected", "follow.removed", "notification.created", "note.reaction_added"},
	},
	{
		Name:        ChannelGlobal,
		Description: "All system events",
		EventTypes:  []string{"*"},
	},
}

func ChannelEventTypes(name string) []string {
	for _, ch := range Channels {
		if ch.Name == name {
			return ch.EventTypes
		}
	}
	return nil
}
