import type { RateEntry } from '../types';

/**
 * DEFAULT Rate Book (v2 §3). Like defaults.ts, this is a SEED for the editable
 * store — the only sanctioned home for these numbers. Every value is a DEFAULT
 * the user tunes in-app (v2 §14 Decision #3). Money is in CENTS.
 *
 * Wall/ceiling per-sqft painting rates are reasonable defaults (the detailed
 * v1 room engine remains the precise path); windows/fixtures/general values
 * come straight from the §3 tables. IDs are stable slugs so re-seeding never
 * duplicates and never clobbers user edits.
 */
export const DEFAULT_RATE_BOOK: RateEntry[] = [
  // --- 3.1 Painting -------------------------------------------------------
  {
    id: 'rb-paint-labor-std',
    category: 'painting',
    label: 'Labor — standard',
    calcMode: 'per_hour',
    defaultRate: 7000,
    unit: 'hr',
    floor: 6500,
    tier: 'standard',
    notes: 'Below $65/hr fires the hard-floor guardrail.',
    sortOrder: 10,
  },
  {
    id: 'rb-paint-labor-tough',
    category: 'painting',
    label: 'Labor — tough / detail',
    calcMode: 'per_hour',
    defaultRate: 8500,
    unit: 'hr',
    floor: null,
    tier: 'tough',
    notes: 'High ceilings, heavy prep, fussy detail. Range $80–95.',
    sortOrder: 20,
  },
  {
    id: 'rb-paint-wall-sqft',
    category: 'painting',
    label: 'Wall labor (per sqft)',
    calcMode: 'per_sqft',
    defaultRate: 175,
    unit: 'sqft',
    floor: null,
    notes: 'Quick-add. The room calculator is the precise path.',
    sortOrder: 30,
  },
  {
    id: 'rb-paint-ceiling-sqft',
    category: 'painting',
    label: 'Ceiling labor (per sqft)',
    calcMode: 'per_sqft',
    defaultRate: 150,
    unit: 'sqft',
    floor: 100,
    notes: 'Below $1.00/sqft fires the giveaway guardrail.',
    sortOrder: 40,
  },
  {
    id: 'rb-paint-material',
    category: 'painting',
    label: 'Paint (per gallon)',
    calcMode: 'material',
    defaultRate: 4500,
    unit: 'ea',
    floor: null,
    notes: 'Coverage ~325–350 sqft/gal/coat (configurable in Settings).',
    sortOrder: 50,
  },

  // --- 3.2 Windows --------------------------------------------------------
  {
    id: 'rb-win-ground-out',
    category: 'windows',
    label: 'Ground — outside only',
    calcMode: 'per_unit',
    defaultRate: 1300,
    unit: 'ea',
    floor: null,
    notes: 'Range $12–15/window.',
    sortOrder: 10,
  },
  {
    id: 'rb-win-ground-both',
    category: 'windows',
    label: 'Ground — inside + outside',
    calcMode: 'per_unit',
    defaultRate: 1700,
    unit: 'ea',
    floor: null,
    notes: 'Range $16–18/window.',
    sortOrder: 20,
  },
  {
    id: 'rb-win-second-out',
    category: 'windows',
    label: 'Second story — outside only',
    calcMode: 'per_unit',
    defaultRate: 1500,
    unit: 'ea',
    floor: null,
    notes: 'Ladder premium baked in.',
    sortOrder: 30,
  },
  {
    id: 'rb-win-second-both',
    category: 'windows',
    label: 'Second story — inside + outside',
    calcMode: 'per_unit',
    defaultRate: 2100,
    unit: 'ea',
    floor: null,
    notes: 'Range $20–22/window.',
    sortOrder: 40,
  },

  // --- 3.3 Fixtures & Lighting (non-licensed handyman scope) --------------
  {
    id: 'rb-fix-swap',
    category: 'fixtures',
    label: 'Fixture swap (existing box)',
    calcMode: 'per_unit',
    defaultRate: 11500,
    unit: 'ea',
    floor: null,
    notes: 'Like-for-like replacement, easy access.',
    sortOrder: 10,
  },
  {
    id: 'rb-fix-recessed',
    category: 'fixtures',
    label: 'Recessed / can — new install',
    calcMode: 'per_unit',
    defaultRate: 20000,
    unit: 'ea',
    floor: null,
    notes: 'Cutouts + box + wiring. New circuits/permits = licensed electrician.',
    sortOrder: 20,
  },
  {
    id: 'rb-fix-high-access',
    category: 'fixtures',
    label: 'High-access / ladder premium',
    calcMode: 'per_unit',
    defaultRate: 4000,
    unit: 'ea',
    floor: null,
    notes: 'Per fixture, or bump the job to the $80–95 tier.',
    sortOrder: 30,
  },
  {
    id: 'rb-fix-removal',
    category: 'fixtures',
    label: 'Removal + disposal',
    calcMode: 'per_unit',
    defaultRate: 2500,
    unit: 'ea',
    floor: null,
    notes: 'Hauling old fixtures.',
    sortOrder: 40,
  },

  // --- 3.4 General handyman / catch-all -----------------------------------
  {
    id: 'rb-gen-labor-std',
    category: 'general',
    label: 'Labor — standard',
    calcMode: 'per_hour',
    defaultRate: 7000,
    unit: 'hr',
    floor: 6500,
    tier: 'standard',
    notes: 'Floor $65/hr.',
    sortOrder: 10,
  },
  {
    id: 'rb-gen-labor-tough',
    category: 'general',
    label: 'Labor — tough / detail',
    calcMode: 'per_hour',
    defaultRate: 8500,
    unit: 'hr',
    floor: null,
    tier: 'tough',
    notes: '$80–95 band.',
    sortOrder: 20,
  },
  {
    id: 'rb-gen-custom',
    category: 'general',
    label: 'Custom line',
    calcMode: 'flat',
    defaultRate: 0,
    unit: 'lump',
    floor: null,
    notes: 'Anything not covered — free-text + amount.',
    sortOrder: 30,
  },
  {
    id: 'rb-gen-minimum',
    category: 'general',
    label: 'Trip / job minimum',
    calcMode: 'flat',
    defaultRate: 0,
    unit: 'lump',
    floor: null,
    notes: 'Warn if the job total falls below this.',
    sortOrder: 40,
  },
];

/** Deep clone of the default Rate Book — safe to seed / mutate. */
export function makeDefaultRateBook(): RateEntry[] {
  return structuredClone(DEFAULT_RATE_BOOK);
}
