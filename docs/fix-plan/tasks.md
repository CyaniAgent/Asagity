# Asagity 仓库问题修复编码任务列表（tasks.md）

> 本文档基于 `design.md` 的 33 项修复方案与 4 批次迭代计划，拆解为原子化、可独立执行、可验证的编码任务。
>
> - **路径前缀**：Go Engine 根 `core/src/Verse.Engine/`（下文简记 `<engine>/`）；前端根 `web/`
> - **工作量**：S（<0.5d）/ M（0.5-1d）/ L（1-2d）
> - **Epic 标注**：合并方案标注同一 epic，子任务可并行但需整体回滚
> - **任务编号**：T<批次>.<序号>，全局唯一递增

---

## 1. Sprint 0：CI 骨架与基线确认

> 目标：建立门禁基线，记录 `go test` 现状，为后续批次提供回归对照。无前置依赖。

### 1.1 创建 GitHub Actions CI workflow 骨架
> **任务 ID**：T0.1 | **问题**：#32 | **Sprint**：0 | **工作量**：M | **依赖**：无

- [ ] 在 `.github/workflows/ci.yml` 创建 CI workflow，配置触发条件为 `push` + `pull_request`，包含 Go `vet`/`build`/`test` 矩阵、前端 `pnpm install`/`pnpm build`/`pnpm test`、`gosec` 与 `govulncheck` 安全扫描四个 job
- [ ] 配置 Go 测试矩阵：Linux `CGO_ENABLED=1` 跑全量 sqlite 用例，Windows `CGO_ENABLED=0` 跑非 sqlite 用例（`//go:build !cgo` 隔离）
- [ ] **验证**：提任意 PR 后 CI 自动运行 vet/build/test/安全扫描，workflow 语法校验通过（`actionlint`）

### 1.2 记录 go test 基线现状
> **任务 ID**：T0.2 | **问题**：#1（基线） | **Sprint**：0 | **工作量**：S | **依赖**：无

- [ ] 在 `<engine>/` 执行 `go vet ./...`、`go build ./...`、`go test ./...`，将当前失败用例清单（6 个 seed 相关 CGO 用例）记录到 `docs/fix-plan/baseline.md`，作为 Sprint 2 #1 修复前的对照基线
- [ ] **验证**：`baseline.md` 存在且列明失败用例与失败原因（CGO 缺失）

---

## 2. Sprint 1：P0 安全与功能阻断

> 目标：消除安全类阻断（密钥/CORS/JWT/WS/日志）与前端认证链路统一。#4 config 加固为 #6/#8 白名单的前置。

### 2.1 config 新增 CORS/WS 白名单字段
> **任务 ID**：T1.1 | **问题**：#6/#8 | **Sprint**：1 | **工作量**：S | **依赖**：无 | **Epic**：config-加固

- [ ] 在 `<engine>/internal/platform/config/config.go` 的 `Config` 结构新增 `CORSAllowedOrigins []string` 与 `WSAllowedOrigins []string` 字段，`Load()` 中从 `CORS_ALLOWED_ORIGINS`（逗号分隔）读取，`WSAllowedOrigins` 为空时复用 `CORSAllowedOrigins`
- [ ] dev 模式默认白名单含 `http://localhost:2000`、`http://127.0.0.1:2000`；production 模式白名单为空时返回 error
- [ ] **验证**：`go test ./internal/platform/config/...` 通过；production 不设 `CORS_ALLOWED_ORIGINS` 启动失败

### 2.2 config JwtSecret 生产强制校验
> **任务 ID**：T1.2 | **问题**：#4 | **Sprint**：1 | **工作量**：M | **依赖**：无 | **Epic**：config-加固

- [ ] 在 `<engine>/internal/platform/config/config.go` 的 `Load()` 中定义弱默认集 `weakSecrets = {"asagity_secret_miku_39": true, "": true}`，`JwtSecret` 改为 `os.Getenv("JWT_SECRET")`；当 `resolvedMode == Production` 且 `weakSecrets[JwtSecret]` 为 true 时返回 error `JWT_SECRET must be set to a strong value in production`
- [ ] 非生产模式 `JwtSecret` 为空时回退默认值并 `log.Println` 打印 WARNING；生产模式额外校验长度 ≥32 字节
- [ ] **验证**：production 模式不设 `JWT_SECRET` 启动失败并提示需设置强密钥；设弱值同样失败

### 2.3 seed.go 生产管理员密码改为 env 注入
> **任务 ID**：T1.3 | **问题**：#4 | **Sprint**：1 | **工作量**：S | **依赖**：T1.2 | **Epic**：config-加固

- [ ] 在 `<engine>/internal/platform/database/seed.go` 将 `ProductionAdministrator.Password` 改为从 `ADMIN_BOOTSTRAP_PASSWORD` env 读取，未设时首次启动随机生成并仅打印一次到 stdout 引导改密；`LiteDeveloper.Password` 保留（仅本地 dev）
- [ ] **验证**：全新 seed 后日志/stdout 不含硬编码明文密码；`ADMIN_BOOTSTRAP_PASSWORD` 设值后使用该值

