# PK Estimator — Spec v2

> **Agent note:** This file extends the existing `ESTIMATOR_SPEC.md` (v1) already in the repo. Drop it in the repo root alongside v1 and load both as context (`CLAUDE.md` / `AGENTS.md`). Treat every **MUST** as a hard requirement and every **DEFAULT** as a value the user edits in-app — **do not hardcode any pricing or rate number anywhere except the Settings / Rate Book store.** Where this file conflicts with v1, **v2 wins**, but do not break v1 features that v2 doesn't mention (AirPrint, offline, integer-cents money, the repository abstraction).

---

## 0. One-paragraph summary

PK Estimator is a mobile-first, installable PWA that turns a quick on-site job into a clean estimate, then carries that same job forward into a client-facing **quote** and a final **invoice** without retyping anything. Painting is the fully-tuned module (rates are locked from real jobs), but the engine is trade-agnostic: a **Rate Book** of tap-to-add quick-select rates covers windows, light/fixture installs, and general handyman work, all running through one totals engine, one print pipeline, and one set of pricing guardrails that stop the user from accidentally underbidding their own floors. It works offline on a job site and **syncs across phone and desktop** when online.

---

## 1. What's new in v2 (the delta over v1)

Build these. Everything else in v1 stays as-is.

1. **Rate Book** — a first-class, editable library of quick-select rates across four trade categories (painting, windows, fixtures/lighting, general). Replaces the implicit "painting module + generic line items" split with explicit, tappable rate chips per category. (§3)
2. **Document lifecycle** — one job flows Estimate → Quote → Invoice, reusing line items. Adds invoice fields (number, terms, paid status, payment method). (§7)
3. **Pricing guardrails ("Money Goblin Defense")** — non-blocking warnings when a number drifts below the user's own floors. (§5)
4. **Scope-over-time output** — every line item has an internal note (the math) and a client description (the scope). Client-facing docs print scope language only. (§6)
5. **Cross-device sync** — add a cloud backend behind v1's existing repository interface; keep the local cache for offline. (§9)
6. **Window module integration** — fold the standalone window-cleaning calculator (4 per-window rates, ground/second split, in+out vs out-only) into the Rate Book as a proper category. (§3.2)

---

## 2. Carryover from v1 — DO NOT CHANGE

- **Stack:** React 18 + TypeScript + Vite + Tailwind, Dexie (IndexedDB) for local storage, Zustand for state, pdfmake for PDFs, vite-plugin-pwa, deployed on Vercel.
- **Money:** all amounts stored as **integer cents**. No floats in the money path.
- **Repository abstraction layer:** all data access goes through the repo interface — this is what makes §9 sync possible without a rewrite. New entities in v2 MUST go through it too.
- **PWA install** on both phone and desktop from one codebase; offline-capable.
- **AirPrint (primary feature, keep it exactly):** iOS browser-print CSS is unreliable, so generate a real PDF with pdfmake and deliver it through the iOS share/print sheet. Verify on a real iPhone.
- **JSON export** stays as a first-class backup/safety feature even after sync exists.
- **All rates editable in-app**, never hardcoded.

---

## 3. The Rate Book (centerpiece of v2)

A `RateBook` is a store of editable rate entries grouped by category. In the UI, picking a category surfaces that category's entries as **tappable chips**; tapping a chip adds a pre-filled line item the user then adjusts (quantity, access premium, etc.). Every value below is a **DEFAULT** the user can change.

Each rate entry:
```
{ id, category, label, calcMode, defaultRate (cents), unit, floor (cents|null), tier, notes }
```

### 3.1 Painting (locked — the user's forte)

| Label | calcMode | Default | Floor | Notes |
|---|---|---|---|---|
| Labor — standard | per_hour | $70/hr | **$65/hr (hard floor)** | Below floor → guardrail flag |
| Labor — tough / high / detail | per_hour | $85/hr | — | Range $80–95; high ceilings, heavy prep, fussy detail |
| Wall labor | per_sqft | (v1 formula) | — | Keep v1 engine: area × coats × rate, prep multiplier |
| Ceiling labor | per_sqft | (v1 formula) | **$1.00/sqft** | Below $1.00/sqft labor → "giveaway" flag |
| Paint (material) | material | per gal | — | Coverage DEFAULT ~325–350 sqft/gal/coat, configurable |
| Prep multiplier | factor | light 1.0 / med 1.15 / heavy 1.3 | — | Carry from v1 |

### 3.2 Windows (integrate the existing calculator)

