import type { LineItem, Rates, Totals } from '../types';
import { roundCents } from '../money';
import { computeTotals } from './totals';

// PURE general (line-item) estimation engine (spec §8). Each line is a cost
// line; the same markup/tax/range pipeline as painting (§7) is applied.

export function lineTotal(item: LineItem): number {
  return roundCents(item.qty * item.unitCost);
}

export interface GeneralComputation {
  lineItems: LineItem[];
  linesSubtotal: number; // cents
  laborHours: number;
}

export interface GeneralEstimate {
  computation: GeneralComputation;
  totals: Totals;
}

export function computeGeneral(lineItems: LineItem[]): GeneralComputation {
  const linesSubtotal = lineItems.reduce((sum, item) => sum + lineTotal(item), 0);
  const laborHours = lineItems.reduce((sum, item) => sum + (item.laborHours ?? 0), 0);
  return { lineItems, linesSubtotal, laborHours };
}

export function computeGeneralEstimate(lineItems: LineItem[], rates: Rates): GeneralEstimate {
  const computation = computeGeneral(lineItems);
  // Lines are the cost base; labor is already baked into the line costs.
  const totals = computeTotals(
    { materials: computation.linesSubtotal, labor: 0, laborHours: computation.laborHours },
    rates,
  );
  return { computation, totals };
}
