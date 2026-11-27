# Auth 模块迁移至 .NET（Auth-to-.NET Migration）

> 状态：**决策已定——Auth 由 .NET 独占；Go Auth 遗留代码已清空（2026-11-27）；
> .NET S5b（邮箱验证码 / 设备信任 / 会话持久化）待实施**
> 依据：[技术栈审计](../architecture/tech-stack-audit.md) §5 S5/S5b。
> 本文同时作为**已删除 Go 实现的契约存档**——后续实现一律以本文为准，不得回头引用旧代码。

## 1. 决策与已完成动作

技术栈红线：**公共 REST API 与业务模块归 .NET，Go 只保留 core 服务**（事件总线、
WebSocket、搜索、联邦、队列、缓存、模式）。Auth 属业务模块，故整体迁至 .NET，
Go 引擎不再提供任何形态的 `/api/auth/*`（含 databaseless mock）。

已执行的清空动作（2026-11-27，均经 `go build` / `go vet` / `go test ./...` 全绿验证）：

| 位置 | 动作 |
|---|---|
| `core/src/Verse.Engine/internal/module/auth/` | **整目录删除**：`module.go` / `handler/` / `service/` / `dto/` / `model/` / `repository/`（6 组文件） |
| `internal/app/app.go` | 删除 `authmodule` import 与 `authmodule.Register(mux, cfg, clients, eventBus)` |
| `internal/platform/database/database.go`、`lite.go` | 删除 `authmodel` import 与 `auth_devices` / `auth_refresh_tokens` / `auth_email_challenges` 的 `AutoMigrate` 条目 |
| `internal/mock/mock.go` | 删除 9 条 `/api/auth/*` mock 路由与 `fakeAuth()`；databaseless 模式不再伪造 Auth |

**保留在 Go 的相邻资产**（非 Auth 业务代码，按审计红线属于 core 基建）：

- `internal/platform/mail`：SMTP 发信能力（当前无调用方，待 .NET 侧决定是否以独立邮件服务复用）。
- `internal/platform/event` 的 `AuthLogin` / `AuthRefresh` / `AuthPayload` 等事件契约常量。
- `internal/platform/jwtx` 的密钥派生（与 .NET `JwtSecrets.DeriveKey` 同为 SHA-256(secret)）。

验证结果：`grep` 全仓 Go 代码 `module/auth` / `authmodel` / `fakeAuth` 残留 **0 处**。

## 2. .NET 现状盘点（S5 已完成部分）

`Verse.Api/Program.cs` 已装配 `AuthModule.AddServices` + `AuthModule.Register`，9 条路由均已映射。

| 能力 | 现状 | 证据 |
|---|---|---|
| 用户名密码注册 / 登录 | ✅ 已实现 | `AuthService.cs`：校验、唯一性、防账号枚举；新哈希 PBKDF2-SHA256(210k)，`PasswordHasher.Verify` 兼容 Go bcrypt（`$2a$/$2b$`，BCrypt.Net-Next 4.2.1） |
| JWT 签发 / 校验 | ✅ 已实现 | `JwtTokenIssuer.cs`（claims `sub/pubid/grp/iat`、HS256、30min）；`JwtMiddleware`（可选 Bearer）+ `ScopeGuardMiddleware` |
| Refresh / 轮换 / 登出 / me | ✅ 已实现 | `refresh_token` Cookie（30 天）、`AuthService.RefreshAsync` 先消费旧 token 再签新；`LogoutAllAsync` 撤销全部会话 |
| DTO / 错误码 / 包络 | ✅ 已对齐 | `Dtos.cs`、`Service.cs` 的 `AuthErrors` 由 Go 常量移植 |
| 单测 | ✅ 13 个测试方法 | `Verse.Tests/AuthServiceTests.cs`（11 `[Fact]` + 2 `[Theory]`，含 Go bcrypt 兼容、token 轮换、非法输入） |
| **邮箱验证码流程** | ❌ **501 未实现** | `RegisterWithEmailAsync` / `VerifyRegisterEmailAsync` / `VerifyLoginEmailAsync` / `SendLoginVerificationEmailAsync` 均抛 `EMAIL_AUTH_NOT_IMPLEMENTED` |
| **设备指纹 / 信任** | ❌ 缺失 | `AuthModule` 读取 `X-Device-Fingerprint` / `X-Device-Name` 但只传给 501 stub；`Device` 实体未注册进 `VerseDbContext` |
| **会话持久化** | ⚠️ 单机 | `InMemoryRefreshTokenStore`（ConcurrentDictionary）；多副本不共享 |
| 事件上报 | ❌ 缺失 | 注册 / 登录 / 刷新事件未发出 |
| `GET /api/auth/devices` | ❌ 缺失 | 前端 `Termity.tsx` 已在调用，Go 删除前也不存在 |

