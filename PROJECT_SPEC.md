# Contractor Estimate Organizer - Project Spec

## 1. Product Summary

Build a mobile-first estimating and lead organization app for contractors, starting with painting estimates but designed to support handyman, construction, and general job-site estimating later.

The app should replace scattered notes and later manual math. A user should be able to stand at a job site, capture rough notes, dimensions, client details, photos, and job context, then generate a rough estimate with transparent assumptions. Each lead or project should behave like an electronic file folder that can be searched, sorted, filtered, updated, archived, printed, and synced between phone and desktop.

Target first usable mobile release: Sunday, June 7, 2026.

## 2. Product Principles

- Field-first: fast on a phone, minimal typing, usable while walking a job.
- Rough but explainable: estimates can be approximate, but the app must show how the number was created.
- Every estimate is a file: client, notes, photos, estimate versions, status, and history stay together.
- Painting first, trade-agnostic foundation: painting estimation is the first template, not the whole product.
- Sync before polish: mobile and desktop must see the same project data as early as possible.
- No black-box pricing: AI can help parse notes, but formulas, rates, markups, and assumptions remain editable.

## 2.1 Owner Decisions For First Build

Use these decisions unless the owner changes them later in Settings:

- Default labor rate: `$30/hr`.
- Default markup: `25%` applied to direct labor, materials, fixed costs, and subcontractor costs.
- Estimate display: show low/high range plus a recommended midpoint.
- Client print view: show scope, grouped line items, assumptions, exclusions, and total/range. Keep raw calculator math internal by default.
- Sales tax: configurable, but off/excluded by default with a clear "tax not included unless configured" note.
- Photos: not required for the June 7 MVP.
- Users: single-owner account first.
- Status workflow: keep New, Estimating, Sent, Won, Active, Lost, Limbo, Archived.
- Desktop app: use desktop browser/PWA first; native Windows wrapper later.

## 3. Primary Users

### Owner / Estimator
The main user who visits job sites, captures leads, produces rough estimates, prints or sends proposals, and tracks whether bids are won, lost, active, or undecided.

### Desktop Admin Mode
Same person at a computer, reviewing estimates, cleaning up notes, printing, exporting, or preparing a final version for the client.

Future users may include crew members, salespeople, or office admins, but V1 can assume one owner account.

## 4. MVP Scope For June 7, 2026

The MVP should be a hosted PWA that works on mobile browsers and can be installed to the phone home screen. On desktop, it should run in the browser and be installable as a desktop PWA where supported. A native packaged desktop app can be a later wrapper around the same web app.

### MVP Must Have

- Account login for one owner user.
- Mobile-first project list.
- Add/edit client details.
- Add/edit project or lead details.
- Status pipeline: New, Estimating, Sent, Won, Active, Lost, Limbo, Archived.
- Search and sorting by date, client, job title, job category, status, estimate total, and last updated.
- Freeform job notes.
- Structured painting estimate builder.
- Rough estimate range output with line-item breakdown.
- Editable business defaults for labor rate, markup, paint cost, coverage, and common production rates.
- Project detail page that behaves like a file folder.
- Browser print layout for estimate summaries.
- Cloud persistence so phone and desktop see the same data.
- Responsive layout tested on phone and desktop widths.

### MVP Should Have If Time Allows

- Photo attachments for project files.
- Duplicate estimate/project.
- Export estimate as PDF using browser print.
- Basic offline draft cache for notes created with weak signal.
- Quick tags such as Interior, Exterior, Painting, Repair, Follow Up, Urgent.

### MVP Should Not Try To Solve Yet

- Full invoice system.
- Payment processing.
- Crew scheduling.
- Complex multi-user permissions.
- Native App Store or Play Store release.
- Perfect AI parsing.
- Automated emails or SMS.
- Full accounting integration.

### June 7 Release Cut

If time gets tight, the June 7 release should keep only:

