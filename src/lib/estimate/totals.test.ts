import { describe, expect, it } from 'vitest';
import { computeTotals } from './totals';
import { makeDefaultRates } from './defaults';

/**
 * LOCKED v2 §4.2 acceptance test — the real "Bozena ceiling" job.
 *
 *   Materials  $534.60
 *   Labor    $1,078.00
 *   Subtotal $1,612.60
 *   Markup   $322.52   (20% of subtotal)
 *   Tax       $42.77   (8% of materials only, pre-markup)
 *   Total  $1,977.89
 *
 * This is the contract for the whole money path. It MUST stay green through
 * every milestone — if a refactor moves it, the refactor is wrong, not the test.
 */
describe('totals engine — v2 §4.2 locked Bozena example', () => {
  const rates = makeDefaultRates(); // markupPct 0.20, taxPct 0.08, taxAppliesTo 'materials'

  it('computes the Bozena job to exactly $1,977.89', () => {
    const t = computeTotals(
      { materials: 53460, labor: 107800, laborHours: 21.6 },
      rates,
    );
    expect(t.materials).toBe(53460); // $534.60
    expect(t.labor).toBe(107800); // $1,078.00
    expect(t.subtotal).toBe(161260); // $1,612.60
    expect(t.markup).toBe(32252); // 20% of subtotal = $322.52
    expect(t.discounts).toBe(0); // no credits on this job
    expect(t.tax).toBe(4277); // 8% of materials only = $42.77
    expect(t.total).toBe(197789); // $1,977.89
  });

  it('subtracts reason-tagged credits from the total (v2 §4.2 discounts term)', () => {
    const t = computeTotals(
      { materials: 53460, labor: 107800, laborHours: 21.6, discounts: -10000 },
      rates,
    );
    // Credits never change markup or tax (those are computed pre-discount),
    // only the final total drops by the credited amount.
    expect(t.markup).toBe(32252);
    expect(t.tax).toBe(4277);
    expect(t.discounts).toBe(-10000); // $100 given away
    expect(t.total).toBe(187789); // $1,977.89 − $100.00 = $1,877.89
  });
});
