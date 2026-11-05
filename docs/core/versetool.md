# versetool — Asagity 服务管理与 Termity Base CLI

> 状态：**活跃开发中**（最新里程碑 2026-11-04 `d76decb`）
> 位置：`core/src/Verse.Cli`，产物 `core/src/Verse.Cli/bin/versetool`（≈13 MB 单二进制）
> 本文是 versetool 的介绍与开发进展记录；交互设计细节见 [termity-base-cli.md](../cli/termity-base-cli.md)。

## 1. 定位

`versetool` 是 Asagity 后端的**双进程监管器（dual-process supervisor）**加一个
**语义化 REPL**，一个二进制承担四份职责：

| 职责 | 说明 |
|---|---|
| 构建 | Go engine（`go build`）、.NET API（`dotnet publish` Release + ReadyToRun，失败回退 Debug）、web（`tsc + vite build`） |
| 进程监管 | 启动/停止/重启/强杀，pid 与日志落盘 `.verse/`，端口健康等待 |
| 诊断 | status 表格、health 探针、doctor 环境体检 |
| 开发者工具 | git 感知构建、缓存清理、实时日志 follow（`/dev`、`/logs -f`） |

监管对象与端口：

| 服务 | 运行时 | 默认端口 | 生产附加 |
|---|---|---|---|
| engine | Go `verse-engine` | `:2048` | — |
| api | .NET `Verse.Api` | `:2050` | — |
| db | PostgreSQL（docker/podman） | — | ✓ |
| redis | Valkey（docker/podman） | — | ✓ |

运行模式：`prod`（production，全四服务）/ `dev`（lite，engine+api+SQLite）/
`dbless`（仅 engine）。

## 2. 两种使用形态

**脚本形态（参数形式，保持稳定不变）**——供 CI、脚本、文档调用：

```bash
versetool start dev            # 构建并启动 dev(lite) 模式全部服务
versetool status               # 一次性状态表格
versetool stop all
versetool destroy -y all       # 强杀，-y 跳过确认
```

**交互形态（TTY 下无参数）**——进入 **Termity Base CLI**：语义化 `/command`
REPL，Yukinoshita Glacier 主题着色，每次启动为全新 Session（输入历史从空白
开始），命令流水持久化到 `.verse/sessions/`，`/recent` 回看。

```
/start /stop /restart /destroy /status /health /doctor
/logs /dev /app /db /mode /recent /help /exit
```

## 3. 命令总表（15 条）

| 分类 | 命令 | 说明 |
|---|---|---|
| 生命周期 | `/start [prod\|dev\|dbless] [service]` | 构建并启动（默认 all + 会话模式），成功后**自动 follow 服务日志** |
| | `/stop [service]` | 优雅停机，自动断开日志 follow |
| | `/restart [mode] [service]` | 重启 |
| | `/destroy [service]` | **inline 二次确认**（输入 `y`），紧急时可强杀 |
| 状态诊断 | `/status` | 对齐表格：进程/端口/健康/RSS |
| | `/health` `/doctor` | 健康探针 / 环境体检 |
| 日志 | `/logs [-f] <engine\|api\|off>` | 尾部 50 行；`-f` 实时 follow，`off` 断开 |
| 开发者 | `/dev build [engine\|api\|web\|all]` | **先打 git 改动摘要**（着色 + 组件归属推断 + 最窄建议），再流式构建 |
| | `/dev cache-clean` | 清理冗余构建缓存（实测释放 ~280 MiB），运行中产物/共享缓存只报告保留 |
| 模块/数据 | `/app <list\|enable\|disable> [name]` | 模块管理 |
| | `/db` | 数据库状态 |
| 会话 | `/mode [prod\|dev\|dbless]` | 切换**本会话**模式，`/status` 头部实时反映 |
| | `/recent [id]` | 历史 Session 列表 / 展开命令流水 |
| | `/help` `/exit` | 帮助 / 退出（Ctrl+C 分层：中断→断 follow→退出） |

裸文本或未知 `/xxx` → `unknown command` + 编辑距离建议（`/stauts` → "did you
mean /status?"）。

## 4. 架构

```
Verse.Cli/
├── cmd/verse/          # 入口：参数分发 + TTY 检测 → termity.Run
└── internal/
    ├── termity/        # Termity Base CLI（bubbletea v2 inline REPL）
    │   ├── cli.go      #   Update/View、liveMsg 注入、日志 tail goroutine、Ctrl+C 分层
    │   ├── commands.go #   命令 registry（15 条）、captureStream 流式捕获
    │   ├── dev.go      #   /dev：git 摘要、组件推断、缓存清单与清理
    │   ├── theme.go    #   Yukinoshita Glacier 主题 + 服务日志行着色
    │   └── session.go  #   JSONL 会话日志（.verse/sessions/）
    ├── runner/         # 构建与生命周期（单一事实源）
    ├── process/        # pid/日志管理、Spawn/Kill、日志轮转检测
    ├── mode/ config/ doctor/ engineapi/ modulemgr/
```