- Login.
- Projects list.
- New/edit project.
- New/edit client.
- Notes.
- Status changes.
- Painting estimate calculator.
- Settings for labor rate, markup, paint coverage, and paint cost.
- Print view.
- Cloud save/sync.

Cut these first if needed:

- Photos.
- Dashboard charts.
- Offline draft mode.
- AI parsing.
- Native desktop packaging.
- Custom PDF generation.

## 5. Full V1 Scope

The full app should include the MVP plus:

- Trade template system beyond painting.
- Estimate version history.
- AI note parser that turns rough notes into proposed structured fields.
- Attachment gallery for photos, documents, measurements, sketches, and signed files.
- Better offline-first sync.
- Client-facing proposal PDF.
- Follow-up reminders.
- Dashboard for bid pipeline value.
- Import/export backup.
- Native desktop wrapper if a true standalone `.exe` is required.

## 6. Core Workflows

### Workflow A: Add Lead At Job Site

1. User opens app on phone.
2. User taps New Project.
3. User enters client name, phone/email, address, and short job title.
4. User chooses job category, defaulting to Painting for the first release.
5. User adds quick notes, measurements, rooms, surfaces, or photos.
6. User saves project.
7. Project appears in project list with status New or Estimating.

### Workflow B: Generate Rough Painting Estimate

1. User opens a project.
2. User opens Estimate tab.
3. User selects Painting template.
4. User adds one or more estimate areas, such as Living Room, Bedroom 1, Exterior Front, Trim, Doors.
5. User enters dimensions or quantities.
6. App calculates material, labor, markup, and recommended bid range.
7. App displays estimate confidence and missing info warnings.
8. User edits assumptions or line items.
9. User saves estimate version.

### Workflow C: Review On Desktop And Print

1. User opens the same account on desktop.
2. User finds project by client, date, status, or search.
3. User reviews notes and estimate.
4. User edits summary wording or assumptions.
5. User clicks Print / Save PDF.
6. App renders a clean estimate summary suitable for client review.

### Workflow D: Manage Bid Status

1. User opens project.
2. User changes status to Sent, Won, Active, Lost, Limbo, or Archived.
3. App records status change in project history.
4. Dashboard and filters update immediately.

## 7. Information Architecture

### Main Navigation

- Projects: all leads and jobs.
- New: quick project capture.
- Templates: estimate templates and rate settings.
- Dashboard: pipeline summary.
- Settings: business info, rates, data/export settings.

For MVP, navigation can be bottom tabs on mobile and left sidebar on desktop.

### Project Detail Tabs

- Overview: client, address, status, total, key dates.
- Notes: freeform notes and structured job observations.
- Estimate: current estimate builder and saved versions.
- Photos: project images and attachments.
- Activity: status changes and important edits.

Photos and Activity can be deferred if needed for the first mobile release.

## 8. Screens

### 8.1 Projects List

Purpose: browse and organize all project files.

Required controls:

- Search box.
- Status filter.
- Job category filter.
- Sort menu.
- New Project button.
- Archive toggle or filter.

Each project row/card should show:

- Client name.
- Project title or job description.
- Status.
- Address or city.
- Last updated date.
- Rough estimate total or range.
- Tags.

Mobile layout should use compact stacked list rows. Desktop can use a denser table/list hybrid.

### 8.2 New Project

Required fields:

- Client name.
- Phone.
- Email.
- Job title.
- Job category.
- Site address.
- Initial notes.
- Desired start date.
- Estimate due date.

Only client name and job title should be required. Everything else can be filled later.

### 8.3 Project Overview

Show:

- Current status.
- Client contact buttons: call, text, email.
- Address with map link.
- Current rough total.
- Next follow-up date.
- Latest notes preview.
- Estimate warnings.

Actions:

- Edit project.
- Change status.
- Add note.
- Build estimate.
- Print estimate.
- Archive.

### 8.4 Notes

