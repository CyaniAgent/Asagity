package service

import (
	"strings"
	"testing"

	"github.com/CyaniAgent/Asagity/core/src/Verse.Engine/internal/platform/config"
)

// Version 必须携带真实 Go 工具链版本（web 系统信息窗口 · 服务端版本行）。
func TestVersionExposesGoRuntime(t *testing.T) {
	svc := New(nil, config.Config{AppVersion: "v2026.Q4"})
	got := svc.Version()

	if got.Name != "Asagity Core" {
		t.Fatalf("Name = %q, want %q", got.Name, "Asagity Core")
	}
	if got.Version != "v2026.Q4" {
		t.Fatalf("Version = %q, want %q", got.Version, "v2026.Q4")
	}
	if !strings.HasPrefix(got.Runtime, "go") {
		t.Fatalf("Runtime = %q, want prefix %q (runtime.Version())", got.Runtime, "go")
	}
}
