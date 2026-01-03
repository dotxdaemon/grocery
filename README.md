# Grocery PWA

An offline-first, multi-list grocery app built with React, TypeScript, Vite, Tailwind, Zustand, and Dexie. It supports fast quick-add input, category-aware sorting, favorites-driven autocomplete, and JSON backup/import.

## Setup

1. Install dependencies:

```bash
pnpm install
```

2. Start the dev server:

```bash
pnpm dev
```

3. Run checks:

```bash
pnpm lint        # ESLint
pnpm test        # Vitest unit tests
pnpm e2e         # Playwright smoke test (starts the dev server)
```

## PWA

- The app ships with a manifest and service worker (via `vite-plugin-pwa`).
- Install on mobile/desktop from the browser’s install/add-to-home-screen prompt.
- Icons live in `public/icons/`; the manifest is at `public/manifest.webmanifest`.
- Offline: the shell is cached, data lives in IndexedDB (falls back to localStorage with a banner if IDB is unavailable).

## Data model

- **lists**: id, name, createdAt, updatedAt, sortMode, categoryOrder, position
- **items**: id, listId, name, nameOriginal, quantity, unit, categoryId, notes, isPurchased, position, createdAt, updatedAt, purchasedAt
- **categories**: id, name, defaultOrder
- **itemHistory**: id, nameCanonical, lastUsedAt, timesUsed, defaultCategoryId, isFavorite
- **storeProfiles**: id, name, aisleOrder (reserved for future store-specific ordering)

## Features

- Multiple lists: create, rename, reorder, delete
- Quick add with quantity parsing (`2 milk`, `1.5 lb chicken`, `milk x2`, etc.)
- Category grouping with customizable order per list and manual item ordering
- History-backed autocomplete with favorites and category inference
- Bulk actions: clear purchased, toggle purchased placement, undo last action
- Settings: rename/reorder categories, saved items library, JSON export/import

## Export/Import

- Export: Settings → **Export JSON** (downloads `grocery-export.json`).
- Import: Settings → **Import JSON** (validates schema; keeps valid records and reports skipped entries).
- Backups include lists, items, categories, history, and store profiles. UI preferences are stored locally.

## Design notes & future cloud sync

- State lives in Zustand; persistence uses Dexie with a full-snapshot fallback to localStorage when IndexedDB fails.
- Sorting follows category order, then name; purchased items respect the “move to bottom” toggle. Manual mode uses stored positions.
- For future cloud sync, consider a small sync service that exchanges the `ExportPayload` schema with per-record updatedAt metadata and conflict resolution based on timestamps.