Notes should support:

- Timestamped freeform entries.
- Optional note type: Site Visit, Client Request, Measurement, Internal, Follow Up.
- Pin important note.
- Convert note to estimate input later.

MVP can use plain text. Rich text is not required.

### 8.5 Estimate Builder

The estimate builder should support:

- Template selection.
- Line items.
- Areas or rooms.
- Quantity fields.
- Unit type.
- Labor calculation.
- Material calculation.
- Markup.
- Tax toggle if needed.
- Estimate range.
- Confidence level.
- Missing info warnings.

User must be able to override any generated line item.

### 8.6 Print / Proposal View

Printable estimate should include:

- Business name and contact info.
- Client name and address.
- Project title.
- Estimate date.
- Scope summary.
- Line item summary.
- Estimated total or range.
- Assumptions.
- Exclusions.
- Optional notes.

MVP print can use browser print CSS. PDF generation can be added later.

## 9. Project Status System

Use these statuses:

- New: lead created, not estimated yet.
- Estimating: site info is being gathered or estimate is being built.
- Sent: estimate has been presented to client.
- Won: bid accepted, but work has not started.
- Active: job is currently in progress.
- Lost: client declined, chose someone else, or no longer proceeding.
- Limbo: waiting on client, unclear timing, or unresolved.
- Archived: not active in normal views.

Each status change should create an activity event:

- project_id
- old_status
- new_status
- changed_at
- optional note

## 10. Sorting, Search, And Filters

### Search Fields

- Client name.
- Project title.
- Job description.
- Address.
- Notes.
- Tags.

### Sort Options

- Newest created.
- Oldest created.
- Recently updated.
- Client A-Z.
- Estimate high to low.
- Estimate low to high.
- Due date.
- Status.
- Job category.

### Filters

- Status.
- Job category.
- Date range.
- Has estimate.
- Has missing info.
- Archived / not archived.
- Tags.

## 11. Estimation System

### 11.1 Estimation Philosophy

The app should generate rough estimates, not legally binding quotes by default. Every estimate must expose:

- Inputs used.
- Assumptions made.
- Production rates used.
- Material pricing used.
- Markup used.
- Confidence level.
- Missing information.

Default pricing should treat `markup_percent` as markup on cost, not profit margin. A 25% markup on $100 of direct cost produces a $125 price and a 20% gross margin before other business costs. The UI should label this clearly as markup.

### 11.2 Estimate Output Shape

Every estimate calculation should return:

```ts
type EstimateResult = {
  estimateId: string;
  projectId: string;
  templateKey: string;
  subtotalMin: number;
  subtotalMax: number;
  materialsMin: number;
  materialsMax: number;
  laborHoursMin: number;
  laborHoursMax: number;
  laborCostMin: number;
  laborCostMax: number;
  markupAmountMin: number;
  markupAmountMax: number;
  totalMin: number;
  totalMax: number;
  confidence: "low" | "medium" | "high";
  warnings: string[];
  assumptions: string[];
  lineItems: EstimateLineItem[];
};
```

### 11.3 Formula Pattern

Each line item should calculate:

```text
labor_cost = labor_hours * hourly_labor_rate
material_cost = material_quantity * material_unit_cost
line_subtotal = labor_cost + material_cost + fixed_cost + subcontractor_cost
line_total = line_subtotal * (1 + markup_percent)
```

For ranges, calculate conservative low and high values:

```text
low_total = low_labor + low_materials + fixed_cost
high_total = high_labor + high_materials + fixed_cost
recommended_range = apply_markup(low_total, high_total)
```

### 11.4 User Overrides

Users must be able to override:

- Quantity.
- Unit cost.
- Labor hours.
- Labor rate.
- Markup.
- Final line item price.
- Final estimate total.

When a value is overridden, store both calculated value and override value.

## 12. Painting Estimate Template

Painting is the first production-ready template.

