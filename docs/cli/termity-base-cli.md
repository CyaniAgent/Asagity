# Termity Base CLI — 设计方案

> versetool 交互机制的深度重做：从「数字菜单」进化为「语义化 Agent CLI」。
> 状态：**已实施完成**（2026-10-28，S1–S3 全部落地并通过端到端走查）

## 1. 背景与目标

现状：`versetool` 无参启动进入数字菜单（`1) start all ... 9) app list`），bufio 读行、无历史、无会话、无着色。

目标：对齐 Agent CLI（Claude Code / Codex CLI / Gemini CLI）的交互范式：

| 能力 | 要求 |
|---|---|
| 语义命令 | `/start` = start all、`/destroy` = destroy all……`/help` 查看全表 |
| 会话隔离 | 每次启动 CLI = 新 Session，输入历史（↑回溯）从空白开始 |
| 会话留痕 | 命令流水持久化到磁盘，`/recent` 查看历史 Session 记录 |
| 主题着色 | TUI 采用当前赛季主题 **Yukinoshita Glacier** 配色 |

## 2. 调研结论（2026-10）

1. **Charm v2 已 GA**（2026-02-23 发布，脱离 beta）：`charm.land/bubbletea/v2`、`charm.land/lipgloss/v2`、`charm.land/bubbles/v2`（含 textinput/spinner/viewport/help），导入路径迁移到 vanity domain。Bubble Tea v2 声明式 API + 高优化渲染，GitLab CLI 已立项从 tview 迁入。
2. **Agent CLI 会话存储的业界模式**（Codex CLI 为样板）：
   - `$HOME/.codex/sessions/YYYY/MM/DD/rollout-<时间戳>-<id>.jsonl`——**日期分区 + JSONL 追加写**；
   - 每行一个自包含 JSON 对象（`type` 字段区分事件），append-only = 崩溃最多丢当前行；
   - 每次启动全新会话，`/status` 显示当前会话 id，历史靠读文件重建。
3. **主题**：Miku Green 已退出 token 体系（本档案在 git 历史），当前为 Yukinoshita Glacier（2026.Q4 赛季），语义 token 齐全（accent/success/error/warning/text/background 双模式数组）。

## 3. UX 设计

### 3.1 REPL 布局（inline 模式，非全屏）

```
╭─ Termity Base CLI ─ session 3f8a21c0 · lite ─╮
 21:30:12 /start dev
 [OK] engine starting (pid 123, :2048, mode=lite)
 [OK] api starting (pid 130, :2050)
 21:30:24 /status
 SERVICE  PROCESS  PORT  HEALTH  RSS
 engine   UP       UP   UP      18.1 MB
 api      UP       UP   UP      95.0 MB
╰──────────────────────────────────────────────╯
  ▸ /status▏
```

- 输出块向上滚动，输入行固定底部（Agent CLI 惯例）；
- 输入行带 `▸` 提示符 + 补全：输入 `/st` 按 Tab 或 ↑↓ 选择（textinput suggestions）；
- 命令执行期间显示 spinner + 命令名（start 的 build 阶段可到 10s+，异步执行不卡输入）。

### 3.2 命令表（语义映射）

| 命令 | 等价旧形式 | 说明 |
|---|---|---|
| `/start [prod\|dev\|dbless] [service]` | `versetool start ...` | 默认 all + 当前会话模式 |
| `/stop [service]` | `versetool stop ...` | 优雅停机 |
| `/restart [mode] [service]` | `versetool restart ...` | |
| `/destroy [service]` | 菜单 4) destroy all | **inline 二次确认**：提示后输入 `y` 才执行 |
| `/status` `/health` `/doctor` | 菜单 5/6/7 | 渲染为对齐表格 |
| `/logs [-f] <engine\|api\|off>` | 菜单 8/9 | 尾部 50 行；`-f` 实时 follow |
| `/dev <build [...]\|cache-clean>` | （新） | 开发者工具，见 §3.4 |
| `/app <list\|enable\|disable ...>` | 菜单 10 | |
| `/db` | 菜单 d) | db status |
| `/mode [prod\|dev\|dbless]` | 菜单 m) | 切换**本会话**模式，/status 头部实时反映 |
| `/recent [id]` | （新） | 列出历史 Session；带 id 则展开该会话命令流水 |
| `/help` | （新） | 命令表 + 快捷键 |
| `/exit` / Ctrl+C / Ctrl+D | 0) exit | Ctrl+C：中断运行中命令 → 断开日志 follow → 退出（分层，见 §3.3） |

- 裸文本（不以 `/` 开头）→ `unknown command` + 最近命令建议（编辑距离）；
- 未知 `/xxx` → 同上（`/stauts` → "did you mean /status?"）。

