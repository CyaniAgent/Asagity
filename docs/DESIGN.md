# Asagity Design System

> 2D/3D 混合级视觉规范 — "A cyan-tinted decentralized social universe"

---

## 1. Color Palette

### Brand Colors

| Token | Hex | Tailwind | Usage |
|:---|:---|:---|:---|
| Primary | `#39C5BB` | `cyan-500` | Core brand, buttons, links, glows |
| Primary Light | `#7BE0DC` | `cyan-300` | Hover states, highlights |
| Primary Dark | `#2B9F98` | `cyan-600` | Active states, pressed |
| Accent | `#22D3EE` | `cyan-400` | Secondary glow, outer shadows |
| Accent Bright | `#67E8F9` | `cyan-300` | Decorative sparkles |

### Semantic Colors

| Token | Light Mode | Dark Mode | Usage |
|:---|:---|:---|:---|
| Background | `gray-100` | `#121212` | Page base |
| Surface | `white/90` | `gray-900/90` | Cards, panels |
| Surface Hover | `black/5` | `white/5` | Interactive hover |
| Text High | `gray-900` | `rgba(255,255,255,0.95)` | Primary text |
| Text Dim | `gray-500` | `rgba(255,255,255,0.4)` | Secondary text |
| Border | `gray-200/50` | `white/5` | Subtle dividers |
| Border Glass | `white/20` | `gray-800/50` | Glassmorphism borders |

### Action Colors

| Action | Hover Background | Hover Text |
|:---|:---|:---|
| Reply | `cyan-950/50` | `cyan-500` |
| Repost | `green-950/50` | `green-500` |
| React | `orange-950/50` | `orange-500` |
| Delete/Danger | `red-50` / `red-950/50` | `red-500` |

### Audio Quality Tags

| Quality | Color | Background |
|:---|:---|:---|
| Hi-Res | `amber-500` | `amber-500/10` |
| Lossless | `cyan-500` | `cyan-500/10` |
| HQ | `green-500` | `green-500/10` |
| Standard | `blue-500` | `blue-500/10` |
| Low | `gray-400` | `gray-400/10` |

---

## 2. Typography

### Font Stacks

| Token | Font | Fallbacks |
|:---|:---|:---|
| `--font-sans` | HarmonyOS Sans SC | HarmonyOS Sans, ui-sans-serif, system-ui, sans-serif |
| `--font-mono` | JetBrains Mono | ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace |

### Weights

| Weight | Value | Usage |
|:---|:---|:---|
| Light | 300 | Secondary text, captions |
| Regular | 400 | Body text |
| Medium | 500 | Labels, navigation |
| Bold | 700 | Headings, display names |
| Black | 900 | Hero text, splash screen |

### CJK Support

HarmonyOS Sans SC covers: Chinese Simplified (CJK), Japanese (Kana), Korean (Hangul) via Unicode range `U+2E80-2A6DF`.

### Code Typography

```css
code, kbd, samp, pre { font-family: var(--font-mono); }
```

---

## 3. Spacing & Layout

### Grid System

- Base unit: Tailwind `4px` grid
- Common widths: `w-64` (sidebar), `w-settings-nav` (~240px), `w-[320px]` (music player)

### Border Radius

| Pattern | Value | Usage |
|:---|:---|:---|
| `rounded-full` | 9999px | Buttons, badges, avatars |
| `rounded-3xl` | 24px | Cards, modals, popovers |
| `rounded-2xl` | 16px | Context menus, panels |
| `rounded-[28px]` | 28px | Music player container |
| `rounded-[30px]` | 30px | FreeWindow containers, glassmorphism cards |

---

## 4. Glassmorphism System

The core visual language. Found in 83+ locations across the codebase.

### Tiers

