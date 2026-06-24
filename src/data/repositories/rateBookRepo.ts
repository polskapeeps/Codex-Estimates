import { db } from '../db';
import { newId, nowIso } from '../../lib/ids';
import { makeDefaultRateBook } from '../../lib/estimate/rateBook';
import type { RateEntry } from '../../lib/types';
import type {
  RateBookRepository,
  RateEntryInput,
  RateEntryPatch,
} from './interfaces';
import { makeSyncChange, notifyLocalSyncChange } from './syncQueue';

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
    // Initial/default seeding is not a user edit. The first sync uploads local
    // records missing from the cloud; on a new device this lets cloud-edited
    // rates win over fresh defaults.
    if (missing.length > 0) await db.rateEntries.bulkAdd(missing);
  }

  async create(input: RateEntryInput): Promise<RateEntry> {
    const entry: RateEntry = { ...input, id: input.id ?? newId() };
    const now = nowIso();
    await db.transaction('rw', db.rateEntries, db.syncChanges, async () => {
      await db.rateEntries.add(entry);
      await db.syncChanges.put(makeSyncChange('rateEntries', entry.id, 'upsert', now));
    });
    notifyLocalSyncChange();
    return entry;
  }

  async update(id: string, patch: RateEntryPatch): Promise<RateEntry> {
    const now = nowIso();
    await db.transaction('rw', db.rateEntries, db.syncChanges, async () => {
      await db.rateEntries.update(id, patch);
      await db.syncChanges.put(makeSyncChange('rateEntries', id, 'upsert', now));
    });
    notifyLocalSyncChange();
    const updated = await db.rateEntries.get(id);
    if (!updated) throw new Error(`RateEntry ${id} not found`);
    return updated;
  }

  async remove(id: string): Promise<void> {
    const now = nowIso();
    await db.transaction('rw', db.rateEntries, db.syncChanges, async () => {
      await db.rateEntries.delete(id);
      await db.syncChanges.put(makeSyncChange('rateEntries', id, 'delete', now));
    });
    notifyLocalSyncChange();
  }

  async resetToDefaults(): Promise<void> {
    const existingIds = await db.rateEntries.toCollection().primaryKeys();
    const defaults = makeDefaultRateBook();
    const defaultIds = new Set(defaults.map((entry) => entry.id));
    const now = nowIso();
    await db.transaction('rw', db.rateEntries, db.syncChanges, async () => {
      await db.rateEntries.clear();
      await db.rateEntries.bulkAdd(defaults);
      await db.syncChanges.bulkPut([
        ...defaults.map((entry) => makeSyncChange('rateEntries', entry.id, 'upsert', now)),
        ...existingIds
          .filter((id) => !defaultIds.has(String(id)))
          .map((id) => makeSyncChange('rateEntries', String(id), 'delete', now)),
      ]);
    });
    notifyLocalSyncChange();
  }
}

export const rateBookRepo: RateBookRepository = new DexieRateBookRepository();
