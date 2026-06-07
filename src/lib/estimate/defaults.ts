import type { Rates } from '../types';

/**
 * Default rate coefficients (spec §9). These are the ONLY place estimation
 * constants are allowed to live (they seed the Settings/Rates store, which the
 * user edits). No estimation code reads numbers from anywhere else.
 *
 * Money is in CENTS. Percentages are decimals (0.20 = 20%).
 */
export const DEFAULT_RATES: Rates = {
  // labor
  hourlyRate: 5000, // $50/hr
  // materials
  paintCostPerGallon: 4500, // $45
  primerCostPerGallon: 3000, // $30
  coverageSqftPerGallon: 350,
  sundriesPct: 0.08,
  // painting production (sqft|linft per hour, per coat, incl cut-in)
  productionRates: {
    walls: 175,
    ceiling: 200,
    trim: 60,
  },
  prepMultipliers: { light: 1.0, standard: 1.25, heavy: 1.6 },
  doorAreaSqft: 21,
  windowAreaSqft: 15,
  doorLaborHrs: 0.75,
  windowLaborHrs: 0.5,
  primerOnHeavyPrep: true,
  // pricing
  markupPct: 0.2,
  taxPct: 0.08,
  taxAppliesTo: 'materials',
  confidenceBandPct: 0.12,
  // company (for PDF)
  company: {
    name: '',
    phone: '',
    email: '',
    address: '',
    logoDataUrl: '',
  },
};

/** Deep clone of the defaults — safe to mutate / store. */
export function makeDefaultRates(): Rates {
  return structuredClone(DEFAULT_RATES);
}
