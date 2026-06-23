import { describe, expect, it } from 'vitest';
import type { LineItem, MaterialsMode, Rates } from '../types';
import { makeDefaultRates } from './defaults';
import { computeDocumentEstimate } from './lineItems';
import { evaluateGuardrails, type GuardrailId } from './guardrails';

function line(overrides: Partial<LineItem>): LineItem {
  return {
    id: `line-${Math.random()}`,
    description: 'Labor',
    clientDescription: 'Labor scope line',
    qty: 1,
    unit: 'hr',
    unitCost: 7000,
    calcMode: 'per_hour',
    ...overrides,
  };
}

function warningIds(
  lineItems: LineItem[],
  opts: {
    rates?: Partial<Rates>;
    materialsMode?: MaterialsMode;
    bundled?: boolean;
    docType?: 'estimate' | 'quote' | 'invoice';
    validUntil?: string;
    dueDate?: string;
  } = {},
): GuardrailId[] {
  const rates = { ...makeDefaultRates(), ...(opts.rates ?? {}) };
  const estimate = computeDocumentEstimate(lineItems, rates, {
    materialsMode: opts.materialsMode,
  });

  return evaluateGuardrails({
    lineItems,
    computation: estimate.computation,
    totals: estimate.totals,
    rates,
    materialsMode: opts.materialsMode,
    bundled: opts.bundled,
    docType: opts.docType,
    validUntil: opts.validUntil,
    dueDate: opts.dueDate,
  }).map((warning) => warning.id);
}

describe('evaluateGuardrails', () => {
  it('flags effective hourly below the hard floor', () => {
    const ids = warningIds([
      line({ qty: 20, unitCost: 5390, clientDescription: 'Ceiling repair labor' }),
      line({ calcMode: 'material', unit: 'ea', qty: 1, unitCost: 53460 }),
    ]);

    expect(ids).toContain('effective-hourly');
  });

  it('flags ceiling sqft pricing below the editable floor', () => {
    const ids = warningIds([
      line({
        category: 'painting',
        calcMode: 'per_sqft',
        unit: 'sqft',
        description: 'Ceiling labor',
        clientDescription: 'Ceiling skim coat labor',
        qty: 100,
        unitCost: 75,
      }),
      line({ calcMode: 'material', unit: 'ea', qty: 1, unitCost: 5000 }),
    ]);

    expect(ids).toContain('ceiling-giveaway');
  });

  it('flags small standalone window jobs unless bundled', () => {
    const windowLine = line({
      category: 'windows',
      calcMode: 'per_unit',
      unit: 'ea',
      description: 'Ground outside windows',
      clientDescription: 'Exterior window cleaning',
      qty: 5,
      unitCost: 1300,
    });

    expect(warningIds([windowLine])).toContain('window-standalone');
    expect(warningIds([windowLine], { bundled: true })).not.toContain('window-standalone');
  });

  it('requires credit reason tags and notes for other credits', () => {
    expect(
      warningIds([
        line({ calcMode: 'credit', unit: 'lump', qty: 1, unitCost: 10000, reasonTag: undefined }),
      ]),
    ).toContain('intentional-discount');

    expect(
      warningIds([
        line({
          calcMode: 'credit',
          unit: 'lump',
          qty: 1,
          unitCost: 10000,
          reasonTag: 'other',
          internalNote: 'Existing barter credit approved.',
        }),
      ]),
    ).not.toContain('intentional-discount');
  });

  it('flags optional job minimums and disabled markup', () => {
    const ids = warningIds(
      [line({ qty: 1, unitCost: 7000, clientDescription: 'Small repair visit' })],
      { rates: { jobMinimumCents: 25000, markupPct: 0 } },
    );

    expect(ids).toContain('job-minimum');
    expect(ids).toContain('no-markup');
  });

  it('flags missing setup time and missing materials on service-only docs', () => {
    const ids = warningIds([
      line({
        category: 'fixtures',
        calcMode: 'per_unit',
        unit: 'ea',
        qty: 2,
        unitCost: 11500,
        clientDescription: 'Fixture swap existing boxes',
      }),
    ]);

    expect(ids).toContain('no-setup-time');
    expect(ids).toContain('missing-materials');
  });

  it('flags ladder language without an access modifier or premium', () => {
    const ids = warningIds([
      line({
        category: 'fixtures',
        calcMode: 'per_unit',
        unit: 'ea',
        qty: 2,
        unitCost: 11500,
        clientDescription: 'Install high access foyer fixtures',
      }),
    ]);

    expect(ids).toContain('ladder-without-modifier');
  });

  it('flags vague client scope and missing lifecycle dates', () => {
    expect(
      warningIds([line({ clientDescription: 'Labor' })], {
        docType: 'quote',
        validUntil: undefined,
      }),
    ).toEqual(expect.arrayContaining(['vague-scope', 'missing-expiration']));

    expect(
      warningIds([line({ clientDescription: 'Invoice repair scope' })], {
        docType: 'invoice',
        dueDate: undefined,
      }),
    ).toContain('missing-due-date');
  });
});
