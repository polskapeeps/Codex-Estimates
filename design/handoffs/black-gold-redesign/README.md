# Handoff: Estimator — Black & Gold Redesign

## Overview
A full visual reskin of the Estimator app (estimates + invoicing for **PK Paints & Renovations**). It replaces the existing dark-navy "blue glass" theme with the PK Paints brand identity: **warm near-black charcoal surfaces with restrained gold accents**. The goal is a clean, modern, daily-use tool for estimating jobs, billing clients, and logging projects — used on phone/tablet on-site and at a desk.

Scope of this redesign: the visual system + six screens (Dashboard, Jobs, Clients, New Estimate, Invoices, Settings) and the app shell (sidebar). The existing data model and app logic stay the same — this is a **look-and-feel + layout** upgrade.

## About the Design Files
The file in this bundle (`Estimator.dc.html`) is a **design reference created in HTML** — a working prototype that shows the intended look, layout, and interactions. It is **not production code to copy verbatim**. The `.dc.html` format uses a small in-house template runtime (`support.js`); you do **not** need that runtime.

Your task: **recreate these designs in the existing codebase** (the live app at `codex-estimates.vercel.app` — appears to be React/Next.js) using its established components, routing, and state. If you are starting fresh, pick the framework that best fits and implement there. Treat the HTML as the source of truth for visuals (colors, spacing, type, copy, component anatomy) and behavior, then rebuild it idiomatically in the target stack.

To preview the reference: open `Estimator.dc.html` in a browser. The left sidebar switches between all six screens; the New Estimate screen has a live calculator.

## Fidelity
**High-fidelity.** Final colors, typography, spacing, radii, and interactions. Recreate pixel-faithfully using the codebase's own component primitives. Exact hex values, sizes, and copy are given below.

---

## Design Tokens

### Color
| Token | Value | Use |
|---|---|---|
| `--bg` | `#14110C` | App background (warm near-black) |
| `--bg-glow` | `radial-gradient(1100px 560px at 88% -12%, rgba(214,164,60,0.07), transparent 60%)`, `radial-gradient(820px 480px at -8% 112%, rgba(214,164,60,0.035), transparent 60%)` | Subtle warm depth layered over `--bg` |
| `--surface` | `#1D1810` | Cards, list containers, sidebar nav active |
| `--surface-sunken` | `#16120B` | Inputs, inset fields, segmented controls |
| `--sidebar-bg` | `rgba(20,16,10,0.5)` + `backdrop-filter: blur(4px)` | Sidebar |
| `--border` | `rgba(255,255,255,0.07)` | Default card/border lines |
| `--border-input` | `rgba(255,255,255,0.09)` | Input borders |
| `--gold` | `#D6A43C` | Core brand gold |
| `--gold-hi` | `#F0CE72` | Highlight gold (large numbers, gradient top) |
| `--gold-bright` | `#E6BD63` | Gold text on dark (links, icons, secondary gold) |
| `--gold-deep` | `#C9962F` | Gradient bottom, uppercase brand label |
| `--gold-cta` | `linear-gradient(150deg, #F0CE72, #D6A43C)` | Primary buttons / brand mark |
| `--gold-tint` | `rgba(214,164,60,0.10–0.16)` | Gold-tinted fills (icon chips, active states) |
| `--gold-tint-border` | `rgba(214,164,60,0.22–0.45)` | Borders on gold-tinted elements |
| `--text` | `#F3EEE1` | Body text (warm off-white) |
| `--text-strong` | `#F6F1E4` | Headings |
| `--text-2` | `#C6BCA8` | Secondary text |
| `--text-3` | `#A89E8B` | Muted text / inactive nav |
| `--text-4` | `#857C6B` / `#8E8573` | Captions, sublabels |
| `--text-5` | `#7C7463` / `#6E6657` | Placeholders, faint hints |
| `--cta-ink` | `#1A1407` | Text/icons on gold buttons |
| `--positive` | `#7FBF95` / `#8FD0A6` | Won/Paid/positive (muted green) |
| `--negative` | `#D69585` / `#E0A595` | Lost/Overdue (muted terracotta) |

**Status chip colors** (background / text):
- Won / Paid: `rgba(127,191,149,0.16)` / `#8FD0A6`
- Sent / Due: `rgba(214,164,60,0.16)` / `#EBC069`
- Draft: `rgba(255,255,255,0.07)` / `#A89E8B`
- Lost: `rgba(200,123,107,0.16)` / `#D69585`
- Overdue: `rgba(200,123,107,0.18)` / `#E0A595`

