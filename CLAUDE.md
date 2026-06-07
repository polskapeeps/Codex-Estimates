# Estimator — agent context

Local-first, installable **PWA** for a trades business (painting / handyman / general):
turn on-site notes into a rough **estimate range**, and organize every job as a
browsable record with a status pipeline. Full spec: [ESTIMATOR_SPEC.md](ESTIMATOR_SPEC.md).

## Current pickup point

Read [HANDOFF.md](HANDOFF.md) first. It records the current branch decision,
saved comparison branches, verification status, and next actions.

## Status

| Milestone | State |
|---|---|
| M0 Scaffold (Vite/React/TS/Tailwind, Dexie+repos, PWA, nav) | ✅ |
| M1 Organizer (clients, projects, jobs list, status, rates editor) | ✅ |
| M2 Painting engine + calculator (+ unit tests) | ✅ |
| M3 General module + reusable Library | ✅ |
| M4 Estimate PDF / print + JSON backup | ✅ |
| M5 Cloud sync (Supabase) | ⛔ Phase 2 — not started |
| M6 AI smart-notes (`/api/ai-parse`) | ⛔ Phase 2 — not started |
| M7 Polish (kanban, photos, dark mode, Tauri) | partial: dark mode done; remaining polish Phase 2 |

**v1 (M0–M4) is complete and usable on phone + desktop from one URL.**

## Commands

```bash
npm run dev        # local dev server
npm run build      # tsc --noEmit && vite build (run before committing)
npm test           # vitest run (engine unit tests)
npm run preview    # serve the production build
npm run gen-icons  # regenerate PWA icons (dependency-free)
```

## Hard rules (do not break)

1. **Money is integer cents** everywhere internally. Format to currency only at
   display (`src/lib/money.ts`). Percentages are decimals (0.20 = 20%).
2. **No pricing/rate magic numbers** outside the Settings store. All coefficients
   live in `src/lib/estimate/defaults.ts` (the seed) and the editable `rates`
   record. Estimation code reads them only from the passed-in `Rates`.
3. **No Dexie outside `src/data/repositories/`.** Components read via the
   `useLiveQuery` hooks in `src/data/hooks.ts` and write via repo methods. This
   abstraction is the seam for future cloud sync (§11) — keep it intact.
4. **The estimation engine is pure and unit-tested.** `src/lib/estimate/{painting,
   general,totals}.ts` take inputs + `Rates` and return numbers — no UI, no I/O.
   The spec §17 example is locked in `painting.test.ts`.

## Rounding strategy (documented deviation from spec §17)

Hours stay at full float precision; money is rounded to whole cents once per money
step (`paintCost`, `sundries`, `labor`, `markup`, `tax`, `low`, `high`). The spec's
§17 worked example rounded intermediate *hours* and lists labor as $512.26 (itself
10.245 × $50 = $512.25 mis-typed). Geometry and materials ($194.40) match the spec
exactly; labor/total land a few cents off by design. Tests lock our values.

## Layout

- `src/lib/` — types, money, ids, dates, status pipeline, `estimate/` (pure engine).
- `src/data/` — `db.ts` (Dexie schema) + `repositories/` (interfaces + Dexie impls + backup) + `hooks.ts`.
- `src/components/` — UI kit (`ui/`), icons, `AppShell`, `TradePicker`.
- `src/features/` — `dashboard`, `clients`, `projects`, `estimates`, `painting`, `general`, `settings`, `pdf`.
- `src/routes/router.tsx` — route table.

## Deploy

Static SPA on **Vercel** (`vercel.json` rewrites non-`/api` paths to `index.html`).
HTTPS is required for PWA install. `dist/` is the build output.
