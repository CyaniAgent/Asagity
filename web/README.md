# Asagity Web (React Frontend)

> Next.js 16 + React 19 + Tailwind CSS v4 + Zustand

## Getting Started

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Dev server (Turbopack) |
| `pnpm build` | Production build |
| `pnpm lint` | ESLint fix |
| `pnpm typecheck` | TypeScript check |
| `pnpm test` | Unit tests (Vitest) |
| `pnpm test:e2e` | E2E tests (Playwright) |
| `pnpm analyze` | Bundle analysis |

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **UI**: Tailwind CSS v4, Framer Motion
- **State**: Zustand (persist middleware)
- **Icons**: @fluentui/react-icons v2
- **Window System**: react-rnd, react-resizable-panels
- **Testing**: Vitest, React Testing Library, Playwright

## Project Structure

```
src/
├── app/            # App Router pages
├── components/     # React components
│   ├── layout/     # MainLayout, Sidebar, SplitView
│   ├── windows/    # FreeWindow, WindowManager
│   ├── music/      # MusicPlayer, Lyrics, Playlist
│   ├── post/       # PostItem, TimelineFeed
│   ├── ui/         # Icon, ContextMenu, SplashScreen
│   └── providers/  # I18nProvider, SW Registration
├── stores/         # 11 Zustand stores
├── types/          # TypeScript types
├── lib/            # api.ts, utils.ts
└── messages/       # i18n (zh-CN, zh-TW, en-US, ja-JP)
```
