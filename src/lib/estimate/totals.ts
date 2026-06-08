import type { PricingMode, Rates, Totals } from '../types';
import { roundCents } from '../money';

export interface TotalsInput {
  materials: number; // cents
  labor: number; // cents
  laborHours: number;
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

  const total = subtotal + markup + tax;
  const low = roundCents(total * (1 - rates.confidenceBandPct));
  const high = roundCents(total * (1 + rates.confidenceBandPct));

  return { materials, laborHours, labor, subtotal, markup, tax, total, low, high };
}