### 12.1 Supported Painting Job Types

- Interior walls.
- Interior ceilings.
- Trim and baseboards.
- Doors.
- Cabinets, optional later.
- Exterior siding.
- Exterior trim.
- Deck or fence staining, optional later.

MVP should prioritize interior walls, ceilings, trim, and doors.

### 12.2 Painting Inputs

Project-level inputs:

- Interior or exterior.
- Occupied or empty.
- Paint supplied by contractor or client.
- Number of coats.
- Paint quality tier.
- Wall height.
- General condition: good, fair, poor.
- Prep level: light, normal, heavy.
- Color change: none, similar, major.
- Access difficulty: normal, ladder, high ceiling, tight access.

Area-level inputs:

- Area name.
- Length.
- Width.
- Height.
- Wall square footage, if measured directly.
- Ceiling square footage.
- Number of doors.
- Number of windows.
- Trim linear feet.
- Excluded opening square footage.
- Notes.

### 12.3 Area Calculations

If room dimensions are known:

```text
wall_area = ((length + width) * 2 * height) - openings_sqft
ceiling_area = length * width
```

If direct square footage is entered, use direct square footage instead of deriving it.

Paint gallons:

```text
gallons = (paintable_sqft * coats / coverage_sqft_per_gallon) * waste_factor
```

Default editable assumptions:

- Paint coverage: 350 sq ft per gallon.
- Waste factor: 1.10.
- Default coats: 2.
- Default paint cost: $45 per gallon for mid-grade paint.
- Default sundries/supplies: 8% of paint cost, with a $25 minimum.
- Openings deduction per standard window: editable.
- Openings deduction per standard door: editable.

### 12.4 Painting Labor Multipliers

Labor should start with a production rate, then adjust using multipliers.

Default editable production rates:

- Walls: 150-225 sq ft per hour per coat.
- Ceilings: 100-175 sq ft per hour per coat.
- Trim/baseboard: 30-50 linear ft per hour per coat.
- Doors: 0.50-0.90 hours per door per coat.
- Prep/patching: manual hours, default 0 until entered.

Suggested editable multipliers:

- Good condition: 1.00.
- Fair condition: 1.15.
- Poor condition: 1.35.
- Light prep: 1.00.
- Normal prep: 1.15.
- Heavy prep: 1.50.
- Similar color: 1.00.
- Major color change: 1.20.
- Empty space: 1.00.
- Occupied space: 1.15.
- High ceiling: 1.25.
- Tight access: 1.20.

These defaults are placeholders and must be editable in Settings.

### 12.5 Painting Line Items

MVP line item types:

- Walls: square feet.
- Ceilings: square feet.
- Trim/baseboard: linear feet.
- Doors: each.
- Prep/patching: hours or fixed price.
- Materials/supplies: calculated or manual.

Each line item should show:

- Description.
- Quantity.
- Unit.
- Labor hours.
- Material cost.
- Markup.
- Total.

### 12.6 Painting Estimate Confidence

High confidence:

- Dimensions entered.
- Coats known.
- Prep level known.
- Labor rate and material settings configured.

Medium confidence:

- Some dimensions entered.
- Some assumptions used.
- Prep level estimated.

Low confidence:

- Freeform notes only.
- Missing dimensions.
- Unknown prep level.
- Unknown material responsibility.

## 13. Generic Trade Template Foundation

The app should not hard-code painting in a way that blocks other trades. Build a generic estimate template system.

### Generic Unit Types

- each
- hour
- day
- square foot
- linear foot
- cubic yard
- lump sum
- allowance

### Generic Line Item Fields

- name
- description
- category
- unit
- quantity
- labor_hours_per_unit
- material_cost_per_unit
- fixed_cost
- markup_percent
- taxable
- notes

### Future Trade Templates

- Drywall repair.
- Flooring.
- Trim carpentry.
- Door installation.
- Fixture replacement.
- Light demolition.
- Deck repair.
- Fence repair.
- General handyman punch list.

