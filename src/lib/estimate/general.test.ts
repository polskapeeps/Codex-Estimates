import { describe, expect, it } from 'vitest';
import { computeGeneralEstimate, lineTotal } from './general';
import { makeDefaultRates } from './defaults';
import type { LineItem } from '../types';

function item(overrides: Partial<LineItem>): LineItem {
  return { id: 'x', description: '', qty: 1, unit: 'ea', unitCost: 0, ...overrides };
}

describe('general engine', () => {
  it('computes a line total as qty × unitCost (rounded cents)', () => {
    expect(lineTotal(item({ qty: 2, unitCost: 5000 }))).toBe(10000);
    expect(lineTotal(item({ qty: 1.5, unitCost: 3333 }))).toBe(5000); // round(4999.5)
  });

  it('sums lines and applies the shared markup/tax/range', () => {
    const rates = makeDefaultRates(); // markup 20%, tax 8% materials, band 12%
    const { computation, totals } = computeGeneralEstimate(
      [
        item({ qty: 2, unitCost: 5000 }), // 10000
        item({ qty: 1.5, unitCost: 3333 }), // 5000
      ],
      rates,
    );
    expect(computation.linesSubtotal).toBe(15000);
    expect(totals.subtotal).toBe(15000);
    expect(totals.markup).toBe(3000); // 20%
    expect(totals.tax).toBe(1200); // 8% of 15000
    expect(totals.total).toBe(19200);
    expect(totals.low).toBe(16896); // −12%
    expect(totals.high).toBe(21504); // +12%
  });

  it('sums optional labor hours for display', () => {
    const rates = makeDefaultRates();
    const { computation } = computeGeneralEstimate(
      [item({ laborHours: 2 }), item({ laborHours: 1.5 }), item({})],
      rates,
    );
    expect(computation.laborHours).toBe(3.5);
  });

  it('is zero for an empty list', () => {
    const rates = makeDefaultRates();
    const { totals } = computeGeneralEstimate([], rates);
    expect(totals.total).toBe(0);
  });
});