关键机制：

1. **构建单一事实源**：`runner.BuildEngine/BuildAPI/BuildWeb` 同时服务
   `/start` 与 `/dev build`；`streamCmd` 把子进程 stdout 直连当前 stdout——
   termity 的 live capture 管道 fd 直通子进程，dotnet/vite/go 输出**逐行实时
   滚动**（`captureStream` → `Program.Send(liveMsg)`）。
2. **Supervisor 式日志 follow**：`/start`/`/restart` 成功后自动 tail
   `.verse/logs/<svc>.log`；tail 为 300ms 轮询（零新依赖），inode 身份检测
   旋转（`os.SameFile`——纯 size 比较会漏掉「新文件比 offset 大」的 rotate），
   size 缩小检测原地截断，容忍文件未创建，跨读半行缓存。
3. **会话持久化**：Codex CLI 模式——日期分区 JSONL 追加写，崩溃最多丢当前行；
   每次启动新 Session，`/recent` 读文件重建历史。
4. **构建安全护栏**：`/dev cache-clean` 保留运行中服务的二进制（`.verse/*`）、
   正在运行的 versetool 本体（`Verse.Cli/bin`）、前端产物（`web/dist`）、全机
   共享 Go cache；探测到 vite dev server 在 :2000 时连 `.vite` 依赖缓存也保留。

## 5. 开发进展（时间线）

| 日期 | 里程碑 | 内容 |
|---|---|---|
| 2026-09-20 | 骨架（`44274c0`） | Verse.Cli 包落位：`cmd/verse` + doctor/modulemgr/runner 桩（19 行） |
| 2026-09-23 | CLI 诞生（`e693dbf`） | 322 行 `main.go`：双形态定型（参数式 / 无参交互），bufio **数字菜单** `1) start all ... 9) app list`，无历史/无会话/无着色 |
| 2026-10-25 | 可靠性（`92bd968`） | `/destroy` 紧急强杀路径；SQLite CVE-2025-6965 修复（pin `SQLitePCLRaw.bundle_e_sqlite3 2.1.14`、Go 侧 go-sqlite3 v1.14.52） |
| 2026-10-28 | **Termity Base CLI**（`faa5cd5`，S1–S3） | 数字菜单 → 语义化 `/command` REPL；Yukinoshita Glacier 主题；会话 journal + `/recent`；编辑距离建议；bubbletea v2（`View() tea.View`、Focus 时机、`Program.Send`）；pty 端到端走查全通过 |
| 2026-10-29 | **实时日志流** | 缺陷修复「/start /stop 无法实时更新日志」：`captureStream` 逐行注入、`/start` 自动 follow、`/logs -f`、Ctrl+C 分层语义、`tailFile` inode 旋转检测（单测抓出纯 size 比较的漏检真 bug）；新增 9 测试 |
| 2026-10-30/31 | **`/dev` 开发者功能** | `/dev build`（git porcelain 摘要着色 → 组件归属推断 → 流式构建）、`/dev cache-clean`（清单带体积 → 清理 → 释放报告，实测 280.3 MiB）；runner `buildCmd`（缓冲）→ `streamCmd`（流式）重构；vite dev server 护栏；新增 8 测试 |
| 2026-11-04 | 集成入库（`d76decb`） | 实时流 + `/dev` 批次随 boot splash、系统信息窗口、README 改版一并提交 |

验证方法沉淀：单元测试 38 个（termity 包）+ 全仓 gofmt/vet/test 零错误零警告；
端到端用 Python `pty` 驱动（仓库无 tmux/expect，回车必须发 `\r`），三轮走查
覆盖实时流、`/dev` 全子命令、`/start` 在 cache-clean 后的从零重建回归。

## 6. 相关文档

- [docs/cli/termity-base-cli.md](../cli/termity-base-cli.md) — Termity Base CLI 设计方案（§3.3 实时日志流、§3.4 `/dev`）
- [docs/architecture/tech-stack-audit.md](../architecture/tech-stack-audit.md) — 技术栈红线（核心服务 Go / API 与业务模块 .NET）
- [docs/backend/dotnet-performance.md](../backend/dotnet-performance.md) — API 运行时调优（versetool `dotNetRuntimeEnv` 的依据）
- [README.md](../../README.md) — Getting Started 中的 versetool 快速上手

> **命名消歧**：本仓有三处「Termity」——① versetool 的 **Termity Base CLI**
>（本文，`core/src/Verse.Cli/internal/termity`）；② 应用内网页终端
> （`docs/TermityCmdList.md`、`web/src/.../termity/`）；③ roadmap 中的
> Termity 终端模拟（`docs/roadmap/movetoReact.md`）。三者独立演进，勿混。
