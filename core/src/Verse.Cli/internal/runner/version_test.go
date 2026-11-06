package runner

import (
	"os"
	"path/filepath"
	"regexp"
	"testing"
)

// appVersion 的优先级契约（docs/architecture/versioning.md §4.1）：
// APP_VERSION env > /VERSION 文件 > git 派生 {year}.{count}+{sha} > "dev"。

func TestAppVersionEnvOverrideWins(t *testing.T) {
	t.Setenv("APP_VERSION", "2026.Q4.1")
	// 即使目录里没有 VERSION 文件、也不是 git 仓库，显式 env 也必须生效。
	if got := appVersion(t.TempDir()); got != "2026.Q4.1" {
		t.Fatalf("appVersion() = %q, want %q", got, "2026.Q4.1")
	}
}

func TestAppVersionReadsVersionFile(t *testing.T) {
	t.Setenv("APP_VERSION", "")
	dir := t.TempDir()
	if err := os.WriteFile(filepath.Join(dir, "VERSION"), []byte(" 2026.Q4.1 \n"), 0o644); err != nil {
		t.Fatal(err)
	}
	if got := appVersion(dir); got != "2026.Q4.1" {
		t.Fatalf("appVersion() = %q, want %q (trimmed VERSION file)", got, "2026.Q4.1")
	}
}

func TestAppVersionGitDerived(t *testing.T) {
	t.Setenv("APP_VERSION", "")
	root := repoRoot(t)
	if root == "" {
		t.Skip("not inside a git checkout")
	}
	got := appVersion(root)
	// {UTC 年份}.{commit 总数}+{短哈希}
	if ok := regexp.MustCompile(`^\d{4}\.\d+\+[0-9a-f]+$`).MatchString(got); !ok {
		t.Fatalf("appVersion() = %q, want {year}.{count}+{sha} form", got)
	}
}

func TestAppVersionFallsBackToDev(t *testing.T) {
	t.Setenv("APP_VERSION", "")
	dir := t.TempDir()
	// 若临时目录碰巧在某个 git 仓库内则跳过（git 会向父目录查找）。
	if gitLine(dir, "rev-parse", "--git-dir") != "" {
		t.Skip("temp dir is inside a git repository")
	}
	if got := appVersion(dir); got != "dev" {
		t.Fatalf("appVersion() = %q, want %q", got, "dev")
	}
}

// repoRoot walks up from the test's working directory to the checkout root.
func repoRoot(t *testing.T) string {
	t.Helper()
	dir, err := os.Getwd()
	if err != nil {
		t.Fatal(err)
	}
	for {
		if _, err := os.Stat(filepath.Join(dir, ".git")); err == nil {
			return dir
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			return ""
		}
		dir = parent
	}
}
