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