### 2.4 .env.example 与 docker-compose 移除真实默认值
> **任务 ID**：T1.4 | **问题**：#4 | **Sprint**：1 | **工作量**：S | **依赖**：T1.2 | **Epic**：config-加固

- [ ] 在 `.env.example` 将 `JWT_SECRET` 改为占位 `JWT_SECRET=changeme-please-set-a-strong-secret`；在 `container/docker/docker-compose.yaml` 移除 `JWT_SECRET` 的 `:-asagity_secret_miku_39` 默认回退
- [ ] 同步补充 `CORS_ALLOWED_ORIGINS`、`WS_ALLOWED_ORIGINS`、`ADMIN_BOOTSTRAP_PASSWORD` 占位示例
- [ ] **验证**：`grep -r "asagity_secret_miku_39" .env.example container/docker/` 无命中

### 2.5 httpx.Cors 改为白名单回显具体 Origin
> **任务 ID**：T1.5 | **问题**：#6 | **Sprint**：1 | **工作量**：M | **依赖**：T1.1

- [ ] 在 `<engine>/internal/platform/httpx/middleware.go` 将 `Cors` 签名改为 `Cors(allowed []string) func(http.Handler) http.Handler`，内部 `toSet(allowed)` 后仅当请求 `Origin` 在白名单时回显该 Origin 并设 `Allow-Credentials: true` 与 `Vary: Origin`；非白名单不设 `Allow-Origin`
- [ ] `Allow-Methods`/`Allow-Headers` 始终设置；`OPTIONS` 预检直接返回 200；在 `<engine>/internal/app/app.go:37` 调用改为 `mux.Use(httpx.Cors(cfg.CORSAllowedOrigins))`
- [ ] **验证**：`curl -H "Origin: https://evil.com" -I` 无 `Access-Control-Allow-Origin` 回显；白名单 Origin 正常回显

### 2.6 WebSocket upgrader.CheckOrigin 改为白名单校验
> **任务 ID**：T1.6 | **问题**：#8 | **Sprint**：1 | **工作量**：M | **依赖**：T1.1

- [ ] 在 `<engine>/internal/platform/ws/handler.go` 将包级 `upgrader` 改为 `newUpgrader(allowed []string) websocket.Upgrader` 工厂，`CheckOrigin` 改为 `allowSet[r.Header.Get("Origin")]` 匹配；`NewHandler` 签名增加 `allowedOrigins []string` 参数
- [ ] 在 `<engine>/internal/app/app.go:73-75` `NewHandler` 调用处传入 `cfg.WSAllowedOrigins`；生产禁止 `CheckOrigin` 恒 true
- [ ] **验证**：从非白名单 Origin 发起 WS 连接，升级握手被拒（HTTP 403）；白名单 Origin 正常连接

### 2.7 JWT keyFunc 断言 HMAC 签名算法
> **任务 ID**：T1.7 | **问题**：#7 | **Sprint**：1 | **工作量**：S | **依赖**：无

- [ ] 在 `<engine>/internal/platform/httpx/middleware.go:51` 的 `Auth` 中 `jwt.Parse` keyFunc 内增加 `if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok { return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"]) }`，拒绝 `none`/RS256 等非 HMAC 算法
- [ ] 同步检查 C# `Verse.Module.Auth/JwtMiddleware.cs`（若启用 .NET 层）做同等 `ValidAlgorithms = ["HS256"]` 校验
- [ ] **验证**：用 `jwt.io` 构造 `alg:none` 伪造 JWT 请求受保护接口，返回 401 且日志记录 `unexpected signing method`

### 2.8 前端认证统一：authGuard PUBLIC_PAGES 改 import constants
> **任务 ID**：T1.8 | **问题**：#3 | **Sprint**：1 | **工作量**：S | **依赖**：无 | **Epic**：前端认证统一

- [ ] 在 `web/src/lib/authGuard.ts` 删除本地 `PUBLIC_PAGES` 副本，改为 `import { PUBLIC_PAGES, ROUTES } from "@/lib/constants"`；`REDIRECT_WHEN_LOGGED_IN` 改为 `[ROUTES.LOGIN, ROUTES.REGISTER]`，已登录用户访问 `/register` 也跳首页
- [ ] **验证**：未登录访问 `/register` 正常进入注册页不被重定向；已登录访问 `/login`/`/register` 跳首页

### 2.9 前端认证统一：isLoggedIn 改读 zustand store
> **任务 ID**：T1.9 | **问题**：#2 | **Sprint**：1 | **工作量**：M | **依赖**：T1.8 | **Epic**：前端认证统一

- [ ] 在 `web/src/lib/authGuard.ts` 将 `isLoggedIn()` 实现改为 `return useUserStore.getState().isLoggedIn`，移除 `getCookie("asagity_access_token")` 读取（cookie 从未被写入）
- [ ] 在 `web/src/stores/user.ts` 的 `persist` 配置增加 `onRehydrateStorage` 钩子，hydration 完成后再触发 guard，避免首帧误判匿名
- [ ] **验证**：浏览器登录后刷新任意受保护页保持登录态；`useUserStore.getState().isLoggedIn` 为 true 时守卫不拦截

