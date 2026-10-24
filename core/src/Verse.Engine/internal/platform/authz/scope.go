// Package authz codifies docs/api/permissions.md in the API logic layer.
//
// It is the single source of truth for core scope strings, their
// write-implies-read expansion, and the Require/RequireAdmin enforcement
// used when wiring module routes. Scope semantics (consent, deny,
// dynamic grants) are designed in docs/aabp/permissions.md.
package authz

import "strings"

// Status mirrors the ✅/🚧/📝 markers of docs/api/permissions.md.
type Status string

const (
	StatusImplemented Status = "implemented"
	StatusPartial     Status = "partial"
	StatusReserved    Status = "reserved"
)

// Level is the minimum trust tier that may hold the scope
// (L1 sandbox, L2 SQL, L3 global; see docs/aabp/trust.md).
type Level string

const (
	LevelSandbox Level = "L1"
	LevelSQL     Level = "L2"
	LevelGlobal  Level = "L3"
)

// Definition describes one core scope.
type Definition struct {
	Name     string
	Desc     string
	MinTrust Level
	Status   Status
}

// Registry lists every core scope, including reserved names claimed ahead
// of their endpoints so future scopes cannot collide.
var Registry = []Definition{
	{Name: "account:read", Desc: "查看自身账户与公开资料", MinTrust: LevelSandbox, Status: StatusImplemented},
	{Name: "account:write", Desc: "修改自身资料（含 pubid）", MinTrust: LevelSandbox, Status: StatusImplemented},

	{Name: "notes:read", Desc: "读取动态、时间线、投票结果、搜索", MinTrust: LevelSandbox, Status: StatusImplemented},
	{Name: "notes:write", Desc: "发布/编辑/删除动态、回应、投票", MinTrust: LevelSandbox, Status: StatusImplemented},

	{Name: "drive:read", Desc: "列取文件、查看用量", MinTrust: LevelSandbox, Status: StatusImplemented},
	{Name: "drive:write", Desc: "建夹/改名/移动/删除/上传", MinTrust: LevelSandbox, Status: StatusPartial},

	{Name: "follow:read", Desc: "查看关注者/正在关注/计数/待处理请求", MinTrust: LevelSandbox, Status: StatusImplemented},
	{Name: "follow:write", Desc: "关注/取关/处理关注请求", MinTrust: LevelSandbox, Status: StatusImplemented},

	{Name: "blocks:read", Desc: "查看黑名单（预留）", MinTrust: LevelSandbox, Status: StatusReserved},
	{Name: "blocks:write", Desc: "编辑黑名单（预留）", MinTrust: LevelSandbox, Status: StatusReserved},
	{Name: "mutes:read", Desc: "查看屏蔽列表（预留）", MinTrust: LevelSandbox, Status: StatusReserved},
	{Name: "mutes:write", Desc: "编辑屏蔽列表（预留）", MinTrust: LevelSandbox, Status: StatusReserved},

	{Name: "asset:read", Desc: "远端图标代理", MinTrust: LevelSandbox, Status: StatusImplemented},
	{Name: "music:read", Desc: "音质标签查询", MinTrust: LevelSandbox, Status: StatusImplemented},

	{Name: "shell:execute", Desc: "执行 Termity 后端命令", MinTrust: LevelGlobal, Status: StatusPartial},

	{Name: "topics:read", Desc: "话题发现/趋势（预留）", MinTrust: LevelSandbox, Status: StatusReserved},
	{Name: "topics:write", Desc: "话题运营操作（预留）", MinTrust: LevelSandbox, Status: StatusReserved},
	{Name: "notifications:read", Desc: "查看通知（预留）", MinTrust: LevelSandbox, Status: StatusReserved},
	{Name: "notifications:write", Desc: "管理通知（预留）", MinTrust: LevelSandbox, Status: StatusReserved},
	{Name: "messaging:read", Desc: "查看私信（预留）", MinTrust: LevelSandbox, Status: StatusReserved},
	{Name: "messaging:write", Desc: "发送/删除私信（预留）", MinTrust: LevelSandbox, Status: StatusReserved},
	{Name: "favorites:read", Desc: "查看收藏（预留）", MinTrust: LevelSandbox, Status: StatusReserved},
	{Name: "favorites:write", Desc: "编辑收藏（预留）", MinTrust: LevelSandbox, Status: StatusReserved},

	{Name: "admin:meta:read", Desc: "查看实例元信息", MinTrust: LevelGlobal, Status: StatusImplemented},
	{Name: "admin:system:read", Desc: "查看系统环境与数据库统计", MinTrust: LevelGlobal, Status: StatusImplemented},
	{Name: "admin:users:read", Desc: "查看用户管理信息（预留）", MinTrust: LevelGlobal, Status: StatusReserved},
	{Name: "admin:users:write", Desc: "用户管理操作（预留）", MinTrust: LevelGlobal, Status: StatusReserved},
	{Name: "admin:drive:read", Desc: "查看用户网盘信息（预留）", MinTrust: LevelGlobal, Status: StatusReserved},
	{Name: "admin:federation:read", Desc: "查看联邦信息（预留）", MinTrust: LevelGlobal, Status: StatusReserved},
	{Name: "admin:federation:write", Desc: "联邦管理操作（预留）", MinTrust: LevelGlobal, Status: StatusReserved},
}

// ByName looks a scope definition up by name.
func ByName(name string) (Definition, bool) {
	for _, d := range Registry {
		if d.Name == name {
			return d, true
		}
	}
	return Definition{}, false
}

// Valid reports whether name is a registered core scope.
func Valid(name string) bool {
	_, ok := ByName(name)
	return ok
}

// IsAdminScope reports whether name belongs to the admin family,
// which is independent from user scopes (no mutual implication).
func IsAdminScope(name string) bool {
	return strings.HasPrefix(name, "admin:")
}

// Expand returns the granted set plus implied scopes: within one domain,
// write implies read ("notes:write" → "notes:read",
// "admin:users:write" → "admin:users:read"). Unknown names pass through
// untouched so checks stay fail-closed at the Require site.
func Expand(granted []string) map[string]bool {
	out := make(map[string]bool, len(granted)*2)
	for _, name := range granted {
		name = strings.TrimSpace(name)
		if name == "" {
			continue
		}
		out[name] = true
		if idx := strings.LastIndex(name, ":"); idx > 0 && name[idx+1:] == "write" {
			out[name[:idx]+":read"] = true
		}
	}
	return out
}
