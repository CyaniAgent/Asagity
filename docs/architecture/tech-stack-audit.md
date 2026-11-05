# 后端技术栈审计（Tech Stack Audit）

> 红线：**核心服务用 Go，API 与业务模块用 .NET（ASP.NET Core）**。
> 审计日期：2026-10-17，范围 `core/src/`。

## 1. 结论

**存在明显技术栈错位**：Go 侧 `Verse.Engine` 目前同时承担了「核心服务」与「API + 业务模块」两份职责；
而 .NET 侧 `Verse.Modules` 的 8 个业务模块全是 `501 Not Implemented` 桩。
结果是**同一批路由在两个语言里各注册一遍**（Go `:2048` 真实实现 / C# `:2050` 空壳），行为分裂、契约双份维护。

## 2. 证据：路由双注册

| 域 | Go `internal/module/*`（有实现） | .NET `Verse.Module.*`（桩） |
|---|---|---|
| auth | 9 个 `/api/auth/*` | 同 9 个（501） |
| user | 3 个 `/api/users/me*` | 同 3 个（501） |
| instance | 8 个（含 `/healthz`、`/api/meta/*`、`/api/admin/*`） | 同 7 个（501） |
| drive | 7 个 `/api/drive/*` | 同 7 个（501） |
| follow | 8 个 `/api/users/{id}/follow*` | 同 8 个（501） |
| note | 12 个 `/api/notes|timeline|search` | 同 12 个（501） |
| asset | `/api/asset/icon` | 同 1 个（501） |
| shell | `/api/shell/ping`、`/api/shell/vnet` | 另有一套 `/meta`、`/github/*`（已实现，非桩） |

## 3. 归位表（现状 → 应在）

| 代码 | 现状位置 | 应在 | 判定 |
|---|---|---|---|
| 8 个业务模块实现（约 7000 行） | Go `internal/module/*` | .NET `Verse.Modules/*` | ❌ 错位 |
| 公共 REST API（路由/中间件/包络） | Go `internal/app` + `platform/httpx` + `cmd/api` | .NET `Verse.Api` | ❌ 错位 |
| 数据访问（GORM repository） | Go `internal/module/*/repository` | .NET 模块内（EF Core） | ❌ 错位 |
| JWT 签发 | Go auth service | .NET Auth 模块 | ❌ 错位 |
| 权限 scope 判定 | Go `platform/authz` | .NET `Verse.Shared`（Go 仅保留内部服务自用） | ❌ 错位 |
| 种子/开发账号 | Go `platform/database/seed.go` | .NET 数据层（迁移期双跑、幂等） | ❌ 错位 |
| databaseless mock（注册全套 API 路由） | Go `internal/mock` | .NET（API 层）或由 .NET 转发 | ❌ 错位 |
| 事件总线 EventBus / WS 推送 | Go `platform/event` + `platform/ws` | Go ✅ 保留 | ✅ 正确 |
| 搜索 Bleve → 后迁 VSQL | Go `platform/search` | Go ✅ 保留 | ✅ 正确 |
| 联邦 ActivityPub / NeoLinkage | Go `pkg/activitypub` | Go ✅ 保留 | ✅ 正确 |
| 工具链 versetool | Go `Verse.Cli` | Go ✅ 保留 | ✅ 正确 |
| 配置/模式/缓存/队列/邮件/ID 生成 | Go `platform/*` | Go ✅ 保留（core 基建） | ✅ 正确 |

## 4. 目标分层

```
.NET  Verse.Api      公共 API 入口：路由、中间件、鉴权校验、包络、模块装配
.NET  Verse.Modules  业务域：auth/user/instance/drive/follow/note/asset/shell/music
.NET  Verse.Shared   共享契约：envelope、principal、scope 表与 Require 守卫
.NET  Verse.Data     EF Core：DbContext、实体映射、provider 切换(SQLite/Npgsql)、种子
Go    Verse.Engine   核心服务：eventbus、ws、search/vsql、federation、queue、cache、mode
Go    Verse.Cli      运维工具：versetool
```

依赖方向：`.NET` →（必要时）`Go` 的内部服务接口；`Go` 绝不反向依赖 `.NET`。

## 5. 转译路线（按依赖顺序）

| 阶段 | 内容 | 备注 |
|---|---|---|
| S1 | `Verse.Shared` 补 authz（scope 表 + `RequireScope` + admin 守卫） | ✅ 已完成：与 Go `platform/authz` 同表同语义 |
| S2 | `Verse.Data`：EF Core DbContext + 实体映射 + provider 切换（lite=SQLite / prod=Npgsql） | ✅ 已完成：列名逐列对齐 GORM schema，共用同一库 |
| S3 | Instance 模块真化（repository + service，替换 501 桩） | ✅ 已完成：含 admin 守卫与开发者账号查询 |
| S4 | User 模块真化（me / pubid 变更 / 历史，含月度配额与格式规则） | ✅ 已完成：36 个 .NET 单测覆盖 |
| S5 | Auth 模块真化（签发 JWT + 邮件验证码 + refresh） | 打通 .NET 端登录闭环 |
| S6 | Drive / Follow / Note / Asset / Shell 依次真化 | Note 最大（含搜索） |
| S7 | databaseless mock 迁到 .NET；Go 引擎收缩为 `/internal/*` 内部服务 | 收尾：Go 只剩 core |
| S8 | Go 侧业务模块与 GORM repository 删除 | 终态清理 |

## 6. 风险与守则

1. **共用一库期**：迁移期 Go 与 .NET 同时访问同一张表，必须严格列名/约束对齐，且**单模块只由一侧写**（以 .NET 为最终写入方）。
2. **种子幂等**：两侧种子逻辑并存时按「管理员组是否已有账号」判定，双跑不重复插入。
3. **契约单一来源**：`docs/api/permissions.md` 的 scope 表是两侧共同事实源，改动必须两侧同步。
4. **不为了转译而转译**：Go 侧 core 服务（eventbus/ws/search/federation）留在 Go，不许回流 .NET。
5. **每片可验证**：每个模块转译后必须自带单测，且 .NET 侧不再返回 501。


## 7. 转译进度（2026-10-17 更新）

已完成 **S1–S4**，.NET 侧不再返回 501 的模块：instance、user。

期间修复的跨语言契约问题（两侧必须同步）：

1. **JWT 密钥长度**：.NET 的 HMAC-SHA256 要求密钥 ≥256 位，而共享 secret 只有 25 字节。
   两侧统一改为 `key = SHA-256(secret)` 派生（Go：`internal/platform/jwtx`；C#：`JwtMiddleware`）。
2. **JWT 声明映射**：`JwtSecurityTokenHandler` 默认把 `sub` 映射为 `ClaimTypes.NameIdentifier`，
   导致 `FindFirst("sub")` 恒为 null；.NET 侧改用 `MapInboundClaims = false`。
3. **.env 优先级**：Go 侧 `godotenv.Overload` 会让文件覆盖进程环境，导致 Verse tool 注入的端口失效；
   两侧统一改为“进程环境优先”（Go `godotenv.Load` / C# `DotEnv`）。
4. **时间戳格式**：GORM 写 `2026-10-21 06:03:18.016999146+08:00`，EF 默认解析器不认；
   .NET 侧加 `DateTimeConverters` 双向兼容。
5. **表名与自增**：`pub_id_changes`（非 `user_pubid_changes`）、`instance_settings.id` 用 long 自增。

验证：同一 SQLite 文件下两侧互认（.NET 签发的令牌 Go 引擎可验、.NET 种子 Go 侧跳过重播）。
