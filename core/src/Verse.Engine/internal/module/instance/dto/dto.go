package dto

type VersionResponse struct {
	Name    string `json:"name"`
	Version string `json:"version"`
}

type MetaResponse struct {
	Name        string `json:"name"`
	Alias       string `json:"alias"`
	Description string `json:"description"`
}

type SystemEnvironmentResponse struct {
	Hostname    string `json:"hostname"`
	Platform    string `json:"platform"`
	OSVersion   string `json:"os_version"`
	Arch        string `json:"arch"`
	CPU         string `json:"cpu"`
	Memory      string `json:"memory"`
	IsContainer bool   `json:"is_container"`
}

// DeveloperAccountResponse describes the seeded administrator/developer
// account of the current instance. The password is never exposed.
type DeveloperAccountResponse struct {
	Exists   bool   `json:"exists"`
	Username string `json:"username"`
	Email    string `json:"email"`
	Name     string `json:"name"`
	Group    string `json:"group"`
	GroupID  string `json:"group_id"`
	PubID    string `json:"pub_id"`
	Mode     string `json:"mode"`
	SeededBy string `json:"seeded_by"`
}