## 3. 契约存档（已删除的 Go 实现，唯一事实源）

### 3.1 端点与语义

| 方法 | 路径 | 成功 | 失败（code） | 备注 |
|---|---|---|---|---|
| POST | `/api/auth/register` | 201 + AuthResponse | 400 `INVALID_REQUEST` / 409 `REGISTRATION_FAILED` | 带 email 时拒绝，须走验证流程 |
| POST | `/api/auth/register/with-email` | 200 + `{challenge_id, expires_at}` | 400 `REGISTRATION_FAILED` | 返回验证码挑战，不发 token |
| POST | `/api/auth/register/verify-email` | 200 + AuthResponse | 400 `VERIFICATION_FAILED` | 成功后写 Cookie |
| POST | `/api/auth/login` | 200 + AuthResponse | 401 `LOGIN_FAILED`（`ERR 14101`） | identifier = pubid / email / username |
| POST | `/api/auth/login/verify-email` | 200 + AuthResponse | 400 `VERIFICATION_FAILED` | 依赖设备请求头 |
| POST | `/api/auth/refresh` | 200 + AuthResponse | 401 `REFRESH_FAILED`（`ERR 14102`） | Cookie 优先，body 兜底；轮换 |
| POST | `/api/auth/logout` | 200 + `{status:"ok"}` | 401 `UNAUTHORIZED` | 需 Bearer；删 Cookie |
| POST | `/api/auth/logout-all` | 200 + `{status:"ok"}` | 401 `UNAUTHORIZED` | 撤销该用户全部 refresh |
| GET | `/api/auth/me` | 200 + UserResponse | 401 `UNAUTHORIZED` / 404 `USER_NOT_FOUND` | 需 Bearer |

### 3.2 DTO（字段名必须逐字保持）

- `RegisterRequest`: `username`、`email?`、`password`（3–64 / email / ≥8）
- `LoginRequest`: `identifier`、`password`
- `VerifyEmailRequest`: `challenge_id`、`code`（6 位）
- `AuthResponse`: `access_token`、`refresh_token`、`user`
- `UserResponse`: `id`、`pub_id`、`username`、`name`、`avatar_url`
- `RegisterSendCodeResponse` / `LoginChallengeResponse`: `challenge_id`、`expires_at`（RFC3339）
- 登出成功体：`{ "status": "ok" }`

### 3.3 常量与令牌契约

| 项 | 值 |
|---|---|
| Access Token | 30 分钟，HS256，claims `sub` / `pubid` / `grp` / `iat` / `exp` |
| 签名密钥 | `SHA256(JWT_SECRET)`（双栈一致，.NET `JwtSecrets.DeriveKey`） |
| Refresh Token | 32 随机字节 hex（64 字符），30 天，轮换（旧 token 消费后失效） |
| Cookie | `refresh_token`；`Path=/`、`MaxAge=2592000`、`Secure`、`HttpOnly`、`SameSite=Strict` |
| 验证码 | 6 位 hex（3 随机字节 `hex.EncodeToString`），有效期 **15 分钟** |
| 验证尝试 | 最多 **5 次**；第 5 次失败设 `cooldown_until = now + 15min` |
| 邮箱归一化 | `TrimSpace + ToLower` |

### 3.4 错误码表

`ERR 14101`（凭据错误）、`ERR 14102`（refresh 无效）、`INVALID_REQUEST`、`REGISTRATION_FAILED`、
`LOGIN_FAILED`、`REFRESH_FAILED`、`LOGOUT_FAILED`、`LOGOUT_ALL_FAILED`、`UNAUTHORIZED`、
`USER_NOT_FOUND`、`VERIFICATION_FAILED`、`EMAIL_AUTH_NOT_IMPLEMENTED`。

> 注：.NET `EmailAuthNotImplemented.Error()` 当前返回 501。该端点迁移完成后此错误码必须消失。

## 4. 目标架构与写入权

```
.NET Verse.Api        /api/auth/* 路由、Jwt/Scope 中间件、包络、Cookie（唯一入口）
.NET Verse.Modules    AuthService：注册/登录/验证码/设备/会话/事件
.NET Verse.Data       EF Core：users / user_groups / auth_* 三表（唯一写入方）
.NET Verse.Shared     envelope / CurrentUser / scope / JwtSecrets
Go  Verse.Engine      **无 Auth 路由**；仅保留 eventbus/WS/cache/mail 等 core 能力
```

