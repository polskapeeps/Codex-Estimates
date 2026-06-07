import { db, RATES_ID, type RatesRow } from '../db';
import { makeDefaultRates } from '../../lib/estimate/defaults';
import type { Rates } from '../../lib/types';
import type { RatesRepository } from './interfaces';

function stripId(row: RatesRow): Rates {
  const { id: _id, ...rates } = row;
  return rates;
}

class DexieRatesRepository implements RatesRepository {
  /**
   * READ-ONLY: returns the persisted singleton, or the defaults if it hasn't
   * been seeded yet. Must not write — this runs inside useLiveQuery contexts,
   * where Dexie forbids readwrite transactions. Seeding happens in
   * ensureSeeded() at app boot.
   */
  async get(): Promise<Rates> {
    const existing = await db.rates.get(RATES_ID);
    return existing ? stripId(existing) : makeDefaultRates();
  }

  /** Persist the defaults row on first run (call once, outside a liveQuery). */
  async ensureSeeded(): Promise<void> {
    const existing = await db.rates.get(RATES_ID);
    if (!existing) {
      await db.rates.put({ id: RATES_ID, ...makeDefaultRates() });
    }
  }

  async update(patch: Partial<Rates>): Promise<Rates> {
    const current = await this.get();
    // Shallow merge top-level, deep-merge the known nested objects so a
    // partial patch can't wipe sibling fields.
    const merged: Rates = {
      ...current,
      ...patch,
      productionRates: { ...current.productionRates, ...(patch.productionRates ?? {}) },
      prepMultipliers: { ...current.prepMultipliers, ...(patch.prepMultipliers ?? {}) },
      company: { ...current.company, ...(patch.company ?? {}) },
    };
    await db.rates.put({ id: RATES_ID, ...merged });
    return merged;
  }

  async reset(): Promise<Rates> {
    const fresh = makeDefaultRates();
    await db.rates.put({ id: RATES_ID, ...fresh });
    return fresh;
  }
}

export const ratesRepo: RatesRepository = new DexieRatesRepository();
