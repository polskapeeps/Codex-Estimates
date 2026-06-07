import { db } from '../db';
import { newId } from '../../lib/ids';
import type { LibraryItem } from '../../lib/types';
import type {
  LibraryItemInput,
  LibraryItemPatch,
  LibraryRepository,
} from './interfaces';

class DexieLibraryRepository implements LibraryRepository {
  getAll(): Promise<LibraryItem[]> {
    return db.libraryItems.orderBy('description').toArray();
  }

  async create(input: LibraryItemInput): Promise<LibraryItem> {
    const item: LibraryItem = { ...input, id: newId() };
    await db.libraryItems.add(item);
    return item;
  }

  async update(id: string, patch: LibraryItemPatch): Promise<LibraryItem> {
    await db.libraryItems.update(id, patch);
    const updated = await db.libraryItems.get(id);
    if (!updated) throw new Error(`Library item ${id} not found`);
    return updated;
  }

  async remove(id: string): Promise<void> {
    await db.libraryItems.delete(id);
  }
}

export const libraryRepo: LibraryRepository = new DexieLibraryRepository();