### 2.10 前端认证统一：isAdmin 移除用户名判定
> **任务 ID**：T1.10 | **问题**：#28 | **Sprint**：1 | **工作量**：S | **依赖**：T1.8 | **Epic**：前端认证统一

- [ ] 在 `web/src/stores/user.ts` 将 `isAdmin` getter 改为 `return get().user?.role === "admin"`，移除 `|| get().user?.username === "Developer"` 隐式判定；`developerEnter` 的 mock user 显式带 `role: "admin"`，该入口仅 dev 模式可用
- [ ] **验证**：客户端 `user.username="Developer"` 但 `role` 非 admin 时 `isAdmin` 为 false

### 2.11 管理员密码日志脱敏
> **任务 ID**：T1.11 | **问题**：#5 | **Sprint**：1 | **工作量**：S | **依赖**：T1.3

- [ ] 在 `<engine>/internal/platform/database/database.go:80-82`（`Open` 内 seed 日志）与 `<engine>/internal/platform/database/lite.go:66-67`（`OpenLite` 内 seed 日志）移除 `password: %s` 占位，改为仅打印账号标识 `username/email/group`，附 `— see startup banner for one-time credential`
- [ ] 若需首次告知密码，改为写到一次性文件 `data/.bootstrap-credential`（权限 0600，读取后由部署脚本删除），绝不进常规日志
- [ ] **验证**：全新 seed 后 `grep -r "Asagity1234\|Asagity-dev1234" <logs>` 无命中；日志不含明文密码

---

## 3. Sprint 2：P1 测试与数据正确性

> 目标：消除测试 CGO 依赖、修复 findProjectRoot、challenge 精确查询/更新、Redis SCAN、note 可见性校验。#10/#11 共改 auth repo 需串行。

### 3.1 测试改用 modernc.org/sqlite 纯 Go 驱动
> **任务 ID**：T2.1 | **问题**：#1 | **Sprint**：2 | **工作量**：L | **依赖**：T0.2

- [ ] 在 `<engine>/go.mod` 增加 `modernc.org/sqlite` 依赖；将 `<engine>/internal/platform/database/seed_test.go` 等 6 个依赖 `go-sqlite3` 的用例改为通过 gorm 适配 `modernc.org/sqlite`（纯 Go 无 CGO），用 build tag 区分测试驱动与生产驱动
- [ ] 新增 `<engine>/internal/platform/database/testdb_helper.go` 封装测试 DB 构造，统一用例获取连接入口
- [ ] **验证**：`CGO_ENABLED=0 go test ./...` 全绿，含原 6 个 seed 用例；Windows 无 gcc 环境下测试通过

### 3.2 CI 矩阵配置 modernc + CGO 双矩阵
> **任务 ID**：T2.2 | **问题**：#1/#32 | **Sprint**：2 | **工作量**：S | **依赖**：T0.1、T2.1

- [ ] 在 `.github/workflows/ci.yml` 将 Go test job 改为主矩阵用 `modernc.org/sqlite`（无 CGO，全平台跑），附加一个 Linux CGO 矩阵 `CGO_ENABLED=1` 验证生产驱动 `go-sqlite3` 兼容性
- [ ] **验证**：CI 双矩阵均通过；Windows runner 跑 modernc 矩阵全绿

### 3.3 findProjectRoot 识别 .yaml 并统一实现
> **任务 ID**：T2.3 | **问题**：#9 | **Sprint**：2 | **工作量**：M | **依赖**：无

- [ ] 在 `<engine>/internal/platform/database/database.go:260-280` 的 `findProjectRoot` 中扩展识别 `docker-compose.yml` 与 `docker-compose.yaml` 两种扩展名，并优先识别 `container` 目录（与 `runtime.go` 对齐）
- [ ] 抽取公共 helper 或让 `database` 复用 `runtime` 的 `findProjectRoot` 逻辑，消除两份副本漂移
- [ ] **验证**：删除 PG/Redis 后启动 production 模式，`findProjectRoot` 找到 `container/docker/docker-compose.yaml`，自愈路径生效

### 3.4 auth repository 新增 GetEmailChallengeByID 方法
> **任务 ID**：T2.4 | **问题**：#10 | **Sprint**：2 | **工作量**：S | **依赖**：无

- [ ] 在 `<engine>/internal/module/auth/repository/repository.go` 接口与实现新增 `GetEmailChallengeByID(id string) (*model.EmailChallenge, error)`，按主键 `id` 精确查询单条 challenge
- [ ] **验证**：`go test ./internal/module/auth/repository/...` 通过；按 ID 查询返回正确记录

### 3.5 auth repository 新增 UpdateEmailChallenge 方法
> **任务 ID**：T2.5 | **问题**：#11 | **Sprint**：2 | **工作量**：S | **依赖**：无

- [ ] 在 `<engine>/internal/module/auth/repository/repository.go` 接口与实现新增 `UpdateEmailChallenge(c *model.EmailChallenge) error`，内部执行 `UPDATE email_challenges SET attempt_count=?, cooldown_until=? WHERE id=?` 原子递增
- [ ] **验证**：`go test ./internal/module/auth/repository/...` 通过；更新后 `attempt_count` 在同一行累计

