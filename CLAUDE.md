# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start Vite dev server with HMR
- `npm run build` — typecheck (`tsc -b`) then build for production
- `npm run lint` — ESLint across the project
- `npm run preview` — serve the production build locally

No test framework is configured.

### Cloudflare Worker (`worker/`)

- `cd worker && npm install` — install worker dependencies
- `cd worker && npm run dev` — run worker locally with wrangler
- `cd worker && npm run deploy` — deploy to Cloudflare

## Architecture

Sume is a medication tracker PWA built with React 19, Vite, Tailwind CSS v4, and TypeScript. User data is stored locally in the browser via IndexedDB (Dexie). A Cloudflare Worker handles background push notifications for medication reminders.

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

Two notification systems:

- **Local reminders** — `src/lib/notifications.ts` wraps the Notification API. A 30-second interval in `App.tsx` checks for due reminders on pending meds. Only works when the app is open.
- **Push notifications** — `src/lib/pushSync.ts` syncs reminder schedules to a Cloudflare Worker (`worker/`). The worker runs a per-minute cron, checks KV for due reminders, and sends Web Push notifications even when the app is closed. Reminder times are converted from local to UTC before syncing. Push subscriptions are keyed by endpoint and self-heal (410 Gone responses trigger cleanup).
- The `timer` feature is different: it's a countdown *after* taking a med (e.g., "wait 30 min before eating").

### Cloudflare Worker (`worker/`)

- `worker/src/index.ts` — API routes (`/api/subscribe`, `/api/unsubscribe`, `/api/vapid-public-key`) and cron handler
- `worker/src/webpush.ts` — Web Push protocol implementation using Web Crypto API (no Node.js dependencies)
- Storage: Cloudflare KV with two key patterns: `sub:{hash}` for subscription records, `time:{HH:MM}` for time-based index lookups
- VAPID private key must be set as a Cloudflare secret (`wrangler secret put VAPID_PRIVATE_KEY`)
- The PWA needs `VITE_PUSH_WORKER_URL` env var pointing to the deployed worker

### Icon system

`src/components/Icons.tsx` — all icons are inline SVGs sharing a common `Ic` wrapper component. Props: `w` (size), `sw` (stroke-width). Add new icons as entries in the `Icons` object.
