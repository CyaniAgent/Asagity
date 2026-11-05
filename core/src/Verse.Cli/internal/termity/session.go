package termity

import (
	"bufio"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"
)

// Session store layout (mirrors Codex CLI's rollout convention):
//
//	<verseDir>/sessions/YYYY/MM/DD/session-<ts>-<id>.jsonl
//
// Append-only JSONL: one self-contained event object per line. A crash or
// destroy loses at most the in-flight line; readers must tolerate a truncated
// last line.

// SessionEvent is one journal line.
type SessionEvent struct {
	Type       string `json:"type"`                  // session_start | command | result | session_end
	TS         string `json:"ts"`                    // RFC3339
	Session    string `json:"session,omitempty"`     // 8-hex session id (start only)
	Mode       string `json:"mode,omitempty"`        // runtime mode (start only)
	EnginePort string `json:"engine_port,omitempty"` // start only
	APIPort    string `json:"api_port,omitempty"`    // start only
	Raw        string `json:"raw,omitempty"`         // command line (command/result)
	OK         *bool  `json:"ok,omitempty"`          // result success (result only; pointer keeps ok=false)
	DurationMS int64  `json:"duration_ms,omitempty"` // result duration (result only)
	Commands   int    `json:"commands,omitempty"`    // session_end total
}

// SessionMeta is the summary row shown by /recent.
type SessionMeta struct {
	ID          string
	StartedAt   time.Time
	Mode        string
	Commands    int
	LastCommand string
	DurationMS  int64 // duration of the last command (0 when none)
	Path        string
}

// Session is the live journal writer for the current CLI run.
type Session struct {
	ID        string
	StartedAt time.Time
	Mode      string

	file   *os.File
	count  int
	closed bool
}

// newSessionID returns an 8-hex-char session id (Codex-style fragment).
func newSessionID() string {
	var b [4]byte
	if _, err := rand.Read(b[:]); err != nil {
		return fmt.Sprintf("%08x", time.Now().UnixNano()&0xffffffff)
	}
	return hex.EncodeToString(b[:])
}

// sessionFileName builds the journal file name: session-<ts>-<id>.jsonl.
func sessionFileName(at time.Time, id string) string {
	return fmt.Sprintf("session-%s-%s.jsonl", at.Format("2006-01-02T15-04-05"), id)
}

// beginSession creates the journal file for a new CLI run under
// <verseDir>/sessions/YYYY/MM/DD/.
func beginSession(verseDir string, at time.Time, mode, enginePort, apiPort string) (*Session, error) {
	id := newSessionID()
	dir := filepath.Join(verseDir, "sessions",
		at.Format("2006"), at.Format("01"), at.Format("02"))
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return nil, fmt.Errorf("session dir: %w", err)
	}
	file, err := os.OpenFile(filepath.Join(dir, sessionFileName(at, id)),
		os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0o644)
	if err != nil {
		return nil, fmt.Errorf("session file: %w", err)
	}
	s := &Session{ID: id, StartedAt: at, Mode: mode, file: file}
	s.emit(SessionEvent{
		Type: "session_start", TS: at.Format(time.RFC3339),
		Session: id, Mode: mode, EnginePort: enginePort, APIPort: apiPort,
	})
	return s, nil
}

// emit appends one event line and flushes (crash loses at most this line).
func (s *Session) emit(ev SessionEvent) {
	if s == nil || s.file == nil || s.closed {
		return
	}
	line, err := json.Marshal(ev)
	if err != nil {
		return
	}
	_, _ = s.file.Write(append(line, '\n'))
	_ = s.file.Sync()
}

// LogCommand records a submitted command line.
func (s *Session) LogCommand(raw string) {
	s.count++
	s.emit(SessionEvent{
		Type: "command", TS: time.Now().Format(time.RFC3339), Raw: raw,
	})
}

// LogResult records the outcome of the last command.
func (s *Session) LogResult(raw string, ok bool, d time.Duration) {
	okCopy := ok
	s.emit(SessionEvent{
		Type: "result", TS: time.Now().Format(time.RFC3339),
		Raw: raw, OK: &okCopy, DurationMS: d.Milliseconds(),
	})
}

