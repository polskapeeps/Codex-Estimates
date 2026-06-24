import { db, RATES_ID, type RatesRow } from '../db';
import { makeDefaultRates } from '../../lib/estimate/defaults';
import type { Rates } from '../../lib/types';
import type { RatesRepository } from './interfaces';
import { nowIso } from '../../lib/ids';
import { makeSyncChange, notifyLocalSyncChange } from './syncQueue';

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
    // Backfill any fields added in later versions (e.g. difficultyModifiers)
    // so a row seeded by an older build still reads as a complete Rates object.
    return existing ? { ...makeDefaultRates(), ...stripId(existing) } : makeDefaultRates();
  }

  /** Persist the defaults row on first run (call once, outside a liveQuery). */
  async ensureSeeded(): Promise<void> {
    const existing = await db.rates.get(RATES_ID);
    if (!existing) {
      // Seeding is not a user edit. An existing cloud row should replace this
      // fresh-device default during first sync.
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
    const now = nowIso();
    await db.transaction('rw', db.rates, db.syncChanges, async () => {
      await db.rates.put({ id: RATES_ID, ...merged });
      await db.syncChanges.put(makeSyncChange('rates', RATES_ID, 'upsert', now));
    });
    notifyLocalSyncChange();
    return merged;
  }

  async reset(): Promise<Rates> {
    const fresh = makeDefaultRates();
    const now = nowIso();
    await db.transaction('rw', db.rates, db.syncChanges, async () => {
      await db.rates.put({ id: RATES_ID, ...fresh });
      await db.syncChanges.put(makeSyncChange('rates', RATES_ID, 'upsert', now));
    });
    notifyLocalSyncChange();
    return fresh;
  }
}

export const ratesRepo: RatesRepository = new DexieRatesRepository();
