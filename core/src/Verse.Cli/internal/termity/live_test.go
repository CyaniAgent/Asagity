package termity

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/CyaniAgent/Asagity/core/src/Verse.Cli/internal/config"
	"github.com/CyaniAgent/Asagity/core/src/Verse.Cli/internal/mode"
	"github.com/CyaniAgent/Asagity/core/src/Verse.Cli/internal/runner"
)

// TestCaptureStreamLive verifies lines reach the callback as they are
// printed (order preserved), not only after fn returns. Pacing the writes
// mirrors a real long operation (build output arriving over time).
func TestCaptureStreamLive(t *testing.T) {
	var mu sync.Mutex
	var seen []string
	var afterReturnAt int // index boundary: lines seen before fn returned

	lines := captureStream(func() {
		for i := 0; i < 5; i++ {
			fmt.Printf("line-%d\n", i)
			time.Sleep(30 * time.Millisecond)
		}
		mu.Lock()
		afterReturnAt = len(seen)
		mu.Unlock()
	}, func(line string) {
		mu.Lock()
		seen = append(seen, line)
		mu.Unlock()
	})

	if len(seen) != 5 || len(lines) != 5 {
		t.Fatalf("seen=%d lines=%d, want 5/5", len(seen), len(lines))
	}
	// The whole point of streaming: lines must arrive BEFORE fn ends.
	if afterReturnAt < 4 {
		t.Errorf("only %d/5 lines streamed before fn returned — not live", afterReturnAt)
	}
	for i := range lines {
		if want := fmt.Sprintf("line-%d", i); lines[i] != want {
			t.Errorf("lines[%d] = %q, want %q", i, lines[i], want)
		}
	}
}

// TestCaptureStreamNoLive keeps the batch contract when no sink is attached.
func TestCaptureStreamNoLive(t *testing.T) {
	lines := captureStream(func() {
		fmt.Println("a")
		fmt.Println("b")
	}, nil)
	if len(lines) != 2 || lines[0] != "a" || lines[1] != "b" {
		t.Errorf("captureStream(nil) = %q", lines)
	}
}

// TestTailFileFollowsAppends drives tailFile against a growing file.
func TestTailFileFollowsAppends(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "svc.log")
	if err := os.WriteFile(path, []byte("old-1\nold-2\n"), 0o644); err != nil {
		t.Fatal(err)
	}

	stop := make(chan struct{})
	defer close(stop)
	got := make(chan string, 16)
	go tailFile(path, "svc", stop, func(line string) { got <- line })

	// Let the tail take its initial snapshot (offset = current size) before
	// appending — otherwise the append may land inside the snapshot window
	// and be treated as history.
	time.Sleep(500 * time.Millisecond)

	// Append after the tail attached: old lines must NOT be replayed.
	f, _ := os.OpenFile(path, os.O_APPEND|os.O_WRONLY, 0o644)
	fmt.Fprintln(f, "new-1")
	f.Sync()

	select {
	case line := <-got:
		if line != "new-1" {
			t.Fatalf("got %q, want new-1", line)
		}
	case <-time.After(2 * time.Second):
		t.Fatal("tailFile did not emit appended line within 2s")
	}

	// Partial line completes across writes.
	fmt.Fprint(f, "partial")
	f.Sync()
	select {
	case line := <-got:
		t.Fatalf("emitted incomplete line %q", line)
	case <-time.After(700 * time.Millisecond):
	}
	fmt.Fprintln(f, "-done")
	f.Sync()
	select {
	case line := <-got:
		if line != "partial-done" {
			t.Fatalf("got %q, want partial-done", line)
		}
	case <-time.After(2 * time.Second):
		t.Fatal("tailFile lost the completed partial line")
	}
	_ = f.Close()
}

// TestTailFileWaitsForCreation: the log file may not exist when the tail
// attaches (service not started yet) — it must keep waiting, then stream.
func TestTailFileWaitsForCreation(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "late.log")

	stop := make(chan struct{})
	defer close(stop)
	got := make(chan string, 4)
	go tailFile(path, "svc", stop, func(line string) { got <- line })

	time.Sleep(500 * time.Millisecond) // tail is polling a nonexistent file
	if err := os.WriteFile(path, []byte("boot line\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	select {
	case line := <-got:
		if line != "boot line" {
			t.Fatalf("got %q, want boot line", line)
		}
	case <-time.After(2 * time.Second):
		t.Fatal("tailFile never picked up a late-created file")
	}
}

