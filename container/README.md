# Asagity Container Setup Guide

This directory contains container configurations for running Asagity's backend services.

## Directory Structure

```
container/
├── docker/              # Docker configuration
│   └── docker-compose.yaml
├── podman/              # Podman configuration
│   ├── podman-compose.yaml
│   ├── podman.env
│   ├── start.sh
│   └── stop.sh
└── shared/              # Shared configurations (future)
```

## Quick Start

### Podman (Recommended on Linux)

```bash
# Start services
cd container/podman && ./start.sh

# Or manually
podman compose -f container/podman/podman-compose.yaml up -d

# Stop services
cd container/podman && ./stop.sh --volumes
```

### Docker

```bash
# Start services
docker compose -f container/docker/docker-compose.yaml up -d

# Stop services
docker compose -f container/docker/docker-compose.yaml down -v
```

## Services

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| PostgreSQL | postgres:18.3-alpine3.23 | 5432 | Primary database |
| Redis | redis:8.6.2-alpine | 6379 | Cache & session storage |

## Environment Variables

Copy `container/podman/podman.env` to project root `.env` and customize:

```bash
cp container/podman/podman.env ../../.env
```

## Prerequisites

### Podman

```bash
# Linux
sudo apt-get install podman podman-compose

# macOS
brew install podman
podman machine init
podman machine start
```

### Docker

```bash
# Linux
sudo apt-get install docker.io docker-compose

# macOS/Windows
# Install Docker Desktop from docker.com
```
