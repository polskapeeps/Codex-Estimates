// Domain types — mirrors ESTIMATOR_SPEC §9 (Rates) and §14 (data model).
// All money fields are integer CENTS. All timestamps are ISO strings.

export type Trade = 'painting' | 'general';

export type PricingMode = 'full' | 'labor_only';

// --- v2 additions ---------------------------------------------------------

/** Rate Book categories (v2 §3). Each surfaces its own tap-to-add rate chips. */
export type RateCategory = 'painting' | 'windows' | 'fixtures' | 'general';

/** Line-item calculation modes (v2 §4.1). The engine keys off this, not `unit`. */
export type CalcMode = 'per_sqft' | 'per_unit' | 'per_hour' | 'flat' | 'material' | 'credit';

/** Reason tag REQUIRED on every credit line item (v2 §5.4 + §15 barter credit). */
export type ReasonTag =
  | 'repeat_client'
  | 'bundled_addon'
  | 'courtesy_credit'
  | 'referral_goodwill'
  | 'barter_tool_credit'
  | 'other';

/** Whether materials flow into the totals or are billed separately (v2 §8). */
export type MaterialsMode = 'in_estimate' | 'separate';

/** Document lifecycle type (v2 §7). v1 estimates are implicitly 'estimate'. */
export type DocType = 'estimate' | 'quote' | 'invoice';

export type PrepLevel = 'light' | 'standard' | 'heavy';

export type LineUnit = 'ea' | 'sqft' | 'linft' | 'hr' | 'day' | 'lump';

export type ProjectStatus =
  | 'lead'
  | 'estimating'
  | 'bid_sent'
  | 'won'
  | 'lost'
  | 'on_hold'
  | 'archived';

export interface Client {
  id: string;
  name: string;
  company?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  clientId: string;
  title: string; // short job description
  address?: string;
  trade: Trade;
  status: ProjectStatus;
  tags: string[];
  notes: string; // freeform
  createdAt: string;
  updatedAt: string;
  bidSentAt?: string;
  decisionAt?: string;
  photoIds: string[]; // Phase 2 attachments
  estimateIds: string[];
  // --- v2 (§10) ---
  /** Saved property/site this job is at (v2 §15.A). */
  propertyId?: string;
  /** Materials in the totals vs billed separately at cost (v2 §8). Default in_estimate. */
  materialsMode?: MaterialsMode;
  /** Tagged as a bundled add-on — turns off the window-standalone guardrail (§5.3). */
  bundled?: boolean;
}

export interface Room {
  id: string;
  label: string;
  length: number; // ft
  width: number; // ft
  height: number; // ft (ceiling)
  walls: boolean;
  ceiling: boolean;
  trim: boolean;
  doors: number; // count
  windows: number; // count
  coats: number;
  prepLevel: PrepLevel;
  notes?: string;
}

export interface LineItem {
  id: string;
  description: string;
  qty: number;
  unit: LineUnit;
  unitCost: number; // cents
  laborHours?: number;
  fromLibraryId?: string;
  // --- v2 line-item fields (§10). All optional so legacy lines keep working;
  //     a line with no `calcMode` is treated as a legacy material cost line. ---
  /** Rate Book category this line belongs to (v2 §3). */
  category?: RateCategory;
  /** Drives the calc engine (v2 §4.1). Absent ⇒ legacy `qty × unitCost`. */
  calcMode?: CalcMode;
  /** Shorthand / the actual math — internal view only (v2 §6). */
  internalNote?: string;
  /** Scope language — the ONLY description printed on client docs (v2 §6). */
  clientDescription?: string;
  /** Per-unit access/ladder premium for per_unit lines, in cents (v2 §3.3). */
  accessPremiumCents?: number;
  /** REQUIRED when calcMode === 'credit' (v2 §5.4). */
  reasonTag?: ReasonTag;
  /** Override default taxability; defaults by calcMode (materials taxable). */
  taxable?: boolean;
  /** Provenance: the Rate Book entry whose chip created this line. */
  rateEntryId?: string;
  /** Active difficulty-modifier ids (v2 §15.C), for UI state. */
  modifierIds?: string[];
  /** Resolved sum of the active modifiers' percentages (decimal). Drives calc. */
  difficultyPct?: number;
}

/** A generalized difficulty/uplift toggle (v2 §15.C). Pct is a decimal (0.10 = +10%). */
export interface DifficultyModifier {
  id: string;
  label: string;
  pct: number;
}

