<div align="center">
  <img src="https://github.com/CyaniAgent/Asagity/blob/Dev/Asagity_Logo.png" width="800" height="600" alt="Asagity Logo">
  <h1>Asagity (アサギティ)</h1>
  <p><b>The Cyan-tinted Decentralized Social Universe.</b></p>
   
  [![License](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](LICENSE)
  [![Frontend](https://img.shields.io/badge/Frontend-Next.js%2016-000000?logo=next.js)](web/)
  [![Backend](https://img.shields.io/badge/Backend-Go-00ADD8?logo=go)](core/)
  [![Status](https://img.shields.io/badge/Status-In%20Development-orange.svg)]()
   
  [English](./README.md) | [简体中文](./README_CN.md)
</div>

---

## What is Asagity?

**Asagity** is a modern, anime-inspired, decentralized federated social platform developed by **CyaniAgent**. 
It's not just another microblogging instance; it's a digital utopia that combines real-time social networking with a powerful multi-backend cloud drive. 

Built with the **ActivityPub** protocol, Asagity allows you to seamlessly interact with users across the entire Fediverse (Mastodon, Misskey, Pleroma, etc.), all while enjoying a gorgeous, glassmorphism "Dashboard" UI.

## Key Features

- **Native Federation**: Fully compatible with the ActivityPub protocol. Connect, reply, and resonate with the entire Fediverse.
- **Skyline Drive**: A built-in, powerful cloud drive system. Supports local storage, S3-compatible object storage, and remote WebDAV mounting. Features chunked uploads and a native file manager UI.
- **Topics System**: Community-driven topic discovery with activity tracking, trending analysis, and real-time post integration.
- **Anime-vibe & Dashboard UI**: Breaking the traditional three-column layout. Asagity uses a modern SaaS-like "Inverted-L" layout with rich glassmorphism (backdrop-blur) effects, customizable themes, and a "Cyan" (Asagi) soul.
- **Rich Toy-like Widgets**: Built-in mini music player with lyrics sync, custom dynamic emojis, typing effects, and weather-based online status.
- **Blazing Fast**: Powered by Go (Goroutines) for massive concurrent federation broadcasting, and Next.js 16 (Turbopack) for instant frontend delivery.

## Tech Stack

Asagity is built as a symmetric Monorepo, separating the UI layer from the heavy-lifting core.

*   **Frontend (`/web`)**: React 19, Next.js 16 (App Router, Turbopack), Tailwind CSS v4, Zustand, Framer Motion.
*   **Backend (`/core`)**: Go, GORM, Asynq (Redis-based task queue).
*   **Infrastructure**: PostgreSQL (Main database with JSONB), Redis (Cache & Queue).
*   **Container Runtime**: Docker & Podman support with separate container configs.

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+) & [pnpm](https://pnpm.io/)
- [Go](https://go.dev/) (v1.21+)
- Docker or Podman

### 1. Setup Infrastructure

Clone the repository and spin up the database and Redis using Docker or Podman:

```bash
git clone https://github.com/CyaniAgent/Asagity.git
cd Asagity
```

**For Docker:**
```bash
docker compose -f container/docker/docker-compose.yaml up -d
```

**For Podman:**
```bash
# Start services
cd container/podman && ./start.sh

# Or manually
podman compose -f container/podman/podman-compose.yaml up -d
```

### 2. Start the Backend (Core)
```bash
cd core
# Copy the env example and configure it
cp .env.example .env 
go mod tidy
go run .
```

### 3. Start the Frontend (Web)
Open a new terminal window:
```bash
cd web
pnpm install
pnpm dev
```
Visit `http://localhost:2000` to enter the Cyan Universe!

## Project Structure

```
Asagity/
├── web/                    # Frontend (Next.js 16 + React 19)
│   ├── src/
│   │   ├── app/            # App Router pages
│   │   ├── components/     # React components
│   │   ├── stores/         # Zustand state management
│   │   ├── types/          # TypeScript types
│   │   ├── lib/            # Utilities (api.ts, utils.ts)
│   │   └── messages/       # i18n (zh-CN, zh-TW, en-US, ja-JP)
│   ├── public/             # Static assets (fonts, sounds, PWA)
│   └── middleware.ts       # Auth route guard
├── core/                   # Backend (Go)
│   ├── cmd/api/            # API entrypoint
│   ├── internal/
│   │   ├── module/         # Domain modules
│   │   │   ├── auth/       # Authentication
│   │   │   ├── drive/      # Skyline Drive
│   │   │   └── ...
│   │   └── platform/       # Shared infrastructure
│   └── ...
├── container/              # Container configurations
│   ├── docker/             # Docker Compose
│   └── podman/             # Podman Compose + scripts
└── docs/                   # Documentation
```

## Contributing
Asagity is currently in its early development phase. PRs, issues, and feature requests are highly welcome! 

## License
This project is licensed under the [AGPL-3.0 License](LICENSE).

---
<div align="center">
  <i>Crafted with 🩵 by <a href="https://github.com/CyaniAgent">CyaniAgent</a></i>
</div>
