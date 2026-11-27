module github.com/CyaniAgent/Asagity/core/src/Verse.Cli

go 1.26.1

// 与 Verse.Engine 对齐的工具链下限（govulncheck/gosec 之外，dump-dev-version
// workflow 用 go-version-file 读本文件）：go1.26.11 修 net/http GO-2026-6859。
toolchain go1.26.11

require (
	charm.land/bubbles/v2 v2.2.2
	charm.land/bubbletea/v2 v2.2.0
	charm.land/lipgloss/v2 v2.1.1
)

require (
	github.com/atotto/clipboard v0.1.4 // indirect
	github.com/charmbracelet/colorprofile v0.4.3 // indirect
	github.com/charmbracelet/ultraviolet v0.0.0-20261125122737-8ed499892fb4 // indirect
	github.com/charmbracelet/x/ansi v0.12.0 // indirect
	github.com/charmbracelet/x/term v0.2.2 // indirect
	github.com/charmbracelet/x/termios v0.1.1 // indirect
	github.com/charmbracelet/x/windows v0.2.2 // indirect
	github.com/clipperhouse/displaywidth v0.11.0 // indirect
	github.com/clipperhouse/uax29/v2 v2.7.0 // indirect
	github.com/lucasb-eyer/go-colorful v1.4.1 // indirect
	github.com/mattn/go-runewidth v0.0.31 // indirect
	github.com/muesli/cancelreader v0.2.2 // indirect
	github.com/rivo/uniseg v0.4.8-0.20261110175422-3a370411ca06 // indirect
	github.com/xo/terminfo v1.3.1 // indirect
	golang.org/x/sync v0.25.0 // indirect
	golang.org/x/sys v0.50.0 // indirect
)
