# ESTIMATOR — Project Specification

**Working name:** Estimator (rename freely)
**Owner:** Peeps (trades business — painting / carpentry / handyman)
**Audience for this document:** Claude Code / Codex coding agents
**Status:** v1 spec, ready to build
**Goal:** A usable, installable estimating + lead-organizing app on a phone within ~1 day, expandable into a synced desktop tool.

> **Agent note:** Drop this file in the repo root and rename it `CLAUDE.md` (Claude Code) or `AGENTS.md` (Codex) so it's auto-loaded as context. Treat every "MUST" as a hard requirement and every "DEFAULT" as a value the user can change in-app — **do not hardcode pricing or rate numbers anywhere except the Settings store.**

---

## 1. What this is (one paragraph)

A mobile-first, installable app that turns quick on-site job notes into a rough cost estimate, and stores every job as a browsable record with client info, photos, notes, and a status pipeline (lead → bid sent → won/lost/on-hold). It ships first as a Progressive Web App (PWA) that installs on both phone and desktop from the same codebase, works offline, and prints/exports clean estimate PDFs. Painting is the first fully-built estimation module, but the engine is trade-agnostic so handyman/contractor/general jobs can be roughed out with line items.

---

## 2. Requirements, translated from the brief

The original ask, decoded into concrete requirements:

| You said | It means |
|---|---|
| "take my note inputs, output a rough estimate" | Fast structured entry (tap-friendly) → deterministic estimate engine → a $ **range** (low / expected / high), not a single false-precision number. (Optional AI freeform-notes parsing is a Phase 2 add-on — see §10.) |
| "electronic file system and lead organizer… neatly stored… browse thru numerous projects" | Projects are first-class records with client, address, notes, photos, and one-or-more estimates. A searchable, scrollable list. |
| "sorting system… by date, by client, job description, etc." | List view with sort + filter + text search across those fields. |
| "separation or archive for won / active / denied / limbo bids" | A **status pipeline**: lead, estimating, bid_sent, won, lost, on_hold (= "limbo"), archived. Filter and group by status. |
| "painting is tomorrow's focus… but not limited to painting… contractor/handyman/construction" | A **painting module** (formula-driven) ships first; a **general module** (line-item driven) covers everything else. Same totals/markup/PDF pipeline. |
| "mobile thru a PWA… also a standalone desktop app… sync… open estimates and print" | One PWA installs on phone **and** desktop. Desktop install handles printing natively. Cross-device sync is the one piece that needs a backend — see §11 for the phased plan. |
| "basic features but clean crisp easy to use" | Minimal chrome, big touch targets, instant calculation feedback, bottom-tab nav on mobile. |
| "built in brains to get quick and roughly accurate estimates" | A pure, unit-tested estimation engine with **editable** coefficients (labor rate, paint coverage, prep multipliers, markup, etc.). Accuracy comes from tuning your real numbers in Settings, not from guesswork. |

---

## 3. Goals & non-goals

**Goals (v1 / Day 1)**
- Installable PWA on phone + desktop, offline-capable.
- Create/edit/browse projects, clients, and estimates entirely on-device.
- Painting estimate calculator that produces a tunable, transparent estimate range.
- General line-item estimate mode for any other trade.
- Status pipeline + sort/filter/search.
- Clean estimate PDF + print.
- Editable rates/settings (no magic numbers in code).
- Full local backup: export/import all data as JSON.

**Non-goals (v1 — explicitly later or never)**
- Multi-user accounts / teams (single user).
- Invoicing, payments, accounting integration.
- Scheduling / calendar.
- Real-time cross-device sync (Phase 2).
- AI freeform-notes parsing (Phase 2).
- Native installers via app stores (PWA install is enough; Tauri is optional Phase 2).

---

## 4. Architecture decision (recommended path)

**Local-first PWA, single codebase, hosted on Vercel.**

- One React + TypeScript + Vite app, served over HTTPS (required for PWA install) from Vercel.
- All data lives **on-device** in IndexedDB (via Dexie). The app is fully functional with zero network.
- The data layer is abstracted behind a **repository interface** so a cloud-sync backend (§11) can be added later without rewriting feature code. **This abstraction is mandatory in v1 even though sync ships later.**
- Desktop = the same PWA, installed via the browser's "Install app" (Chrome/Edge). It opens in its own window and prints natively. (A true native wrapper via Tauri is an optional Phase 2 upgrade if standalone installers are wanted.)

