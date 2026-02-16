# Unified Dark Theme Design

## Goal

Apply the landing page's premium dark minimalist aesthetic across the entire app — auth pages, onboarding, and all protected app routes.

## Design Decisions

- **Dark-only**: Remove light/dark toggle. Single dark theme everywhere.
- **Sharp & flat**: No rounded corners, no shadows on cards/buttons/inputs.
- **Typography**: Mono font + wide tracking for nav, page titles, section headers. Sans-serif for body/data.

## Color System

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#0a0a0a` | Page background |
| Surface | `rgba(255,255,255,0.03)` | Cards, panels |
| Foreground | `#ffffff` | Primary text |
| Muted | `rgba(255,255,255,0.5)` | Secondary text |
| Muted-more | `rgba(255,255,255,0.4)` | Tertiary text |
| Border | `rgba(255,255,255,0.10)` | Dividers, card borders |
| Primary button | `bg-white text-black` | CTAs |
| Destructive | Muted red | Delete actions |

## Typography

- **Nav items, page titles, section headers**: `font-mono uppercase tracking-[0.2em] text-xs`
- **Body text, form fields, amounts, table data**: `font-sans` (Geist Sans), standard tracking
- **Large headings** (e.g. onboarding): `font-sans font-bold`, large size, white

## Components

- **Buttons**: `rounded-none`. Primary = white bg, black text. Ghost = transparent, white/50 text, hover white/70.
- **Cards**: `rounded-none`, no shadow, `border border-white/10`, `bg-white/[0.03]`.
- **Inputs**: `rounded-none`, dark bg, `border-white/10`, white text.
- **Sidebar**: Mono uppercase nav items, white/50 default, white on active.
- **Mobile bottom nav**: Same mono/uppercase treatment.
- **Auth pages**: Centered card with new dark flat style.
- **Onboarding**: Same dark bg, selection cards with `border-white/10`.

## What Changes

1. `globals.css` — Replace oklch color system with dark-only values, remove light mode, set `rounded-none` base radius
2. `tailwind.config.ts` — Update if needed for new color tokens
3. Sidebar (`AppSidebar.tsx`) — Mono font, uppercase, wide tracking for nav items
4. Mobile nav — Same treatment
5. Auth pages (login, signup) — Dark bg, sharp cards
6. Onboarding — Dark bg, updated card styles
7. Settings — Remove theme toggle
8. shadcn components (button, card, input, sheet) — Update to sharp corners, new color scheme
9. App-specific components — Update any hardcoded light-mode colors or rounded corners
