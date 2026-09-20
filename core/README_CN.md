# 🩵 Asagity Verse (服务端)

> **一抹青色的去中心化多元社交宇宙 — 后端核心引擎**

Asagity Verse 是 Asagity 平台的后端服务端引擎项目，采用 **Go（核心底层与工具链） + ASP.NET Core（API 与模块层）** 的双引擎融合架构。基于**自主开发的解耦式模块 + App 环境设计（Modular Monolith + App 环境 / AAP）**与 **Clean Architecture (简洁架构)** 理念，融合了原生联邦宇宙 (ActivityPub / Verse 协议)、高性能实时推送、自研 VSQL 搜索解释器以及 Skyline Drive 多云盘存储系统。

---

## 🎨 架构设计原则与模块 + App 环境理念

1. **自主开发的模块 + App 环境设计 (Verse.Modules + AAP)**：
   - 将业务解耦为独立的**核心模块**（如 `Auth`, `User`, `Note`, `Drive`, `Follow`, `Instance`, `Music`）。
   - 每个核心模块独立具备 Rest API 路由挂载、数据 Model/Repository 以及 Event 订阅逻辑，实现高内聚、低耦合与即插即用。
   - 第三方开发者不再直接编写“模块”，而是基于 **App 环境**开发**应用（App）**：以 `.aap`（Asagity Application）包格式分发，运行在受控的应用沙箱中，只能通过受限 API 与 EventBus 订阅与平台交互，无法直连数据库（详见“📦 模块与 App 的边界”一节）。
2. **Go 与 ASP.NET Core 双引擎分层**：
   - **ASP.NET Core (API & Modules 层)**：负责 RESTful API、中间件路由、类型安全模型绑定、依赖注入及业务域模块隔离。
   - **Go (核心底层 Engine)**：承载高性能事件总线（EventBus）、长连接推送、ActivityPub 联邦协议适配与 VSQL 语义解释器。
3. **事件驱动与 Hook 机制 (Event-Driven)**：
   - 模块间禁止直接硬编码强依赖，通过 Go Core EventBus & Redis EventBridge 进行解耦订阅（例如：发布动态触发 `note.created` 事件，其他模块自由订阅处理）。
4. **自研搜索机制与 VSQL 解释器**：弃用第三方搜索引擎依赖，采用自研搜索机制并整合 **Verse Search Query Language (VSQL)** 语义解释器，支持多语言 CJK 分词、拼音检索与复杂条件表达式解析。
5. **统一 CLI 工具管理 (Verse tool)**：通过 **Verse tool**（基于 Go 编写的轻量化 CLI 运维管理工具）管理 Asagity Verse 的生命周期（启动、停止、模块/应用加载、环境自愈）。

---

## 📁 重构后的目录结构

```text
core/
├── src/
│   ├── Verse.slnx                       # .NET 解决方案 (Api + 7 Modules)
│   ├── Verse.Api/                        # 🚀 ASP.NET Core (API 层主入口)
│   │   ├── Program.cs                    # 动态扫描并加载 Modules
│   │   ├── Middlewares/                  # JWT 鉴权, CORS, VSQL 路由解析中间件
│   │   └── Verse.Api.csproj
│   │
│   ├── Verse.Shared/                     # 🧩 共享契约层 (Envelope/认证上下文/ModuleException)
│   │   └── Verse.Shared.csproj
│   │
│   ├── Verse.Modules/                    # 🧩 自主开发模块化业务域 (Modular Domains)
│   │   ├── Verse.Module.Asset/           # 远程资源代理与缓存模块 (Icon Proxy & Cache)
│   │   ├── Verse.Module.Auth/            # 认证模块 (Login, Register, OTP, Device Trust)
│   │   ├── Verse.Module.User/            # 用户模块 (Profile, pubid, Groups)
│   │   ├── Verse.Module.Note/            # 动态/时间线模块 (Posts, Repost, Reactions, Trees)
│   │   ├── Verse.Module.Drive/           # Skyline Drive 网盘模块 (Local/S3/WebDAV)
│   │   ├── Verse.Module.Follow/          # 社交关系网 (Follow, Block, Mute)
│   │   ├── Verse.Module.Instance/        # 实例元信息与 Federation 健康度
│   │   └── Verse.Module.Music/           # 音乐播放器与 LRC 歌词模块 (AAP 应用扩展示例)
│   │
│   ├── Verse.Engine/                     # ⚙️ Go 核心底层引擎 (事件/长连接/VSQL/联邦)
│   │   ├── cmd/verse-engine/             # Go 引擎守护进程入口
│   │   ├── pkg/
│   │   │   ├── eventbus/                 # 高性能 EventBus & Redis Bridge
│   │   │   ├── vsql/                     # Verse Search Query Language 语义解释器
│   │   │   ├── activitypub/              # ActivityPub & NeoLinkage 联邦协议适配器
│   │   │   └── websocket/                # 长连接推送服务 (/ws/timeline, /ws/global)
│   │   ├── go.mod
│   │   └── go.sum
│   │
│   └── Verse.Cli/                        # 🛠️ Verse tool (Go 编写的 CLI 管理工具)
│       ├── cmd/verse/                    # `verse` 命令行入口 (start, stop, status, module)
│       ├── internal/
│       │   ├── runner/                   # 双进程 (API + Engine) 调度与守护
│       │   ├── doctor/                   # 环境与数据库自愈诊断
│       │   └── modulemgr/                # AAP 应用管理
│       ├── go.mod
│       └── go.sum
│
├── storage/                              # 持久化存储与 Migration
│   ├── migrations/                       # PostgreSQL 表结构演进脚本
│   └── scripts/                          # 运维辅助脚本
│
├── README.md                             # 英文说明文档
├── README_CN.md                          # 中文说明文档
└── Arch.mermaid                          # 模块化后端架构图表
```

