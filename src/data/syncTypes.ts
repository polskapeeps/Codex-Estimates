export const SYNC_ENTITY_TYPES = [
  'clients',
  'projects',
  'estimates',
  'libraryItems',
  'rates',
  'rateEntries',
  'properties',
] as const;

export type SyncEntityType = (typeof SYNC_ENTITY_TYPES)[number];
export type SyncOperation = 'upsert' | 'delete';

export interface SyncChange {
  key: string;
  entityType: SyncEntityType;
  recordId: string;
  operation: SyncOperation;
  changedAt: string;
}

export interface SyncStateRow {
  id: 'cloud';
  userId?: string;
  initialSyncComplete?: boolean;
  lastSyncedAt?: string;
  lastError?: string;
}

export interface CloudRecord {
  user_id: string;
  entity_type: SyncEntityType;
  record_id: string;
  payload: unknown | null;
  client_updated_at: string;
  deleted: boolean;
  updated_at?: string;
}

export function syncKey(entityType: SyncEntityType, recordId: string): string {
  return `${entityType}:${recordId}`;
}