## 3.3 实时日志流（Supervisor 风格，2026-10-29 增补）

早期版本的 `/start`/`/stop` 跑完才一次性倒出输出——spinner 期间一片寂静。现对齐
Home Assistant Supervisor 的实时模型：

1. **流式 runner 输出**：`captureStream` 把 stdout/stderr 逐行推入 TUI
   （`Program.Send(liveMsg)`），build 进度、`[OK] engine starting` 边跑边显示；
2. **服务日志自动 follow**：`/start`/`/restart` 成功后自动 tail engine/api 的
   `.verse/logs/<svc>.log`（`/stop`/`/destroy` 自动断开）；`/logs -f <svc>` 手动
   挂载，`/logs off` 断开；
3. **tail 实现**：300ms 轮询（零新依赖），inode 身份检测旋转（`os.SameFile`，
   纯 size 比较会漏掉"新文件比 offset 大"的 rotate），size 缩小检测原地截断，
   容忍文件尚未创建，跨读半行缓存；
4. **着色**：`[db]`/`[runtime]` 等字母标签上 accent 色，error/fatal/panic/warn
   按严重度着色，`.NET` 数字事件 id（`[0]`）不着色；follow 行带 `[engine]`/
   `[api]` dim 前缀区分来源；
5. **Ctrl+C 分层语义**：运行中→中断提示；空闲且 follow 中→先断开所有 tail；
   再按→退出。输入行下方常驻 `⚡ live: api · engine` 状态行。

## 3.4 /dev 开发者功能（2026-10-30 增补）

面向日常开发循环的两条子命令，构建逻辑全部下沉到 runner 包
（`BuildEngine`/`BuildAPI`/`BuildWeb`，与 `/start` 单一事实源），termity 侧只做编排。

### `/dev build [engine|api|web|all]`（默认 all）

**先看再建**——执行前先打 git 改动摘要：

1. `git status --porcelain` 着色列出（改动码 M/A/D/??/R 各有其色，R 取新名，
   引号路径还原；超过 8 条折叠为 `… +N more`）；
2. 每条按路径推断组件归属：`core/src/Verse.Engine/`→engine、
   `core/src/Verse.{Api,Data,Modules,Shared,Tests}/`→api、`web/`→web、
   `core/src/Verse.Cli/`→cli（提示手工重建 versetool）、其余→core/docs/infra；
3. 汇总 `→ touched: api · web`，并给出最窄建议
   （只动了 web → `hint: /dev build web`）；
4. 然后流式构建请求的目标：runner 的 `streamCmd` 把子进程 stdout/stderr
   直连当前 stdout——termity 的 live capture 管道 fd 直通子进程，
   dotnet/vite 输出逐行实时滚动（复用 §3.3 实时流），`[DEV] building ...`/
   `[OK] built`/`[FAIL]` 标签着色；首败即停。

`/start` 原本的 `buildCmd`（CombinedOutput 缓冲）已统一替换为 `streamCmd`，
`/start dev` 的 .NET 构建输出同样变为实时。

### `/dev cache-clean`

清单（带体积）→ 清理 → 释放报告：

| 目录 | 处置 | 理由 |
|---|---|---|
| `core/src/*/obj`、`*/bin`（除 Verse.Cli） | **清理** | .NET 中间产物/构建输出，重建即回 |
| `web/node_modules/.vite` | **清理*** | Vite 依赖缓存，下次构建透明重建；*vite dev server 在跑（:2000）时保留 |
| `core/src/Verse.Cli/bin` | 保留 | 里面是**正在运行的 versetool** 本体 |
| `web/dist` | 保留 | 前端产物（非缓存），`/dev build web` 可重建 |
| `.verse/bin`、`.verse/publish` | 保留 | 运行中服务的二进制/发布目录 |
| Go build cache（`go env GOCACHE`） | 保留 | 全机共享，跨项目，报告体积但不动 |

输出形如：

```
[OK]   core/src/Verse.Api/obj                 22.4 MiB
[OK]   web/node_modules/.vite                 58.1 MiB
[KEEP] web/dist                               100 MiB  (build artifact — rebuild via /dev build web)
freed 80.5 MiB across 2 cache(s)
```

测试：git 摘要解析（含 R/引号/空行）、组件推断、目标参数校验、缓存清单
purge/keep 标志与排序、cache-clean 端到端（temp tree 清理+保留验证）、
humanSize 格式。

## 4. 架构

```
Verse.Cli/internal/termity/
├── cli.go        # bubbletea v2 Program 装配、REPL 主循环（model/update/view）
├── commands.go   # 命令注册表：名字/参数解析/handler/帮助文案；含模糊建议
├── theme.go      # Yukinoshita Glacier token → lipgloss 样式（AdaptiveColor 双模式）
├── session.go    # 会话存储：JSONL 追加写 + /recent 读取/列表
└── render.go     # 表格/输出块/确认提示渲染
```

