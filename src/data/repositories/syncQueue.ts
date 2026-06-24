import { nowIso } from '../../lib/ids';
import { db } from '../db';
import {
  syncKey,
  type SyncChange,
  type SyncEntityType,
  type SyncOperation,
} from '../syncTypes';

const LOCAL_CHANGE_EVENT = 'estimator:local-sync-change';
let lastChangeTime = 0;

function monotonicTimestamp(candidate: string): string {
  const parsed = Date.parse(candidate);
  const next = Math.max(Number.isFinite(parsed) ? parsed : Date.now(), lastChangeTime + 1);
  lastChangeTime = next;
  return new Date(next).toISOString();
}

export function makeSyncChange(
  entityType: SyncEntityType,
  recordId: string,
  operation: SyncOperation,
  changedAt: string = nowIso(),
): SyncChange {
  const orderedChangedAt = monotonicTimestamp(changedAt);
  return {
    key: syncKey(entityType, recordId),
    entityType,
    recordId,
    operation,
    changedAt: orderedChangedAt,
  };
}

export function notifyLocalSyncChange(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(LOCAL_CHANGE_EVENT));
  }
}

export function onLocalSyncChange(listener: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined;
  window.addEventListener(LOCAL_CHANGE_EVENT, listener);
  return () => window.removeEventListener(LOCAL_CHANGE_EVENT, listener);
}

export async function queueSyncChange(
  entityType: SyncEntityType,
  recordId: string,
  operation: SyncOperation,
  changedAt?: string,
): Promise<void> {
  await db.syncChanges.put(makeSyncChange(entityType, recordId, operation, changedAt));
  notifyLocalSyncChange();
}

export async function acknowledgeSyncChange(change: SyncChange): Promise<void> {
  await db.transaction('rw', db.syncChanges, async () => {
    const current = await db.syncChanges.get(change.key);
    if (
      current &&
      current.changedAt === change.changedAt &&
      current.operation === change.operation
    ) {
      await db.syncChanges.delete(change.key);
    }
  });
}
