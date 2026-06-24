import { describe, expect, it } from 'vitest';
import type { CloudRecord, SyncChange } from '../syncTypes';
import { resolveConflict } from './syncMerge';

const local: SyncChange = {
  key: 'clients:1',
  entityType: 'clients',
  recordId: '1',
  operation: 'upsert',
  changedAt: '2026-06-24T12:00:00.000Z',
};

const cloud: CloudRecord = {
  user_id: 'user-1',
  entity_type: 'clients',
  record_id: '1',
  payload: { id: '1', name: 'Client' },
  client_updated_at: '2026-06-24T11:00:00.000Z',
  deleted: false,
};

describe('resolveConflict', () => {
  it('pushes a newer local mutation', () => {
    expect(resolveConflict(local, cloud)).toBe('push_local');
  });

  it('applies an equally new or newer cloud mutation', () => {
    expect(
      resolveConflict(local, {
        ...cloud,
        client_updated_at: '2026-06-24T12:00:00.000Z',
      }),
    ).toBe('apply_cloud');
  });
});
