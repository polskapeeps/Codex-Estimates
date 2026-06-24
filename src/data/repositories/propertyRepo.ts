import { db } from '../db';
import { newId, nowIso } from '../../lib/ids';
import type { Property } from '../../lib/types';
import type {
  PropertyInput,
  PropertyPatch,
  PropertyRepository,
} from './interfaces';
import { makeSyncChange, notifyLocalSyncChange } from './syncQueue';

class DexiePropertyRepository implements PropertyRepository {
  getAll(): Promise<Property[]> {
    return db.properties.toArray();
  }

  get(id: string): Promise<Property | undefined> {
    return db.properties.get(id);
  }

  byClient(clientId: string): Promise<Property[]> {
    return db.properties.where('clientId').equals(clientId).toArray();
  }

  async create(input: PropertyInput): Promise<Property> {
    const now = nowIso();
    const property: Property = { ...input, id: newId(), createdAt: now, updatedAt: now };
    await db.transaction('rw', db.properties, db.syncChanges, async () => {
      await db.properties.add(property);
      await db.syncChanges.put(makeSyncChange('properties', property.id, 'upsert', now));
    });
    notifyLocalSyncChange();
    return property;
  }

  async update(id: string, patch: PropertyPatch): Promise<Property> {
    const now = nowIso();
    await db.transaction('rw', db.properties, db.syncChanges, async () => {
      await db.properties.update(id, { ...patch, updatedAt: now });
      await db.syncChanges.put(makeSyncChange('properties', id, 'upsert', now));
    });
    notifyLocalSyncChange();
    const updated = await db.properties.get(id);
    if (!updated) throw new Error(`Property ${id} not found`);
    return updated;
  }

  async remove(id: string): Promise<void> {
    const now = nowIso();
    await db.transaction('rw', db.properties, db.syncChanges, async () => {
      await db.properties.delete(id);
      await db.syncChanges.put(makeSyncChange('properties', id, 'delete', now));
    });
    notifyLocalSyncChange();
  }
}

export const propertyRepo: PropertyRepository = new DexiePropertyRepository();
