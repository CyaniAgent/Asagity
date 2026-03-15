
<div align="center">
  <img src="https://via.placeholder.com/150/00bcd4/ffffff?text=Asagity" width="120" height="120" alt="Asagity Logo">
  <h1>Asagity (アサギティ)</h1>
  <p><b>The Cyan-tinted Decentralized Social Universe.</b></p>
  
  [![License](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](LICENSE)
  [![Frontend](https://img.shields.io/badge/Frontend-Nuxt%203-00DC82?logo=nuxt.js)](web/)
  [![Backend](https://img.shields.io/badge/Backend-Go-00ADD8?logo=go)](core/)
  [![Status](https://img.shields.io/badge/Status-In%20Development-orange.svg)]()[English](./README.md) | [简体中文](./README_CN.md)
</div>

---

## 🌌 What is Asagity?

**Asagity** is a modern, anime-inspired, decentralized federated social platform developed by **CyaniAgent**. 
It's not just another microblogging instance; it's a digital utopia that combines real-time social networking with a powerful multi-backend cloud drive. 

Built with the **ActivityPub** protocol, Asagity allows you to seamlessly interact with users across the entire Fediverse (Mastodon, Misskey, Pleroma, etc.), all while enjoying a gorgeous, glassmorphism "Dashboard" UI.

## ✨ Key Features

- **🪐 Native Federation**: Fully compatible with the ActivityPub protocol. Connect, reply, and resonate with the entire Fediverse.
- **☁️ Asagi Drive**: A built-in, powerful cloud drive system. Supports local storage, S3-compatible object storage, and remote WebDAV mounting. Features chunked uploads and a native file manager UI.
- **🎨 Anime-vibe & Dashboard UI**: Breaking the traditional three-column layout. Asagity uses a modern SaaS-like "Inverted-L" layout with rich glassmorphism (backdrop-blur) effects, customizable themes, and a "Cyan" (Asagi) soul.
- **🎵 Rich Toy-like Widgets**: Built-in mini music player, custom dynamic emojis, typing effects, and weather-based online status.
- **⚡ Blazing Fast**: Powered by Go (Goroutines) for massive concurrent federation broadcasting, and Nuxt 3 for instant SSR frontend delivery.

## 🛠️ Tech Stack

Asagity is built as a symmetric Monorepo, separating the UI layer from the heavy-lifting core.

*   **Frontend (`/web`)**: Vue 3, Nuxt 3 (SSR), Nuxt UI, Tailwind CSS, Pinia, VueUse.
*   **Backend (`/core`)**: Go, GORM, Asynq (Redis-based task queue).
*   **Infrastructure**: PostgreSQL (Main database with JSONB), Redis (Cache & Queue).

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+) & [pnpm](https://pnpm.io/)
- [Go](https://go.dev/) (v1.21+)
- [Docker](https://www.docker.com/) & Docker Compose

### 1. Setup Infrastructure
Clone the repository and spin up the database and Redis using Docker:
```bash
git clone https://github.com/CyaniAgent/Asagity.git
cd Asagity
docker-compose up -d
```

### 2. Start the Backend (Core)
```bash
cd core
# Copy the env example and configure it
cp .env.example .env 
go mod tidy
go run main.go
```

### 3. Start the Frontend (Web)
Open a new terminal window:
```bash
cd web
pnpm install
pnpm dev
```
Visit `http://localhost:3000` to enter the Cyan Universe!

## 🤝 Contributing
Asagity is currently in its early development phase. PRs, issues, and feature requests are highly welcome! 

## 📜 License
This project is licensed under the [AGPL-3.0 License](LICENSE).

---
<div align="center">
  <i>Crafted with 🩵 by <a href="https://github.com/CyaniAgent">CyaniAgent</a></i>
</div>