Each future template should define default line items and calculators, but all can use the same estimate result model.

## 14. AI / Built-In Brains

### MVP Brain

The MVP brain can be deterministic:

- Structured inputs.
- Editable rate defaults.
- Formula-based estimate ranges.
- Missing info warnings.
- Assumption summaries.

This is enough for a useful first release.

### Future AI Parser

AI should help translate messy notes into proposed project fields and line items.

Example input:

```text
Mrs Smith, 3 bedrooms and hallway, walls only, 8 ft ceilings, some patching, wants mid grade paint, occupied home, wants it done next week.
```

AI proposed output:

- Client: Mrs Smith.
- Job category: Painting.
- Areas: 3 bedrooms, hallway.
- Scope: walls only.
- Height: 8 ft.
- Prep: normal/heavy patching.
- Occupied: yes.
- Timing: next week.
- Missing info: exact room sizes, trim, ceilings, paint supplied by who.

Rules:

- AI must never silently overwrite saved project fields.
- AI suggestions must go through a review screen.
- AI must mark uncertain values.
- The deterministic calculator remains the source of final math.

## 15. Data Model

Use UUID primary keys. Include `created_at`, `updated_at`, and optional `deleted_at` for sync-friendly soft deletes.

### users

- id
- email
- display_name
- created_at

### business_settings

- id
- user_id
- business_name
- owner_name
- phone
- email
- address
- default_hourly_rate
- default_markup_percent
- default_tax_percent
- print_footer
- created_at
- updated_at

### clients

- id
- user_id
- name
- phone
- email
- company
- billing_address
- notes
- created_at
- updated_at
- deleted_at

### projects

- id
- user_id
- client_id
- title
- job_category
- status
- site_address
- description
- desired_start_date
- estimate_due_date
- bid_sent_at
- won_at
- lost_at
- archived_at
- rough_total_min
- rough_total_max
- confidence
- tags
- created_at
- updated_at
- deleted_at

### project_notes

- id
- user_id
- project_id
- note_type
- body
- pinned
- created_at
- updated_at
- deleted_at

### estimates

- id
- user_id
- project_id
- template_key
- version_number
- status
- subtotal_min
- subtotal_max
- total_min
- total_max
- confidence
- assumptions
- warnings
- created_at
- updated_at
- deleted_at

### estimate_line_items

- id
- user_id
- estimate_id
- sort_order
- category
- description
- quantity
- unit
- labor_hours_min
- labor_hours_max
- labor_rate
- material_cost_min
- material_cost_max
- fixed_cost
- markup_percent
- calculated_total_min
- calculated_total_max
- override_total
- notes
- created_at
- updated_at
- deleted_at

### estimate_templates

- id
- user_id
- key
- name
- trade_category
- settings_json
- active
- created_at
- updated_at

### attachments

- id
- user_id
- project_id
- estimate_id
- file_name
- file_type
- storage_path
- caption
- created_at
- deleted_at

### activity_events

- id
- user_id
- project_id
- event_type
- event_json
- created_at

### 15.1 Supabase Rules

If Supabase is used, every user-owned table must have row-level security enabled.

Policy pattern:

- Select: authenticated user can read rows where `user_id = auth.uid()`.
- Insert: authenticated user can insert rows where `user_id = auth.uid()`.
- Update: authenticated user can update rows where `user_id = auth.uid()`.
- Delete: prefer soft delete; if hard delete exists, only allow where `user_id = auth.uid()`.

Storage:

- Create a private `project-attachments` bucket.
- Store files under `{user_id}/{project_id}/{file_id}-{filename}`.
- Only allow authenticated users to read/write files under their own `user_id` prefix.

## 16. Sync And Offline Behavior

### MVP Sync

