# Asagity Web (React Frontend)

> Asagity BuildX is built on Vite — React 19 + Tailwind CSS v4 + Zustand + Astryx design system

## Getting Started

```bash
pnpm install
pnpm dev          # http://localhost:2000
```

The dev server proxies the dual backend: `/api` → Go engine (`:2048`), `/api-net` + `/healthz-api` → .NET API (`:2050`). Proxy rules are order-sensitive (`/api-net` must precede `/api`), see `vite.config.ts`.

## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Asagity BuildX dev server (port 2000, HMR) |
| `pnpm build` | Typecheck (`tsc --noEmit`) + production build via BuildX |
| `pnpm preview` | Serve the production build via BuildX |
| `pnpm typecheck` | TypeScript check |
| `pnpm test` | Unit tests (Vitest + BuildX banner tests) |
| `pnpm test:buildx` | BuildX banner / log normalization tests (node:test) |
| `pnpm test:watch` | Vitest watch mode |
| `pnpm test:e2e` | E2E tests (Playwright) |
| `pnpm test:e2e:ui` | Playwright UI mode |
| `pnpm theme:palette` | Regenerate the seasonal palette (astryx CLI) |
| `pnpm theme:build` | Build the seasonal theme CSS |

## Tech Stack

- **Framework**: React 19.2 + **Asagity BuildX** (built on Vite; ESM dev server, HMR)
- **UI**: Tailwind CSS v4, Astryx design system (`@astryxdesign/*`), Framer Motion
- **State**: Zustand (persist middleware, ~20 stores)
- **Icons**: @fluentui/react-icons, mapped through the local `Icon` wrapper
- **Window System**: self-built free-window manager (FreeWindow / WindowManager / split view / page manager)
- **Terminal**: Termity — bash-style history, zsh-style suggestions, tmux-style sessions
- **i18n**: 4 locales (zh-CN, zh-TW, en-US, ja-JP) under `src/i18n/locale`
- **Seasonal theme**: `src/theme/yukinoshita-glacier` (2026.Q4, Astryx `defineTheme` → built CSS in `dist/`)
- **Testing**: Vitest + React Testing Library, Playwright (e2e)

## Asagity BuildX

**Asagity BuildX is built on Vite** — BuildX is the frontend compiler runner behind `dev` / `build` / `preview`:

- `scripts/buildx.mjs` calls the Vite JS API (`createServer` / `build` / `preview`) instead of the Vite CLI, so the startup banner, build logs and exit message are all produced by BuildX.
- The banner shows `Asagity BuildX <version>` plus "Asagity BuildX is built on Vite". The version comes from the `version` field in `package.json` (the CI-rewritten true version) and matches the project version verbatim.
- Address lines carry the actual listening port: `IPv4 127.0.0.1:2000`, `IPv6 [::1]:2000`. When the port is busy, Vite auto-increments and the banner shows the real value.
- Runtime `[vite]` prefixes are rewritten to `[BuildX]`. The attribution tagline is product copy, not a Vite CLI artifact.

Configuration lives in `vite.config.ts` (BuildX plugin); the pure banner helpers live in `scripts/buildx/banner.mjs`.

## Project Structure

```
src/
├── pages/            # Route pages (about, panel, settings, chat, drive, topic, …)
├── components/       # React components
│   ├── layout/       # MainLayout, Sidebar, SplitView, PageManager, WindowHeader
│   ├── windows/      # FreeWindow, WindowManager (free-floating windows)
│   ├── termity/      # Termity terminal + session selector + auth modal
│   ├── topbar/       # TopBar suite, ThemeToggle, ConnectionPill, NotificationCenter
│   ├── music/        # MusicPlayer, Lyrics, Playlist
│   ├── post/         # PostItem, TimelineFeed, MfmRenderer
│   ├── welcome/      # Welcome page + instance card + status pills
│   ├── widgets/      # Right-rail widgets (clock, memo)
│   ├── portal-debugger/  # Portal Debugger (embedded Termity + tabs)
│   ├── ui/           # Icon, ClientLink, ContextMenu, SplashScreen, ErrorBoundary
│   └── providers/    # I18nProvider, SeasonThemeProvider, SW Registration
├── stores/           # Zustand stores (theme, freeWindow, termitySessions, widgets, …)
├── i18n/locale/      # i18n JSON (4 languages)
├── theme/            # Yukinoshita Glacier seasonal theme (Astryx palette + built CSS)
├── hooks/            # Shared React hooks
├── lib/              # Utilities (backend proxy, termity suggest, debug commands, …)
├── types/            # TypeScript types
└── styles/           # globals.css (semantic design tokens)
scripts/
├── buildx.mjs        # Asagity BuildX compiler runner entry (dev / build / preview)
└── buildx/           # BuildX banner, version metadata and tests
```
