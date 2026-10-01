# Asagity 核心权限列表（Core Scopes）

> 项目级 scope 定义：App 在 manifest `permissions` 中声明、Bridge 逐调用检查的唯一依据。
> 仿 Misskey 权限表思路，按 Asagity 实际模块与端点改写；语义细则（consent / deny / 动态授权）见 `../aabp/permissions.md`（待写）。

## 1. 格式与规则

- 格式：`<domain>:<action>`，管理域为三段 `<admin>:<domain>:<action>`，全小写 kebab/camel 不混用。
- 蕴含：同域内 `write` ⊃ `read`（申请 `notes:write` 即含 `notes:read`）；`admin:*` 独立，不蕴含也不被蕴含。
- 状态：✅ 已实现 / 🚧 部分实现 / 📝 预留（名称先行占位，端点未到）。
- 版本：本表随 `compatibility.api` 版本演进，只加不改（见 AABP 版本铁律）。

## 2. 账户与用户

| Scope | 覆盖端点 | 最低信任 | 状态 |
|---|---|---|---|
| `account:read` | `GET /api/auth/me`、`GET /api/users/me`、`GET /api/users/me/pubid/history` | L1 | ✅ |
| `account:write` | `POST /api/users/me/pubid`（每月限次，见 user 模块） | L1 | ✅ |

公开无需 scope：`POST /api/auth/register*`、`POST /api/auth/login*`、`POST /api/auth/refresh`、`POST /api/auth/logout*`（登出需登录态但不占 scope）。

## 3. 动态（Note）

| Scope | 覆盖端点 | 最低信任 | 状态 |
|---|---|---|---|
| `notes:read` | `GET /api/notes/{id}`、`GET /api/timeline/{type}`、`GET /api/notes/{id}/poll`、`GET /api/notes/{id}/edits`、`GET /api/search/*`（含 regexp/suggest） | L1 | ✅ |
| `notes:write` | `POST /api/notes`、`PATCH/DELETE /api/notes/{id}`、`POST/DELETE /api/notes/{id}/react`、`POST /api/notes/{id}/vote`（投票并入写，不单列 `votes`） | L1 | ✅ |

说明：搜索是读操作，不设独立 `search` 域；Misskey 的 `pages/gallery/channels/flash` 系 Misskey 特有，不引入。

## 4. 云盘（Skyline Drive）

| Scope | 覆盖端点 | 最低信任 | 状态 |
|---|---|---|---|
| `drive:read` | `GET /api/drive/files*`、`GET /api/drive/usage` | L1 | ✅（读） |
| `drive:write` | `POST /api/drive/folders`、`PATCH/DELETE /api/drive/files/{id}`、`POST /api/drive/files/{id}/move`、分片上传（规划中） | L1 | 🚧（分片上传未到） |

## 5. 社交图谱

| Scope | 覆盖端点 | 最低信任 | 状态 |
|---|---|---|---|
| `follow:read` | `GET /api/users/{id}/followers|following|follow-count`、`GET /api/follow/requests/pending` | L1 | ✅ |
| `follow:write` | `POST/DELETE /api/users/{id}/follow`、`POST /api/follow/requests/{id}/accept|reject` | L1 | ✅ |
| `blocks:read` / `blocks:write` | 黑名单（对标 Misskey blocks） | L1 | 📝 预留 |
| `mutes:read` / `mutes:write` | 屏蔽列表（对标 Misskey mutes） | L1 | 📝 预留 |

## 6. 资产与音乐（公开端点，scope 预留）

| Scope | 覆盖端点 | 最低信任 | 状态 |
|---|---|---|---|
| `asset:read` | `GET /api/asset/icon`（远端图标代理；当前公开） | L1 | ✅（端点公开，scope 预留收紧用） |
| `music:read` | `GET /api/music/quality-tags`（音质标签；当前公开） | L1 | ✅（同上） |

## 7. 终端（Termity Shell）

| Scope | 覆盖端点 | 最低信任 | 状态 |
|---|---|---|---|
| `shell:execute` | `GET /api/shell/ping`、`GET /api/shell/vnet`（`.tms` 脚本执行见 `../file-format/tms.md`） | L3 | 🚧 |

说明：Shell 可执行后端命令，列为高危 scope，仅 L3 且须显式 consent；当前端点公开是开发期状态，收紧后以本表为准。

## 8. 管理域（L3 专属）

| Scope | 覆盖端点 | 状态 |
|---|---|---|
| `admin:meta:read` | `GET /api/meta/version`、`GET /api/meta/instance`（当前公开，收紧用） | ✅（端点公开） |
| `admin:system:read` | `GET /api/system/environment`、`GET /api/admin/system/instance|database` | ✅ |
| `admin:users:read` / `admin:users:write` | 用户管理（冻结/重置/备注等，对标 Misskey admin users 系） | 📝 预留 |
| `admin:drive:read` | 查看用户网盘信息 | 📝 预留 |
| `admin:federation:read` / `admin:federation:write` | 联邦（Verse/ActivityPub）管理 | 📝 预留 |

公开无需 scope：`GET /`、`GET /healthz`。

## 9. 预留（README 功能对齐，先占名）

| Scope | 对应功能 | 状态 |
|---|---|---|
| `topics:read` / `topics:write` | README Topics System（话题发现/趋势） | 📝 预留 |
| `notifications:read` / `notifications:write` | 通知（前端已有消费，见 `web`；后端模块未到） | 📝 预留 |
| `messaging:read` / `messaging:write` | 私信/聊天（对标 Misskey messaging/chat） | 📝 预留 |
| `favorites:read` / `favorites:write` | 收藏（对标 Misskey favorites） | 📝 预留 |

## 10. manifest 用法示例
```json
"permissions": ["notes:read", "notes:write", "drive:read"],
"deny": ["account:write"]
```

- 申请即按 §1 蕴含展开；`deny` 恒优先；运行时提权走动态授权（见 `../aabp/trust.md` §4）。
- 本表新增 scope 必须同步：实现端点的 scope 检查 + 本表状态翻绿 + `compatibility.api` 次版本 +1。

## 11. 实施映射（代码侧）

- 唯一事实源：`core/src/Verse.Engine/internal/platform/authz/scope.go`（`Registry` 与本表一一对应，含预留名占位）。
- 主体与判定：`principal.go`（self token 持全部非 admin scope；scoped app token 持授予展开；admin 域双重门控）。
- 执行层：`require.go`（`Require`/`RequireAdmin`，401 沿用既有语义，403 `PERMISSION_DENIED` 具名缺失 scope）。
- 身份扩展：JWT 新增 `grp`（用户组，`admin` 即管理员）、预留 `scope`/`app`（app token 到达即生效，中间件已解析）。
- 路由接线（`*/module.go`）：note 写操作→`notes:write`；drive 读写→`drive:read/write`；follow 写→`follow:write`；user→`account:read/write`；`/api/admin/*`→`RequireAdmin`；公开读与 auth/asset/shell/music 保持现状（shell 收紧见 §7）。