This is the fastest route to "usable tomorrow on my phone" while leaving clean seams for sync and AI.

---

## 5. Tech stack (use exactly this unless blocked)

- **Framework:** React 18 + TypeScript, built with **Vite**.
- **Styling:** **Tailwind CSS**. Clean, high-contrast, minimal.
- **Routing:** `react-router-dom`.
- **Local DB:** **Dexie.js** (IndexedDB). All access goes through `/src/data/repositories/*` — never call Dexie directly from components.
- **State:** **Zustand** for UI/app state; data reads come from the repository layer (live queries via `dexie-react-hooks` `useLiveQuery`).
- **PWA:** **`vite-plugin-pwa`** (Workbox) — generate manifest, service worker, offline precache, installability.
- **PDF:** **`pdfmake`** (programmatic, reliable layout). **Print:** native `window.print()` with a dedicated print stylesheet, or `react-to-print`.
- **Dates:** `date-fns`.
- **IDs:** `crypto.randomUUID()`.
- **Money math:** integer **cents** internally to avoid float drift; format to currency only at display. A small `money` util MUST handle this.
- **Hosting:** **Vercel** (HTTPS, instant deploy, installable). User already has Vercel connected.
- **Phase 2 only:** Supabase JS (sync + auth), a Vercel serverless function for the AI proxy, optionally Tauri.

---

## 6. Information architecture / screens

Mobile navigation = bottom tab bar: **Home · Jobs · ＋ · Clients · Settings**. The ＋ opens "New Estimate." On desktop, the same nav can sit in a left rail.

1. **Home / Dashboard**
   - Top-line stats: # active bids, $ won this month, # awaiting decision (bid_sent).
   - "Recent jobs" list (tap to open).
   - Prominent **＋ New Estimate** button.

2. **Jobs (Projects list)** — the core browse screen
   - Search bar (matches client name, job title/description, address).
   - Sort control: Date (newest/oldest), Client (A–Z), Amount (high/low), Status.
   - Filter chips: status (lead / estimating / bid sent / won / lost / on hold), trade, tags. Include an "Archived" toggle (hidden by default).
   - Each row: client name, job title, status chip (color-coded), estimate total (range or expected), updated date.

3. **Job detail (Project)**
   - Header: client + title + status control (tap to change status; setting `bid_sent` stamps `bidSentAt`, setting won/lost/on_hold stamps `decisionAt`).
   - Sections: client/contact, address, **freeform notes**, **photos** (Phase 2 attachments — see §16), list of estimates (with totals + version).
   - Actions: Edit, Duplicate estimate, Export/Print PDF, Archive, Delete.

4. **New / Edit Estimate**
   - Step 1: pick or create a **client**.
   - Step 2: job title/description + trade picker (**Painting** | **General**).
   - Step 3a (Painting): the **Painting Calculator** (§7).
   - Step 3b (General): the **Line-Item Editor** (§8).
   - Live **totals panel** always visible (sticky): materials, labor (hrs + $), subtotal, markup, tax, **total**, and **low / expected / high** range.
   - Save → creates/updates the Project + Estimate.