### 3.6 VerifyRegisterEmail/VerifyLoginEmail 改用精确查询
> **任务 ID**：T2.6 | **问题**：#10 | **Sprint**：2 | **工作量**：M | **依赖**：T2.4

- [ ] 在 `<engine>/internal/module/auth/service/service.go:296`（`VerifyRegisterEmail`）与 `:415`（`VerifyLoginEmail`）将 `GetLatestEmailChallenge("", purpose)` + 比对 ID 的全局查询改为 `GetEmailChallengeByID(req.ChallengeID)` 精确查询，消除空串歧义语义
- [ ] **验证**：两用户并发注册邮箱验证各用各自 challengeID，互不串号各自验证成功

### 3.7 验证失败改用 UpdateEmailChallenge 原子更新
> **任务 ID**：T2.7 | **问题**：#11 | **Sprint**：2 | **工作量**：M | **依赖**：T2.5

- [ ] 在 `<engine>/internal/module/auth/service/service.go:323` 与 `:438` 的验证失败分支，将 `challenge.AttemptCount++; s.authRepo.CreateEmailChallenge(challenge)`（Create 当 Update）改为 `challenge.AttemptCount++; s.authRepo.UpdateEmailChallenge(challenge)`，确保 `MaxVerificationAttempts` 在单行累计生效
- [ ] **验证**：连续输错验证码 5 次，单行 `attempt_count=5`，第 6 次被拒；表中无重复行

### 3.8 cache 接口新增 Scan 方法声明
> **任务 ID**：T2.8 | **问题**：#12 | **Sprint**：2 | **工作量**：S | **依赖**：无

- [ ] 在 `<engine>/internal/platform/cache/cache.go` 接口新增 `Scan(ctx context.Context, pattern string, fn func(key string) error) error` 方法声明，注释说明替代 `Keys` 的 O(N) 阻塞；`Keys` 保留并标注 `// Deprecated: use Scan`
- [ ] **验证**：`go build ./internal/platform/cache/...` 通过；接口编译无误

### 3.9 cache Redis 实现 Scan 游标迭代
> **任务 ID**：T2.9 | **问题**：#12 | **Sprint**：2 | **工作量**：M | **依赖**：T2.8

- [ ] 在 `<engine>/internal/platform/cache/redis.go` 实现 `Scan`，内部使用 go-redis `Scan` 游标迭代（每批 100），对每个匹配 key 调用 `fn`，出错即终止
- [ ] **验证**：`go test ./internal/platform/cache/...` 通过；`redis-cli monitor` 观察到 SCAN 而非 KEYS 命令

### 3.10 cache memory 实现 Scan 遍历
> **任务 ID**：T2.10 | **问题**：#12 | **Sprint**：2 | **工作量**：S | **依赖**：T2.8

- [ ] 在 `<engine>/internal/platform/cache/memory.go` 实现 `Scan`，内部遍历内存 map 的 key 并按 pattern 匹配（简易通配），对匹配 key 调用 `fn`
- [ ] **验证**：`go test ./internal/platform/cache/...` 通过；内存模式下 Scan 行为正确

### 3.11 LogoutAll 改用 Scan 替代 KEYS
> **任务 ID**：T2.11 | **问题**：#12 | **Sprint**：2 | **工作量**：M | **依赖**：T2.9、T2.10

- [ ] 在 `<engine>/internal/module/auth/service/service.go:200-215` 的 `LogoutAll` 将 `s.cache.Keys(ctx, "refresh:*")` + 循环 Del 改为 `s.cache.Scan(ctx, "refresh:*", func(key string) error { ... })`，回调内比对 value 等于 userID 时 Del
- [ ] **验证**：用户有大量 refresh token 时调 `logout-all`，Redis 不阻塞，token 被清理；`redis-cli monitor` 观察 SCAN

### 3.12 note service 新增 canViewNote 可见性判定
> **任务 ID**：T2.12 | **问题**：#15 | **Sprint**：2 | **工作量**：M | **依赖**：无

- [ ] 在 `<engine>/internal/module/note/service/service.go` 新增内部方法 `canViewNote(viewerID string, note *notemodel.Note) bool`，规则：`public`/`local` → true；`private` → `note.UserID==viewerID` 或互关（复用 follow repository）；`direct` → `note.UserID==viewerID` 或在 mention 列表
- [ ] **验证**：单元测试覆盖四种 visibility × viewer 关系组合，判定结果符合规则

### 3.13 AddReaction 增加可见性校验
> **任务 ID**：T2.13 | **问题**：#15 | **Sprint**：2 | **工作量**：S | **依赖**：T2.12

- [ ] 在 `<engine>/internal/module/note/service/service.go:563` 的 `AddReaction` 在 `IsDeleted` 校验后增加 `if !s.canViewNote(userID, note) { return errors.New(dto.ErrNoteForbidden) }`
- [ ] **验证**：用户 A 对 B 的 private note 调 AddReaction 返回 403 Forbidden

### 3.14 VotePoll 多选投票查重
> **任务 ID**：T2.14 | **问题**：#16 | **Sprint**：2 | **工作量**：M | **依赖**：T2.12

