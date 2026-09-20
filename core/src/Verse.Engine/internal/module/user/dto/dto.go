package dto

type MessageResponse struct {
	Message string `json:"message"`
}

type ChangePubIDRequest struct {
	NewPubID string `json:"new_pub_id"`
}

type ChangePubIDResponse struct {
	PubID       string `json:"pub_id"`
	ChangesLeft int    `json:"changes_left"`
	ResetDate   string `json:"reset_date"`
}

type PubIDChangeHistoryItem struct {
	OldPubID  string `json:"old_pub_id"`
	NewPubID  string `json:"new_pub_id"`
	ChangedAt string `json:"changed_at"`
}

type PubIDChangeHistoryResponse struct {
	History []PubIDChangeHistoryItem `json:"history"`
	Total   int                      `json:"total"`
}
