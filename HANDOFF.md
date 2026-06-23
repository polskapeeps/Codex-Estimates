# Estimator Handoff

Last updated: 2026-06-22

> **This file supersedes the old 2026-06-07 handoff** (which pointed at `master` /
> the v1 Claude-spec build + dark mode and is now OUTDATED). Active work is the
> **PK Estimator v2** build on branch **`codex/v2`**. Read this top to bottom
> before touching anything.

## ⚠️ Possible parallel sessions

Another agent session may be building v2 too. Before you commit:
1. `git fetch origin && git log --oneline -1 origin/codex/v2` — make sure you're not
   behind. Last known HEAD from this session: **`c685583` (M2)**.
2. If `origin/codex/v2` is ahead of you, `git pull --ff-only` first and re-read
   `BUILD_LOG.md` — it's the authoritative running record of what's actually built.
3. Don't force-push. Don't rebase shared history. Commit per milestone.

## Current pickup point

- **Branch:** `codex/v2` (created off `codex/labor-only-simplification`), pushed to
  `origin/codex/v2`. NOT merged to `master`.
- **What this is:** building **PK Estimator v2** per `ESTIMATOR_SPEC_v2.md`. This pass is
  **LOCAL ONLY** (Dexie/IndexedDB). No Supabase / auth / cloud sync / cloud photos — that is
  an explicit separate follow-up, do not start it.