5. **Clients** — list + detail (a client's jobs roll up here).

6. **Settings / Rates** — every coefficient in §9, plus company info (name, phone, email, optional logo) used on the PDF. Buttons: **Export all data (JSON)**, **Import data (JSON)**, **Reset rates to defaults**.

7. **Library** (lightweight in v1) — saved reusable line items for the General module.

8. **Estimate Preview** — formatted document view with **Print** and **Export PDF**.

---

## 7. The estimation engine — Painting module (the "brains")

> Implement as **pure functions** in `/src/lib/estimate/painting.ts` with **no UI and no hardcoded numbers** — all coefficients are passed in from the Settings/Rates object. Write **unit tests** (§17 worked example).

### Inputs (per room; an estimate has 1..n rooms)
- `label` (e.g., "Living Room")
- `length` (ft), `width` (ft), `height` (ceiling, ft)
- surfaces to paint (booleans + counts): `walls`, `ceiling`, `trim`, `doors` (count), `windows` (count)
- `coats` (default 2)
- `prepLevel`: `light` | `standard` | `heavy`
- `notes` (free text, not used in math)

### Geometry
- `perimeter = 2 × (length + width)`
- `wallGross = perimeter × height`
- `openings = doors × doorAreaSqft + windows × windowAreaSqft`
- `wallNet = max(0, wallGross − openings)`
- `ceilingArea = length × width`
- `trimLinearFt = perimeter` (baseboard run; doors/windows handled as fixed labor below)

### Materials
- Painted area per surface counts coats: `appliedSqft = selectedSurfaceArea × coats`.
- `paintGallons = ceil( totalAppliedSqft / coverageSqftPerGallon )` (round **up**, per estimate).
- `primerGallons` = `ceil(totalArea / coverageSqftPerGallon)` **only if** `prepLevel === 'heavy'` (configurable toggle); else 0.
- `paintCost = paintGallons × paintCostPerGallon`
- `primerCost = primerGallons × primerCostPerGallon`
- `sundries = round((paintCost + primerCost) × sundriesPct)` (tape, plastic, rollers).
- `materials = paintCost + primerCost + sundries`

### Labor
- **Production rate semantics (define precisely to avoid ambiguity):** `productionRates.{walls,ceiling}` are **square feet applied per hour, per coat, including cut-in.** So hours for a surface = `(surfaceArea × coats) / productionRate`.
- `wallHours = (wallNet × coats) / productionRates.walls`
- `ceilingHours = (ceilingArea × coats) / productionRates.ceiling`
- `trimHours = trimLinearFt / productionRates.trim` (trim rate = linear ft/hr, single pass; multiply by coats if `coats>1` for trim too)
- `doorHours = doors × doorLaborHrs`, `windowHours = windows × windowLaborHrs` (fixed per unit, includes their coats)
- `baseHours = sum of the above for selected surfaces`
- `prepHours = baseHours × (prepMultiplier[prepLevel] − 1)` → effectively `totalHours = baseHours × prepMultiplier[prepLevel]`
- `labor = round(totalHours × hourlyRate)`

### Totals (shared with General module — put in `/src/lib/estimate/totals.ts`)
- `subtotal = materials + labor`
- `markup = round(subtotal × markupPct)`
- `taxableBase = taxAppliesTo === 'materials' ? materials : taxAppliesTo === 'all' ? subtotal : 0`
- `tax = round(taxableBase × taxPct)`
- `total = subtotal + markup + tax`
- **Range:** `low = round(total × (1 − confidenceBandPct))`, `high = round(total × (1 + confidenceBandPct))`. Display as **expected** with low–high.

The UI MUST show the breakdown (materials, labor hrs, labor $, markup, tax) — the user trusts an estimate they can see inside.

---

## 8. Estimation engine — General module (trade-agnostic)

For handyman / contractor / construction / anything non-painting. **Line-item based.**

Each `LineItem`:
- `description`
- `qty` (number)
- `unit`: `ea` | `sqft` | `linft` | `hr` | `day` | `lump`
- `unitCost` (cents)
- `laborHours` (optional — for visibility/scheduling; not required)
- `total = qty × unitCost`

Estimate `materials`/`labor` split is optional here; simplest v1: each line is a cost line, `subtotal = Σ line.total`, then the **same** markup/tax/range logic from §7 applies. If a line has `laborHours`, sum them into a displayed labor-hours figure.

**Library:** users can save a line item to a reusable `LibraryItem` list and re-add it later (pre-fills description/unit/unitCost). Keep this flat in v1 (no nested assemblies yet).

This is the mechanism that fulfills "not limited to painting": any job can be roughed out as line items, and painting jobs get the dedicated calculator on top.

---

## 9. Settings / Rates (the single source of all coefficients)

Store as one singleton record in Dexie. **Every number below is a DEFAULT the user edits in the Settings screen.** Implement the editor with sensible input types (number steppers, % fields). Provide "Reset to defaults."

```ts
interface Rates {
  // labor
  hourlyRate: number;            // DEFAULT $50/hr  → store cents: 5000
  // materials
  paintCostPerGallon: number;    // DEFAULT $45     → 4500
  primerCostPerGallon: number;   // DEFAULT $30     → 3000
  coverageSqftPerGallon: number; // DEFAULT 350
  sundriesPct: number;           // DEFAULT 0.08
  // painting production (see §7 semantics)
  productionRates: {
    walls: number;   // DEFAULT 175  (sqft/hr/coat, incl cut-in)
    ceiling: number; // DEFAULT 200
    trim: number;    // DEFAULT 60   (linft/hr/coat)
  };
  prepMultipliers: { light: number; standard: number; heavy: number };
                     // DEFAULT 1.0 / 1.25 / 1.6
  doorAreaSqft: number;    // DEFAULT 21
  windowAreaSqft: number;  // DEFAULT 15
  doorLaborHrs: number;    // DEFAULT 0.75 (per door, incl coats)
  windowLaborHrs: number;  // DEFAULT 0.5  (per window, incl coats)
  primerOnHeavyPrep: boolean; // DEFAULT true
  // pricing
  markupPct: number;       // DEFAULT 0.20
  taxPct: number;          // DEFAULT 0.08  (Philadelphia-ish; user sets)
  taxAppliesTo: 'materials' | 'all' | 'none'; // DEFAULT 'materials'
  confidenceBandPct: number; // DEFAULT 0.12  (±12% → low/high)
  // company (for PDF)
  company: {
    name: string; phone?: string; email?: string;
    address?: string; logoDataUrl?: string;
  };
}
```

> These defaults are reasonable industry placeholders **only**. Peeps will tune them to his real numbers — the app is designed so accuracy comes from his rates, not from the code's guesses.

---

## 10. Note → estimate flow

**Phase 1 (Day 1, deterministic — REQUIRED):**
Fast structured entry. On mobile, optimize for speed: number steppers for door/window counts, large tap targets, surface toggles, instant recalculation of the totals panel on every change. A **freeform notes** field is saved on the project for context but is **not** parsed. (Voice entry is free here — the phone keyboard's mic dictates into any field.)

**Phase 2 (optional — AI smart notes):**
A "Smart Notes" box where the user types or dictates plain language, e.g. *"12 by 14 living room, 9 ft ceilings, walls and ceiling, two coats, one door two windows, standard prep."* The app sends this to the Anthropic API (via a serverless proxy — see below) and gets back **structured JSON** matching the Room schema, which **pre-fills the calculator for the user to review**. The deterministic engine (§7) always does the actual math. **The AI never returns a dollar figure** — it only extracts structure. This keeps estimates trustworthy and the "brains" honest.

- **Security:** never embed an Anthropic API key in the client. Route through a **Vercel serverless function** (`/api/ai-parse`) that holds the key server-side.
- **Output contract:** the function MUST return strictly-validated JSON (no prose, no markdown). Validate with Zod against the Room schema; on parse failure, fall back to manual entry and tell the user.

---

## 11. Sync (phased; the one part that needs a backend)

True cross-device sync (estimate on phone at the site → open and print on the PC) requires a shared store. Design for it now, add it after Day 1.

- **Phase 1 bridge (Day 1):** **Export all data (JSON)** + **Import data (JSON)** in Settings, plus single-estimate share. Clunky but unblocks the phone→PC workflow on day one.
- **Phase 2 (real sync):** **Supabase** (hosted Postgres + auth + realtime).
  - Tables mirror the local model (clients, projects, estimates, library_items, rates, attachments).
  - Auth: email magic link (single user is fine; RLS scoped to the user).
  - Sync adapter implements the repository interface; strategy = **last-write-wins on `updatedAt`** per record (sufficient for a single-user, low-conflict tool). Realtime subscription so the desktop reflects phone edits.
  - Because all v1 data access already goes through the repository layer, this is **additive** — no feature rewrites.

---

## 12. Offline behavior
- App shell + assets precached by the service worker; full functionality offline.
- All reads/writes hit IndexedDB; no network required in Phase 1.
- (Phase 2) When sync exists: writes queue locally and reconcile on reconnect.

---

## 13. PDF / print — estimate document

A clean, professional one-page (multi-page if long) estimate. Generated with `pdfmake`; print via a dedicated print stylesheet.

Contents, top to bottom:
- Company header (name, phone, email, logo if set) + "ESTIMATE" + date + estimate #/version.
- Client block (name, phone/email, job address).
- Job title / description.
- **Breakdown:** Painting → rooms table (room, surfaces, area, hours) and a materials/labor summary; General → line-item table (description, qty, unit, unit cost, total).
- Totals: materials, labor, subtotal, markup, tax, **Total** + the **low–high range** with a "rough estimate" disclaimer line.
- Notes / scope / terms (editable free text).
- Signature + date line.
- Footer disclaimer: estimate only, subject to change after inspection.

Buttons: **Print** (native) and **Export PDF** (download).

---

## 14. Data model (Dexie schema)

Money fields are integer **cents**. Timestamps are ISO strings.

```ts
interface Client {
  id: string; name: string; company?: string;
  phone?: string; email?: string; address?: string; notes?: string;
  createdAt: string; updatedAt: string;
}

type ProjectStatus =
  'lead' | 'estimating' | 'bid_sent' | 'won' | 'lost' | 'on_hold' | 'archived';

interface Project {
  id: string; clientId: string;
  title: string;              // short job description
  address?: string;
  trade: 'painting' | 'general';
  status: ProjectStatus;
  tags: string[];
  notes: string;              // freeform
  createdAt: string; updatedAt: string;
  bidSentAt?: string; decisionAt?: string;
  photoIds: string[];         // Phase 2 attachments
  estimateIds: string[];
}

interface Room {
  id: string; label: string;
  length: number; width: number; height: number; // ft
  walls: boolean; ceiling: boolean; trim: boolean;
  doors: number; windows: number;
  coats: number; prepLevel: 'light' | 'standard' | 'heavy';
  notes?: string;
}

interface LineItem {
  id: string; description: string;
  qty: number; unit: 'ea'|'sqft'|'linft'|'hr'|'day'|'lump';
  unitCost: number;           // cents
  laborHours?: number;
  fromLibraryId?: string;
}

interface Totals {
  materials: number; laborHours: number; labor: number;
  subtotal: number; markup: number; tax: number;
  total: number; low: number; high: number; // all cents
}

interface Estimate {
  id: string; projectId: string; version: number;
  trade: 'painting' | 'general';
  rooms: Room[];              // painting
  lineItems: LineItem[];      // general
  ratesSnapshot: Rates;       // freeze rates used at calc time
  totals: Totals;
  scopeNotes?: string;        // shown on PDF
  status: 'draft' | 'final';
  createdAt: string; updatedAt: string;
}

interface LibraryItem {
  id: string; description: string;
  unit: LineItem['unit']; unitCost: number; laborHours?: number;
  category?: string;
}

interface Attachment {        // Phase 2
  id: string; projectId: string;
  blob: Blob; caption?: string; createdAt: string;
}

// Rates: see §9 (singleton)
```

**Dexie stores:** `clients`, `projects`, `estimates`, `libraryItems`, `attachments`, `rates` (single row, fixed id `'default'`).
Index `projects` on `updatedAt`, `clientId`, `status`, `trade` for fast sort/filter.

---

## 15. Suggested repo structure

```
/public            icons (192,512,maskable), favicon
/src
  /components       shared UI (Button, NumberStepper, StatusChip, TotalsPanel…)
  /features
    /dashboard
    /projects       list, detail, status control
    /clients
    /estimates      new/edit flow, preview
    /painting       calculator UI (uses lib/estimate/painting)
    /general        line-item editor + library
    /settings       rates editor, export/import
    /pdf            pdfmake doc + print view
  /data
    db.ts           Dexie definition
    /repositories   clientRepo, projectRepo, estimateRepo, ratesRepo… (interface + dexie impl)
  /lib
    /estimate       painting.ts, general.ts, totals.ts  (PURE, tested)
    money.ts        cents <-> display, rounding
    types.ts
    format.ts       dates, currency
  /store            zustand stores (ui, draftEstimate)
  /routes           router config
  main.tsx, App.tsx
/api                 ai-parse.ts (Phase 2, Vercel serverless)
vite.config.ts       + vite-plugin-pwa config
tailwind.config.js
CLAUDE.md            (this spec)
```

---

## 16. Build milestones (priority order — build top-down)

> Target: **end of Milestone 4 = a usable app on phone + desktop.** Milestones 5–7 are fast-follows.

- **M0 — Scaffold (1–2 hrs).** Vite + React + TS + Tailwind + router. Dexie schema + repository interfaces. PWA manifest + service worker (`vite-plugin-pwa`), app icons. Bottom-tab nav shell. Deploy skeleton to Vercel; confirm "Install app" works on phone and desktop.
- **M1 — Organizer core.** Clients + Projects CRUD via repositories. Jobs list with search + sort + filter chips + archived toggle. Project detail with notes + status control (with timestamp side-effects). Settings/Rates editor seeded with §9 defaults.
- **M2 — Painting engine + calculator.** Pure `painting.ts` + `totals.ts` with **unit tests** (use §17 example). Room input UI with steppers + surface toggles. Sticky live totals panel showing breakdown + low/expected/high. Save estimate to project.
- **M3 — General module + library.** Line-item editor, unit picker, live totals (shared logic). Flat Library of reusable items (save / re-add).
- **M4 — PDF / print + backup.** `pdfmake` estimate doc (§13) + print stylesheet. Export/Import all data as JSON in Settings. **← usable product.**
- **M5 — Cloud sync (Phase 2).** Supabase tables + auth (magic link) + sync adapter implementing repo interface + realtime. Last-write-wins on `updatedAt`.
- **M6 — AI smart notes (Phase 2).** Vercel `/api/ai-parse` serverless proxy (key server-side) → strict JSON → Zod-validated → pre-fills calculator for review. Deterministic engine still computes.
- **M7 — Polish.** Kanban pipeline view, photo attachments, duplicate estimate / versioning UI, dark mode, dashboard refinements, optional Tauri native desktop build.

---

## 17. Acceptance criteria (testable)

**PWA / platform**
- [ ] Installs to phone home screen and to desktop ("Install app") from the same URL.
- [ ] Loads and is fully usable with the network disabled after first load.

**Estimation engine — painting unit test (must pass exactly):**
Inputs: one room 12×14, height 9, walls+ceiling on, trim off, 1 door, 2 windows, coats 2, prep `standard`. Default rates from §9.
Expected derived values:
- perimeter 52 ft; wallGross 468; openings 51; wallNet 417; ceiling 168.
- paint area = (417+168)×2 = 1170 sqft-coats → gallons `ceil(1170/350)=4` → paintCost $180.00.
- sundries 8% of $180 = $14.40 → materials $194.40 (primer 0; not heavy prep).
- labor hours: walls (417×2)/175 = 4.766; ceiling (168×2)/200 = 1.68; doors 1×0.75; windows 2×0.5=1.0 → base 8.196; ×1.25 prep = **10.245 hr** → labor `10.245×$50` = **$512.26** (round at the dollar step).
- subtotal $706.66; markup 20% = $141.33; tax (materials only, 8%) = $15.55; **total ≈ $863.54**; range ±12% → low ≈ $759.92, high ≈ $967.16.
> Lock these in a test. If you change rounding strategy, update the test and document it. All money math in **cents**.

**Organizer**
- [ ] Can create a client, then a project, then an estimate, and it appears in the Jobs list.
- [ ] Jobs list sorts by date, client, amount, status; filters by status and trade; text search matches client/title/address.
- [ ] Changing status to `bid_sent` sets `bidSentAt`; won/lost/on_hold sets `decisionAt`. Archived items hidden unless toggled.

**General module**
- [ ] A multi-line general estimate sums correctly and applies the same markup/tax/range.
- [ ] A line item can be saved to the Library and re-added.

**Output**
- [ ] Estimate PDF renders company header, client, breakdown, totals + range + disclaimer; prints cleanly from desktop.
- [ ] Export produces a JSON file; Import restores all data on a fresh install.

**Code quality**
- [ ] No pricing/rate magic numbers outside the Rates store.
- [ ] No Dexie calls outside `/src/data/repositories`.
- [ ] Estimation logic is pure and unit-tested.

---

## 18. Design direction
Clean, crisp, professional-trade — not sterile. Light theme default (dark mode in M7). High contrast, generous spacing, large tap targets, number steppers over tiny keyboards. The **totals panel is always visible** while editing and updates instantly. Status chips are color-coded (lead=grey, estimating=blue, bid_sent=amber, won=green, lost=red, on_hold=purple). Currency always formatted with thousands separators; ranges shown as `$760 – $967 (est. $864)`.

---

## 19. Open decisions / assumptions baked into this spec
The spec is buildable as-is using these defaults; confirm or redirect:
1. **Sync:** assumed **local-first now, Supabase sync as Phase 2** (with JSON export/import bridging Day 1).
2. **Desktop:** assumed **installable PWA** (not a native Tauri build) for Day 1.
3. **AI notes:** assumed **structured forms only for v1**, AI freeform parsing as Phase 2.
4. **Rates:** placeholders in §9; real numbers set in-app by the user.
5. **Single user, single device-of-record** until sync lands.