// Close writes the session_end event and closes the journal.
func (s *Session) Close() {
	if s == nil || s.closed {
		return
	}
	s.emit(SessionEvent{
		Type: "session_end", TS: time.Now().Format(time.RFC3339), Commands: s.count,
	})
	s.closed = true
	_ = s.file.Close()
}

// Commands returns how many commands were journaled in this session.
func (s *Session) Commands() int { return s.count }

// recentSessions scans <verseDir>/sessions for journals and summarizes each.
// Files are small (dev-tool transcripts); whole-file scans are acceptable and
// keep the reader tolerant of truncated last lines.
func recentSessions(verseDir string) []SessionMeta {
	root := filepath.Join(verseDir, "sessions")
	var out []SessionMeta
	_ = filepath.WalkDir(root, func(path string, d os.DirEntry, err error) error {
		if err != nil || d.IsDir() || !strings.HasSuffix(path, ".jsonl") {
			return nil //nolint:nilerr // unreadable entries are skipped
		}
		if meta, ok := summarizeSession(path); ok {
			out = append(out, meta)
		}
		return nil
	})
	// Newest first; tie-break on id for determinism.
	sort.Slice(out, func(i, j int) bool {
		if !out[i].StartedAt.Equal(out[j].StartedAt) {
			return out[i].StartedAt.After(out[j].StartedAt)
		}
		return out[i].ID > out[j].ID
	})
	return out
}

// summarizeSession reads one journal and builds its /recent row.
func summarizeSession(path string) (SessionMeta, bool) {
	file, err := os.Open(path)
	if err != nil {
		return SessionMeta{}, false
	}
	defer file.Close()

	meta := SessionMeta{Path: path}
	found := false
	sc := bufio.NewScanner(file)
	sc.Buffer(make([]byte, 0, 64*1024), 1024*1024)
	for sc.Scan() {
		var ev SessionEvent
		if err := json.Unmarshal(sc.Bytes(), &ev); err != nil {
			continue // tolerate a truncated final line
		}
		switch ev.Type {
		case "session_start":
			meta.ID = ev.Session
			meta.Mode = ev.Mode
			if ts, err := time.Parse(time.RFC3339, ev.TS); err == nil {
				meta.StartedAt = ts
			}
			found = true
		case "command":
			meta.Commands++
			meta.LastCommand = ev.Raw
		case "result":
			meta.DurationMS = ev.DurationMS
		case "session_end":
			if ev.Commands > 0 {
				meta.Commands = ev.Commands
			}
		}
	}
	if !found {
		return SessionMeta{}, false
	}
	if meta.ID == "" {
		base := filepath.Base(path)
		meta.ID = strings.TrimSuffix(strings.TrimPrefix(base, "session-"), ".jsonl")
	}
	return meta, true
}

// sessionEvents loads the full journal of one session (for /recent <id>).
func sessionEvents(path string) []SessionEvent {
	file, err := os.Open(path)
	if err != nil {
		return nil
	}
	defer file.Close()

	var out []SessionEvent
	sc := bufio.NewScanner(file)
	sc.Buffer(make([]byte, 0, 64*1024), 1024*1024)
	for sc.Scan() {
		var ev SessionEvent
		if err := json.Unmarshal(sc.Bytes(), &ev); err != nil {
			continue
		}
		out = append(out, ev)
	}
	return out
}

// findSession resolves an /recent <id> argument to a journal path.
// The id may be an exact or unique prefix match.
func findSession(verseDir string, id string) (SessionMeta, bool) {
	all := recentSessions(verseDir)
	var match *SessionMeta
	for i := range all {
		if all[i].ID == id {
			return all[i], true
		}
		if strings.HasPrefix(all[i].ID, id) {
			if match != nil {
				return SessionMeta{}, false // ambiguous prefix
			}
			m := all[i]
			match = &m
		}
	}
	if match == nil {
		return SessionMeta{}, false
	}
	return *match, true
}
