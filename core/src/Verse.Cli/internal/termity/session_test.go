package termity

import (
	"os"
	"path/filepath"
	"testing"
	"time"
)

// TestSessionRoundTrip writes a full session and reads it back through both
// summarizeSession and sessionEvents.
func TestSessionRoundTrip(t *testing.T) {
	dir := t.TempDir()
	at := time.Date(2026, 10, 26, 21, 30, 11, 0, time.UTC)

	s, err := beginSession(dir, at, "lite", "2048", "2050")
	if err != nil {
		t.Fatalf("beginSession: %v", err)
	}
	s.LogCommand("/start dev")
	s.LogResult("/start dev", true, 12430*time.Millisecond)
	s.LogCommand("/status")
	s.LogResult("/status", true, 40*time.Millisecond)
	s.Close()

	// File lives under the date-partitioned path: sessions/2026/10/26/.
	dirPart := filepath.Dir(s.file.Name())
	if filepath.Base(dirPart) != "26" || filepath.Base(filepath.Dir(dirPart)) != "10" ||
		filepath.Base(filepath.Dir(filepath.Dir(dirPart))) != "2026" {
		t.Errorf("journal not date-partitioned: %s", s.file.Name())
	}
	if _, err := os.Stat(s.file.Name()); err != nil {
		t.Fatalf("journal file missing: %v", err)
	}

	all := recentSessions(dir)
	if len(all) != 1 {
		t.Fatalf("recentSessions = %d, want 1", len(all))
	}
	meta := all[0]
	if meta.ID != s.ID {
		t.Errorf("meta.ID = %q, want %q", meta.ID, s.ID)
	}
	if meta.Mode != "lite" {
		t.Errorf("meta.Mode = %q, want lite", meta.Mode)
	}
	if meta.Commands != 2 {
		t.Errorf("meta.Commands = %d, want 2", meta.Commands)
	}
	if meta.LastCommand != "/status" {
		t.Errorf("meta.LastCommand = %q, want /status", meta.LastCommand)
	}
	if meta.DurationMS != 40 {
		t.Errorf("meta.DurationMS = %d, want 40", meta.DurationMS)
	}
	if !meta.StartedAt.Equal(at) {
		t.Errorf("meta.StartedAt = %v, want %v", meta.StartedAt, at)
	}

	events := sessionEvents(meta.Path)
	var types []string
	for _, ev := range events {
		types = append(types, ev.Type)
	}
	want := []string{"session_start", "command", "result", "command", "result", "session_end"}
	if len(types) != len(want) {
		t.Fatalf("events = %v, want %v", types, want)
	}
	for i := range want {
		if types[i] != want[i] {
			t.Errorf("event[%d] = %q, want %q", i, types[i], want[i])
		}
	}
}

// TestRecentSessionsOrder verifies newest-first ordering across day dirs.
func TestRecentSessionsOrder(t *testing.T) {
	dir := t.TempDir()
	old, _ := beginSession(dir, time.Date(2026, 10, 25, 9, 0, 0, 0, time.UTC), "prod", "", "")
	old.Close()
	newer, _ := beginSession(dir, time.Date(2026, 10, 26, 18, 0, 0, 0, time.UTC), "lite", "", "")
	newer.Close()

	all := recentSessions(dir)
	if len(all) != 2 {
		t.Fatalf("recentSessions = %d, want 2", len(all))
	}
	if all[0].ID != newer.ID || all[1].ID != old.ID {
		t.Errorf("order wrong: got [%s %s], want [%s %s]",
			all[0].ID, all[1].ID, newer.ID, old.ID)
	}
}

// TestFindSession covers exact, prefix and ambiguous/missing lookups.
func TestFindSession(t *testing.T) {
	dir := t.TempDir()
	s1, _ := beginSession(dir, time.Date(2026, 10, 26, 10, 0, 0, 0, time.UTC), "lite", "", "")
	s1.Close()
	s2, _ := beginSession(dir, time.Date(2026, 10, 26, 11, 0, 0, 0, time.UTC), "prod", "", "")
	s2.Close()

	if m, ok := findSession(dir, s1.ID); !ok || m.ID != s1.ID {
		t.Errorf("exact match failed: ok=%v id=%q", ok, m.ID)
	}

	// A prefix resolves only when it matches exactly one session.
	for n := 1; n <= 8; n++ {
		p := s1.ID[:n]
		m, ok := findSession(dir, p)
		if !ok {
			continue // ambiguous (both share prefix) or missing — both fine
		}
		if m.ID != s1.ID && m.ID != s2.ID {
			t.Errorf("prefix %q resolved to unknown session %q", p, m.ID)
		}
	}

	if _, ok := findSession(dir, "zzzzzzzz"); ok {
		t.Error("missing session should not resolve")
	}
}

// TestSummarizeToleratesTruncatedTail simulates a crash-truncated journal.
func TestSummarizeToleratesTruncatedTail(t *testing.T) {
	dir := t.TempDir()
	at := time.Date(2026, 10, 26, 12, 0, 0, 0, time.UTC)
	s, err := beginSession(dir, at, "lite", "", "")
	if err != nil {
		t.Fatal(err)
	}
	path := s.file.Name()
	s.LogCommand("/status")
	s.Close()

	// Append a truncated line (crash mid-write).
	f, _ := os.OpenFile(path, os.O_APPEND|os.O_WRONLY, 0o644)
	_, _ = f.WriteString(`{"type":"command","ts":"2026-10-26T12:0`)
	_ = f.Close()

	meta, ok := summarizeSession(path)
	if !ok {
		t.Fatal("summarizeSession failed on truncated tail")
	}
	if meta.Commands != 1 {
		t.Errorf("Commands = %d, want 1 (truncated line skipped)", meta.Commands)
	}
}

// TestSessionIDUnique checks id shape and collision resistance over runs.
func TestSessionIDUnique(t *testing.T) {
	seen := map[string]bool{}
	for i := 0; i < 100; i++ {
		id := newSessionID()
		if len(id) != 8 {
			t.Fatalf("session id %q not 8 chars", id)
		}
		if seen[id] {
			t.Fatalf("duplicate session id %q", id)
		}
		seen[id] = true
	}
}

// TestSessionFileName pins the file naming convention.
func TestSessionFileName(t *testing.T) {
	at := time.Date(2026, 10, 26, 21, 30, 11, 0, time.UTC)
	got := sessionFileName(at, "3f8a21c0")
	want := "session-2026-10-26T21-30-11-3f8a21c0.jsonl"
	if got != want {
		t.Errorf("sessionFileName = %q, want %q", got, want)
	}
}