- [ ] 在 `<engine>/internal/module/note/service/service.go:721-737` 的 `VotePoll` 多选分支，先 `s.repo.GetUserPollVotes(poll.ID, userID)` 取已投选项集合，循环 `optionIDs` 时跳过已投选项；同步对 `VotePoll` 增加 `canViewNote` 校验（与 #15 同文件）
- [ ] 可选加固：数据库加 `UNIQUE(poll_id, option_id, user_id)` 索引兜底（本迭代先以应用层查重）
- [ ] **验证**：多选投票对同一 option 连续投 2 次，第 2 次被跳过，无重复 PollVote 行

---

## 4. Sprint 3：P2 健壮性修复

> 目标：消除死代码、修复 seed/错误处理、App 优雅停机、EventBus/Idempotency 健壮性、平台兼容与数据兜底。多数可并行。

### 4.1 Register 删除死代码分支
> **任务 ID**：T3.1 | **问题**：#13 | **Sprint**：3 | **工作量**：S | **依赖**：无

- [ ] 在 `<engine>/internal/module/auth/service/service.go:51-63` 的 `Register` 删除前段"查 email 已注册"死代码，保留单一可达分支 `if req.Email != "" { return nil, errors.New("email verification required; use RegisterWithEmail") }`，方法注释说明职责边界
- [ ] **验证**：带 email 调 `Register` 返回明确错误 `use RegisterWithEmail`，无死代码分支

### 4.2 SeedUserGroups 改 FirstOrCreate 逐组 upsert
> **任务 ID**：T3.2 | **问题**：#14 | **Sprint**：3 | **工作量**：S | **依赖**：无

- [ ] 在 `<engine>/internal/platform/database/seed.go:73-83` 的 `SeedUserGroups` 将 `count > 0` 跳过逻辑改为 `for _, g := range userGroups() { db.Where("id = ?", g.ID).FirstOrCreate(&g) }` 逐组 upsert
- [ ] **验证**：预置仅 admin 组后重启，moderator/default 组被补齐

### 4.3 UpdateNote 检查 CreateEdit 错误
> **任务 ID**：T3.3 | **问题**：#17 | **Sprint**：3 | **工作量**：S | **依赖**：无

- [ ] 在 `<engine>/internal/module/note/service/service.go:165` 的 `UpdateNote` 将 `s.repo.CreateEdit(edit)` 返回值忽略改为 `if err := s.repo.CreateEdit(edit); err != nil { log.Printf("[note] failed to save edit history for %s: %v", note.ID, err) }`，失败记日志不阻断主流程
- [ ] **验证**：编辑 note 内容后查 `note_edits` 表存在历史行；mock repo 失败时有日志输出

### 4.4 fetchMe 引入 depth 防无限递归
> **任务 ID**：T3.4 | **问题**：#18 | **Sprint**：3 | **工作量**：S | **依赖**：无

- [ ] 在 `web/src/stores/user.ts:157-162` 的 `fetchMe` 签名改为 `fetchMe: async (depth = 0)`，refresh 成功后递归调用 `get().fetchMe(depth + 1)`，当 `!refreshed || depth >= 1` 时 `get().logout()` 放弃
- [ ] **验证**：mock 后端持续返回 me 失败，观察 fetchMe 最多 refresh 1 次后 logout，不无限递归

### 4.5 App 新增 Shutdown 方法
> **任务 ID**：T3.5 | **问题**：#19 | **Sprint**：3 | **工作量**：M | **依赖**：无

- [ ] 在 `<engine>/internal/app/app.go` 的 `App` 结构新增 `Shutdown(ctx context.Context) error` 方法，依次调用 `a.wsServer.Stop()`（若 ws.Server 无 Stop 则同步补）、`a.eventBus.Shutdown()`（已有）、`a.bridge.Stop()`（新增 bridge 引用持有）、`a.httpServer.Shutdown(ctx)`
- [ ] **验证**：`go build ./internal/app/...` 通过；`App.Shutdown` 方法存在且签名正确

### 4.6 serveApp 接管 SIGINT/SIGTERM 信号
> **任务 ID**：T3.6 | **问题**：#19 | **Sprint**：3 | **工作量**：M | **依赖**：T3.5

- [ ] 在 `<engine>/internal/runtime/runtime.go` 的 `serveApp` 将 `http.ListenAndServe` 改为构造 `http.Server` + `signal.NotifyContext(ctx, SIGINT, SIGTERM)`，收到信号时调用 `app.Shutdown(ctx)` 优雅退出
- [ ] **验证**：`kill -SIGTERM <pid>` 后日志显示优雅停机，`pprof` 无 goroutine/连接泄漏

### 4.7 EventBus Emit 满队列改超时策略
> **任务 ID**：T3.7 | **问题**：#20 | **Sprint**：3 | **工作量**：M | **依赖**：无

- [ ] 在 `<engine>/internal/platform/event/bus.go:72-84` 的 `Emit` 将 `default` 静默丢弃改为 `case <-time.After(b.cfg.EmitTimeout):` 超时丢弃并 `log.Printf` 告警；config 新增 `EmitTimeout` 字段，channel 容量可配置
- [ ] **验证**：灌满 event channel（>1024 并发 emit）后超时丢弃并告警，不无限阻塞

