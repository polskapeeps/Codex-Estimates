import { describe, expect, it } from 'vitest';
import {
  computeDocument,
  computeDocumentEstimate,
  difficultyPctFor,
  lineItemAmount,
} from './lineItems';
import { makeDefaultRates } from './defaults';
import type { DifficultyModifier, LineItem } from '../types';

function line(overrides: Partial<LineItem>): LineItem {
  return {
    id: Math.random().toString(36).slice(2),
    description: '',
    qty: 1,
    unit: 'ea',
    unitCost: 0,
    ...overrides,
  };
}

describe('lineItemAmount — the five calc modes (v2 §4.1)', () => {
  it('per_hour: hours × rate', () => {
    expect(lineItemAmount(line({ calcMode: 'per_hour', qty: 8, unitCost: 7000 }))).toBe(56000);
  });

  it('per_unit: count × (rate + access premium)', () => {
    expect(
      lineItemAmount(
        line({ calcMode: 'per_unit', qty: 10, unitCost: 1700, accessPremiumCents: 400 }),
      ),
    ).toBe(21000); // 10 × ($17 + $4)
  });

  it('per_sqft: area × rate', () => {
    expect(lineItemAmount(line({ calcMode: 'per_sqft', qty: 168, unitCost: 100 }))).toBe(16800);
  });

  it('flat: a single typed amount', () => {
    expect(lineItemAmount(line({ calcMode: 'flat', qty: 1, unitCost: 25000 }))).toBe(25000);
  });

  it('material: raw cost (markup applied once downstream, not per line)', () => {
    expect(lineItemAmount(line({ calcMode: 'material', qty: 3, unitCost: 4500 }))).toBe(13500);
  });

  it('credit: always negative regardless of stored sign', () => {
    expect(lineItemAmount(line({ calcMode: 'credit', qty: 1, unitCost: 10000 }))).toBe(-10000);
  });
});

describe('difficulty modifiers (v2 §15.C)', () => {
  const mods: DifficultyModifier[] = [
    { id: 'access_ladder', label: 'Ladder', pct: 0.1 },
    { id: 'heavy_prep', label: 'Heavy prep', pct: 0.15 },
  ];

  it('sums the active modifier percentages', () => {
    expect(difficultyPctFor(['access_ladder', 'heavy_prep'], mods)).toBeCloseTo(0.25, 10);
    expect(difficultyPctFor([], mods)).toBe(0);
    expect(difficultyPctFor(undefined, mods)).toBe(0);
  });

  it('uplifts a labor line by the difficulty percentage', () => {
    // 8h × $70 × 1.10 = $616.00
    expect(
      lineItemAmount(line({ calcMode: 'per_hour', qty: 8, unitCost: 7000, difficultyPct: 0.1 })),
    ).toBe(61600);
  });

  it('never uplifts materials or credits', () => {
    expect(
      lineItemAmount(line({ calcMode: 'material', qty: 1, unitCost: 10000, difficultyPct: 0.5 })),
    ).toBe(10000);
    expect(
      lineItemAmount(line({ calcMode: 'credit', qty: 1, unitCost: 5000, difficultyPct: 0.5 })),
    ).toBe(-5000);
  });
});

describe('computeDocument — bucketing', () => {
  it('splits labor / materials / credit and sums hours', () => {
    const c = computeDocument([
      line({ calcMode: 'per_hour', qty: 4, unitCost: 7000 }), // labor 28000, 4h
      line({ calcMode: 'per_unit', qty: 5, unitCost: 11500 }), // labor 57500
      line({ calcMode: 'material', qty: 1, unitCost: 20000 }), // materials 20000
      line({ calcMode: 'credit', qty: 1, unitCost: 5000, reasonTag: 'repeat_client' }), // -5000
    ]);
    expect(c.laborSubtotal).toBe(85500);
    expect(c.materialsSubtotal).toBe(20000);
    expect(c.discounts).toBe(-5000);
    expect(c.laborHours).toBe(4);
  });
});

describe('computeDocumentEstimate — ties back to the locked Bozena total (§4.2)', () => {
  const rates = makeDefaultRates();

  it('reconstructs $1,977.89 from a labor line + a material line', () => {
    const { totals } = computeDocumentEstimate(
      [
        line({ calcMode: 'flat', qty: 1, unitCost: 107800, clientDescription: 'Ceiling labor' }),
        line({ calcMode: 'material', qty: 1, unitCost: 53460, clientDescription: 'Paint & supplies' }),
      ],
      rates,
    );
    expect(totals.subtotal).toBe(161260);
    expect(totals.markup).toBe(32252);
    expect(totals.tax).toBe(4277); // materials only
    expect(totals.total).toBe(197789); // $1,977.89
  });

  it('materials-separate excludes materials from the totals (§8)', () => {
    const items = [
      line({ calcMode: 'flat', qty: 1, unitCost: 107800 }),
      line({ calcMode: 'material', qty: 1, unitCost: 53460 }),
    ];
    const { computation, totals } = computeDocumentEstimate(items, rates, {
      materialsMode: 'separate',
    });
    expect(computation.materialsSubtotal).toBe(53460); // still tracked for the note
    expect(totals.materials).toBe(0);
    expect(totals.subtotal).toBe(107800); // labor only
    expect(totals.tax).toBe(0); // no materials in totals → no tax
    expect(totals.markup).toBe(21560); // 20% of labor
    expect(totals.total).toBe(129360);
  });

  it('subtracts reason-tagged credits from the total', () => {
    const { totals } = computeDocumentEstimate(
      [
        line({ calcMode: 'flat', qty: 1, unitCost: 107800 }),
        line({ calcMode: 'material', qty: 1, unitCost: 53460 }),
        line({ calcMode: 'credit', qty: 1, unitCost: 10000, reasonTag: 'referral_goodwill' }),
      ],
      rates,
    );
    expect(totals.discounts).toBe(-10000);
    expect(totals.total).toBe(187789); // $1,977.89 − $100
  });
});
