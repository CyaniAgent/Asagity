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
