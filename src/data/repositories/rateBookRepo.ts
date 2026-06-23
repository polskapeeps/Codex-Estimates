import { db } from '../db';
import { newId } from '../../lib/ids';
import { makeDefaultRateBook } from '../../lib/estimate/rateBook';
import type { RateEntry } from '../../lib/types';
import type {
  RateBookRepository,
  RateEntryInput,
  RateEntryPatch,
} from './interfaces';

class DexieRateBookRepository implements RateBookRepository {
  getAll(): Promise<RateEntry[]> {
    return db.rateEntries.orderBy('sortOrder').toArray();
  }

  byCategory(category: RateEntry['category']): Promise<RateEntry[]> {
    return db.rateEntries
      .where('category')
      .equals(category)
      .sortBy('sortOrder');
  }

  /**
   * Add any default entries whose stable id isn't present yet. Never overwrites
   * an existing row, so user edits survive and future default additions appear.
   * Runs at boot, outside any liveQuery context.
   */
  async ensureSeeded(): Promise<void> {
    const defaults = makeDefaultRateBook();
    const existingIds = new Set(await db.rateEntries.toCollection().primaryKeys());
    const missing = defaults.filter((entry) => !existingIds.has(entry.id));
    if (missing.length > 0) await db.rateEntries.bulkAdd(missing);
  }

  async create(input: RateEntryInput): Promise<RateEntry> {
    const entry: RateEntry = { ...input, id: input.id ?? newId() };
    await db.rateEntries.add(entry);
    return entry;
  }

  async update(id: string, patch: RateEntryPatch): Promise<RateEntry> {
    await db.rateEntries.update(id, patch);
    const updated = await db.rateEntries.get(id);
    if (!updated) throw new Error(`RateEntry ${id} not found`);
    return updated;
  }

  async remove(id: string): Promise<void> {
    await db.rateEntries.delete(id);
  }

  async resetToDefaults(): Promise<void> {
    await db.rateEntries.clear();
    await db.rateEntries.bulkAdd(makeDefaultRateBook());
  }
}

export const rateBookRepo: RateBookRepository = new DexieRateBookRepository();