| Level | Blur | Opacity | Usage |
|:---|:---|:---|:---|
| Light | `backdrop-blur-md` | `/40` | Header bars, glass pills |
| Medium | `backdrop-blur-xl` | `/70` | Context menus, mobile nav |
| Heavy | `backdrop-blur-2xl` | `/80` | Popovers, settings panels |
| Immersive | `backdrop-blur-3xl` | `/90` | FreeWindows, splash screen |

### Glass Card Pattern

```tsx
className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl
  border border-white/10 dark:border-gray-800/80
  shadow-[0_10px_40px_rgba(0,0,0,0.15)]
  rounded-[30px]"
```

### Glass Pill Pattern (Header)

```tsx
className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-md
  border border-white/20 dark:border-gray-700/50
  rounded-full"
```

---

## 5. Shadows & Glows

### Box Shadows

| Pattern | Value | Usage |
|:---|:---|:---|
| Subtle | `shadow-[0_20px_50px_rgba(0,0,0,0.3)]` | Context menus |
| Medium | `shadow-[0_10px_40px_rgba(0,0,0,0.15)]` | FreeWindows |
| Large | `shadow-2xl` | Popovers, modals |
| Cyan Glow | `shadow-[0_0_8px_rgba(57,197,187,0.2)]` | Active toggles |
| Cyan Glow Strong | `shadow-[0_0_10px_rgba(57,197,187,0.6)]` | Progress bars |
| Cyan Outer | `shadow-[0_0_20px_rgba(57,197,187,0.4)]` | Welcome pillars |
| Red Glow | `shadow-[0_0_30px_rgba(239,68,68,0.3)]` | Network error toast |

### Ring Patterns

```tsx
ring-2 ring-cyan-500/50  // Avatar default
ring-2 ring-cyan-500     // Avatar hover
```

---

## 6. Animations

### Entry Animations

| Name | CSS | Duration | Usage |
|:---|:---|:---|:---|
| fadeIn | `ease-out` | 0.3s | Page loads, post items |
| fadeInUp | `cubic-bezier(0.2,0.8,0.2,1)` | 0.8s | Splash screen |
| fadeInUp | `ease-out` | 0.15-0.2s | Popovers, modals |
| slideLeft | `ease-out` | 0.6s | Drive drop panel |

### Window Animations (FreeWindow)

| State | Effect | Duration |
|:---|:---|:---|
| Open | Fade in + scale(0.95→1) | 200ms |
| Close | Fade out + scale(1→0.8) | 200ms |
| Minimize | Drop-down slide | 350ms |
| Maximize | Expand to viewport | 200ms |
| Restore | Scale bounce (cubic-bezier 0.34,1.56,0.64,1) | 300ms |

### Continuous Animations

| Name | Pattern | Usage |
|:---|:---|:---|
| shimmer | 1.5s infinite linear | Loading bars |
| marquee | 10s linear infinite | Music track title |
| pulse | Tailwind default | Glow effects, badges |
| ping | Tailwind default | Notification badges |
| flicker | 4s infinite | Welcome page label |
| spin | Tailwind default | Loading spinners |

### Cursor Patterns

```css
cursor-grab              // Draggable headers
active:cursor-grabbing   // During drag
```

---

## 7. Icon System

### Library

`@fluentui/react-icons` v2 — Fluent UI System Icons

### Wrapper Component

```tsx
<Icon name="home" fontSize={20} filled />
```

- 90+ mapped icon names
- `filled` prop toggles Regular/Filled variants
- Wrapped with `React.memo` for performance

### Common Icons

| Category | Names |
|:---|:---|
| Navigation | `home`, `tag`, `cloud`, `settings`, `chat`, `music_note` |
| Actions | `send`, `heart`, `repeat`, `bookmark`, `edit`, `delete` |
| Status | `check_circle`, `error`, `warning`, `info` |
| Media | `play_arrow`, `pause`, `skip_next`, `skip_previous`, `volume_up` |

---

## 8. Component Patterns

### Button Variants