### 4.8 async handler 并发上限限制
> **任务 ID**：T3.8 | **问题**：#21 | **Sprint**：3 | **工作量**：M | **依赖**：无

- [ ] 在 `<engine>/internal/platform/event/bus.go:126-144` 的 `dispatch` 将 `sub.Async` 每事件起 goroutine 改为 `b.asyncSem.Acquire(ctx, 1)` + `go func() { defer b.asyncSem.Release(1); s.Handler(...) }()`，或取消 `Async` 标志统一经 worker 池消费
- [ ] **验证**：高频事件 + 多 async 订阅下，goroutine 数受 semaphore 上限约束（`runtime.NumGoroutine()` 稳定）

### 4.9 IdempotencyStore 改 LRU 修复容量越界
> **任务 ID**：T3.9 | **问题**：#22 | **Sprint**：3 | **工作量**：M | **依赖**：无

- [ ] 在 `<engine>/internal/platform/event/idempotency.go:23-42` 的 `Mark` 将 ring + nil 判断改为 `container/list` + map 实现 LRU，驱逐 `lru.Back()` 最旧且非 nil 元素，命中时 `MoveToFront` 实现 LRU 而非 FIFO
- [ ] **验证**：灌入 >capacity 幂等 key 后 `Size()` ≤ capacity，重复 key 被正确识别

### 4.10 randString 改真随机消除可预测性
> **任务 ID**：T3.10 | **问题**：#23 | **Sprint**：3 | **工作量**：S | **依赖**：无

- [ ] 在 `<engine>/internal/platform/event/bus.go:182-198` 将 `seededInt` 单调计数器改为 `crypto/rand.Read` 生成真随机字节并映射到 `randChars`，删除 `seededCounter` 变量
- [ ] **验证**：连续生成 subscriber ID 各不相同且不可预测（统计分布均匀）

### 4.11 runtime.go 平台选解释器替代硬编码 bash
> **任务 ID**：T3.11 | **问题**：#24 | **Sprint**：3 | **工作量**：M | **依赖**：无

- [ ] 在 `<engine>/internal/runtime/runtime.go:136-160` 的 `runInitDatabase` 将 `exec.Command("bash", initScript)` 改为按平台选择：Windows 用 `exec.Command("powershell", "-ExecutionPolicy", "Bypass", "-File", initScript+".ps1")`，其他平台用 bash
- [ ] 确保 `scripts/container/initDatabase.ps1` 存在（审查中 database.go 已引用该 hint）
- [ ] **验证**：Windows 下触发 DB 自愈执行 `initDatabase.ps1` 而非 bash，不报错

### 4.12 parseInitResult 改精确比较
> **任务 ID**：T3.12 | **问题**：#25 | **Sprint**：3 | **工作量**：S | **依赖**：无

- [ ] 在 `<engine>/internal/runtime/runtime.go:176-196` 的 `parseInitResult` 将 `ready = strings.Contains(line, "true")` 改为 `ready = strings.TrimPrefix(line, "ASAGITY_DB_READY=") == "true"` 精确比较
- [ ] **验证**：`.initdb_result` 含 `ASAGITY_DB_READY=not_true` 时 `ready=false`，无误判

### 4.13 openPostgres 时区从 env 读取
> **任务 ID**：T3.13 | **问题**：#26 | **Sprint**：3 | **工作量**：S | **依赖**：无

- [ ] 在 `<engine>/internal/platform/database/database.go:149-157` 的 `openPostgres` 将硬编码 `TimeZone=Asia/Shanghai` 改为从 `config.Config.TimeZone`（新增字段）读取，`Load()` 中从 `TZ` env 读取默认 `UTC`
- [ ] **验证**：设 `TZ=America/New_York` 启动，PG 连接时区为 America/New_York

### 4.14 buildTimelineResponse 处理缺失用户
> **任务 ID**：T3.14 | **问题**：#27 | **Sprint**：3 | **工作量**：S | **依赖**：无

- [ ] 在 `<engine>/internal/module/note/service/service.go:493-534` 的 `buildTimelineResponse` 将 `user := userMap[note.UserID]` 零值兜底改为 `user, ok := userMap[note.UserID]; if !ok { log.Printf("[note] timeline: note %s references missing user %s, skipping", note.ID, note.UserID); continue }`
- [ ] **验证**：timeline 含已注销用户 note 时该 note 被跳过，DTO 无空用户字段

---

## 5. Sprint 3：P3 架构清理与规划

> 目标：消除误导性宣称、清理占位包、docker-compose 废弃字段。无强前置，可并行。

### 5.1 C# stub 501 改 503 并附说明
> **任务 ID**：T3.15 | **问题**：#29 | **Sprint**：3 | **工作量**：M | **依赖**：无

- [ ] 在 `Verse.Module.*/Service.cs` 各 `NotImplementedXxxService` 将抛 501 改为返回 `503 Service Unavailable` 并附 JSON 说明 `.NET layer is planned but not implemented; use Go engine /api/*`
- [ ] **验证**：访问 `/api-net/auth/login` 返回 503 + 说明，非 501

