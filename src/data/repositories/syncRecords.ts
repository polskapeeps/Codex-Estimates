import type { Table } from 'dexie';
import type {
  Client,
  Estimate,
  LibraryItem,
  Project,
  Property,
  RateEntry,
  Rates,
} from '../../lib/types';
import { db, RATES_ID, type RatesRow } from '../db';
import type {
  CloudRecord,
  SyncChange,
  SyncEntityType,
} from '../syncTypes';
import { syncKey } from '../syncTypes';

export interface LocalSyncRecord {
  entityType: SyncEntityType;
  recordId: string;
  payload: unknown;
}

function record(
  entityType: SyncEntityType,
  recordId: string,
  payload: unknown,
): LocalSyncRecord {
  return { entityType, recordId, payload };
}

function stripRatesId(row: RatesRow): Rates {
  const { id: _id, ...rates } = row;
  return rates;
}

export async function readAllLocalSyncRecords(): Promise<Map<string, LocalSyncRecord>> {
  const [clients, projects, estimates, libraryItems, rateEntries, properties, rates] =
    await Promise.all([
      db.clients.toArray(),
      db.projects.toArray(),
      db.estimates.toArray(),
      db.libraryItems.toArray(),
      db.rateEntries.toArray(),
      db.properties.toArray(),
      db.rates.get(RATES_ID),
    ]);

  const records = [
    ...clients.map((value) => record('clients', value.id, value)),
    ...projects.map((value) => record('projects', value.id, value)),
    ...estimates.map((value) => record('estimates', value.id, value)),
    ...libraryItems.map((value) => record('libraryItems', value.id, value)),
    ...rateEntries.map((value) => record('rateEntries', value.id, value)),
    ...properties.map((value) => record('properties', value.id, value)),
    ...(rates ? [record('rates', RATES_ID, stripRatesId(rates))] : []),
  ];

  return new Map(records.map((value) => [syncKey(value.entityType, value.recordId), value]));
}

export async function readLocalSyncRecord(
  entityType: SyncEntityType,
  recordId: string,
): Promise<LocalSyncRecord | undefined> {
  switch (entityType) {
    case 'clients': {
      const value = await db.clients.get(recordId);
      return value ? record(entityType, recordId, value) : undefined;
    }
    case 'projects': {
      const value = await db.projects.get(recordId);
      return value ? record(entityType, recordId, value) : undefined;
    }
    case 'estimates': {
      const value = await db.estimates.get(recordId);
      return value ? record(entityType, recordId, value) : undefined;
    }
    case 'libraryItems': {
      const value = await db.libraryItems.get(recordId);
      return value ? record(entityType, recordId, value) : undefined;
    }
    case 'rateEntries': {
      const value = await db.rateEntries.get(recordId);
      return value ? record(entityType, recordId, value) : undefined;
    }
    case 'properties': {
      const value = await db.properties.get(recordId);
      return value ? record(entityType, recordId, value) : undefined;
    }
    case 'rates': {
      const value = await db.rates.get(RATES_ID);
      return value ? record(entityType, RATES_ID, stripRatesId(value)) : undefined;
    }
  }
}

type SyncTable =
  | Table<Client, string>
  | Table<Project, string>
  | Table<Estimate, string>
  | Table<LibraryItem, string>
  | Table<RateEntry, string>
  | Table<Property, string>
  | Table<RatesRow, string>;

function tableFor(entityType: SyncEntityType): SyncTable {
  switch (entityType) {
    case 'clients':
      return db.clients;
    case 'projects':
      return db.projects;
    case 'estimates':
      return db.estimates;
    case 'libraryItems':
      return db.libraryItems;
    case 'rateEntries':
      return db.rateEntries;
    case 'properties':
      return db.properties;
    case 'rates':
      return db.rates;
  }
}

function payloadWithId(recordValue: CloudRecord): object {
  if (!recordValue.payload || typeof recordValue.payload !== 'object') {
    throw new Error(`Cloud ${recordValue.entity_type} record has an invalid payload.`);
  }
  if (recordValue.entity_type === 'rates') {
    return { id: RATES_ID, ...recordValue.payload };
  }
  return { ...recordValue.payload, id: recordValue.record_id };
}

function sameChange(a: SyncChange | undefined, b: SyncChange | undefined): boolean {
  return Boolean(
    a &&
      b &&
      a.key === b.key &&
      a.operation === b.operation &&
      a.changedAt === b.changedAt,
  );
}

/**
 * Apply a remote record only if the local outbox is still in the state the
 * sync pass inspected. A user edit that lands mid-sync therefore wins and is
 * handled by the next pass instead of being overwritten.
 */
export async function applyCloudRecord(
  cloudRecord: CloudRecord,
  expectedChange?: SyncChange,
): Promise<boolean> {
  const key = syncKey(cloudRecord.entity_type, cloudRecord.record_id);
  const table = tableFor(cloudRecord.entity_type);

  return db.transaction('rw', [table, db.syncChanges], async () => {
    const currentChange = await db.syncChanges.get(key);
    if (expectedChange ? !sameChange(currentChange, expectedChange) : Boolean(currentChange)) {
      return false;
    }

    if (cloudRecord.deleted) {
      await table.delete(cloudRecord.record_id);
    } else {
      await table.put(payloadWithId(cloudRecord) as never);
    }
    if (expectedChange) await db.syncChanges.delete(key);
    return true;
  });
}
