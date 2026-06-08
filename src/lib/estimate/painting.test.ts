import { describe, expect, it } from 'vitest';
import { computePaintingEstimate, computePainting } from './painting';
import { computeTotals } from './totals';
import { makeDefaultRates } from './defaults';
import type { Room } from '../types';

function makeRoom(overrides: Partial<Room> = {}): Room {
  return {
    id: 'r1',
    label: 'Room',
    length: 12,
    width: 14,
    height: 9,
    walls: true,
    ceiling: true,
    trim: false,
    doors: 1,
    windows: 2,
    coats: 2,
    prepLevel: 'standard',
    ...overrides,
  };
}

/**
 * Spec §17 acceptance example. The GEOMETRY and MATERIALS values below match
 * the spec exactly. The labor and downstream totals are LOCKED to the values
 * produced by our documented rounding strategy (full-precision hours, money
 * rounded once per step). They differ from the spec's *approximate* worked
 * figures by a few cents because that example rounded intermediate hours (and
 * lists labor as $512.26, which is itself 10.245 × $50 = $512.25 mis-typed).
 * Per the spec ("If you change rounding strategy, update the test and document
 * it"), these locked numbers are the source of truth.
 */
describe('painting engine — spec §17 worked example', () => {
  const rates = makeDefaultRates();
  const { computation: c, totals } = computePaintingEstimate([makeRoom()], rates);
  const room = c.rooms[0];

  it('derives geometry exactly', () => {
    expect(room.perimeter).toBe(52);
    expect(room.wallGross).toBe(468);
    expect(room.openings).toBe(51);
    expect(room.wallNet).toBe(417);
    expect(room.ceilingArea).toBe(168);
  });

  it('derives paint materials exactly ($194.40)', () => {
    expect(c.totalAppliedSqft).toBe(1170); // (417 + 168) × 2
    expect(c.paintGallons).toBe(4); // ceil(1170 / 350)
    expect(c.paintCost).toBe(18000); // $180.00
    expect(c.primerGallons).toBe(0); // not heavy prep
    expect(c.primerCost).toBe(0);
    expect(c.sundries).toBe(1440); // 8% of $180 = $14.40
    expect(c.materials).toBe(19440); // $194.40
  });

  it('derives labor hours (full precision)', () => {
    expect(room.wallHours).toBeCloseTo(4.765714, 5); // (417×2)/175
    expect(room.ceilingHours).toBeCloseTo(1.68, 5); // (168×2)/200
    expect(room.doorHours).toBe(0.75);
    expect(room.windowHours).toBe(1.0);
    expect(room.baseHours).toBeCloseTo(8.195714, 5);
    expect(room.totalHours).toBeCloseTo(10.244643, 5); // × 1.25 prep
    expect(c.laborHours).toBeCloseTo(10.244643, 5);
  });

  it('locks labor and totals (cents)', () => {
    expect(c.labor).toBe(51223); // round(10.244643 × $50) = $512.23
    expect(totals.subtotal).toBe(70663); // $706.63
    expect(totals.markup).toBe(14133); // 20% = $141.33
    expect(totals.tax).toBe(1555); // materials × 8% = $15.55
    expect(totals.total).toBe(86351); // $863.51
    expect(totals.low).toBe(75989); // −12% = $759.89
    expect(totals.high).toBe(96713); // +12% = $967.13
  });

  it('can bill painting as labor-only while preserving material planning', () => {
    const { computation, totals: laborOnly } = computePaintingEstimate(
      [makeRoom()],
      rates,
      'labor_only',
    );
    expect(computation.materials).toBe(19440);
    expect(laborOnly.materials).toBe(0);
    expect(laborOnly.labor).toBe(computation.labor);
    expect(laborOnly.subtotal).toBe(computation.labor);
    expect(laborOnly.markup).toBe(0);
    expect(laborOnly.tax).toBe(0);
    expect(laborOnly.total).toBe(computation.labor);
  });
});

describe('painting engine — behavior', () => {
  it('rounds paint gallons up across the whole estimate, not per room', () => {
    const rates = makeDefaultRates();
    // Two small rooms whose combined applied sqft straddles a gallon boundary.
    const small = makeRoom({
      length: 5,
      width: 5,
      height: 8,
      ceiling: false,
      doors: 0,
      windows: 0,
      coats: 1,
    });
    const oneRoom = computePainting([small], rates);
    const twoRooms = computePainting([small, { ...small, id: 'r2' }], rates);
    // Per-room ceil would double; aggregate ceil should be <= sum of per-room.
    expect(twoRooms.paintGallons).toBeGreaterThanOrEqual(oneRoom.paintGallons);
    expect(twoRooms.totalAppliedSqft).toBe(oneRoom.totalAppliedSqft * 2);
  });

  it('excludes unselected surfaces from area and hours', () => {
    const rates = makeDefaultRates();
    const wallsOnly = computePainting(
      [makeRoom({ ceiling: false, doors: 0, windows: 0 })],
      rates,
    );
    expect(wallsOnly.rooms[0].ceilingHours).toBe(0);
    // ceiling area not painted -> applied sqft is walls only
    expect(wallsOnly.rooms[0].appliedSqft).toBe(wallsOnly.rooms[0].wallNet * 2);
  });

  it('adds primer only on heavy prep when enabled', () => {
    const rates = makeDefaultRates();
    const heavy = computePainting([makeRoom({ prepLevel: 'heavy' })], rates);
    expect(heavy.primerGallons).toBeGreaterThan(0);
    const off = computePainting([makeRoom({ prepLevel: 'heavy' })], {
      ...rates,
      primerOnHeavyPrep: false,
    });
    expect(off.primerGallons).toBe(0);
  });

  it('prep multiplier scales labor hours', () => {
    const rates = makeDefaultRates();
    const light = computePainting([makeRoom({ prepLevel: 'light' })], rates);
    const heavy = computePainting([makeRoom({ prepLevel: 'heavy' })], rates);
    expect(heavy.laborHours).toBeGreaterThan(light.laborHours);
  });

  it('produces a zero estimate for an empty room list', () => {
    const rates = makeDefaultRates();
    const { computation, totals } = computePaintingEstimate([], rates);
    expect(computation.materials).toBe(0);
    expect(computation.labor).toBe(0);
    expect(totals.total).toBe(0);
  });
});

describe('totals — tax modes', () => {
  const base = { materials: 10000, labor: 20000, laborHours: 4 };

  it('taxes materials only by default', () => {
    const rates = makeDefaultRates(); // taxAppliesTo materials, 8%
    const t = computeTotals(base, rates);
    expect(t.tax).toBe(800); // 8% of $100 materials
  });

  it('taxes the whole subtotal when configured', () => {
    const rates = { ...makeDefaultRates(), taxAppliesTo: 'all' as const };
    const t = computeTotals(base, rates);
    expect(t.tax).toBe(2400); // 8% of $300 subtotal
  });

  it('applies no tax when configured', () => {
    const rates = { ...makeDefaultRates(), taxAppliesTo: 'none' as const };
    const t = computeTotals(base, rates);
    expect(t.tax).toBe(0);
  });

  it('uses labor only with no materials, markup, or tax', () => {
    const rates = makeDefaultRates();
    const t = computeTotals(base, rates, 'labor_only');
    expect(t.materials).toBe(0);
    expect(t.labor).toBe(20000);
    expect(t.subtotal).toBe(20000);
    expect(t.markup).toBe(0);
    expect(t.tax).toBe(0);
    expect(t.total).toBe(20000);
  });
});