### 5.2 README 标注 .NET 层为规划中
> **任务 ID**：T3.16 | **问题**：#29 | **Sprint**：3 | **工作量**：S | **依赖**：T3.15

- [ ] 在 `README.md` 与 `README_CN.md` 将"Go + ASP.NET Core 双引擎"宣称改为"Go 引擎为当前唯一实现，.NET 层规划中未实现"，`/api-net/*` 回退路径文档同步标注
- [ ] **验证**：README 不再宣称双引擎可用，明确指向 Go 引擎

### 5.3 app.go 误导性日志修正
> **任务 ID**：T3.17 | **问题**：#30 | **Sprint**：3 | **工作量**：S | **依赖**：无

- [ ] 在 `<engine>/internal/app/app.go:52` 将 `log.Println("[app] Asagity NET Core EventBus initialized")` 改为 `log.Println("[app] Asagity EventBus initialized")`
- [ ] **验证**：启动日志显示 `Asagity EventBus initialized`，无 `NET Core` 字样

### 5.4 pkg/* 占位包标注规约意图
> **任务 ID**：T3.18 | **问题**：#31 | **Sprint**：3 | **工作量**：S | **依赖**：无

- [ ] 在 `pkg/eventbus`、`pkg/vsql`、`pkg/activitypub`、`pkg/websocket` 各 `doc.go` 顶部补充注释说明"接口规约占位，实现在 `internal/platform/`"，或在 README 架构图标注对应关系
- [ ] **验证**：`pkg/*` 各包 doc.go 含规约说明注释，无误导

### 5.5 docker-compose.yaml 删除废弃 version 字段
> **任务 ID**：T3.19 | **问题**：#33 | **Sprint**：3 | **工作量**：S | **依赖**：无

- [ ] 在 `container/docker/docker-compose.yaml:1` 删除 `version: '3.8'` 行（Compose v2+ 已废弃该字段）
- [ ] **验证**：`docker compose -f container/docker/docker-compose.yaml config` 无 version 废弃 warning

---

## 6. 集成测试与验证

> 目标：分批次集成验证 + 全量回归 + 安全专项扫描，确保各 Sprint 合入质量。

### 6.1 Sprint 1 P0 安全专项验证
> **任务 ID**：T4.1 | **Sprint**：验证 | **工作量**：M | **依赖**：T1.1-T1.11

- [ ] 执行安全专项：`gosec ./...` 无 G101 硬编码密钥告警；启动时 `JWT_SECRET` 长度 <32 拒绝
- [ ] 执行 CORS/WS 验证：`curl -H "Origin: https://evil.com" -I` 无 `Access-Control-Allow-Origin` 回显；非白名单 Origin WS 连接被拒
- [ ] 执行 JWT 验证：用 `jwt.io` 构造 `alg:none` token 验证被拒返回 401
- [ ] 执行日志验证：`grep -r "Asagity1234\|Asagity-dev1234\|asagity_secret_miku_39" <logs> .env.example` 无命中
- [ ] 执行前端验证：浏览器登录后刷新受保护页保持登录态；未登录访问 `/register` 正常进入；`username="Developer"` 但 role 非 admin 时 `isAdmin` 为 false

### 6.2 Sprint 2 P1 数据正确性验证
> **任务 ID**：T4.2 | **Sprint**：验证 | **工作量**：M | **依赖**：T2.1-T2.14

- [ ] 执行测试基线：`cd core/src/Verse.Engine && CGO_ENABLED=0 go test ./...` 全绿（含原 6 个 seed 用例）；`go vet ./...` 无告警
- [ ] 执行 challenge 并发验证：两用户并发注册邮箱验证各用各自 challengeID 互不串号；连续输错 5 次后单行 `attempt_count=5`，第 6 次被拒
- [ ] 执行 SCAN 验证：大量 refresh token 时 `logout-all` 不阻塞，`redis-cli monitor` 观察 SCAN
- [ ] 执行 note 校验验证：用户 A 对 B 的 private note AddReaction 返回 403；多选投票重复投同一 option 被跳过
- [ ] 执行 findProjectRoot 验证：删除 PG/Redis 后 production 模式自愈路径生效

### 6.3 Sprint 3 P2 健壮性验证
> **任务 ID**：T4.3 | **Sprint**：验证 | **工作量**：M | **依赖**：T3.1-T3.14

- [ ] 执行停机验证：`kill -SIGTERM <pid>` 后日志显示优雅停机，`pprof` 无 goroutine/连接泄漏
- [ ] 执行 EventBus 验证：灌满 event channel 超时丢弃告警；高频 async 事件 goroutine 数受上限约束
- [ ] 执行 Idempotency 验证：灌入 >capacity key 后 `Size()` ≤ capacity，重复 key 正确识别
- [ ] 执行平台兼容验证：Windows 下 DB 自愈执行 `.ps1`；`ASAGITY_DB_READY=not_true` 时 `ready=false`
- [ ] 执行数据兜底验证：timeline 含已注销用户 note 被跳过；设 `TZ=America/New_York` PG 时区正确

