// Package modulemgr manages third-party .aap applications on disk.
//
// Layout: <root>/apps/<name>/manifest.json (+ .disabled flag when disabled).
// This is the file-level registry the `verse app` subcommand drives; the
// future App Environment sandbox will read the same layout.
package modulemgr

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sort"
)

// App is one installed application.
type App struct {
	Name    string
	Version string
	Enabled bool
}

// Manager scans an apps directory.
type Manager struct {
	AppsDir string
}

// New creates a manager (creating the directory when missing).
func New(appsDir string) (*Manager, error) {
	if err := os.MkdirAll(appsDir, 0o755); err != nil {
		return nil, err
	}
	return &Manager{AppsDir: appsDir}, nil
}

// List returns installed apps sorted by name.
func (m *Manager) List() ([]App, error) {
	entries, err := os.ReadDir(m.AppsDir)
	if err != nil {
		return nil, err
	}
	var out []App
	for _, e := range entries {
		if !e.IsDir() {
			continue
		}
		manifest := filepath.Join(m.AppsDir, e.Name(), "manifest.json")
		data, err := os.ReadFile(manifest)
		if err != nil {
			continue // not an app dir
		}
		var meta struct {
			Name    string `json:"name"`
			Version string `json:"version"`
		}
		if err := json.Unmarshal(data, &meta); err != nil {
			continue
		}
		if meta.Name == "" {
			meta.Name = e.Name()
		}
		_, disabled := os.Stat(filepath.Join(m.AppsDir, e.Name(), ".disabled"))
		out = append(out, App{Name: meta.Name, Version: meta.Version, Enabled: disabled != nil})
	}
	sort.Slice(out, func(i, j int) bool { return out[i].Name < out[j].Name })
	return out, nil
}

// Enable marks an installed app enabled.
func (m *Manager) Enable(name string) error {
	dir, err := m.appDir(name)
	if err != nil {
		return err
	}
	if err := os.Remove(filepath.Join(dir, ".disabled")); err != nil && !os.IsNotExist(err) {
		return err
	}
	return nil
}

// Disable marks an installed app disabled.
func (m *Manager) Disable(name string) error {
	dir, err := m.appDir(name)
	if err != nil {
		return err
	}
	f, err := os.OpenFile(filepath.Join(dir, ".disabled"), os.O_CREATE|os.O_WRONLY, 0o644)
	if err != nil {
		return err
	}
	return f.Close()
}

func (m *Manager) appDir(name string) (string, error) {
	apps, err := m.List()
	if err != nil {
		return "", err
	}
	for _, a := range apps {
		if a.Name == name {
			return filepath.Join(m.AppsDir, name), nil
		}
	}
	// Fall back to the raw directory name so enable/disable also work
	// before a manifest is fully valid.
	if isDir(filepath.Join(m.AppsDir, name)) {
		return filepath.Join(m.AppsDir, name), nil
	}
	return "", fmt.Errorf("app %q is not installed under %s", name, m.AppsDir)
}

func isDir(p string) bool {
	st, err := os.Stat(p)
	return err == nil && st.IsDir()
}