### Typography
- Family: **Hanken Grotesk** (Google Fonts), weights 400/500/600/700/800. Fallback `system-ui, sans-serif`.
- Page H1: 32px (Dashboard greeting 34px), weight 800, letter-spacing -0.7px to -0.8px, color `--text-strong`.
- Section label (uppercase): 13–14px, weight 700, letter-spacing 0.5–0.7px, `text-transform: uppercase`, color `--text-3`/`--text-4`.
- Card stat number: 42px (Dashboard) / 34px (Invoices), weight 800, letter-spacing -1px, `font-variant-numeric: tabular-nums`.
- Body: 15–16px, weight 400–600.
- List row title: 16px weight 700; sublabel 13.5px `--text-4`.
- Nav item: 15.5px weight 600.
- Use `font-variant-numeric: tabular-nums` on all money/number displays.

### Spacing, radius, shadow
- Page content: `max-width: 1000px`, padding `46px 52px 80px`.
- Sidebar width: `272px`, padding `24px 18px 18px`.
- Card padding: 20–24px. List-row padding: `16–17px 22px`.
- Radius: cards/containers **18px**, buttons/inputs **12–14px**, icon chips **11–14px**, pills/chips **99px**, brand mark **13px**.
- Card shadow: `0 8–10px 22–28px rgba(0,0,0,0.28–0.32)`.
- Gold CTA shadow: `0 8px 22px rgba(201,150,47,0.32)`; hover lifts to `0 11px 26px rgba(201,150,47,0.42)` + `translateY(-1px)`.
- Gold is **restrained**: only the primary CTA, active nav, key figures, links, and icon accents. Everything else is neutral warm charcoal.

---

## App Shell (Sidebar)
Fixed 272px left column, full-height, sticky, `border-right: 1px solid rgba(255,255,255,0.06)`, translucent + blur.

1. **Brand lockup** (top): 46px rounded-square (radius 13px) with the `--gold-cta` gradient and "PK" in `--cta-ink` (weight 800, 18px, letter-spacing -0.5px). Beside it: "Estimator" (18px/800, `--text-strong`) over "PK PAINTS & RENO" (11px/600, `--gold-deep`, uppercase, letter-spacing 0.4px).
2. **New Estimate CTA**: full-width gold-gradient button, `--cta-ink` text, plus icon, 14px padding, radius 13px. Navigates to New Estimate.
3. **Nav** (5 items): Dashboard (house), Jobs (briefcase), Clients (users), Invoices (receipt), Settings (gear). Each: 13px×15px padding, radius 12px, 20px stroke icon (`stroke-width 1.9`, `currentColor`), 15.5px/600 label.
   - **Active**: background `rgba(214,164,60,0.13)`, text/icon `--gold-hi`.
   - **Inactive**: transparent background, text/icon `--text-3`.
   - ⚠️ Do **not** put a CSS transition on the nav background/color (caused a render latch in the prototype). Toggle the active class instantly, or animate a separate indicator element.
4. **Footer status pill**: green dot (`#7FBF95`, glow) + "Local-first" / "Offline ready · synced".

Icons are simple inline stroke SVGs (24×24 viewBox, `fill:none; stroke:currentColor; stroke-linecap/linejoin:round`). Use your icon library's equivalents (house, briefcase, users, receipt, gear/settings, plus, chevron-down, check, paint-brush).

---

## Screens / Views

### 1. Dashboard (`/`)
- **Header**: greeting H1 "Good morning, Peter" + sub "Here's where your jobs stand today." Right-aligned date block ("TUESDAY" in gold uppercase 13px, "June 23, 2026" 18px/700).
- **Stat cards**: 3-column grid (`repeat(3,1fr)`, gap 18px). Each card = uppercase label, big number, caption.
  - Active bids → `4` (number in `--gold-hi`), "in progress"
  - Awaiting client → `2` (white), "bids sent"
  - Won this month → `$6,690` (white), "▲ 18% vs last month" (`--positive`, weight 600)
- **Recent jobs**: section header "RECENT JOBS" + "View all →" link (`--gold-deep`, goes to Jobs). List container (surface, radius 18px) of 4 job rows.
- **Job row**: 44px gold-tint icon chip (paint-brush) · title (16/700) + "Client · Date" sub · right side amount (16/700, tabular) + status chip. Full-row hover `background: rgba(214,164,60,0.05)`. Clicking a row → Jobs (in real app, → job detail).