| Variant | Classes |
|:---|:---|
| Primary | `bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-full shadow-lg` |
| Ghost | `hover:bg-black/5 dark:hover:bg-white/5` |
| Danger | `bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl` |
| Glass Pill | `bg-white/40 dark:bg-gray-800/40 backdrop-blur-md border border-white/20` |

### Input Pattern

```tsx
className="bg-white/50 dark:bg-gray-900/50
  border border-gray-200/50 dark:border-gray-700/50
  rounded-2xl
  focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500
  placeholder:text-gray-400"
```

### Card Pattern

```tsx
className="bg-white/90 dark:bg-gray-900/90
  backdrop-blur-2xl
  border border-white/10 dark:border-gray-800/80
  shadow-[0_10px_40px_rgba(0,0,0,0.15)]
  rounded-[30px]
  p-6"
```

### Empty State Pattern

```tsx
<EmptyState
  icon={<Icon name="inbox" fontSize={48} />}
  title="No posts yet"
  description="When someone posts, it will appear here."
/>
```

---

## 9. Theme System

### Modes

| Mode | Background | Surface | Text |
|:---|:---|:---|:---|
| Dark | `#121212` | `gray-900/90` | `white/95` |
| Light | `gray-100` | `white/90` | `gray-900` |
| System | Auto-detected via `prefers-color-scheme` | — | — |

### Implementation

- Zustand store with `persist` middleware (localStorage key: `asagity-theme`)
- Applied via `data-theme` attribute on `<html>`
- Toggle cycle: light → dark → system → light
- `<html lang="zh" data-theme="dark" suppressHydrationWarning>`

### Dynamic Theming (Music Player)

```css
--theme-color: var(--color-cyan-500);
--text-color: var(--foreground);
```

Album art background: `scale-150 blur-[80px] opacity-25` with color extraction.

---

## 10. Scrollbar

```css
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(57, 197, 187, 0.3); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: rgba(57, 197, 187, 0.5); }
```

Glass-styled, cyan-tinted, minimal.

---

## 11. Lyrics Focus-Blur (Spotify-style)

| State | Opacity | Scale | Blur | Font |
|:---|:---|:---|:---|:---|
| Active | 1.0 | 1.05-1.15 | 0 | Black (800) |
| Near | 0.3 | 0.75 | 0.5px | Regular (400) |
| Far | 0 | — | 4px | Regular (400) |

```css
mask-image: linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%);
will-change: transform, opacity, filter;
```

---

## 12. Layout Ratios

| Element | Value |
|:---|:---|
| Sidebar width | `w-64` (256px) |
| Mobile nav | Fixed bottom, `lg:hidden` |
| Settings nav | `w-settings-nav` (~240px) |
| Music player | `w-[320px]` |
| FreeWindow min | 300×200 |
| FreeWindow max inset | 16px from viewport edge |

---

## 13. Keyframe Definitions (globals.css)

```css
@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: translateY(0) } }
@keyframes slideLeft { from { transform: translateX(30px); opacity: 0 } to { transform: translateX(0); opacity: 1 } }
@keyframes shimmer { from { background-position: 200% 0 } to { background-position: -200% 0 } }
@keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
@keyframes flicker { 0%, 100% { opacity: 1 } 50% { opacity: 0.4 } }
@keyframes pulse { 50% { opacity: 0.5 } }
```

---

## 14. Dependencies

| Package | Purpose |
|:---|:---|
| `tailwindcss` v4 | Utility-first CSS |
| `framer-motion` v12 | Declarative animations |
| `react-rnd` v10 | Draggable + resizable windows |
| `react-resizable-panels` v4 | Panel layouts |
| `react-window` v2 | Virtualized lists |
| `@fluentui/react-icons` v2 | Icon system |
| `clsx` + `tailwind-merge` | Class utilities |
| `zustand` v5 | State management |
| `@tanstack/react-query` v5 | Data fetching |
| `next-intl` v4 | i18n |

---

*Last updated: 2026-07-13 — Synced with Asagity frontend codebase.*
