// Package config locates the repository, reads .env and exposes ports.
package config

import (
	"bufio"
	"os"
	"path/filepath"
	"strings"
)

// Defaults.
const (
	DefaultEnginePort = "2048"
	DefaultAPIPort    = "2050"
)

// Config is the resolved CLI configuration.
type Config struct {
	ProjectRoot string
	VerseDir    string // <root>/.verse (pids, logs)
	AppsDir     string // <root>/apps (.aap registry)
	EnginePort  string // Go verse-engine HTTP (SERVER_PORT)
	APIPort     string // C# Verse.Api HTTP (VERSE_API_PORT)
	Env         map[string]string
}

// Load discovers the project root and reads <root>/.env (if present).
func Load() (*Config, error) {
	root, err := FindProjectRoot()
	if err != nil {
		return nil, err
	}

	env := readDotEnv(filepath.Join(root, ".env"))

	cfg := &Config{
		ProjectRoot: root,
		VerseDir:    filepath.Join(root, ".verse"),
		AppsDir:     filepath.Join(root, "apps"),
		EnginePort:  firstNonEmpty(env["SERVER_PORT"], os.Getenv("SERVER_PORT"), DefaultEnginePort),
		APIPort:     firstNonEmpty(env["VERSE_API_PORT"], os.Getenv("VERSE_API_PORT"), DefaultAPIPort),
		Env:         env,
	}
	return cfg, nil
}

// FindProjectRoot walks up from cwd and the executable looking for the
// repository marker core/src/Verse.slnx (falling back to a core+web pair).
func FindProjectRoot() (string, error) {
	var dirs []string
	if cwd, err := os.Getwd(); err == nil {
		dirs = append(dirs, walkUp(cwd, 8)...)
	}
	if exe, err := os.Executable(); err == nil {
		dirs = append(dirs, walkUp(filepath.Dir(exe), 8)...)
	}

	seen := map[string]bool{}
	for _, d := range dirs {
		if seen[d] {
			continue
		}
		seen[d] = true
		if _, err := os.Stat(filepath.Join(d, "core", "src", "Verse.slnx")); err == nil {
			return d, nil
		}
		if isDir(filepath.Join(d, "core")) && isDir(filepath.Join(d, "web")) {
			return d, nil
		}
	}
	return "", errNoRoot
}

type rootError struct{}

func (rootError) Error() string {
	return "cannot find project root (looked for core/src/Verse.slnx or core+web upwards)"
}

var errNoRoot = rootError{}

func walkUp(start string, depth int) []string {
	var out []string
	d := start
	for i := 0; i < depth; i++ {
		out = append(out, d)
		parent := filepath.Dir(d)
		if parent == d {
			break
		}
		d = parent
	}
	return out
}

func isDir(p string) bool {
	st, err := os.Stat(p)
	return err == nil && st.IsDir()
}

// readDotEnv parses KEY=VALUE lines; missing file yields an empty map.
// It never overrides real process environment; callers merge explicitly.
func readDotEnv(path string) map[string]string {
	env := map[string]string{}
	f, err := os.Open(path)
	if err != nil {
		return env
	}
	defer f.Close()

	sc := bufio.NewScanner(f)
	for sc.Scan() {
		line := strings.TrimSpace(sc.Text())
		if line == "" || strings.HasPrefix(line, "#") || strings.HasPrefix(line, "export ") {
			continue
		}
		line = strings.TrimPrefix(line, "export ")
		key, val, ok := strings.Cut(line, "=")
		if !ok {
			continue
		}
		key = strings.TrimSpace(key)
		val = strings.TrimSpace(val)
		val = strings.Trim(val, `"'`)
		if key != "" {
			env[key] = val
		}
	}
	return env
}

func firstNonEmpty(vals ...string) string {
	for _, v := range vals {
		if strings.TrimSpace(v) != "" {
			return v
		}
	}
	return ""
}
