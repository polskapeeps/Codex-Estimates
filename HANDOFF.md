# Estimator Handoff

Last updated: 2026-06-07

## Current Decision

Use `Codex Estimates` as the active repo and `master` as the active production branch.

The app on `master` is the Claude-spec build, plus a dark-mode pass. It is the build the user is testing through Vercel now.

Active repo:

`C:\Users\Habad\Documents\Code\Repos\Codex Estimates`

Current production branch:

`master` at `1b2b429 Add dark mode theme`

## Branch Map

- `master`: active app. Claude-spec implementation plus dark mode.
- `codex/claudes-spec`: older branch pointing at `46392f9`; now redundant because `master` moved beyond it.
- `codex/original-master-build`: saved copy of the original Codex/raw master build at `7b89bfa`. Keep this for feature mining and comparison.

GitHub remote:

`https://github.com/polskapeeps/Codex-Estimates.git`

The old/raw build is preserved remotely as:

`origin/codex/original-master-build`

## What Happened

1. The repo originally had a lean Codex MVP on `master`.
2. A Claude-written spec was used to build a fuller estimator app on `codex/claudes-spec`.
3. That Claude-spec branch tested cleanly and became the chosen direction.
4. `master` was fast-forwarded to the Claude-spec branch.
5. The original raw `master` build was preserved as `codex/original-master-build`.
6. Dark mode was added on `master` and pushed.

## Current App Shape

The current app is a local-first PWA for estimating and lead organization:

- React + TypeScript + Vite
- Tailwind CSS
- Dexie / IndexedDB local storage
- Repository layer under `src/data/repositories`
- Painting estimate engine with tests
- General line-item estimator
- Client/job organizer and status pipeline
- Settings/rates editor
- JSON export/import backup
- PDF export/print via `pdfmake`
- Dark mode default with persisted light/dark toggle

## Verification Already Run

After adopting the Claude-spec build:

- `npm test` passed: 16/16
- `npm run build` passed

After adding dark mode:

- `npm test` passed: 16/16
- `npm run build` passed
- Local production preview checked on mobile viewport:
  - Home
  - New Estimate
  - Settings
  - Theme toggle light/dark
- Browser console errors: none observed

Known non-blocking warnings:

- Vite build warns about large `pdfmake` chunks.
- `npm audit` previously reported 6 issues: 5 moderate, 1 critical. The critical one is in dev/test tooling (`vitest`) and should be cleaned up later, but it has not blocked builds.

## Important Compatibility Note

The active Claude-spec build does not use the same IndexedDB database name or data shape as the original raw build.

Original raw build:

- DB name: `codex-estimates`
- Branch: `codex/original-master-build`

Current Claude-spec build:

- DB name: `estimator`
- Branch: `master`

That means existing browser data from the original raw build will not automatically appear in the current build. If old data ever matters, add a migration/import path before relying on it.

## Suggested Next Actions

Immediate testing path:

1. Deploy `master` through Vercel.
2. On mobile, test:
   - Create client
   - Create job
   - Create painting estimate
   - Save and reopen estimate
   - Create general line-item estimate
   - Export/print PDF
   - Export/import JSON backup
   - Refresh/reopen and confirm data persists
3. Record bugs found during real use.

Likely follow-up improvements:

- Fix any bugs from the mobile/Vercel test.
- Re-add useful scripts from original raw build if needed:
  - `dev:lan`
  - `preview:lan`
  - `lint`
- Consider pulling useful concepts from `codex/original-master-build`:
  - due dates
  - notes/activity log
  - simpler print flow
  - newer Vite/React tooling
- Clean dependency audit issues.
- Consider deleting `codex/claudes-spec` after testing, since `master` is now the chosen branch.

## Ground Rules For Future Agents

- Do not reset or rewrite `master` casually. It is the active chosen build.
- Keep `codex/original-master-build` as the preserved old build unless the user explicitly says to delete it.
- Work from `C:\Users\Habad\Documents\Code\Repos\Codex Estimates` unless the user clearly asks for another repo.
- Treat `CLAUDE.md` and `ESTIMATOR_SPEC.md` as project context.
- Before shipping changes, run:

```bash
npm test
npm run build
```
