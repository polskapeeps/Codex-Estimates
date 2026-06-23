import type { CalcMode, LineItem, Rates, Totals } from '../types';
import { roundCents } from '../money';
import { computeTotals } from './totals';

/**
 * PURE Rate-Book line-item engine (v2 §4.1). Each line's signed cents amount is
 * derived from its `calcMode`; lines bucket into labor / materials / credit and
 * feed the SAME locked totals stack as painting (v2 §4.2 — see totals.ts and the
 * locked Bozena test). No UI, no I/O, no magic numbers — every rate comes off
 * the line (which was seeded from the editable Rate Book).
 *
 * Reconciliation note: v2 §4.1 describes `material` as `qty × unitCost × (1 +
 * markupRate)`, but §4.2 applies markup ONCE to the labor+material subtotal and
 * the locked Bozena example carries materials at RAW cost ($534.60). §4.2 wins,
 * so material lines are raw cost here; markup is applied once downstream.
 */

export type LineBucket = 'labor' | 'materials' | 'credit';

export function bucketOf(calcMode: CalcMode | undefined): LineBucket {
  if (calcMode === 'material') return 'materials';
  if (calcMode === 'credit') return 'credit';
  // per_hour / per_sqft / per_unit / flat — and legacy lines with no calcMode —
  // are the operator's service revenue (labor bucket, untaxed by default).
  return calcMode ? 'labor' : 'materials';
}

/**
 * Signed cents for a single line. Credits are returned negative; everything
 * else non-negative. `accessPremiumCents` is a per-unit bump for per_unit lines.
 */
export function lineItemAmount(item: LineItem): number {
  const qty = item.qty || 0;
  switch (item.calcMode) {
    case 'per_unit': {
      const per = item.unitCost + (item.accessPremiumCents ?? 0);
      return roundCents(qty * per);
    }
    case 'credit':
      // Stored as a positive magnitude; applied as a negative discount.
      return -Math.abs(roundCents(qty * item.unitCost));
    case 'flat':
      // A single typed amount (qty defaults to 1 in the builder).
      return roundCents(qty * item.unitCost);
    case 'per_sqft':
    case 'per_hour':
    case 'material':
    default:
      return roundCents(qty * item.unitCost);
  }
}

export interface LineComputation {
  item: LineItem;
  amount: number; // signed cents
  bucket: LineBucket;
}

export interface DocumentComputation {
  lines: LineComputation[];
  laborSubtotal: number; // cents
  materialsSubtotal: number; // cents
  discounts: number; // cents, ≤ 0
  /** Estimated labor hours (per_hour qty + any explicit laborHours), for §5.1. */
  laborHours: number;
}

export interface DocumentEstimateOptions {
  /** v2 §8: 'separate' excludes materials from the totals. */
  materialsMode?: 'in_estimate' | 'separate';
}

export function computeDocument(lineItems: LineItem[]): DocumentComputation {
  const lines: LineComputation[] = lineItems.map((item) => ({
    item,
    amount: lineItemAmount(item),
    bucket: bucketOf(item.calcMode),
  }));

  let laborSubtotal = 0;
  let materialsSubtotal = 0;
  let discounts = 0;
  for (const { amount, bucket } of lines) {
    if (bucket === 'labor') laborSubtotal += amount;
    else if (bucket === 'materials') materialsSubtotal += amount;
    else discounts += amount; // already negative
  }

  const laborHours = lineItems.reduce(
    (sum, item) =>
      sum + (item.calcMode === 'per_hour' ? item.qty || 0 : item.laborHours ?? 0),
    0,
  );

  return { lines, laborSubtotal, materialsSubtotal, discounts, laborHours };
}

export interface DocumentEstimate {
  computation: DocumentComputation;
  totals: Totals;
}

/**
 * Run line items through the locked v2 §4.2 totals stack. When `materialsMode`
 * is 'separate', materials are excluded from the totals (billed at cost, §8) but
 * still tracked on the computation for the printed "materials separate" note.
 */
export function computeDocumentEstimate(
  lineItems: LineItem[],
  rates: Rates,
  opts: DocumentEstimateOptions = {},
): DocumentEstimate {
  const computation = computeDocument(lineItems);
  const materials =
    opts.materialsMode === 'separate' ? 0 : computation.materialsSubtotal;
  const totals = computeTotals(
    {
      materials,
      labor: computation.laborSubtotal,
      laborHours: computation.laborHours,
      discounts: computation.discounts,
    },
    rates,
  );
  return { computation, totals };
}