**切流守则**：双栈共用同一数据库期间，Auth 相关表**只允许 .NET 写入**；Go 侧
`user` 模块不得再写 `users` 的密码/邮箱字段。前端经 `toApiNetPath` 将
`NET_OWNED_AUTH_PATHS` 中的 6 条用户名/密码路径（login、register、refresh、me、
logout、logout-all）指向 `:2050`（`web/src/lib/backend.ts`），Go `:2048` 的对应路由已不存在。
**已知缺口**：邮箱验证与挑战路径（`register/with-email`、`register/verify-email`、
`login/verify-email`）及 `GET /api/auth/devices` 尚未纳入该集合；Go 删除后这些路径在
`:2048` 返回 404，而 .NET 侧目前为 501 stub 或缺失（见 §2）。它们须在 S5b 实施时
一并把路径切到 :2050 并补齐实现，不能视为已切流完成。

## 5. 数据模型设计（EF Core ↔ 已删除的 GORM 模型）

`Verse.Module.Auth/Models.cs` 已有三个实体类，但**未注册进 `VerseDbContext`**，且
`RefreshToken` 缺 `TokenHash`、`EmailChallenge` 缺 `CodeHash`——必须补齐后以显式
migration 建表（现状 `EnsureCreated` 不会改写已存在的库）。

| 表 | 关键列（与 Go GORM 逐列对齐） |
|---|---|
| `auth_devices` | `id`(PK,64)、`user_id`(idx)、`device_fingerprint`(idx,255)、`device_name`、`user_agent`、`ip_address`、`last_seen_at`、`trusted_at?`、`created_at` |
| `auth_refresh_tokens` | `id`(PK,64)、`user_id`(idx)、`device_id`(idx)、**`token_hash`(text，只存哈希)**、`expires_at`、`created_at`、`revoked_at?`、`replaced_by_token_id?` |
| `auth_email_challenges` | `id`(PK,64)、`user_id`(idx)、`device_fingerprint`(idx)、`email`(idx,320)、**`code_hash`(text)**、`purpose`(idx,64)、`attempt_count`(默认 0)、`cooldown_until?`(idx)、`resend_available_at?`、`expires_at`、`verified_at?`、`created_at` |

待注册数据载体：Go 用缓存键 `register:{challenge_id}` 存 JSON
`{username, email, password_hash}`（TTL 15min）。.NET 可选：
① 新增 .NET Valkey client 复用缓存（推荐，与我方 Valkey 迁移一致）；② 在 challenge
表加 JSON 列。**待拍板**。

## 6. 流程设计

### 6.1 邮箱注册（`register/with-email` → `register/verify-email`）

1. `NormalizeEmail`，查重（email + username）。
2. 生成 6 位验证码 → bcrypt/PBKDF2 哈希 `code_hash`；密码哈希写入待注册数据
   （.NET 新写入建议 PBKDF2，`PasswordHasher` 双格式可验证）。
3. 建 `EmailChallenge`（`purpose=register_with_email`、15min 过期）；待注册数据写缓存。
4. 发信（MailKit，见 §6.5）；返回 `{challenge_id, expires_at}`。
5. 验证：**按 ID 精确查询**（严禁「按 email 取最新」——见
   [评审](../review/2026.11.4.1.md) #10/#11 的历史坑）→ 校验过期 / 已验证 /
   尝试次数 → 比对 `code_hash`；失败则 `attempt_count++`，达 5 次写冷却。
6. 成功：读回并删除待注册数据 → 建用户 → 标记 `verified_at` → 发
   `user.registered` 事件 → 签 token + 写 Cookie → 返回 AuthResponse。

### 6.2 登录与新设备验证（`login` → `login/verify-email`）

> Go 的 `SendLoginVerificationEmail` 是**未被调用的死代码**，`Login()` 直接签 token；
> 因此这里不是照搬，而是补全设计。**待拍板**：是否强制新设备验证（影响前端体验）。

1. 凭据校验成功（统一 `ERR 14101`，防枚举）。
2. 若用户有邮箱且 `device_fingerprint` 不在信任设备表 → 建
   `login_new_device` challenge + 发信 → 返回挑战响应（建议 **202** +
   `LoginChallengeResponse`，需前端支持）。
3. 否则 upsert `auth_devices`（`last_seen_at`），签 token。
4. `login/verify-email` 带设备请求头 → 按 ID 校验 challenge（同 §6.1 的
   过期/尝试/冷却规则）→ 标记设备 `trusted_at` → 签 token + 写 Cookie。
5. 补 `GET /api/auth/devices` 返回该用户设备列表（前端已在调用）。

### 6.3 Refresh 与登出

