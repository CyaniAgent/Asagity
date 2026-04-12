<div align="center">
  <img src="https://via.placeholder.com/150/00bcd4/ffffff?text=Asagity" width="120" height="120" alt="Asagity Logo">
  <h1>Asagity (アサギティ)</h1>
  <p><b>一抹青色的去中心化多元社交宇宙。</b></p>
   
  [![License](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](LICENSE)
  [![Frontend](https://img.shields.io/badge/Frontend-Nuxt%204-00DC82?logo=nuxt.js)](web/)
  [![Backend](https://img.shields.io/badge/Backend-Go-00ADD8?logo=go)](core/)
  [![Status](https://img.shields.io/badge/Status-正在开发-orange.svg)]()
   
  [English](./README.md) | [简体中文](./README_CN.md)
</div>

---

## 🌌 什么是 Asagity？

**Asagity** 是由 **CyaniAgent** 组织开发的一款充满日系二次元美学、现代化的去中心化联邦社交平台。
它不仅仅是一个微博客实例，更是一个将"实时社交网络"与"强大且多端的云盘系统"完美融合的数字乌托邦。

基于 **ActivityPub** 协议，Asagity 能够与整个联邦宇宙（Mastodon, Misskey, Pleroma 等）无缝连接与互动。同时，它抛弃了传统枯燥的布局，为你呈现极致顺滑的毛玻璃"控制台" UI 体验。

## ✨ 核心特性

- **🪐 原生联邦宇宙**：深度集成 ActivityPub 协议，跨实例关注、回复、转发，与万千星球产生共鸣。
- **☁️ Skyline Drive**：内置超强云盘系统。支持本机存储、S3 对象存储及 WebDAV 远程挂载。支持大文件分片上传，拥有媲美桌面级资源管理器的 UI。
- **#️⃣ 话题系统**：社区驱动的话题发现机制，支持活动追踪、趋势分析和实时帖子整合。
- **🎨 二次元美学 UI**：打破传统三栏布局，采用现代 SaaS 级"倒 L 型"控制台布局。大量使用毛玻璃 (backdrop-blur) 效果、浅葱色 (Cyan) 点缀与极其流畅的动画过渡。
- **🎵 趣味交互组件**：谁说社交平台只能发字？内置迷你音乐播放器挂件、动态自定义表情包、打字机特效签名及个性化在线状态。
- **⚡ 极致性能驱动**：后端由 Go 语言 (Goroutines) 驱动，轻松扛住海量联邦并发广播；前端采用 Nuxt 4 服务端渲染 (SSR)，首屏秒开，SEO 完美拉满。

## 🛠️ 技术栈

Asagity 采用清晰的 Monorepo（单体仓库）架构，前后端分离但协同开发：

*   **前端 (`/web`)**: Vue 3, Nuxt 4 (SSR), Nuxt UI, Tailwind CSS v4, Pinia, VueUse.
*   **后端 (`/core`)**: Go, GORM, Asynq (基于 Redis 的强力异步任务队列).
*   **底层基建**: PostgreSQL (极其依赖 JSONB 处理联邦数据), Redis (缓存与消息队列).
*   **容器运行时**: 支持 Docker 与 Podman，配置分离管理。

## 🚀 快速开始

### 环境准备
- [Node.js](https://nodejs.org/) (v18+) & [pnpm](https://pnpm.io/)
- [Go](https://go.dev/) (v1.21+)
- Docker 或 Podman

### 1. 启动底层基建
克隆仓库，使用 Docker 或 Podman 一键启动数据库与 Redis：

```bash
git clone https://github.com/CyaniAgent/Asagity.git
cd Asagity
```

**Docker:**
```bash
docker compose -f container/docker/docker-compose.yaml up -d
```

**Podman:**
```bash
# 使用启动脚本
cd container/podman && ./start.sh

# 或手动启动
podman compose -f container/podman/podman-compose.yaml up -d
```

### 2. 启动后端 (Core)
```bash
cd core
# 复制并配置环境变量
cp .env.example .env 
go mod tidy
go run .
```

### 3. 启动前端 (Web)
打开一个新的终端窗口：
```bash
cd web
pnpm install
pnpm dev
```
在浏览器中访问 `http://localhost:2000`，欢迎来到青之城邦！

## 📁 项目结构

```
Asagity/
├── web/                    # 前端 (Nuxt 4)
│   ├── app/
│   │   ├── components/     # Vue 组件
│   │   ├── pages/         # 页面路由
│   │   ├── stores/         # Pinia 状态
│   │   └── layouts/       # 布局组件
│   └── ...
├── core/                   # 后端 (Go)
│   ├── cmd/api/           # API 入口
│   ├── internal/
│   │   ├── module/        # 领域模块
│   │   │   ├── auth/     # 认证模块
│   │   │   ├── drive/    # Skyline Drive
│   │   │   └── ...
│   │   └── platform/     # 共享基础设施
│   └── ...
├── container/              # 容器配置
│   ├── docker/            # Docker Compose
│   └── podman/            # Podman Compose + 脚本
└── docs/                   # 文档
```

## 🤝 参与贡献
Asagity 目前正处于火热的早期开发阶段。无论你是擅长 Go 的硬核极客，还是精通 Vue 的 UI 魔法师，我们都极其欢迎你的 PR 和 Issue！

## 📜 开源协议
本项目采用 [AGPL-3.0 协议](LICENSE) 开源。

---
<div align="center">
  <i>Crafted with 🩵 by <a href="https://github.com/CyaniAgent">CyaniAgent</a></i>
</div>
