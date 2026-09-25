// Package process supervises child processes: pid files, signalling,
// TCP port probes and HTTP health checks. Standard library only.
package process

import (
	"fmt"
	"io"
	"net"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"syscall"
	"time"
)

// Manager tracks pid/log files under <root>/.verse.
type Manager struct {
	PIDDir string
	LogDir string
}

// New creates the pid/log directories under verseDir.
func New(verseDir string) (*Manager, error) {
	m := &Manager{
		PIDDir: filepath.Join(verseDir, "pids"),
		LogDir: filepath.Join(verseDir, "logs"),
	}
	if err := os.MkdirAll(m.PIDDir, 0o755); err != nil {
		return nil, err
	}
	if err := os.MkdirAll(m.LogDir, 0o755); err != nil {
		return nil, err
	}
	return m, nil
}

func (m *Manager) pidFile(name string) string { return filepath.Join(m.PIDDir, name+".pid") }

// LogFile returns the log path for a service.
func (m *Manager) LogFile(name string) string { return filepath.Join(m.LogDir, name+".log") }

// PidOf reads the recorded pid, or 0 when absent/stale.
func (m *Manager) PidOf(name string) int {
	data, err := os.ReadFile(m.pidFile(name))
	if err != nil {
		return 0
	}
	pid, err := strconv.Atoi(strings.TrimSpace(string(data)))
	if err != nil || pid <= 0 || !Alive(pid) {
		return 0
	}
	return pid
}

// Alive reports whether pid exists (SIG 0 probe).
func Alive(pid int) bool {
	if pid <= 0 {
		return false
	}
	proc, err := os.FindProcess(pid)
	if err != nil {
		return false
	}
	return proc.Signal(syscall.Signal(0)) == nil
}

// Spawn starts argv in dir with extra env, redirecting output to the log file.
// An existing live instance is stopped first.
func (m *Manager) Spawn(name, dir string, extraEnv map[string]string, argv ...string) (int, error) {
	if old := m.PidOf(name); old > 0 {
		_ = m.Kill(name)
	}

	logF, err := os.OpenFile(m.LogFile(name), os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0o644)
	if err != nil {
		return 0, fmt.Errorf("open log: %w", err)
	}
	defer logF.Close()

	cmd := exec.Command(argv[0], argv[1:]...)
	cmd.Dir = dir
	cmd.Env = mergeEnv(os.Environ(), extraEnv)
	cmd.Stdout = logF
	cmd.Stderr = logF
	cmd.SysProcAttr = &syscall.SysProcAttr{Setpgid: true}

	if err := cmd.Start(); err != nil {
		return 0, fmt.Errorf("start %s: %w", name, err)
	}

	pid := cmd.Process.Pid
	if err := os.WriteFile(m.pidFile(name), []byte(strconv.Itoa(pid)), 0o644); err != nil {
		return 0, err
	}

	// Reap in background so zombies never accumulate; forget the pid on exit.
	go func() {
		_ = cmd.Wait()
		if m.PidOf(name) == pid {
			_ = os.Remove(m.pidFile(name))
		}
	}()

	return pid, nil
}

// Kill stops a service: SIGTERM, grace period, then SIGKILL.
func (m *Manager) Kill(name string) error {
	pid := m.PidOf(name)
	_ = os.Remove(m.pidFile(name))
	if pid == 0 {
		return nil
	}
	proc, err := os.FindProcess(pid)
	if err != nil {
		return nil
	}
	_ = proc.Signal(syscall.SIGTERM)
	deadline := time.Now().Add(6 * time.Second)
	for time.Now().Before(deadline) {
		if !Alive(pid) {
			return nil
		}
		time.Sleep(200 * time.Millisecond)
	}
	_ = proc.Signal(syscall.SIGKILL)
	return nil
}

func mergeEnv(base []string, extra map[string]string) []string {
	out := append([]string(nil), base...)
	for k, v := range extra {
		prefix := k + "="
		replaced := false
		for i, e := range out {
			if strings.HasPrefix(e, prefix) {
				out[i] = prefix + v
				replaced = true
				break
			}
		}
		if !replaced {
			out = append(out, prefix+v)
		}
	}
	return out
}

// PortOpen dials host:port within timeout.
func PortOpen(host, port string, timeout time.Duration) bool {
	conn, err := net.DialTimeout("tcp", net.JoinHostPort(host, port), timeout)
	if err != nil {
		return false
	}
	_ = conn.Close()
	return true
}

// HealthOK GETs url and expects 200 within timeout.
func HealthOK(url string, timeout time.Duration) bool {
	client := &http.Client{Timeout: timeout}
	resp, err := client.Get(url)
	if err != nil {
		return false
	}
	defer resp.Body.Close()
	_, _ = io.Copy(io.Discard, io.LimitReader(resp.Body, 256))
	return resp.StatusCode == http.StatusOK
}

// Tail returns the last n lines of path (whole file when shorter).
func Tail(path string, n int) (string, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return "", err
	}
	lines := strings.Split(strings.TrimRight(string(data), "\n"), "\n")
	if len(lines) > n {
		lines = lines[len(lines)-n:]
	}
	return strings.Join(lines, "\n") + "\n", nil
}
