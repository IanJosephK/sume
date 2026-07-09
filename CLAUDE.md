# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start Vite dev server with HMR
- `npm run build` — typecheck (`tsc -b`) then build for production
- `npm run lint` — ESLint across the project
- `npm run preview` — serve the production build locally

No test framework is configured.

## Architecture

Sume is a medication tracker PWA built with React 19, Vite, Tailwind CSS v4, and TypeScript. All user data is stored locally in the browser via IndexedDB (Dexie). There is no backend — the app is fully offline-capable once installed.

### Data flow

- **Dexie DB** (`src/lib/db.ts`) — two tables: `meds` (medication definitions) and `logs` (daily take records). The DB schema is versioned; bump `db.version()` for migrations.
- **Zustand stores** — `useMedStore` loads from Dexie on mount and holds runtime state (including transient fields like timer countdowns and med status). `useThemeStore` uses `zustand/persist` to localStorage.
- **StoredMed vs Medication** — `StoredMed` is the Dexie-persisted shape (no runtime state). `Medication` is the runtime shape with `status`, `timer.remaining`, and `takenAt`. Conversion functions `storedToRuntime`/`runtimeToStored` live in the store.

### Screen navigation

No router — `App.tsx` manages a `screen` state (`"today" | "history" | "edit"`) with Framer Motion transitions. The editor slides up as an overlay (`screen-slide` class, `position: absolute`).

### Styling

All styles are in `src/index.css` using CSS custom properties for theming (light/dark via `[data-theme]`). Tailwind is imported but most styling uses BEM-like class names. Theme tokens are `--canvas`, `--bg`, `--surface`, `--ink`, `--muted`, `--line`, `--accent`, etc.

Med color swatches use OKLCH relative to `--accent-h` — see the `.sw-*` classes. Changing the accent hue automatically shifts all swatch colors.

### Media query structure

CSS media queries must be ordered carefully — rules at the same specificity are resolved by source order:
- `@media (max-width: 440px)` — mobile: hides phone shell chrome, full-bleed layout
- `@media (display-mode: standalone)` — installed PWA: same as mobile but triggered by install state
- `@media (min-width: 768px)` — desktop: centered content column, editor as modal
- `@media (min-width: 1100px)` — wide desktop: 2-column card grid

### PWA setup

- `vite-plugin-pwa` generates the service worker and manifest
- PNG icons (192/512) are generated from `public/icon.svg` using `sharp` (dev dependency)
- Service worker registration is in `App.tsx` via dynamic `import("virtual:pwa-register")`
- Workbox config caches Google Fonts for offline use

### Notifications & reminders

- `src/lib/notifications.ts` wraps the Notification API with service worker fallback
- Medications can have a `reminder` time (HH:MM) — a 30-second interval in `App.tsx` checks for due reminders on pending meds
- The existing `timer` feature is different: it's a countdown *after* taking a med (e.g., "wait 30 min before eating")

### Icon system

`src/components/Icons.tsx` — all icons are inline SVGs sharing a common `Ic` wrapper component. Props: `w` (size), `sw` (stroke-width). Add new icons as entries in the `Icons` object.
