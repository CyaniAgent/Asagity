# Asagity Design Tokens

This document defines the core aesthetic tokens and design principles used across the Asagity platform. The design system is rooted in a **SSS-Rank 2D/3D Hybrid Aesthetic**, heavily inspired by the Vocaloid (Hatsune Miku) theme and modern Glassmorphism.

## 🎨 Color Palette

The primary accent color is **Miku Green (#39C5BB)**, mapped to the `cyan` palette in our Tailwind configuration.

| Token | Hex | Usage |
| :--- | :--- | :--- |
| `primary` | `#39C5BB` | Main accents, active states, glows, and key CTA buttons. |
| `bg-base` | `#121212` | Deep charcoal background for most full-screen views. |
| `bg-surface` | `rgba(255, 255, 255, 0.05)` | Semi-transparent surfaces for glassmorphic cards. |
| `border-glass` | `rgba(255, 255, 255, 0.1)` | Subtle borders for visual separation in dark mode. |

## 🔠 Typography

We prioritize readability and a high-tech feel using custom typefaces.

- **Primary Sans**: `MiSans`
  - *Usage*: Body text, headings, navigation.
  - *Fallback*: `ui-sans-serif`, `system-ui`.
- **Monospace**: `JetBrains Mono`
  - *Usage*: Code blocks, timestamps (Music Player), metadata, and status tags.
  - *Fallback*: `ui-monospace`, `SFMono-Regular`.

## ✨ Effects & Glassmorphism

Asagity relies on depth (Z-axis) to create an immersive experience.

- **Backdrop Blur**:
  - `Standard`: `blur-md` (12px) for menus.
  - `Immersive`: `blur-3xl` (64px) for the music player and detailed views.
- **Border Radius**:
  - `Container`: `30px` to `40px` (Extremely rounded for a soft, premium feel).
  - `Button/Avatar`: `full` (Circular).
- **Shadows**:
  - `Glow`: `0 0 20px rgba(57, 197, 187, 0.4)` (Used for active Miku Green elements).
  - `Deep`: `0 30px 60px rgba(0, 0, 0, 0.8)` (Used for album art and floating cards).

## 🌊 Scrollbar (Vocaloid Custom)

A global custom scrollbar is implemented to maintain UI consistency.

- **Width**: `6px`
- **Track**: `transparent`
- **Thumb**: `rgba(255, 255, 255, 0.08)` (Rounded 20px).
- **Hover State**: `rgba(57, 197, 187, 0.3)` with Miku Green accent.

## 🎞️ Animation Tokens

Animations should be as smooth as a 120fps Miku PV.

- **Primary Duration**: `700ms` to `1000ms` (For immersive transitions).
- **Micro-interactions**: `300ms` (For hover states and button clicks).
- **Easing**: `cubic-bezier(0.16, 1, 0.3, 1)` (Ultra-smooth out-quint).
- **Special**: `marquee` (10s linear infinite) for flowing titles in the mini-player.