- refresh 以**哈希**入库，轮换时 `replaced_by_token_id` 指向新 token；旧 token 立刻 revoke。
- `logout` 撤当前 token；`logout-all` 用 `user_id` 索引批量 revoke（消灭 Go 曾用的
  `KEYS` 扫描模式）。`IRefreshTokenStore` 由同步接口改为 async，实现落 EF Core/Valkey。

### 6.4 邮件服务（.NET 新增 `MailService`）

- 配置：`MAIL_SMTP_HOST` / `MAIL_SMTP_PORT` / `MAIL_SMTP_USER` / `MAIL_SMTP_PASSWORD` /
  `MAIL_FROM` / `MAIL_FROM_NAME`（与 Go `config.go` 同名）。
- 库：MailKit（`SmtpClient` 在 .NET 已弃用）；验证码生成沿用 `hex(3 random bytes)`。
- 主题/正文沿用 Go 中文模板：`【Asagity】注册验证码` / `【Asagity】登录验证码`，
  正文注明「15 分钟内有效」；`IsEnabled` 为 false 时只建 challenge 不发信。

### 6.5 事件

注册 / 登录 / 刷新分别发 `user.registered` / `auth.login` / `auth.refresh`，载荷
`{user_id, pub_id, timestamp}`（与 Go `AuthPayload` 一致）；经 Valkey Pub/Sub
桥接 Go EventBus，或引入 outbox 表保证最终一致。

## 7. 分阶段实施与验收

| 阶段 | 内容 | 验收 |
|---|---|---|
| P0 契约冻结 | 本文 §3 定为唯一契约；前端 `toApiNetPath` 指向 :2050；Go `/api/auth/*` 已删 | 前端登录/注册走 .NET，Go 无 auth 路由 |
| P1 数据层 | 补 `TokenHash` / `CodeHash`、注册 3 个 DbSet、EF migration 建表 | 三表存在且与 GORM 列名一致 |
| P2 邮箱注册 | `MailService` + `register/with-email` + `verify-email` | 发信、验证成功、5 次冷却、过期/重复验证拒绝 |
| P3 设备流 | 登录挑战 + `login/verify-email` + `/devices` | 新设备先挑战后签 token，信任设备直登 |
| P4 会话持久化 | async `IRefreshTokenStore` + EF/Valkey 实现 + 轮换/revoke-all | 多副本共享会话，旧 token 立即失效 |
| P5 事件与切流 | 事件上报、契约对照测试、单写切换 | `dotnet test` 全绿，双栈无写冲突 |
| P6 可选清理 | 评估 `platform/mail` 与 event 常量是否随 S8 删除 | 无残留死代码 |

## 8. 风险与未决项

1. **共用库期双写**：Auth 写入权必须唯一归 .NET，否则 bcrypt/PBKDF2 哈希漂移。
2. **设备挑战是新增设计**：Go 原本未实现，需产品/前端先拍板响应形态与是否强制。
3. **待注册数据载体**：Valkey client vs DB JSON 列（§5）。
4. **`JwtSecrets.DefaultSecret` 硬编码**：`JwtSecrets.cs` 仍有默认密钥，而 Go 侧已做生产
   强校验——.NET 应同步补 `JWT_SECRET` 生产校验（与 [评审](../review/2026.11.4.1.md) §6-1 对齐）。
5. **databaseless mock 已消失**：Go mock Auth 路由随本次清空删除，演示模式需由 .NET
   mock/种子账号承接（S7 范围）。
6. **schema 演进**：`EnsureCreated` 不改写既有表，新增列/表必须走显式 migration。

## 9. 验收测试清单

验证码：正确 / 错误累计 5 次与冷却 / 过期 / 已验证 / 按 ID 隔离（并发两 challenge 不串号）；
注册：重复用户名与邮箱、email 归一化、待注册数据缺失；登录：pubid/email/username 三种
identifier、Go bcrypt 旧哈希、未知用户与错密码同错误；令牌：轮换后旧 token 失效、
logout-all 撤销全部、Cookie 属性；设备：新设备挑战、信任后直登、`/devices` 列表；
契约：状态码、错误码、字段名、claims 与本文 §3 逐项对照。

## 10. 相关文档

- [技术栈审计（S5/S5b 路线）](../architecture/tech-stack-audit.md)
- [shen 安全修复评审（#10/#11 与 JWT 注意点）](../review/2026.11.4.1.md)
- [权限契约（scope 表）](../api/permissions.md)
- [数据库现状](../sql/current-state.md)
- [版本号治理](../architecture/versioning.md)
- [前端后端路由映射](../../web/src/lib/backend.ts)
