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
npm run dev:lan
npm run lint
npm run build
npm run preview
npm run preview:lan
```

## Local App

The dev server defaults to:

```text
http://127.0.0.1:5173/projects
```

For same-Wi-Fi phone testing, run:

```bash
npm run dev:lan -- --port 5174
```

Then open this from the phone while it is on the same Wi-Fi:

```text
http://YOUR_PC_WIFI_IP:5174/projects
```

For a production-like local build:

```bash
npm run build
npm run preview:lan -- --port 4174
```

Then open:

```text
http://YOUR_PC_WIFI_IP:4174/projects
```

## Print / PDF

Open a project, save an estimate, then use the project `Print / PDF` button. On iPhone, the system print sheet can AirPrint over Wi-Fi, and iOS can also save/share the print preview as a PDF.

## Current Limitation

This build is local-first. Cross-device phone/desktop sync still needs Supabase credentials, database schema setup, and a cloud persistence adapter.

Mobile LAN testing over plain `http://` is good enough for field workflow testing. Full installable PWA behavior on iPhone will need HTTPS from a deploy target or trusted local certificate.

See [PROJECT_SPEC.md](./PROJECT_SPEC.md) for the full product plan.