- `cmd/verse/main.go` 的 `interactive()` 改为启动 `termity.Run(cfg, mode)`；
- **命令 form 完全不变**（`versetool start dev` 等脚本用法零影响）；
- handler 复用现有 `runner`/`doctor`/`engineapi`，不重写业务逻辑；
- 异步执行：handler 放 goroutine，`tea.Cmd` 回传结果消息（spinner 保活）；
- 非 TTY（管道/CI）调用无参 → 打印指引并退出（数字菜单不保留）。

### 4.1 会话存储（Codex 模式）

```
<root>/.verse/sessions/2026/10/26/session-2026-10-26T21-30-11-3f8a21c0.jsonl
```

```jsonl
{"type":"session_start","ts":"...","session":"3f8a21c0","mode":"lite","engine_port":"2048","api_port":"2050"}
{"type":"command","ts":"...","raw":"/start dev"}
{"type":"result","ts":"...","raw":"/start dev","ok":true,"duration_ms":12430}
{"type":"session_end","ts":"...","commands":7}
```

- 位置在项目 `.verse/`（与 pids/logs 同根，已被 gitignore）；
- append-only，逐行落盘（缓冲 flush）；进程被 destroy/强杀最多丢一行；
- `/recent` 扫描 `sessions/**/*.jsonl` 取每文件首行（session_start）+ 末行（session_end/最后 command）列元数据表；不全量载入。

## 5. 主题映射（Yukinoshita Glacier · 暗面 / 明面）

| 角色 | 暗面 hex | 明面 hex | token |
|---|---|---|---|
| accent（提示符/边框/会话头） | `#7fc9f0` | `#2e76b8` | glacier 75/60 |
| text primary | `#dee3e9` | `#0f1114` | frost 90/5 |
| text secondary（时间戳/元信息） | `#8a9299` | `#595f66` | frost 60/40 |
| success（[OK]） | `#52d2a4` | `#19795a` | aurora 70/50 |
| error（[KILL]/失败） | `#f58ca5` | `#c73e5f` | berry 80/60 |
| warning（[WARN]/destroy 提示） | `#f2be5a` | `#b26018` | melt 75/65 |
| surface / body | `#001f2f` / `#001421` | `#ffffff` / frost 95 | glacier 10/5 |
| periwinkle（/recent 装饰） | `#acb2f2` | 见 palette | periwinkle 80 |

- 用 lipgloss v2 `AdaptiveColor`：终端亮/暗背景自动切换两套值（与主题 [light, dark] 数组一一对应）；
- [OK]/[WARN]/[SKIP]/[KILL] 前缀按既有 runner 输出解析着色，业务代码不改动。

## 6. 兼容性与风险

| 项 | 结论 |
|---|---|
| 命令 form（start/stop/destroy...） | 不变，脚本零影响 |
| `--mode` flag / ASAGITY_MODE | 不变，决定 REPL 初始模式 |
| 数字菜单 | 移除（REPL 替代）；非 TTY 给指引 |
| **CLI 从零依赖 → 3 个 Charm v2 包** | 已知代价：go.mod +3 行、二进制约 +3~5MB；Charm 系 MIT、生产在用（GitLab/lazygit 生态） |
| 破坏性退出 | Ctrl+C 语义：中断当前命令 → 再按退出（防误杀 start） |

## 7. 测试

- `commands_test.go`：解析矩阵（含参数、别名、模糊建议）；
- `session_test.go`：JSONL 写读往返、`/recent` 列表排序/截断；
- `theme_test.go`：token → hex 映射快照（防主题漂移）；
- 手动验收：REPL 全命令走查 + destroy 确认流 + `/recent` 回看 + 非 TTY 退化。

## 8. 实施切片

1. **S1**：`theme.go` + `commands.go` + `session.go`（纯逻辑，无 TUI，测试先行）；
2. **S2**：`cli.go`/`render.go` bubbletea v2 装配（REPL、补全、spinner、确认流）；
3. **S3**：接线 `interactive()`、非 TTY 处理、help/usage 文案、端到端走查。

## 9. 评审结论（2026-10-26 已拍板）

1. `/recent <id>` **v1 仅查看**，恢复（重放）列入 phase 2；
2. 会话文件放**项目内** `<root>/.verse/sessions/`（与 pids/logs 同根，gitignore 已覆盖）；
3. 数字菜单**直接移除**，不留 `--legacy-menu` 后门；非 TTY 打印指引后退出。

→ 方案锁定，进入实施（S1 → S2 → S3）。
