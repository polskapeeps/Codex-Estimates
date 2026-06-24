import 'fake-indexeddb/auto';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '../db';
import type { CloudRecord } from '../syncTypes';
import { clientRepo } from './clientRepo';
import { applyCloudRecord } from './syncRecords';

beforeEach(async () => {
  db.close();
  await db.delete();
  await db.open();
});

afterAll(async () => {
  db.close();
  await db.delete();
});

describe('cloud sync IndexedDB integration', () => {
  it('queues a durable upsert alongside a local repository write', async () => {
    const client = await clientRepo.create({ name: 'Local client' });
    const queued = await db.syncChanges.get(`clients:${client.id}`);

    expect(await db.clients.get(client.id)).toEqual(client);
    expect(queued).toMatchObject({
      entityType: 'clients',
      recordId: client.id,
      operation: 'upsert',
    });
    expect(queued!.changedAt >= client.updatedAt).toBe(true);
  });

  it('applies a newer cloud record and acknowledges the inspected local change', async () => {
    const client = await clientRepo.create({ name: 'Local client' });
    const queued = await db.syncChanges.get(`clients:${client.id}`);
    expect(queued).toBeDefined();

    const cloud: CloudRecord = {
      user_id: 'user-1',
      entity_type: 'clients',
      record_id: client.id,
      payload: {
        ...client,
        name: 'Cloud client',
        updatedAt: '2026-06-24T13:00:00.000Z',
      },
      client_updated_at: '2026-06-24T13:00:00.000Z',
      deleted: false,
    };

    expect(await applyCloudRecord(cloud, queued)).toBe(true);
    expect((await db.clients.get(client.id))?.name).toBe('Cloud client');
    expect(await db.syncChanges.get(`clients:${client.id}`)).toBeUndefined();
  });

  it('will not overwrite a newer local edit that lands during a sync pass', async () => {
    const client = await clientRepo.create({ name: 'First local version' });
    const inspectedChange = await db.syncChanges.get(`clients:${client.id}`);
    expect(inspectedChange).toBeDefined();

    await clientRepo.update(client.id, { name: 'Newer local version' });
    const cloud: CloudRecord = {
      user_id: 'user-1',
      entity_type: 'clients',
      record_id: client.id,
      payload: { ...client, name: 'Cloud version' },
      client_updated_at: '2026-06-24T13:00:00.000Z',
      deleted: false,
    };

    expect(await applyCloudRecord(cloud, inspectedChange)).toBe(false);
    expect((await db.clients.get(client.id))?.name).toBe('Newer local version');
    expect(await db.syncChanges.get(`clients:${client.id}`)).toBeDefined();
  });
});
