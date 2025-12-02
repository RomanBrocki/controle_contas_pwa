## Overview

This repository is a small, client-only PWA built with React UMD (in-browser Babel), Tailwind, Chart.js and Supabase. There is no build step — JSX is transformed at runtime and some scripts are ESM modules. When editing, keep the runtime loading strategy in mind (see `index.html`).

## Big picture (what an agent should know)
- Entry point: `index.html` — loads UMD React, Babel (JSX in-browser), CDN libs and mounts `<App />`.
- Routing: `src/router.js` (hash-based Router). Use `Router.go('#/mes')` or register handlers there.
- Data layer: `src/supabase/client.js` (Supabase client + global helpers) and `src/supabase/queries.js` (CRUD). All queries guard by UID (see `uid()` implementation).
- UI adapter: `src/data-adapter.js` transforms Supabase rows into UI-friendly objects (dates in DD/MM/YYYY, BRL formatting).
- Globals: components and runtime expose globals used throughout the app:
  - `window.SupabaseClient` (contains `supabase` and `getActiveUid`)
  - `window.SupabaseQueries` (all query helpers)
  - `window.SupabaseMutations` (insert/update/delete helpers)
  - `window.DataAdapter.fetchMes(year, month)` (returns formatted rows)
  - `window.MOCK_AUTH` (test/mock auth used by App; may be set by LoginGate)

## Project-specific conventions and gotchas
- No build: most components are included with `<script type="text/babel" src="...">` in `index.html`. Editing files is instant but you must reload and often unregister the service worker to see changes.
- Mixed module strategy: `src/router.js`, `src/data-adapter.js`, `src/features/*.js` are loaded as ES modules while components are loaded via Babel-UMD JSX. Keep imports/exports consistent with how the file is referenced in `index.html`.
- Supabase key: `src/supabase/client.js` contains the public (anon) key. Do NOT add a service_role key to client-side code.
- UID guard: every query in `queries.js` enforces `user_id` via a `uid()` fallback (checks `window.MOCK_AUTH` and `window.SupabaseClient.__lastAuthUid`). Keep that pattern when adding new queries.
- Service Worker: `sw.js` caches local assets listed in `URLS_TO_CACHE`. If you add or rename files, update this list and bump the `CACHE_NAME` to force clients to fetch new assets.

## Useful examples (copy-paste from console)
- Check runtime objects:
  - `window.SupabaseClient` → supabase instance
  - `window.SupabaseQueries.listMes(2025, 10)` → returns raw DB rows (promise)
  - `window.DataAdapter.fetchMes(2025, 10).then(rows => console.log(rows))` → UI-shaped rows
- Navigate programmatically:
  - `Router.go('#/relatorios')` or `Router.go('#/mes?ano=2025&mes=10')`
- Unregister service workers (when debugging):
  - `navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister()))`

## Developer workflow & debugging
- Run locally: the app can be opened directly in the browser, but a static server avoids CORS/service-worker quirks. Example (PowerShell):
```
python -m http.server 8000
```
- After editing JSX/module files: hard-reload, and if the SW caches old files, unregister the SW (see example above) or bump `CACHE_NAME` in `sw.js`.
- Inspect globals in DevTools console to verify runtime wiring (`window.SupabaseQueries`, `window.DataAdapter`, `window.AppState`).

## Integration points & important files
- `index.html` — script loading order, Babel, CDN dependencies, Chart.js and jsPDF inclusion.
- `src/components/App.jsx` — root component, session check, `window.MOCK_AUTH` usage and `open-self-chat`/‘Fale com Tosco’ trigger.
- `src/supabase/client.js` — configure SUPABASE_URL / SUPABASE_KEY for your environment and understand `getActiveUid()` and `uid()` helpers.
- `src/supabase/queries.js` — canonical place for DB access; follow its guard-by-UID pattern and return-safe shapes (null/[] on error).
- `src/data-adapter.js` — single place mapping DB fields to UI fields (use when adding new views).
- `src/features/pdf.js` and `src/features/charts.js` — PDF generation and Chart.js configuration; they are ESM modules and expected to be tied into `ReportsModal.jsx`.
- `sw.js` and `manifest.json` — PWA lifecycle and caching. Update `start_url`/`scope` when changing hosting path.

## Guidance for changes an AI might make
- Prefer small, local edits: add new query in `queries.js` + corresponding adapter in `data-adapter.js` + UI in components.
- When adding files referenced from `index.html`, update `sw.js` cache list and bump `CACHE_NAME` if the file must exist before App mounts.
- For new UI state that must survive reloads, consider `window.AppState` (used lightly) or persist via `profile` (see `upsertProfile`).
- Keep RLS and UID guards in mind: Supabase rules expect `user_id` filters; tests or mocks should set `window.MOCK_AUTH`.

## Short checklist for PRs
- Ensure new client-side secrets are NOT added (no service_role keys).
- Update `sw.js` cache list and bump `CACHE_NAME` if you change filenames.
- Update `index.html` script order if adding a dependency required at boot.
- Test: open `index.html` via a static server, confirm `window.SupabaseClient` and `DataAdapter` work, and run a PDF export from `ReportsModal` to validate `features/pdf.js` changes.

---
If anything here is unclear or you'd like me to expand examples (small code snippets to add a query, adapter or a component), tell me which area and I'll iterate.