- Cloud database is the source of truth.
- Mobile and desktop use the same authenticated account.
- Save project changes immediately when online.
- Cache the current project list and recently opened project locally.
- If offline, allow note drafts and mark them as unsynced.
- Show a visible sync status: Saved, Saving, Offline Draft, Sync Error.

### Full Offline-First Sync

- Store all records locally in IndexedDB.
- Sync changes to cloud when online.
- Use `updated_at` and soft deletes for conflict handling.
- If both mobile and desktop edit the same field, prefer last write but log conflict in activity.
- Keep attachments upload-queued until online.

## 17. Technical Architecture

Recommended MVP stack:

- Frontend: React + TypeScript.
- Build tool: Vite.
- Routing: React Router.
- PWA: `vite-plugin-pwa`, web app manifest, and service worker.
- Styling: Tailwind CSS.
- Forms/validation: React Hook Form plus Zod.
- Icons: lucide-react.
- Local cache: IndexedDB through Dexie.
- Cloud backend: Supabase Auth, Postgres, and Storage.
- Hosting: Vercel for the MVP unless another host is already configured.
- Print: browser print CSS for MVP.
- Native desktop later: Tauri wrapper around the web frontend if a true standalone Windows app is required.

Reasoning:

- PWA is the fastest path to mobile availability without app store review.
- Supabase gives login, database, storage, and cross-device sync quickly.
- Browser print is enough for first client-facing estimates.
- Tauri can package the same UI later without rebuilding the app from scratch.

### 17.1 Route Map

- `/login`: login screen.
- `/projects`: project list, search, sort, filters.
- `/projects/new`: quick project capture.
- `/projects/:projectId`: project overview.
- `/projects/:projectId/notes`: notes.
- `/projects/:projectId/estimate`: estimate builder.
- `/projects/:projectId/print`: printable estimate view.
- `/dashboard`: pipeline summary.
- `/settings`: business defaults and profile.

### 17.2 Code Organization

Recommended folders:

```text
src/
  app/
    App.tsx
    routes.tsx
  components/
    layout/
    forms/
    estimate/
    projects/
  features/
    auth/
    clients/
    projects/
    estimates/
    settings/
    sync/
  lib/
    supabase.ts
    db.ts
    money.ts
    dates.ts
  calculators/
    estimateTypes.ts
    genericCalculator.ts
    paintingCalculator.ts
    paintingCalculator.test.ts
  styles/
    index.css
    print.css
```

Calculator code should be pure functions with no UI, database, or network calls. UI should call calculators, display the result, then save the result.

## 18. Security And Privacy

- Require login before viewing project data.
- All data belongs to the authenticated user.
- Enforce row-level security if using Supabase.
- Do not expose service keys in frontend code.
- Store client contact information securely.
- Attachments should require authenticated access.
- Provide export/backup before destructive deletes.

## 19. UI And Design Direction

The app should feel like a clean field tool, not a marketing site.

Design qualities:

- Crisp, utilitarian, fast.
- Large tap targets on mobile.
- Dense but readable desktop list views.
- Clear status colors without overwhelming the screen.
- No decorative landing page.
- The first screen after login should be the actual Projects view.
- Estimate totals should be visually prominent.
- Warnings should be clear but not alarming.

Suggested mobile layout:

- Top bar with title/search.
- Project list as compact rows.
- Bottom navigation: Projects, New, Dashboard, Settings.
- Floating or fixed New Project action.

Suggested desktop layout:

- Left sidebar.
- Main table/list.
- Right detail pane or full project detail route.

## 20. Validation Rules

- Client name is required to save a client.
- Project title is required to save a project.
- Status must be one of the allowed statuses.
- Estimate totals cannot be negative.
- Quantity cannot be negative.
- Labor rate cannot be negative.
- Markup cannot be less than -100 percent.
- Warn when estimate has no line items.
- Warn when confidence is low.
- Warn when dimensions are missing for painting estimates.

## 21. Acceptance Criteria

