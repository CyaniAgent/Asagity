<div align="center">
  <img src="https://github.com/CyaniAgent/Asagity/blob/Dev/Asagity_Logo.png" width="800" height="600" alt="Asagity Logo">
  <h1>Asagity (アサギティ)</h1>
  <p><b>The Cyan-tinted Decentralized Social Universe.</b></p>
   
  [![License](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](LICENSE)
  [![Client](https://img.shields.io/badge/Client-React%2019-61DAFB?logo=react)](web/)
  [![Server](https://img.shields.io/badge/Server-Go%20%2B%20ASP.NET%20Core-00ADD8?logo=go)](core/)
  [![Status](https://img.shields.io/badge/Status-In%20Development-orange.svg)]()
   
  [English](./README.md) | [简体中文](./README_CN.md)
</div>

---

## What is Asagity?

**Asagity** is a modern, anime-inspired, decentralized federated social platform developed by **CyaniAgent**. 
It's not just another microblogging instance; it's a digital utopia that combines real-time social networking with a powerful multi-backend cloud drive. 

Built on the self-developed **Verse for Asagity** backend engine, leveraging the Verse primary protocol with ActivityPub compatibility, Asagity allows you to seamlessly interact with users across the entire Fediverse (Mastodon, Misskey, Pleroma, etc.), all while enjoying a highly customizable tab-based experience.

## Key Features

- **Native Federation**: Built on the self-developed Verse for Asagity backend engine, leveraging the Verse primary protocol with ActivityPub compatibility. Connect, reply, and resonate with the entire Fediverse.
- **Skyline Drive**: A built-in, powerful cloud drive system. Supports local storage, S3-compatible object storage, and remote WebDAV mounting. Features chunked uploads and a native file manager UI.
- **Topics System**: Community-driven topic discovery with activity tracking, trending analysis, and real-time post integration.
- **Highly Customizable UI**: Breaking the traditional three-column layout. Asagity adopts an advanced tab mechanism with on-open loading, on-close release, and minimized-page preloading, delivering an OS-level page experience.
- **Rich Toy-like Widgets**: Built-in mini music player with lyrics sync, custom dynamic emojis, typing effects, and weather-based online status.
- **Blazing Fast**: Powered by Go + ASP.NET Core for massive concurrent federation broadcasting, and React 19 for instant client-side delivery.

## Tech Stack

Asagity is built as a symmetric Monorepo, separating the client layer from the server core.

*   **Client (`/web`)**: React 19, Tailwind CSS v4, Zustand.
*   **Server (`/core`)**: Go + ASP.NET Core, GORM, Asynq (Redis-based task queue).
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

### 2. Start the Server (Core)
```bash
cd core
# Copy the env example and configure it
cp .env.example .env 
go mod tidy
go run .
```

### 3. Start the Client (Web)
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
├── web/                    # Client (React 19)
│   ├── src/
│   │   ├── app/            # App Router pages
│   │   ├── components/     # React components
│   │   ├── stores/         # Zustand state management
│   │   ├── types/          # TypeScript types
│   │   ├── lib/            # Utilities (api.ts, utils.ts)
│   │   └── messages/       # i18n (zh-CN, zh-TW, en-US, ja-JP)
│   ├── public/             # Static assets (fonts, sounds, PWA)
│   └── middleware.ts       # Auth route guard
├── core/                   # Server (Go + ASP.NET Core)
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
  <i>Crafted with 🩵 by <a href="https://github.com/CyaniAgent">CyaniAgent and every contributor.</a></i>
</div>