### 2. Jobs (`/jobs`)
- **Header**: H1 "Jobs" + sub "6 total · 2 awaiting reply". Right: small gold "New Estimate" button.
- **Filter chips**: All / Drafts / Sent / Won / Lost — pill buttons (radius 99px). Active = `rgba(214,164,60,0.13)` bg, `--gold-hi` text, `rgba(214,164,60,0.4)` border. Inactive = transparent, `--text-3`, `rgba(255,255,255,0.1)` border. Filters the list by status.
- **Job list**: same row anatomy as Dashboard plus a status chip before the amount; amount column fixed 96px right-aligned.
- Sample data (title · client · date · amount · status):
  - Interior repaint — 2nd floor · The Bennett Family · Jun 21 · $3,240 · Sent
  - Custom trim — dining room · Marcus Reilly · Jun 18 · $1,890 · Won
  - Exterior — full house · Glenmore Property · Jun 16 · $9,750 · Draft
  - Cabinet refinish — kitchen · Sofia Alvarez · Jun 12 · $2,400 · Won
  - Stairwell & hallway · David Chen · Jun 09 · $1,120 · Sent
  - Deck stain & seal · Marcus Reilly · Jun 03 · $640 · Lost

### 3. Clients (`/clients`)
- **Header**: H1 "Clients" + sub "5 total · $18,290 billed all-time". Right: gold "New client" button.
- **Card grid**: 2 columns, gap 16px. Each card (surface, radius 18px, padding 22px):
  - Top row: 50px gold-tint avatar (radius 14px) with initials (17/800, `--gold-hi`) · name (17/700) + location (13.5px `--text-4`).
  - Divider, then two stats: "Jobs" (count, white) and "Billed" (amount, `--gold-hi`).
  - Hover: `border-color: rgba(214,164,60,0.3)` + `translateY(-2px)`.
- Sample: Marcus Reilly (Chestnut Hill, MR, 3, $5,130) · The Bennett Family (Wyndmoor, BF, 2, $3,240) · Glenmore Property (Center City, GP, 4, $6,920) · Sofia Alvarez (Mt. Airy, SA, 1, $2,400) · David Chen (Roxborough, DC, 1, $600).

### 4. New Estimate (`/estimate/new`)
- **Header**: H1 "New estimate" + sub "Build a bid in under a minute. Numbers update as you type."
- **Client field**: select-style box (chevron-down) showing "The Bennett Family — Wyndmoor" + a gold-outline "+ New" button beside it.
- **Job title**: text input (default "Interior repaint — 2nd floor"). Inputs focus: `border-color: #C9962F; box-shadow: 0 0 0 3px rgba(201,150,47,0.18)`.
- **Trade toggle**: 2 large selectable cards — **Painting** (Room calculator) / **General** (Line items). Selected card: `background: rgba(214,164,60,0.1)`, `border: 1.5px solid #C9962F`. Painting is default.
- **Room card** (shown for Painting):
  - Room name input (default "Master bedroom").
  - 3 dimension inputs: Length / Width / Height (ft), centered, value in `--gold-hi` (18/700). Defaults 12 / 12 / 9.
  - **Surfaces to paint**: 3 toggle buttons Walls / Ceiling / Trim. On = `rgba(214,164,60,0.16)` bg, `--gold-hi` text, gold border. Defaults: Walls on, Ceiling on, Trim off.
  - **Steppers**: Doors (default 2), Windows (default 2), Coats (default 2, min 1 / max 4). −/+ buttons 38px; minus = neutral, plus = gold-outline.
  - **Prep** segmented control: Light / Standard / Heavy (default Standard). Active segment = gold gradient + `--cta-ink`.
  - Footer summary line: "{painted} sqft painted · {wall} sqft walls" left, "{hours} hrs labor" right.
- **Add another room**: full-width dashed gold-outline button.
- **Sticky estimate bar** (bottom of viewport, `rgba(22,18,11,0.92)` + blur, gold top border): "ESTIMATE" label + big total (36/800, `--gold-hi`, tabular), "{low} – {high}" / "expected range" beside it, and a gold "Save estimate" button (check icon) on the right.

