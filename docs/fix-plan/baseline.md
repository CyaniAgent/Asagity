# Asagity `go test` 基线（修复前）

> 生成时间：Sprint 0 / T0.2
> 环境：Windows 11，`CGO_ENABLED=0`，无 gcc

## 失败用例（6 个）

包：`internal/platform/database`

| 用例 | 失败原因 |
|------|---------|
| `seed_test.go` 全部 6 个 | `go-sqlite3 requires cgo to work. This is a stub` |

## 根因

- `gorm.io/driver/sqlite` 在 `CGO_ENABLED=0` 时回退到 stub，无法打开数据库。
- 默认 `CGO_ENABLED=0`，Windows 环境无 gcc，导致测试完全无法运行。

## 修复目标（Sprint 2 / T2.1）

测试改用 `modernc.org/sqlite` 纯 Go 驱动，消除 CGO 依赖，使 `CGO_ENABLED=0 go test ./...` 全绿。

## 通过项

- `go vet ./...`：无告警
- `go build ./...`：通过