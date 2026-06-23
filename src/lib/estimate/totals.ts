import type { PricingMode, Rates, Totals } from '../types';
import { roundCents } from '../money';

export interface TotalsInput {
  materials: number; // cents
  labor: number; // cents
  laborHours: number;
  /** Σ credit line items, as a non-positive cents value (v2 §4.2). Default 0. */
  discounts?: number;
}

/**
 * Shared totals pipeline for BOTH the painting and general modules (spec §7).
 * Rounding strategy: hours stay at full float precision; money is rounded to
 * whole cents once per money step (markup, tax, low, high). `materials` and
 * `labor` arrive already rounded from their module.
 */
export function computeTotals(
  input: TotalsInput,
  rates: Rates,
  pricingMode: PricingMode = 'full',
): Totals {
  const { labor, laborHours } = input;
  const materials = pricingMode === 'labor_only' ? 0 : input.materials;

  const subtotal = materials + labor;
  const markup = pricingMode === 'labor_only' ? 0 : roundCents(subtotal * rates.markupPct);

  const taxableBase =
    pricingMode === 'labor_only'
      ? 0
      : rates.taxAppliesTo === 'materials'
        ? materials
        : rates.taxAppliesTo === 'all'
          ? subtotal
          : 0;
  const tax = roundCents(taxableBase * rates.taxPct);

  // Credits/discounts are applied in every mode (v2 §4.2). They arrive as a
  // non-positive value; each credit line item must carry a reason tag (§5.4).
  const discounts = input.discounts ?? 0;
  const total = subtotal + markup + tax + discounts;
  const low = roundCents(total * (1 - rates.confidenceBandPct));
  const high = roundCents(total * (1 + rates.confidenceBandPct));

  return { materials, laborHours, labor, subtotal, markup, discounts, tax, total, low, high };
}
