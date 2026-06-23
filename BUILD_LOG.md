# PK Estimator v2 — Build Log

Running record of the v2 build (extends v1; v2 spec wins conflicts). Local-only
pass: no Supabase/auth/cloud sync/cloud photos this round. Branch: `codex/v2`
(off `codex/labor-only-simplification`).

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
