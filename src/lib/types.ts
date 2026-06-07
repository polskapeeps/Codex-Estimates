// Domain types — mirrors ESTIMATOR_SPEC §9 (Rates) and §14 (data model).
// All money fields are integer CENTS. All timestamps are ISO strings.

export type Trade = 'painting' | 'general';

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
}

export interface Totals {
  materials: number;
  laborHours: number;
  labor: number;
  subtotal: number;
  markup: number;
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
  rooms: Room[]; // painting
  lineItems: LineItem[]; // general
  ratesSnapshot: Rates; // freeze rates used at calc time
  totals: Totals;
  scopeNotes?: string; // shown on PDF
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