/** A Rate Book entry — an editable, tappable quick-select rate (v2 §3). */
export interface RateEntry {
  id: string;
  category: RateCategory;
  label: string;
  calcMode: CalcMode;
  defaultRate: number; // cents
  unit: LineUnit;
  /** Hard/soft floor in cents that drives guardrails (v2 §5); null = none. */
  floor: number | null;
  /** Optional tier grouping label (e.g. "standard", "tough"). */
  tier?: string;
  notes?: string;
  /** Order within its category for chip display. */
  sortOrder: number;
}

/** A saved job site / location with reusable measurements + access notes (§15.A). */
export interface Property {
  id: string;
  clientId: string;
  label: string; // e.g. "Main house", "Rental — 2nd floor"
  address?: string;
  /** Saved measurements as freeform notes for now (structured later, §15.A). */
  measurements?: string;
  accessNotes?: string; // parking, gate codes, tight access
  ladderNotes?: string; // ladder/scaffold needs, high windows
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Totals {
  materials: number;
  laborHours: number;
  labor: number;
  subtotal: number;
  markup: number;
  /** Σ credit line items (≤ 0). v2 §4.2; older saved totals omit it (treat as 0). */
  discounts: number;
  tax: number;
  total: number;
  low: number;
  high: number; // all cents (except laborHours)
}

export interface Estimate {
  id: string;
  projectId: string;
  version: number;
  trade: Trade;
  /** Missing on older saved estimates; treat as "full". */
  pricingMode?: PricingMode;
  /** Document lifecycle type (v2 §7). Missing ⇒ 'estimate'. */
  docType?: DocType;
  rooms: Room[]; // painting
  lineItems: LineItem[]; // general / Rate Book lines
  ratesSnapshot: Rates; // freeze rates used at calc time
  totals: Totals;
  scopeNotes?: string; // shown on PDF
  /** Quote expiration date (v2 §7). Required for quotes once lifecycle lands. */
  validUntil?: string;
  /** Invoice due date (v2 §7). Required for invoices once lifecycle lands. */
  dueDate?: string;
  status: 'draft' | 'final';
  createdAt: string;
  updatedAt: string;
}

export interface LibraryItem {
  id: string;
  description: string;
  unit: LineUnit;
  unitCost: number; // cents
  laborHours?: number;
  category?: string;
}

export interface Attachment {
  // Phase 2
  id: string;
  projectId: string;
  blob: Blob;
  caption?: string;
  createdAt: string;
}

export interface CompanyInfo {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  logoDataUrl?: string;
}

// Single source of truth for every coefficient (ESTIMATOR_SPEC §9).
// Money values are CENTS. Percentages are decimals (0.20 = 20%).
export interface Rates {
  // labor
  hourlyRate: number; // cents
  // materials
  paintCostPerGallon: number; // cents
  primerCostPerGallon: number; // cents
  coverageSqftPerGallon: number;
  sundriesPct: number;
  // painting production (sqft|linft per hour, per coat, incl cut-in)
  productionRates: {
    walls: number;
    ceiling: number;
    trim: number;
  };
  prepMultipliers: { light: number; standard: number; heavy: number };
  doorAreaSqft: number;
  windowAreaSqft: number;
  doorLaborHrs: number; // per door, incl coats
  windowLaborHrs: number; // per window, incl coats
  primerOnHeavyPrep: boolean;
  // pricing
  markupPct: number;
  taxPct: number;
  taxAppliesTo: 'materials' | 'all' | 'none';
  confidenceBandPct: number; // +/- band -> low/high
  // v2 §5 pricing guardrails (editable thresholds; 0 disables optional minimums)
  hardFloorHourlyCents: number;
  targetHourlyCents: number;
  ceilingSqftFloorCents: number;
  windowStandaloneMinimumCents: number;
  jobMinimumCents: number;
  // v2 §15.C: editable difficulty/uplift toggles (the only home for these %s)
  difficultyModifiers: DifficultyModifier[];
  // company (for PDF)
  company: CompanyInfo;
}

// Shape of a full data export/import payload (Settings backup).
export interface BackupPayload {
  schemaVersion: number;
  exportedAt: string;
  clients: Client[];
  projects: Project[];
  estimates: Estimate[];
  libraryItems: LibraryItem[];
  rates: Rates;
}