### 6.4 Sprint 3 P3 架构清理验证
> **任务 ID**：T4.4 | **Sprint**：验证 | **工作量**：S | **依赖**：T3.15-T3.19

- [ ] 执行 C# 验证：访问 `/api-net/auth/login` 返回 503 + 说明
- [ ] 执行日志验证：启动日志无 `NET Core` 字样
- [ ] 执行 docker 验证：`docker compose -f container/docker/docker-compose.yaml config` 无 version 废弃 warning
- [ ] 执行 README 验证：不再宣称双引擎可用，`pkg/*` 占位包 doc.go 含规约说明

### 6.5 全量回归与 CI 门禁验证
> **任务 ID**：T4.5 | **Sprint**：验证 | **工作量**：L | **依赖**：T4.1-T4.4

- [ ] 执行全量构建：`cd core/src/Verse.Engine && go vet ./... && go build ./... && go test ./...` 全绿
- [ ] 执行前端全量：`cd web && pnpm build && pnpm test` 全绿
- [ ] 执行 CI 门禁：提 PR 触发 `.github/workflows/ci.yml`，双矩阵（modernc + CGO）全绿，gosec/govulncheck 无新增告警
- [ ] 执行回归对照：对照 `docs/fix-plan/baseline.md` 基线，确认原失败用例全部修复且无新增失败

---

## 7. 评审与交付确认

> 目标：最终代码审查、设计与实现一致性核对、变更范围确认。

### 7.1 代码审查与设计一致性核对
> **任务 ID**：T5.1 | **Sprint**：评审 | **工作量**：M | **依赖**：T4.5

- [ ] 逐项核对 33 个问题修复实现与 `design.md` 2.4 节方案一致，重点检查 #2/#3/#28 统一方案整体性、#4 config 加强生产拒绝逻辑、#6/#8 白名单回显行为
- [ ] 审查关键安全代码（config.Load、httpx.Cors、ws.upgrader、jwt keyFunc、seed 日志）的 Review 意见并记录到 `docs/fix-plan/review.md`

### 7.2 变更范围与回滚预案确认
> **任务 ID**：T5.2 | **Sprint**：评审 | **工作量**：S | **依赖**：T5.1

- [ ] 确认每项修复独立成 commit，回滚即 revert 单 commit（#2/#3/#28 统一方案需整体 revert）；CORS/WS 白名单与密钥强制校验通过 env 开关可运行时降级
- [ ] 确认无 schema 变更，PollVote 唯一索引为可选加固未加则回滚零成本；生成最终变更清单与回滚预案文档

---

## 附录：任务统计与依赖链

### 任务统计

| Sprint | 主题 | 主任务数 | 问题编号 | 工作量合计 |
|--------|------|---------|---------|-----------|
| Sprint 0 | CI 骨架与基线 | 2 | #32, #1(基线) | M + S |
| Sprint 1 | P0 安全与功能阻断 | 11 | #2 #3 #4 #5 #6 #7 #8 #28 | 3S+5M+3S |
| Sprint 2 | P1 测试与数据正确性 | 14 | #1 #9 #10 #11 #12 #15 #16 | 5S+6M+1L+2M |
| Sprint 3 (P2) | 健壮性 | 14 | #13-#27 | 8S+6M |
| Sprint 3 (P3) | 架构清理 | 5 | #29 #30 #31 #33 | 4S+1M |
| 验证 | 集成测试与评审 | 6 | 全量 | 3S+3M+1L |
| **合计** | — | **52** | **33 项全覆盖** | — |

### 关键依赖链

```
T0.1 (CI骨架) ──┬──> T2.2 (CI双矩阵)
T0.2 (基线)   ──┴──> T2.1 (modernc驱动) ──> T4.5 (全量回归)

T1.1 (config白名单字段) ──┬──> T1.5 (httpx.Cors白名单)
                          └──> T1.6 (ws白名单)
T1.2 (JwtSecret强制) ──┬──> T1.3 (seed密码env注入) ──> T1.11 (日志脱敏)
                       └──> T1.4 (.env.example清理)

T1.8 (authGuard import) ──┬──> T1.9 (isLoggedIn读zustand)  } Epic: 前端认证统一
                          └──> T1.10 (isAdmin移除用户名判定) }

T2.4 (GetEmailChallengeByID) ──> T2.6 (Verify改精确查询)   } #10
T2.5 (UpdateEmailChallenge)   ──> T2.7 (失败改Update)       } #11
T2.8 (Scan接口) ──┬──> T2.9 (Redis Scan) ──┐
                  └──> T2.10 (memory Scan) ─┴──> T2.11 (LogoutAll改Scan)
T2.12 (canViewNote) ──┬──> T2.13 (AddReaction校验)
                      └──> T2.14 (VotePoll查重)

T3.5 (App.Shutdown) ──> T3.6 (serveApp信号接管)
```

### Epic 标注

| Epic | 包含任务 | 说明 |
|------|---------|------|
| config-加固 | T1.1, T1.2, T1.3, T1.4 | #4 密钥强制 + #6/#8 白名单 config 前置，整体回滚 |
| 前端认证统一 | T1.8, T1.9, T1.10 | #2+#3+#28 单一事实来源，整体回滚 |