| Label | calcMode | Default | Notes |
|---|---|---|---|
| Ground — outside only | per_unit | $13/window | Range $12–15 |
| Ground — inside + outside | per_unit | $17/window | Range $16–18 |
| Second story — outside only | per_unit | $15/window | Ladder premium baked in |
| Second story — inside + outside | per_unit | $21/window | Range $20–22 |
| Add-on bundle discount | factor | toggle 10–25% off | Only when attached to a paint/reno job |

- **Job-minimum note:** a small standalone window job has a friendly floor around **$150** — but if window items appear on a job NOT tagged as a bundled add-on and priced in the add-on band, fire a guardrail (§5.3). $150-on-a-neighbor is friend pricing, not the standalone rate.
- **Adjusters (optional upcharges):** storm windows / screen removal / heavy mineral staining each add a configurable per-window bump.
- **Scope note for the user, surfaced in UI:** check glass for paint overspray first — that's paint-job scope, not window scope. Be careful with razor scrapers on tempered/coated glass.

### 3.3 Fixtures & Lighting (handyman — new)

| Label | calcMode | Default | Notes |
|---|---|---|---|
| Fixture swap (existing box + wiring) | per_unit | $115/fixture | Like-for-like replacement, easy access |
| Recessed / can — new install | per_unit | $200/fixture | Cutouts + box + wiring; **see scope warning** |
| High-access / ladder / stair premium | per_unit | +$40/fixture | Or bump the job to the $80–95 tier |
| Removal + disposal | per_unit | $25/fixture | If hauling old fixtures |

- **Scope warning (MUST surface in UI on this category):** this category is for **non-licensed handyman scope only** — like-for-like swaps and simple installs reusing existing boxes, no new circuits or panel work. Once a job needs **new wiring runs, new circuits, or a permit**, that's licensed-electrician territory in Philly — flag it and let the user decide. (This is a heads-up field, not legal advice; the user confirms local requirements.)
- **Output reminder:** describe by scope on the client doc ("five fixtures installed incl. high-access work, cutouts, junction wiring"), never "took all day." (§6)

### 3.4 General handyman / catch-all

| Label | calcMode | Default | Notes |
|---|---|---|---|
| Labor — standard | per_hour | $70/hr | Floor $65/hr |
| Labor — tough / detail | per_hour | $85/hr | $80–95 band |
| Custom line | flat | — | Anything not covered; free-text + amount |
| Trip / job minimum | flat | optional | Warn if job total falls below |

---

## 4. Calculation engine

### 4.1 Line-item calc modes

- `per_sqft` — painting; keep v1's formula (area × coats × rate, prep multiplier).
- `per_unit` — windows, fixtures; `count × rate (+ accessPremium per unit)`.
- `per_hour` — general; `hours × tierRate`.
- `flat` — custom; a typed amount.
- `material` — `qty × unitCost × (1 + markupRate)` **or** flagged `materialsSeparate` (§8).
- `credit` — a negative amount; **requires a reason tag** (§5.4).

### 4.2 Totals stack (exact formula — grounded in a real job)

Compute in integer cents, in this order:

```
laborSubtotal     = Σ labor line items
materialsSubtotal = Σ material line items        (0 if job is "materials separate")
subtotal          = laborSubtotal + materialsSubtotal
markup            = round(subtotal × markupRate)         DEFAULT markupRate = 0.20
discounts         = Σ credit line items                  (negative)
tax               = round(materialsSubtotal × taxRate)   DEFAULT taxRate = 0.08  (materials only)
total             = subtotal + markup + tax + discounts
```

