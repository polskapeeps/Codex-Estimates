import { db } from '../db';
import { newId, nowIso } from '../../lib/ids';
import type { Client } from '../../lib/types';
import type { ClientInput, ClientPatch, ClientRepository } from './interfaces';

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
    await db.clients.add(client);
    return client;
  }

  async update(id: string, patch: ClientPatch): Promise<Client> {
    await db.clients.update(id, { ...patch, updatedAt: nowIso() });
    const updated = await db.clients.get(id);
    if (!updated) throw new Error(`Client ${id} not found`);
    return updated;
  }

  async remove(id: string): Promise<void> {
    await db.clients.delete(id);
  }
}

export const clientRepo: ClientRepository = new DexieClientRepository();