- **Done (committed + pushed):**
  - **M0** — locked the v2 §4.2 totals formula. The Bozena job (`materials $534.60`,
    `labor $1,078.00`, 20% markup, 8% tax on materials only) computes to **$1,977.89**;
    this is pinned in `src/lib/estimate/totals.test.ts` and MUST stay green forever.
  - **M1** ⛔ checkpoint (passed — user OK'd) — v2 data model through the repo layer
    (RateEntry, Property, extended LineItem/Project/Estimate; Dexie v2 additive migration);
    the line-item calc engine (5 calc modes + credit) in `src/lib/estimate/lineItems.ts`;
    a quote builder at route `/quote/new` that exports a clean **Quote PDF** via pdfmake.
  - **M2** — Rate Book tap-chips (4 categories preloaded from §3) + generalized difficulty
    modifiers (§15.C) + materials in-estimate/separate toggle (§8).
- **Next: M3** — full **non-blocking** guardrail/warning set (§5 + §15.E: effective-hourly
  floor, ceiling-giveaway, window-standalone, intentional-discount/reason-tag, job-minimum,
  no-setup-time, missing-materials, no-markup, ladder-without-modifier, vague-scope,
  missing-expiration, missing-due-date) **plus** the internal-vs-client view toggle (§6).
  Then M4 (estimate→quote→invoice, change orders, deposits, receipt/change-order PDFs),
  then M5 (client/property screens, local photos, dashboard, mobile nav, dark theme).

## Authoritative docs (read in this order)

1. `BUILD_LOG.md` — **the running record.** Exactly what changed per milestone + how to test.
2. `ESTIMATOR_SPEC_v2.md` — the v2 spec. **v2 wins all conflicts with v1.**
3. `ESTIMATOR_SPEC.md` (v1) + `CLAUDE.md` — architecture baseline + hard rules.

Note: the milestone list references a **§15 (15.A–15.K)** that is NOT present in the spec
file (it ends at §14). Build §15 items from the milestone bullets + best judgment; flag
genuine ambiguity to the user rather than guessing.

## Confirmed decisions (do not re-litigate)

- **§15 source:** build from the milestone bullets (no §15 text exists).
- **Branch:** `codex/v2` off `codex/labor-only-simplification` (keeps labor-only mode, which
  pairs with v2 §8 materials-separate).
- **Windows (§3.2 / Decision #5):** **REBUILD** as a Rate Book category. The
  `origin/feature/window-estimator` branch is architecturally incompatible (prices in float
  dollars, hardcodes its own rate table, bypasses the repo + shared totals). Mine it for
  rate values / presets / scope wording ONLY. (Currently windows exist as a Rate Book
  category from §3.2 defaults; a richer in/out + ground/2nd-story flow can come later.)
- **Branding (Decision #4):** default PWA name "PK Estimator" + PDF header
  "PK Paints & Renovations", but everything stays user-editable in Settings.

## Hard constraints (must hold every milestone)

1. **Money is integer CENTS** everywhere internally; format only at display
   (`src/lib/money.ts`). Percentages are decimals (0.20 = 20%).
2. **No pricing/rate numbers outside the stores.** Coefficients live only in
   `src/lib/estimate/defaults.ts` (Rates seed) and `src/lib/estimate/rateBook.ts`
   (Rate Book seed). Engine reads them from the passed-in `Rates` / line items.
3. **No Dexie outside `src/data/repositories/`.** Components read via `useLiveQuery`
   hooks in `src/data/hooks.ts`, write via repo methods. This is the cloud-sync seam — keep it.
4. **Engines are pure + unit-tested.** `src/lib/estimate/{painting,general,totals,lineItems}.ts`
   take inputs + `Rates` and return numbers — no UI, no I/O.
5. **PDFs use pdfmake → iOS share/print sheet (AirPrint).** Never HTML-to-PDF / browser print.
6. Keep the **Bozena $1,977.89 test green.** If you change rounding, update + document the test.

## How to run / test

```bash
npm test                 # vitest — expect 33/33 green (incl. the locked Bozena test)
npm run build            # tsc --noEmit && vite build — must pass (pdfmake chunk-size
                         # warning is known + non-blocking)
npm run dev -- --host    # LAN dev server; open the printed Network: URL on an iPhone
                         # (same Wi-Fi) to test AirPrint from Safari
```

**Device testing:** push `codex/v2` and use the Vercel preview (HTTPS, PWA install), or the
LAN command above. **Math check:** New Quote → add a Per-hour line (20h × $53.90 = $1,078.00)
+ a Material line ($534.60) → total must read **$1,977.89**. **Print check:** Export/Print
quote → iOS share sheet → AirPrint; the PDF prints scope language only (no hours/rates).

## Known gaps / watch-outs

- **JSON backup is incomplete:** `BackupPayload` (`src/lib/types.ts` + `backup.ts`) does NOT
  yet include `rateEntries` or `properties`. Rate Book re-seeds at boot, but properties would
  not round-trip an export/import. Extend backup before relying on it (slated M4/M5).
- The new quote flow saves as an `Estimate` with `docType:'quote'`, `trade:'general'`. The
  existing estimate preview + `estimatePdf` were made calc-mode-aware so saved quotes display
  correctly in ONE flow — don't fork a parallel preview.
- `Property` entity + repo exist and seed nothing; the Property UI screen is M5.
- Difficulty-modifier percentages live in `Rates.difficultyModifiers` (editable). A Settings
  UI to edit the Rate Book + modifiers isn't built yet — repos support it; add UI when needed.
- `ratesRepo.get` backfills new default Rates fields onto older seeded rows — keep that when
  adding new Rates fields.

## Branch map

- `codex/v2` — **active v2 build** (this work). Pushed to origin.
- `codex/labor-only-simplification` — v2's parent; adds labor-only estimate mode. Not merged.
- `master` — v1 production (Claude-spec build + dark mode). The old prod branch; the user
  tests it via Vercel. **Do not reset/rewrite it casually.**
- `codex/original-master-build` — preserved original raw Codex build. Keep unless the user
  says delete.
- `origin/feature/window-estimator` — old standalone window calculator. Reference only
  (incompatible; see Windows decision above).

## Ground rules for the next agent

- Work from `C:\Users\Habad\Documents\Code\Repos\Codex Estimates` on `codex/v2`.
- Commit after each milestone; keep `BUILD_LOG.md` updated. Run `npm test` + `npm run build`
  before committing.
- If the spec is ambiguous or conflicts, ASK the user rather than guessing.
- If you run low on context: stop, commit, update `BUILD_LOG.md`, and state the resume point.