// TestTailFileResetsOnRotation simulates logrotate: the old file is renamed
// away and a NEW file (new inode, possibly larger than the old offset) is
// created at the path. Size comparison alone would miss this — inode
// identity is what catches it.
func TestTailFileResetsOnRotation(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "rot.log")
	if err := os.WriteFile(path, []byte("first-generation-aaaaaaaaaaaaaaaaaaaa\n"), 0o644); err != nil {
		t.Fatal(err)
	}

	stop := make(chan struct{})
	defer close(stop)
	got := make(chan string, 8)
	go tailFile(path, "svc", stop, func(line string) { got <- line })

	time.Sleep(500 * time.Millisecond) // attach past "first-generation"

	// Rotate: rename away, then create the successor file.
	if err := os.Rename(path, path+".1"); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(path, []byte("second-gen-1\nsecond-gen-2\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	var seen []string
	deadline := time.After(2 * time.Second)
	for len(seen) < 2 {
		select {
		case line := <-got:
			seen = append(seen, line)
		case <-deadline:
			t.Fatalf("after rotation saw %v, want second-gen lines", seen)
		}
	}
	if seen[0] != "second-gen-1" || seen[1] != "second-gen-2" {
		t.Errorf("post-rotation lines = %v", seen)
	}
}

// TestColorizeServiceLine pins severity mapping and the service prefix.
func TestColorizeServiceLine(t *testing.T) {
	s := newStyles()
	// lipgloss renders plain when no color profile is detected (tests), but
	// guard anyway: compare after stripping escapes so the assertion holds
	// under CI with COLORTERM set.
	strip := func(x string) string {
		var b strings.Builder
		inEsc := false
		for _, r := range x {
			switch {
			case inEsc && (r == 'm' || r == 'K'):
				inEsc = false
			case r == '\x1b':
				inEsc = true
			case !inEsc:
				b.WriteRune(r)
			}
		}
		return b.String()
	}

	styled := []string{
		"2026/10/29 05:45:28 [db] something error occurred",
		"warn: Microsoft.Hosting.Lifetime[0]",
		"fail: Some.Module blew up",
		"fatal: gone",
		"2026/10/29 05:45:28 [runtime] listening",
	}
	for _, in := range styled {
		got := strip(s.colorizeServiceLine("", in))
		if got != in {
			t.Errorf("colorizeServiceLine(%q) = %q after strip — text must be preserved", in, got)
		}
	}

	// Plain line, no svc → untouched passthrough.
	if got := s.colorizeServiceLine("", "plain info line"); got != "plain info line" {
		t.Errorf("plain line was modified: %q", got)
	}

	// Service prefix appears only when svc is given.
	if got := strip(s.colorizeServiceLine("", "hello")); strings.Contains(got, "] ") {
		t.Errorf("no svc: unexpected prefix in %q", got)
	}
	if got := strip(s.colorizeServiceLine("engine", "hello")); !strings.HasPrefix(got, "[engine] ") {
		t.Errorf("svc prefix missing in %q", got)
	}
}

// TestOutcomeFollowFlags: /stop /destroy detach, /logs -f attaches, and
// /start's follow routing is covered by loggable (cmdStart itself would
// trigger a real engine build — too heavy for a unit test; verified e2e).
func TestOutcomeFollowFlags(t *testing.T) {
	st := newStyles()
	r, err := runner.New(&config.Config{VerseDir: t.TempDir()})
	if err != nil {
		t.Fatal(err)
	}
	env := &Env{Runner: r, Mode: mode.Lite, st: st}

	// /stop → unfollow.
	out := cmdStop([]string{"api"}, env)
	if !out.OK || !out.Unfollow {
		t.Errorf("/stop should unfollow: %+v", out)
	}

	// /destroy → unfollow.
	out = cmdDestroy([]string{"api"}, env)
	if !out.OK || !out.Unfollow {
		t.Errorf("/destroy should unfollow: %+v", out)
	}
}

// TestLoggableMapsTargets: only engine/api have log files.
func TestLoggableMapsTargets(t *testing.T) {
	if got := loggable("engine"); len(got) != 1 || got[0] != "engine" {
		t.Errorf("loggable(engine) = %v", got)
	}
	if got := loggable("all"); len(got) != 2 {
		t.Errorf("loggable(all) = %v, want engine+api", got)
	}
}

// TestLogsFollowParsing: /logs -f <svc> attaches, /logs off detaches.
func TestLogsFollowParsing(t *testing.T) {
	st := newStyles()
	r, err := runner.New(&config.Config{VerseDir: t.TempDir()})
	if err != nil {
		t.Fatal(err)
	}
	env := &Env{Runner: r, st: st}

	out := cmdLogsLines([]string{"-f", "off"}, env)
	if !out.OK || !out.Unfollow {
		t.Errorf("/logs -f off should unfollow: %+v", out)
	}

	out = cmdLogsLines([]string{"off"}, env)
	if !out.OK || !out.Unfollow {
		t.Errorf("/logs off should unfollow: %+v", out)
	}

	// -f with a valid service but no log file yet → attaches anyway.
	out = cmdLogsLines([]string{"-f", "engine"}, env)
	if !out.OK || len(out.Follow) != 1 || out.Follow[0] != "engine" {
		t.Errorf("/logs -f engine = %+v", out)
	}

	out = cmdLogsLines([]string{"-f", "bogus"}, env)
	if out.OK {
		t.Errorf("/logs -f bogus should fail: %+v", out)
	}
}