---

## 🧱 模块化业务域说明 (`Verse.Modules`)

| 模块包名 | 功能说明 |
| :--- | :--- |
| **`Verse.Module.Auth`** | 注册/登录、邮箱 6 位验证码 OTP、JWT 验证（30 分钟 Access Token + 30 天 Cookie Refresh Token 轮换）、设备信任与全局登出。 |
| **`Verse.Module.User`** | 用户基本资料、权限组管理，以及 Asagity 特有的 `pubid`（`usr_` 前缀的全局唯一且支持每月变更的标识符）。 |
| **`Verse.Module.Instance`** | 系统健康检查（`GET /healthz`）、版本及实例元信息暴露（`/api/meta/instance`）。 |
| **`Verse.Module.Drive`** | Skyline Drive 云盘系统：支持本地磁盘、S3 对象存储、WebDAV 挂载的分片上传与目录管理。 |
| **`Verse.Module.Note`** | 社交动态核心：支持长短动态发布、纯转发、带评论转发 (Quote Repost)、无限 Emoji 反应 (Reactions)、树状回复链及 VSQL 搜索。 |
| **`Verse.Module.Follow`** | 关注、粉丝图谱与静音/黑名单管理。 |
| **`Verse.Module.Music`** | 音乐播放器、LRC 歌词解析与音质标签，展示 AAP 应用扩展能力。 |
| **`Verse.Module.Asset`** | 远程资源代理与缓存：抓取联邦远端图标并按 MD5 落盘缓存。 |

---

## 📦 模块与 App 的边界（创新点）

Asagity 后端采用 **“模块 + App 环境”** 双层扩展体系，请注意术语区分：

- **模块（Module）**：仅指随服务端一起编译、由官方维护的**核心模块**（`Verse.Modules` 下的 `Auth / User / Note / Drive / Follow / Instance / Music`）。核心模块拥有完整的数据访问与路由挂载能力，遵循统一的模块内分层规范。
- **应用（App）**：指**第三方开发者**开发的扩展，一律称为“应用”，不再称为“模块”。应用以 `.aap`（Asagity Application，本质为 tar.gz 压缩包，含 `manifest.json` + 前后端代码 + 静态资源）格式分发，经签名校验后安装到 **App 环境**中运行。App 环境提供 UI 注入点（导航栏、侧边栏、时间线、悬浮按钮等）与受限 API/Event 订阅能力，应用**禁止直连数据库**，只能通过平台网关访问受限接口，从而保证主服务的安全与稳定。
- 旧称 **AIM（Asagity Integrated Module）** 及其 `.aim` 扩展名已统一更名为 **AAP（Asagity Application）** 及其 `.aap` 扩展名。完整的应用包规范参见 [`docs/file-format/aap.md`](../docs/file-format/aap.md)（原 `aim.md`）。

---

## 🛠️ 基础设施与核心引擎 (`Verse.Engine`)

- **PostgreSQL + ORM (`storage/migrations`)**：以 PostgreSQL 作为主数据库，深度利用其 `JSONB` 特性解析和存储 ActivityPub 联邦协议异构数据。
- **Redis (缓存 / 队列 / Bridge)**：承担热点缓存、Token 刷新黑名单/轮换存储、EventBridge 消息管道及任务队列。
- **Go 内存 EventBus & Redis Bridge (`Verse.Engine/pkg/eventbus`)**：
  - **内存 EventBus**：配置 16 个 Worker 协程，支持 10 万条记录的**幂等性去重**。
  - **Redis EventBridge**：跨 Server 节点通过 Redis Pub/Sub 同步事件，构建集群广播能力。
- **WebSocket 推送服务器 (`Verse.Engine/pkg/websocket`)**：提供多频道订阅（`/ws/timeline` 时间线、`/ws/notifications` 通知、`/ws/global` 全局事件）。
- **自研搜索引擎与 VSQL 解释器 (`Verse.Engine/pkg/vsql`)**：
  - **自研搜索机制**：搭配 **Verse Search Query Language (VSQL)** 语义解释器，解析富文本、语法条件表达式与逻辑匹配。
  - **多语言与拼音**：支持中文全拼/首字母拼音联想、CJK 智能切词与复杂搜索语法。

---

## 🛠️ 管理工具：Verse tool (`Verse.Cli`)

Asagity Verse 服务端生命周期由 **Verse tool**（Go 编写的 CLI 管理工具）统一管理：
- **服务管控**：`verse start` / `verse stop` / `verse restart` / `verse status`
- **应用管理**：`verse app list` / `verse app enable` / `verse app disable`（管理第三方 `.aap` 应用）
- **环境检查**：诊断 PostgreSQL、Redis、网络端口及环境连通性。

---

## 🗺️ 架构图表

详细的架构图表请参见本目录下的 [Arch.mermaid](./Arch.mermaid)。

---

## 🔧 运行与维护

Asagity Verse 的生命周期和运维命令由 **Verse tool** 统一调度：

```bash
# 启动 Asagity Verse 服务端全套服务 (API + Engine)
verse start

# 查看服务运行状态与模块/应用加载状态
verse status

# 停止服务
verse stop
```

API 默认监听端口：`:2048`。可以通过访问 `http://localhost:2048/healthz` 检查服务运行状态。
