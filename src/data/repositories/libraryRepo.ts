import { db } from '../db';
import { newId, nowIso } from '../../lib/ids';
import type { LibraryItem } from '../../lib/types';
import type {
  LibraryItemInput,
  LibraryItemPatch,
  LibraryRepository,
} from './interfaces';
import { makeSyncChange, notifyLocalSyncChange } from './syncQueue';

class DexieLibraryRepository implements LibraryRepository {
  getAll(): Promise<LibraryItem[]> {
    return db.libraryItems.orderBy('description').toArray();
  }

  async create(input: LibraryItemInput): Promise<LibraryItem> {
    const item: LibraryItem = { ...input, id: newId() };
    const now = nowIso();
    await db.transaction('rw', db.libraryItems, db.syncChanges, async () => {
      await db.libraryItems.add(item);
      await db.syncChanges.put(makeSyncChange('libraryItems', item.id, 'upsert', now));
    });
    notifyLocalSyncChange();
    return item;
  }

  async update(id: string, patch: LibraryItemPatch): Promise<LibraryItem> {
    const now = nowIso();
    await db.transaction('rw', db.libraryItems, db.syncChanges, async () => {
      await db.libraryItems.update(id, patch);
      await db.syncChanges.put(makeSyncChange('libraryItems', id, 'upsert', now));
    });
    notifyLocalSyncChange();
    const updated = await db.libraryItems.get(id);
    if (!updated) throw new Error(`Library item ${id} not found`);
    return updated;
  }

  async remove(id: string): Promise<void> {
    const now = nowIso();
    await db.transaction('rw', db.libraryItems, db.syncChanges, async () => {
      await db.libraryItems.delete(id);
      await db.syncChanges.put(makeSyncChange('libraryItems', id, 'delete', now));
    });
    notifyLocalSyncChange();
  }
}

export const libraryRepo: LibraryRepository = new DexieLibraryRepository();
