# PK Estimator v2 — Build Log

Running record of the v2 build (extends v1; v2 spec wins conflicts). The build began
local-only; M6 adds optional Supabase auth + record sync while Dexie remains the offline
database. Cloud photos are still deferred. Branch: `codex/v2` (off
`codex/labor-only-simplification`).

Decisions confirmed with the user (recon):
- **§15**: not present in the attached spec file (it ends at §14). Build each §15
  item from the milestone bullets + best judgment; flag ambiguity when reached.
- **Branch**: `codex/v2` off `codex/labor-only-simplification` (keeps labor-only mode,
  which pairs with v2 §8 materials-separate).
- **Windows (§3.2 / Decision #5)**: REBUILD as a Rate Book category. The existing
  `origin/feature/window-estimator` branch is architecturally incompatible (prices in
  dollar floats, hardcodes its own rate table in the component, bypasses repo + shared
  totals). Mine it for rate values, scope presets, condition/access modifiers, and
  customer-facing wording only. (M2.)
- **Branding (Decision #4)**: default PWA name "PK Estimator" + PDF header
  "PK Paints & Renovations", all still user-editable in Settings.

---

## M0 — Recon + plan + money utils + locked totals test ✅

**Recon finding:** v1 is a real, tested codebase (18/18 green) that already satisfies
every v2 §2 carryover constraint (integer-cents, repo abstraction, pdfmake, Dexie, PWA,
Zustand, rates-only-in-store). v1's `computeTotals` **already** matches v2 §4.2 — verified
the Bozena job computes to $1,977.89 against the existing engine. Terminology maps
v1→v2 as Project→Job, Estimate→Document; `Trade` widens to 4 Rate Book categories;
`LineItem` gains ~7 fields.

**Changes:**
- `src/lib/types.ts` — added `discounts: number` to `Totals` (v2 §4.2 credit term).
- `src/lib/estimate/totals.ts` — `TotalsInput.discounts?` (default 0);
  `total = subtotal + markup + tax + discounts`. Bozena uses none → unchanged.
- `src/lib/estimate/totals.test.ts` — **LOCKED** Bozena $1,977.89 test + a credit case.

**Verify:** `npm test` (locked Bozena test green), `npm run build` (typecheck clean).

**Next:** M1 ⛔ checkpoint — extend data model (Document/Job/LineItem/RateBook/Property)
through the repo layer, the 5 calc modes, a minimal line-item builder → clean Quote PDF.
Stop after M1 for iPhone print verification.

---

## M1 ⛔ — Data model + calc modes + builder + Quote PDF ✅ (STOP for verification)

**Data model (all through the repo layer):**
- `types.ts` — new `RateCategory`, `CalcMode`, `ReasonTag` (incl. `barter_tool_credit`),
  `MaterialsMode`, `DocType`. Extended `LineItem` (+category, calcMode, internalNote,
  clientDescription, accessPremiumCents, reasonTag, taxable, rateEntryId), `Project`
  (+propertyId, materialsMode, bundled), `Estimate` (+docType). New `RateEntry`, `Property`.
- `db.ts` — Dexie **version(2)**: additive new tables `rateEntries`, `properties`
  (v1 stores untouched → v1 data migrates cleanly).
- New repos `rateBookRepo`, `propertyRepo` (+ interfaces, index bundle, hooks). Seeded at
  boot in `main.tsx` (rate book = additive, never clobbers edits).

**Engine (pure, tested):**
- `lineItems.ts` — `lineItemAmount` for all 5 calc modes (per_sqft/per_unit/per_hour/flat/
  material + credit); `computeDocument` buckets labor/materials/credit; `computeDocumentEstimate`
  feeds the locked §4.2 stack with materials-separate (§8) support.
- `lineItems.test.ts` — each mode + bucketing + **Bozena reconstructed to $1,977.89 from a
  labor line + a material line** + materials-separate + credit cases. (30 tests total green.)
- `rateBook.ts` — `DEFAULT_RATE_BOOK`: 4 categories preloaded from §3 (painting/windows/
  fixtures/general) with floors. (Chips UI is M2; data seeded now.)

**Builder + PDF:**
- `features/documents/DocumentBuilderPage.tsx` (route `/quote/new`) — pick client, job title/
  address, materials in-estimate/separate toggle, tap-add calc-mode line rows (scope text,
  qty, rate, per-unit access premium, credit reason), live totals, **Export/Print Quote PDF**,
  Save (creates Job + Document via `saveEstimate`, extended with docType/materialsMode).
- `features/pdf/quotePdf.ts` — clean client-facing quote (scope language only; PK-default
  header; validUntil +30d; credit + materials-separate notes) via pdfmake → iOS share/print.
- Made the existing estimate preview + estimate PDF calc-mode-aware (per-row amounts use
  `lineItemAmount`, which is identical to the old `lineTotal` for legacy lines) so saved
  quotes display correctly in one consistent flow.
- Home: "New Quote" (primary) + "Painting Estimate" (secondary).

**Windows decision recorded:** rebuild from §3.2 in M2 (the `feature/window-estimator`
branch prices in float dollars + hardcodes rates — incompatible; mine it for values/UX only).

**Verify:** `npm test` 30/30, `npx tsc --noEmit` clean, `npm run build` clean (only the
known pdfmake chunk-size warning). Not yet driven on a live device — that's the checkpoint.

**STOP — awaiting OK before M2.** → User confirmed ("yes"). Branch pushed to
`origin/codex/v2` for the Vercel preview / iPhone test.

---

## M2 — Rate Book chips + difficulty modifiers + materials toggle ✅

- **Rate Book chips** in the builder: a category chip row (Painting / Windows / Fixtures /
  General) surfaces that category's seeded entries as tap-to-add chips (label + default
  price). Tapping pre-fills a line via `makeLineFromRateEntry` (calcMode, rate, unit,
  category, rateEntryId provenance). Reads live from the editable store via
  `useRateBookByCategory`.
- **Category scope heads-ups** (v2 §3.2 / §3.3 MUST): Windows shows the glass-overspray /
  tempered-glass caution; Fixtures shows the non-licensed-handyman / licensed-electrician
  warning. Rendered as an inline amber banner per category.
- **Difficulty modifiers (§15.C)** — generalized, editable toggle set stored in `Rates`
  (`difficultyModifiers`, seeded: ladder +10%, heavy prep +15%, tight space +8%, rush +15%).
  Per-line toggle chips set `modifierIds` + resolved `difficultyPct`; `lineItemAmount`
  applies `(1 + difficultyPct)` to labor/service lines only — never materials or credits.
  `ratesRepo.get` now backfills new default fields so older seeded rows stay complete.
- **Materials in-estimate vs separate (§8)** — already shipped in M1's builder.
- Tests: +3 (difficulty modifier sum, labor uplift, materials/credit never uplifted).
  Bozena stays $1,977.89. **33/33 green**, tsc clean, build clean.

**Known gap (deferred):** JSON backup payload doesn't yet include `rateEntries` /
`properties` (rate book re-seeds at boot; properties would not round-trip). Extend in M4/M5.

**Next:** M3 — full guardrail/warning set (§5 + §15.E), all non-blocking, + internal-vs-client
view toggle (§6).

---

## M3 — Pricing guardrails + internal/client views ✅

- **Authoritative v2 spec restored to the repo:** copied `ESTIMATOR_SPEC_v2.md` from the
  Desktop into the repo root, matching the handoff's doc order. The old `ESTIMATOR_SPEC.md`
  remains v1 carryover context only.
- **Pure guardrail engine:** added `src/lib/estimate/guardrails.ts` plus 8 focused tests.
  It evaluates the full M3 warning set from §5 + the milestone bullets: effective-hourly
  floor, ceiling/sqft giveaway, standalone window floor, credit reason tags, optional job
  minimum, no setup time, missing materials, no markup, ladder/access without uplift,
  vague client scope, missing quote expiration, and missing invoice due date.
- **Editable thresholds live in Rates:** added Settings fields for hard hourly floor,
  hourly target, ceiling sqft floor, standalone window minimum, and optional job minimum.
  Defaults seed from `defaults.ts`; `ratesRepo.get` backfills them for older local stores.
- **Quote builder UI:** added Internal/Client view toggle. Internal view shows math fields,
  internal notes, labor-hours visibility for non-hourly lines, difficulty/access controls,
  and guardrail badges. Client view collapses rows to printable scope language + amounts.
  Quotes now persist `validUntil` (default +30 days).
- **Saved document views:** Job detail and estimate preview now share the Internal/Client
  toggle. Internal view surfaces warning counts/panels; Client view summarizes scope. Saved
  quote/invoice PDFs now print scope + amounts only (no qty/rate/unit-cost leakage) and show
  valid-until / due-date when present.
- **Scope-only PDF fallback:** missing client scope prints as "Scope to be confirmed" instead
  of falling back to internal rate labels.

**Verify:** `npm test` **41/41 green** (Bozena still locked at $1,977.89), `npm run build`
clean (only the known pdfmake chunk-size warning).

**Known gaps (deferred):**
- Invoice lifecycle/conversion UI is still M4. M3 can warn on missing invoice due dates once
  invoices exist, but it does not create invoices yet.
- JSON backup still does not include `rateEntries` / `properties`.
- Settings can tune guardrail thresholds; full Rate Book + difficulty modifier editing UI is
  still later.

**Next:** M4 — Estimate → Quote → Invoice conversion, invoice fields/paid status, deposits /
change orders where scoped, and receipt/change-order/invoice PDFs.

---

## M4 — Document lifecycle + invoice basics ✅

- **Document lifecycle fields:** extended `Estimate` as the v2 Document record with
  `DocumentStatus`, `sourceDocumentId`, invoice issue/due dates, invoice number, terms,
  amount due, paid status, payment method, and paid date.
- **No-retyping conversion:** added `features/documents/documentLifecycle.ts`. Saved documents
  now convert Estimate → Quote → Invoice from the preview screen, carrying rooms/line items,
  rate snapshots, totals, scope notes, and materials mode context without re-entry.
  Converted documents are linked via `sourceDocumentId`; quotes get a +30 day expiration,
  invoices get auto-numbered `PK-0001` style numbers plus default "Due on receipt" / cash
  payment fields. Creating a quote promotes lead/estimating jobs to `bid_sent`.
- **Chain visible on jobs:** job detail now labels converted documents (for example,
  "Converted from QUOTE v2") in Internal view while Client view keeps scope summaries.
- **Invoice controls:** invoice previews expose editable invoice number, issue date, due date,
  amount due, paid status, payment method, and terms. Marking paid stamps `paidDate`, zeroes
  amount due, and moves the document status to `paid`.
- **Invoice PDF:** saved invoice PDFs now show invoice number, issue/due/terms, payment method,
  amount due, and a PAID mark when `paidStatus === 'paid'`. Quote/invoice PDFs remain
  scope-only for line items.
- **Tests:** added pure lifecycle tests for conversion order and invoice-number sequencing.

**Verify:** `npm test` **44/44 green**, `npm run build` clean (only the known pdfmake
chunk-size warning).

**Known gaps (deferred):**
- Deposits/change orders/receipt-specific PDFs are not implemented yet; v2 names them in
  the milestone handoff but the spec does not define fields, statuses, or money rules.
- JSON backup still does not include `rateEntries` / `properties`.
- Document status filtering in the Jobs list is still project-status based; richer document
  status filters can land with the next organizer polish pass.

**Next:** M4 follow-up or M5 — define deposits/change-order data model if wanted, then move
into client/property screens, local photos, dashboard, mobile nav, and dark theme.

---

## M5 — Organizer polish + deploy-readiness (Claude pickup) ✅

Picked up from M4 by a Claude session. Goal set by the user: get the app coherent,
data-safe, and ready to push to live hosting (no visual redesign this pass — a separate
"Claude design" pass will scope the look; this kept the existing UI kit). Cloud sync stays
explicitly deferred. Tackled the standing correctness/coherence gaps + the headline M5
organizer screens.

- **JSON backup is no longer lossy (correctness fix).** `BackupPayload` now carries
  `rateEntries` + `properties`; `exportAll`/`importAll` round-trip them; schema bumped to
  **2**. Older (v1) backups omit those arrays and import fine (`?? []`); the Rate Book
  re-seeds its defaults at the post-import reload via `rateBookRepo.ensureSeeded`. Settings
  import warning copy updated. Tests stay pure (vitest runs in `node`, no Dexie), so this is
  covered by typecheck + reasoning, not a new unit test.
- **Nav + branding now lead with the v2 flow (§11 / Decision #4).** The shell's primary "+"
  (desktop button + mobile FAB) and the Home empty-state CTA now open the Rate-Book quote
  builder `/quote/new` ("New Quote") instead of the v1 painting flow. Painting estimate is
  still reachable from Home's secondary button. Wordmark/app name set to **"PK Estimator"**
  across `AppShell`, `HomePage`, `index.html` (title + apple-mobile-web-app-title), and the
  PWA manifest (`vite.config.ts`).
- **Properties UI (M5 headline, §15.A).** New `features/properties/PropertyForm.tsx` (modal
  CRUD: label, address, measurements, access notes, ladder/height notes, notes). Client
  detail page gained a **Properties** section (list + add/edit/delete, with a delete-confirm).
  `ProjectForm` can link a job to one of the selected client's saved sites (dropdown +
  inline "New property"); changing the client resets the property. Job detail renders the
  linked property's address + measurements/access/ladder notes. New `MapPinIcon`. Deleting a
  client now also removes its saved properties so no rows are orphaned.
- **Client tags + preferred payment (§10).** `Client` gained optional `tags[]` +
  `preferredPaymentMethod`. `ClientForm` edits both (comma-separated tags + a payment select);
  client detail shows tag chips + preferred method. Invoice conversion
  (`documentLifecycle.convertDocument`) now defaults `paymentMethod` to the client's
  preference (falls back to cash).
- **Dashboard outstanding vs. collected (Phase C start).** Home stat cards now read
  **Outstanding** (Σ amount due on unpaid/partial invoices), **Collected** (Σ totals of
  invoices marked paid this month, by `paidDate`), and **Active bids** (count). Built purely
  from existing lifecycle/invoice data — no new entities.

**Verify:** `npm test` **44/44 green** (Bozena still $1,977.89), `npx tsc --noEmit` clean,
`npm run build` clean (only the known pdfmake chunk-size warning).

**Known gaps (deferred):**
- Deposits / change orders / receipt PDFs still undefined — needs the user to confirm fields
  + money rules before building (unchanged from M4).
- Local photos (v1 `Attachment` blob type exists, no UI) and cloud sync are still not built.
- Property `measurements` are freeform text; structured per-room measurements are a later pass.
- Client `tags` are informational + drive the invoice payment default; they do NOT yet
  auto-suggest a `repeat_client` credit reason in the quote builder (possible future tie-in).
- Document-status filtering in the Jobs list is still project-status based.

**Next:** local photos (Dexie blobs, no cloud), or a deposits/change-order data model once the
user defines it, or the "Claude design" UI pass. Cloud sync (Supabase, §9) remains the big
separate follow-up.

---

## M5.1 — Black & gold design integration ✅

Codex paused feature/backend expansion at the user's request and integrated the supplied
Claude Design handoff as the app's production visual system. The original prototype remains
archived at `design/handoffs/black-gold-redesign/`; it was moved out of generated `dist/` so
future builds cannot erase it.

- **Warm black + restrained gold system:** Hanken Grotesk, charcoal surfaces, gold active
  states/CTAs, warm text hierarchy, input focus rings, status treatments, cards, modals,
  steppers, chips, scrollbars, and the subtle radial background now match the handoff.
- **Responsive shell:** 272px desktop sidebar with PK lockup, quote-first CTA, Dashboard /
  Jobs / Clients / Invoices / Settings navigation, and local-first status. Mobile retains the
  fast center quote FAB, four daily-use tabs, and a dedicated Settings shortcut.
- **Dashboard/layout:** greeting + live date, clearer high-value stat cards, quote and
  painting quick actions, and a unified recent-jobs list using real local data.
- **Jobs + clients:** denser gold-accented job rows; quote-first header action while preserving
  manual job creation; responsive client card grid with initials, real job counts, and billed
  invoice totals.
- **Invoices view:** new `/invoices` organizer screen derived entirely from existing local
  invoice documents (outstanding, paid this month, due/partial/paid/overdue status, links to
  the saved document). No new backend or money model was introduced.
- **Production workflows preserved:** v2 Rate Book quote builder, painting calculator, guardrails,
  internal/client views, repository boundary, lifecycle conversion, and cents-based engines were
  retained rather than replacing them with the prototype's sample data or simplified math.
- **Brand assets:** supplied PK logo added to Settings; favicon/PWA icons, manifest colors, and
  browser theme color updated to black and gold.

**Visual QA:** rendered locally at desktop and phone widths across Dashboard, New Quote,
Invoices, and Settings shell states. **Verify:** `npm test` **44/44 green**; `npm run build`
clean (only the known pdfmake chunk-size warning).

**Next:** resume product work only after the user reviews the redesign. Existing open choices
remain local photos, user-defined deposits/change orders, richer Rate Book/settings editing,
or the separately authorized cloud-sync phase.

---

## M6 / Phase C — Supabase cloud sync (code complete; live activation pending) ✅/⏳

The user confirmed that seamless PC ↔ phone access is the next critical feature. This phase
implements the deferred v2 §9 sync architecture while preserving Dexie as the offline working
database. No Supabase project credentials were present on this machine, so the code and database
migration are complete, but the live account/project and two-device smoke test still need to be
activated.

- **Local-first outbox (Dexie v3):** added `syncChanges` and `syncState`. Every repository
  create/update/delete now commits the business record and its sync mutation atomically. Deletes
  become tombstones, including estimates cascade-deleted with a job. JSON import now queues a
  complete replacement snapshot plus tombstones for removed records.
- **Cross-device reconciliation:** `data/cloud/cloudSync.ts` pulls the authenticated user's
  records, merges them with local records, pushes queued/local-only records, retries on reconnect
  and app focus, and listens for Supabase Realtime changes. Conflict behavior is last-write-wins
  per record. Sync timestamps are monotonic so rapid same-millisecond edits cannot collapse into
  one ambiguous change.
- **Race protection:** remote data is applied only if the local outbox still matches the mutation
  inspected by that sync pass. A user edit made while syncing remains queued and wins the next
  reconciliation pass.
- **Account safety:** the local database binds to the first authenticated Supabase user. Signing
  into a different account cannot silently upload the existing local client/job data.
- **Supabase security/migration:** added
  `supabase/migrations/202606240001_estimator_cloud_sync.sql` with one flexible JSONB records
  table, authenticated-owner RLS for every operation, realtime publication, tombstones, and a
  database trigger that rejects stale client timestamps.
- **Auth + status UI:** Settings now supports email/password account creation, sign-in, manual
  sync, sign-out, last-sync/pending/error states, and explains the local-first behavior. The
  desktop shell status pill reports local-only, syncing, synced, offline, queued, or error state.
- **Deployment guide:** `.env.example` and `SUPABASE_SETUP.md` document SQL setup, browser-safe
  publishable keys, Vercel variables, auth URLs, first-device migration, and phone onboarding.
- **Data covered:** clients, jobs, estimate/quote/invoice documents, properties, line-item
  library, Rates, and Rate Book entries. Existing attachment blobs are intentionally not included
  because the app still has no photo UI; photos require a later Supabase Storage pass.
- **Tests:** added pure conflict tests and fake-IndexedDB integration tests for atomic outbox
  writes, cloud replacement/acknowledgement, and the mid-sync local-edit race.

**Verify:** `npm test` **49/49 green** (Bozena still $1,977.89), `npm run typecheck` clean,
`npm run build` clean (known chunk-size warning only), production dependency audit clean.

**Activation checklist (still required):**
1. Create the Supabase project and run the included migration.
2. Add `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY` locally and in Vercel.
3. Sign in first on the PC that holds the authoritative local data and wait for "Up to date."
4. Sign in on the phone, verify matching data, then edit one harmless field in each direction.
5. Separately exercise Invoice conversion/PDF and real iPhone AirPrint; those workflows are built
   but still need the user's live-device acceptance test.
