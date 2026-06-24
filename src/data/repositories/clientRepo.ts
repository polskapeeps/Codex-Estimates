import { db } from '../db';
import { newId, nowIso } from '../../lib/ids';
import type { Client } from '../../lib/types';
import type { ClientInput, ClientPatch, ClientRepository } from './interfaces';
import { makeSyncChange, notifyLocalSyncChange } from './syncQueue';

class DexieClientRepository implements ClientRepository {
  getAll(): Promise<Client[]> {
    return db.clients.orderBy('name').toArray();
  }

  get(id: string): Promise<Client | undefined> {
    return db.clients.get(id);
  }

  async create(input: ClientInput): Promise<Client> {
    const now = nowIso();
    const client: Client = { ...input, id: newId(), createdAt: now, updatedAt: now };
    await db.transaction('rw', db.clients, db.syncChanges, async () => {
      await db.clients.add(client);
      await db.syncChanges.put(makeSyncChange('clients', client.id, 'upsert', now));
    });
    notifyLocalSyncChange();
    return client;
  }

  async update(id: string, patch: ClientPatch): Promise<Client> {
    const now = nowIso();
    await db.transaction('rw', db.clients, db.syncChanges, async () => {
      await db.clients.update(id, { ...patch, updatedAt: now });
      await db.syncChanges.put(makeSyncChange('clients', id, 'upsert', now));
    });
    notifyLocalSyncChange();
    const updated = await db.clients.get(id);
    if (!updated) throw new Error(`Client ${id} not found`);
    return updated;
  }

  async remove(id: string): Promise<void> {
    const now = nowIso();
    await db.transaction('rw', db.clients, db.syncChanges, async () => {
      await db.clients.delete(id);
      await db.syncChanges.put(makeSyncChange('clients', id, 'delete', now));
    });
    notifyLocalSyncChange();
  }
}

export const clientRepo: ClientRepository = new DexieClientRepository();
