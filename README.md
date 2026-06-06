# Codex Estimates

Mobile-first contractor estimate organizer and rough painting estimator.

## What Works Now

- Local project/client file system backed by IndexedDB.
- Search, status filters, category filters, and sorting.
- Project notes and activity history.
- Editable business and estimating defaults.
- Painting estimate calculator with range, midpoint, warnings, assumptions, and line items.
- Printable estimate view.
- PWA manifest and service worker generation.

## Commands

```bash
npm install
npm run dev
npm run lint
npm run build
npm run preview
```

## Local App

The dev server defaults to:

```text
http://127.0.0.1:5173/projects
```

## Current Limitation

This build is local-first. Cross-device phone/desktop sync still needs Supabase credentials, database schema setup, and a cloud persistence adapter.

See [PROJECT_SPEC.md](./PROJECT_SPEC.md) for the full product plan.