### 5. Invoices (`/invoices`)
- **Header**: H1 "Invoices" + sub "Track what's billed and what's still owed."
- **Two summary cards** (2-col): Outstanding `$7,275` (`--gold-hi`) / "across 2 invoices"; Paid this month `$5,130` (white) / "2 invoices cleared" (`--positive`).
- **Table** (surface container): header row (uppercase 12px `--text-4`) with columns Invoice (84px) · Client (flex) · Issued (110px) · Status (96px) · Amount (90px, right). Rows hover `rgba(214,164,60,0.045)`.
- Sample: INV-1042 · Bennett · Jun 21 · Paid · $3,240 | INV-1041 · Reilly · Jun 18 · Paid · $1,890 | INV-1040 · Alvarez · Jun 12 · Due · $2,400 | INV-1039 · Glenmore · Jun 02 · Overdue · $4,875.

### 6. Settings (`/settings`)
- **Header**: H1 "Settings" + sub "Your rates power every estimate — tune them to your real numbers."
- **Company card**: logo tile (88px, `--surface-sunken`, gold-tint border, shows `pk-logo.png`) + "Replace logo" button; Business name input ("PK Paints & Renovations"); Phone ("(215) 603-8009") + Email ("peterkpaint@gmail.com") in a 2-col grid.
- **Rates & materials**: 2×2 grid of cards, each a labeled input with `$`/unit affixes: Hourly labor rate `$50/hr` (value in gold), Coverage rate `350 sqft/gal`, Paint/gallon `$45`, Sundries markup `8%`.
- **Save changes** gold button at the bottom.

---

## Interactions & Behavior
- **Navigation**: sidebar items + the various CTAs switch the active screen. Active nav state must track the current route/screen. The "New Estimate" buttons and "View all →" link route accordingly.
- **Jobs filter**: clicking a filter chip filters the list to that status (`all` shows everything). Active chip styled as above.
- **Live estimate calculation** (New Estimate): recompute on every input/toggle/stepper change. Formula used in the prototype (tune to PK's real numbers via Settings):
  ```
  wallArea  = 2 * (L + W) * H
  ceilArea  = L * W
  trimArea  = trim ? (2*(L+W))*0.75 + doors*18 + windows*12 : 0
  base      = (walls?wallArea:0) + (ceiling?ceilArea:0) + trimArea
  painted   = base * coats
  prepMult  = light 0.85 | standard 1.0 | heavy 1.35
  hours     = (painted / 150) * prepMult + doors*0.4 + windows*0.3
  labor     = hours * hourlyRate(50)
  gallons   = max(1, ceil(painted / coverage(350)))
  materials = gallons * paintPerGal(45)
  total     = (labor + materials) * (1 + sundries(0.08))
  range     = total*0.9  to  total*1.12
  ```
  All money formatted as `$N,NNN` (rounded, thousands separators). Steppers clamp: doors/windows ≥ 0, coats 1–4.
- **Hover states**: list rows tint gold-faint; client cards lift + gold border; gold CTA lifts + deeper shadow. Keep transitions on `transform`/`box-shadow`/`border-color` only.
- **Inputs**: focus ring `box-shadow: 0 0 0 3px rgba(201,150,47,0.18)` + `border-color: #C9962F`.

### ⚠️ Known prototype gotchas (already fixed in the reference, avoid re-introducing)
1. Do not gate content visibility behind a CSS entrance animation with `fill-mode: both` — it can latch at `opacity:0`.
2. Do not put a CSS `transition` on the nav buttons' background/color — it latched the active highlight. Switch active state instantly or animate a separate indicator.

## State Management
- `screen`/route: which view is active.
- `jobs`, `clients`, `invoices`: collections (currently local-first / offline; preserve that).
- New Estimate working state: `{ client, jobTitle, trade, room: { name, length, width, height, walls, ceiling, trim, doors, windows, coats, prep } }`.
- Settings: `{ businessName, phone, email, logo, hourlyRate, coverage, paintPerGal, primerPerGal, sundriesPct }` — these feed the estimate math.

## Assets
- `assets/pk-logo.png` — PK Paints & Renovations logo (gold monogram + wordmark, transparent PNG, 1102×567). Used on the Settings company card and as the basis for the sidebar "PK" mark. Provided by the client.
- All icons are simple inline stroke SVGs — substitute your icon library (Lucide, Heroicons, etc.).
- Font: Hanken Grotesk via Google Fonts.

## Files
- `Estimator.dc.html` — the complete design reference (all six screens + live shell). Open in a browser; use the sidebar to navigate.
- `assets/pk-logo.png` — logo asset.
