// Package engineapi queries the running Verse engine over HTTP.
//
// The CLI deliberately owns no database driver: every fact about the engine's
// storage is read through the engine's own read-only endpoints.
package engineapi

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

// DeveloperAccount mirrors the engine's /api/system/developer-account payload.
type DeveloperAccount struct {
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

// Envelope is the shared {ok,data} response wrapper.
type Envelope struct {
	OK   bool            `json:"ok"`
	Data json.RawMessage `json:"data"`
}

// FetchDeveloperAccount reads the seeded administrator/developer account
// from the engine's read-only endpoint.
func FetchDeveloperAccount(baseURL string, timeout time.Duration) (DeveloperAccount, error) {
	var acc DeveloperAccount

	var env Envelope
	if err := get(baseURL+"/api/system/developer-account", timeout, &env); err != nil {
		return acc, err
	}
	if !env.OK {
		return acc, fmt.Errorf("engine reported a failed response")
	}
	if err := json.Unmarshal(env.Data, &acc); err != nil {
		return acc, err
	}
	return acc, nil
}

func get(url string, timeout time.Duration, out any) error {
	client := &http.Client{Timeout: timeout}
	resp, err := client.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("%s returned HTTP %d", url, resp.StatusCode)
	}
	return json.NewDecoder(resp.Body).Decode(out)
}