**Worked example (real job — the Bozena ceiling estimate, encode as the engine's locked test):**

| Line | Amount |
|---|---|
| Materials | $534.60 |
| Labor | $1,078.00 |
| Subtotal | $1,612.60 |
| Markup (20% of subtotal) | $322.52 |
| Tax (8% of materials only) | $42.77 |
| **Total** | **$1,977.89** |

Tax is computed on **raw material cost** (pre-markup), labor is untaxed, markup is 20% of the labor+material subtotal. Lock this as a unit test so refactors can't drift it.

---

## 5. Pricing guardrails — "Money Goblin Defense"

These are **non-blocking warnings**. They surface the math and a colored badge; the user can always override and proceed. The point is that underpricing is never *accidental* — only ever a deliberate choice.

### 5.1 Effective-hourly check
`effectiveHourly = laborSubtotal ÷ estimatedHours`
- `< $65` → **red** ("below your hard floor")
- `$65–70` → **yellow** ("friendly, not aggressive")
- `≥ $70` → clear

Show the math inline. *(Reality check: the Bozena example above is $1,078 ÷ 21.6 hrs = **$49.90/hr** — that job would have fired a red flag. This is exactly the case the feature exists to catch.)*

### 5.2 Ceiling/sqft giveaway check
For painting-by-area: `ceilingLabor ÷ ceilingSqft < $1.00/sqft` → flag "giveaway territory."

### 5.3 Window-standalone check
If window line items are present, the job is **not** tagged `bundled`/`add-on`, and the per-window rate sits in the add-on band → flag "add-on pricing on a standalone job."

### 5.4 Intentional-discount rule
Every `credit` line item **MUST** carry a reason tag, chosen from: `repeat_client`, `bundled_addon`, `courtesy_credit`, `referral_goodwill`, `other` (with a note). No silent discounts. The document summary shows **total dollars given away** so the user always sees the size of the gift. *(This is the grinder-credit pattern: name it, subtract it visibly, don't let it quietly eat the day.)*

### 5.5 Job-minimum check (optional)
If `total < jobMinimum` (a configurable Settings value) → warn.

---

## 6. Scope-over-time output

Each line item carries two text fields:
- `internalNote` — the user's shorthand / the actual math (hours, per-unit, access). Internal view only.
- `clientDescription` — scope language ("Recessed & fixture installation, 5 fixtures, incl. high-access ladder work, larger cutouts, and junction wiring").

**MUST:** the client-facing **Quote** and **Invoice** print `clientDescription` only. Hours and rates live in an internal-only toggle. Default new line items to scope phrasing in the printed doc. *(Principle from the field: scope sounds professional, time sounds negotiable.)*

A **view toggle** on the job screen switches between Internal view (shows hours/rates/guardrails) and Client view (shows only scope + totals — a preview of what prints).

---

## 7. Document lifecycle: Estimate → Quote → Invoice

A **Job** owns one or more **Documents**. `Document.type ∈ { estimate, quote, invoice }`.

**Status pipeline** (extends v1's): `draft → sent → accepted → scheduled → completed → invoiced → paid`, plus `lost`, `on_hold`, `archived`. Filterable/sortable in the list view (carry v1's sort/filter/search).

**Conversion (MUST, no retyping):**
- Estimate → Quote: carry line items forward, add `validUntil` (DEFAULT +30 days), snapshot totals.
- Quote → Invoice: carry line items, add invoice fields below, snapshot totals.
- Each conversion creates a linked document; the chain is visible on the job.

**Invoice-only fields:**
```
invoiceNumber   (auto-increment, e.g. PK-0001)
issueDate
dueDate / terms (DEFAULT "Due on receipt"; cash-friendly)
amountDue
paidStatus      (unpaid | partial | paid)
paymentMethod   (DEFAULT cash)
paidDate
```

**Quote-only fields:** `validUntil`.

---

## 8. Materials handling

Per-job toggle `materialsMode`:
- `in_estimate` (DEFAULT) — material line items flow into the totals (markup + tax per §4.2).
- `separate` — materials are tracked on the job (with receipts/notes) but **excluded from the totals**; the client pays materials directly at cost. The printed doc states "Materials billed separately (at cost; receipts provided)."

*(The lighting job ran `separate`; the Bozena painting job ran `in_estimate`. Both must be first-class.)*

---

## 9. Sync & storage (the headline v2 change)

v1 already routes all data access through a repository abstraction **specifically so a backend can be added without rewriting the app.** v2 plugs the backend in behind that same interface.

**Architecture:**
- **Local-first stays.** Keep Dexie/IndexedDB as the on-device cache. Job sites have bad signal — the app MUST keep working fully offline, reads and writes.
- **Cloud backend for cross-device sync.** Add it behind the repo interface. On write: persist locally, then push to cloud when online. On open: pull latest, reconcile.
- **Conflict model:** single user across their own devices, so **last-write-wins per record** is acceptable (real conflicts are rare). JSON export remains the safety net.
- **Photos** (v1 feature) move to cloud storage so they sync too.

**Recommended backend: Supabase** (Postgres + Auth + Row-Level Security + Storage). Reasons: generous free tier easily covers one operator, email/password auth is simple, pairs cleanly with the existing Vercel deploy, and Postgres maps neatly onto the integer-cents data model. One account, the user's own.

**Decision to confirm (see §14):** Supabase (recommended — true seamless sync) **vs.** a lighter stopgap (stay local-only and export/import a JSON backup to an OS-synced folder like Google Drive / iCloud). The stopgap is simpler to ship but sync is manual and conflict-prone; given the explicit "access on PC and mobile most of the time" requirement, Supabase is the right call.

---

## 10. Data model additions (over v1)

Route all of these through the repository layer.

- **Document** (new, or extend v1 Estimate): `type`, `status`, `invoiceNumber?`, `issueDate?`, `dueDate?`, `validUntil?`, `paidStatus?`, `paymentMethod?`, `paidDate?`, `totalsSnapshot`.
- **LineItem** (extend): `+ category`, `+ calcMode`, `+ internalNote`, `+ clientDescription`, `+ accessPremiumCents?`, `+ reasonTag?` (credits), `+ taxable`.
- **RateBook** (new): categories + entries per §3 (`label`, `calcMode`, `defaultRate`, `unit`, `floor?`, `tier`, `notes`).
- **Settings** (extend): `markupRate` (0.20), `taxRate` (0.08, per-job overridable), `hardFloorHourlyCents` (6500), `ceilingSqftFloorCents` (100), `jobMinimumCents?`, business info, logo.
- **Client** (extend): `+ tags[]` (e.g. `repeat`, `has_connections`), `+ preferredPaymentMethod?`.
- **Job** (extend): `+ materialsMode` (`in_estimate | separate`), `+ bundled` (bool, drives §5.3).

**Per-job tax override:** the service area spans Philadelphia (8%), greater PA (6%), NJ, and DE (0%). `taxRate` is a per-job field defaulting to **0.08** (Philly, matching the user's existing estimates). *(Configurable field only — the user confirms taxability of labor vs. materials across states with their accountant; this spec doesn't assert tax law.)*

---

## 11. UI / quick-select flow

- **Home:** New Job · recent jobs · clients · (Phase C) dashboard. Bottom-tab nav on mobile (carry v1).
- **New Job:** pick or create client → pick trade category → that category's **rate chips** load → tap a chip to add a pre-filled line item → adjust quantity / access premium → running **total** + live **guardrail badges** always visible.
- **Actions on a job:** Convert to Quote · Convert to Invoice · Print/Export PDF · Internal/Client view toggle (§6).
- Mobile-first, fully usable on desktop (carry v1 responsive layout). Big touch targets, instant calc feedback.

---

## 12. Print & export

- **Carry v1's AirPrint path exactly** (pdfmake PDF → iOS share/print sheet). Do not regress to browser-print CSS on iOS.
- **Templates:**
  - **Quote** — branding header, `validUntil`, scope line items, totals, optional "materials separate" note.
  - **Invoice** — adds invoice number, terms/due, amount due, a **PAID** stamp when `paidStatus = paid`, and payment method.
- **Branding:** "PK Paints & Renovations" header with contact info and a **logo slot**. Keep this consistent with the website branding refresh (same logo/wordmark once finalized).
- **Format:** Letter/A4; PDF export for email or hand-off.

---

## 13. Build phases (v2)

Ship incrementally; each phase is independently useful.

- **Phase A — Rate Book + guardrails + window integration (biggest immediate win, all local).**
  Rate Book with all four categories preloaded · the four calc modes · the exact totals formula (§4.2) with the locked Bozena test · the five guardrails (§5) · fold in the existing window calculator as a proper module · scope/internal dual fields (§6). After this, the user can quote *any* trade job and hand over a clean PDF, with floors protected.

- **Phase B — Document lifecycle + clients + materials toggle.**
  Estimate → Quote → Invoice conversion without retyping · invoice fields + paid status · client records with tags · `materialsMode` toggle · status pipeline filtering.

- **Phase C — Sync + polish.**
  Supabase cross-device sync behind the repo interface · photos to cloud storage · dashboard (outstanding vs. paid, jobs in progress) · job templates ("standard interior repaint," "window add-on package") · duplicate-a-past-job.

---

## 14. Open decisions for the user (confirm before / during build)

1. **Sync architecture** — Supabase (recommended, true sync) vs. local-only + JSON-to-synced-folder stopgap. → *Recommend Supabase.*
2. **Tax** — confirm the 8% materials-only default + per-job override is correct across PA / Philly / NJ / DE with your accountant.
3. **Rate values** — the fixture/lighting and window numbers here are reasonable defaults; tune the floors to your real comfort once you've run a few jobs through.
4. **Naming / branding** — keep "PK Estimator," or rebrand (e.g. PK Job Kit / PK QuickQuote)? Affects the PWA name + print header.
5. **Window module** — wire in the existing calculator code, or have the agent rebuild it from §3.2? (Rebuild is cleaner if the old code wasn't committed.)

---

*End of v2 spec. Build on top of v1; v2 wins on conflicts; don't regress AirPrint, offline, integer-cents, or the repository abstraction.*