### Mobile Availability

- App is reachable from a secure HTTPS URL.
- App can be added to a mobile home screen as a PWA where browser support allows.
- New project can be created on a phone.
- Estimate can be generated on a phone.
- Data appears on desktop after login.

### Project Organization

- User can create, edit, archive, and search projects.
- User can sort by date, client, status, job category, and estimate total.
- User can filter by bid status.

### Painting Estimate

- User can create an interior painting estimate with room dimensions.
- App calculates wall area, ceiling area, paint quantity, labor hours, materials, markup, and total range.
- User can override line items.
- App shows assumptions and missing information warnings.

### Printing

- Desktop print view includes business info, client info, scope, line items, total, assumptions, and exclusions.
- Print view hides app navigation.

### Sync

- Project created on phone appears on desktop.
- Project edited on desktop appears on phone after refresh or automatic update.
- App clearly shows save/sync errors.

## 22. Testing Checklist

### Functional

- Create project.
- Edit project.
- Delete/archive project.
- Add client.
- Add note.
- Change status.
- Build painting estimate.
- Override estimate total.
- Sort and filter projects.
- Print estimate.

### Calculation

- Wall area calculation.
- Ceiling area calculation.
- Opening deduction.
- Paint gallon calculation.
- Labor multiplier application.
- Markup calculation.
- Low/high range calculation.

### Responsive

- Test at 390 px mobile width.
- Test at 768 px tablet width.
- Test at 1280 px desktop width.
- Confirm text does not overflow buttons/cards.
- Confirm project list remains usable with long client names.

### Sync

- Login on phone and desktop.
- Create project on phone.
- Edit on desktop.
- Refresh phone.
- Test weak/offline connection if offline drafts are implemented.

## 23. Implementation Milestones

### Milestone 1: Skeleton App

- Create React/TypeScript app.
- Add routing.
- Add basic layout.
- Add PWA manifest.
- Add placeholder project list.

### Milestone 2: Data And Auth

- Add Supabase project.
- Create database schema.
- Add login.
- Add row-level security.
- Add project/client CRUD.

### Milestone 3: Project File System

- Build projects list.
- Build project detail page.
- Add statuses.
- Add notes.
- Add search/sort/filter.

### Milestone 4: Painting Estimator

- Add business defaults.
- Add painting template.
- Add line items.
- Add calculations.
- Add assumptions and warnings.
- Save estimate result to project.

### Milestone 5: Print And Mobile QA

- Add printable proposal view.
- Add print CSS.
- Test mobile install behavior.
- Test desktop browser.
- Fix responsive layout.

### Milestone 6: Polish And Backup

- Add data export.
- Add photo attachments if time allows.
- Add dashboard summary.
- Add error states and empty states.

## 24. Agent Build Notes

Implementation agents should prioritize:

1. Ship a usable PWA before adding native wrappers.
2. Use structured calculators before AI parsing.
3. Keep painting template modular so other trades can be added later.
4. Make rate assumptions editable.
5. Keep estimate math pure and unit-testable.
6. Store estimate versions instead of overwriting history.
7. Use print CSS before introducing server-side PDF generation.

Suggested first coding prompt:

```text
Build the MVP for the Contractor Estimate Organizer from PROJECT_SPEC.md.
Start with a React TypeScript PWA backed by Supabase. Implement auth, project/client CRUD, status filters, notes, business settings, a painting estimate calculator, and a printable estimate view. Keep the painting calculator modular so future trade templates can reuse the same estimate result model.
```

## 25. Remaining Owner Inputs

The app can be built without these, but they should be filled before real client printouts:

1. Business name for printed estimates.
2. Business phone and email for printed estimates.
3. Business address or service area wording.
4. Preferred estimate footer/disclaimer.
5. Local sales tax handling, if tax should be shown.

Until these are filled, use placeholders in Settings and keep printed estimates marked as draft/internal.
