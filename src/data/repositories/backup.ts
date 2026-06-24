import { db, RATES_ID } from '../db';
import { ratesRepo } from './ratesRepo';
import { nowIso } from '../../lib/ids';
import type { BackupPayload } from '../../lib/types';
import { syncKey, type SyncEntityType } from '../syncTypes';
import { makeSyncChange, notifyLocalSyncChange } from './syncQueue';

// v2: bumped to 2 when the payload gained rateEntries + properties. Older
// (v1) backups omit those fields; import treats the missing arrays as empty.
export const BACKUP_SCHEMA_VERSION = 2;

/** Snapshot all local data as a portable payload (spec §11 Day-1 bridge). */
export async function exportAll(): Promise<BackupPayload> {
  const [clients, projects, estimates, libraryItems, rateEntries, properties, rates] =
    await Promise.all([
      db.clients.toArray(),
      db.projects.toArray(),
      db.estimates.toArray(),
      db.libraryItems.toArray(),
      db.rateEntries.toArray(),
      db.properties.toArray(),
      ratesRepo.get(),
    ]);
  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: nowIso(),
    clients,
    projects,
    estimates,
    libraryItems,
    rateEntries,
    properties,
    rates,
  };
}

/** Replace ALL local data with the contents of a backup payload. */
export async function importAll(payload: BackupPayload): Promise<void> {
  if (
    !payload ||
    typeof payload !== 'object' ||
    !Array.isArray(payload.clients) ||
    !Array.isArray(payload.projects) ||
    !payload.rates
  ) {
    throw new Error('This file is not a valid Estimator backup.');
  }

  const oldKeys = new Set<string>();
  const oldRecords = await Promise.all([
    db.clients.toCollection().primaryKeys(),
    db.projects.toCollection().primaryKeys(),
    db.estimates.toCollection().primaryKeys(),
    db.libraryItems.toCollection().primaryKeys(),
    db.rateEntries.toCollection().primaryKeys(),
    db.properties.toCollection().primaryKeys(),
  ]);
  const entityTypes: SyncEntityType[] = [
    'clients',
    'projects',
    'estimates',
    'libraryItems',
    'rateEntries',
    'properties',
  ];
  oldRecords.forEach((ids, index) => {
    ids.forEach((id) => oldKeys.add(syncKey(entityTypes[index], String(id))));
  });
  oldKeys.add(syncKey('rates', RATES_ID));

  const imported = [
    ...payload.clients.map((value) => ({ entityType: 'clients' as const, id: value.id })),
    ...payload.projects.map((value) => ({ entityType: 'projects' as const, id: value.id })),
    ...(payload.estimates ?? []).map((value) => ({
      entityType: 'estimates' as const,
      id: value.id,
    })),
    ...(payload.libraryItems ?? []).map((value) => ({
      entityType: 'libraryItems' as const,
      id: value.id,
    })),
    ...(payload.rateEntries ?? []).map((value) => ({
      entityType: 'rateEntries' as const,
      id: value.id,
    })),
    ...(payload.properties ?? []).map((value) => ({
      entityType: 'properties' as const,
      id: value.id,
    })),
    { entityType: 'rates' as const, id: RATES_ID },
  ];
  const importedKeys = new Set(imported.map(({ entityType, id }) => syncKey(entityType, id)));
  const changedAt = nowIso();

  await db.transaction(
    'rw',
    [
      db.clients,
      db.projects,
      db.estimates,
      db.libraryItems,
      db.rateEntries,
      db.properties,
      db.rates,
      db.syncChanges,
    ],
    async () => {
      await Promise.all([
        db.clients.clear(),
        db.projects.clear(),
        db.estimates.clear(),
        db.libraryItems.clear(),
        db.rateEntries.clear(),
        db.properties.clear(),
        db.rates.clear(),
        db.syncChanges.clear(),
      ]);
      await db.clients.bulkPut(payload.clients);
      await db.projects.bulkPut(payload.projects);
      await db.estimates.bulkPut(payload.estimates ?? []);
      await db.libraryItems.bulkPut(payload.libraryItems ?? []);
      await db.rateEntries.bulkPut(payload.rateEntries ?? []);
      await db.properties.bulkPut(payload.properties ?? []);
      await db.rates.put({ id: RATES_ID, ...payload.rates });
      await db.syncChanges.bulkPut([
        ...imported.map(({ entityType, id }) =>
          makeSyncChange(entityType, id, 'upsert', changedAt),
        ),
        ...[...oldKeys]
          .filter((key) => !importedKeys.has(key))
          .map((key) => {
            const separator = key.indexOf(':');
            return makeSyncChange(
              key.slice(0, separator) as SyncEntityType,
              key.slice(separator + 1),
              'delete',
              changedAt,
            );
          }),
      ]);
    },
  );
  notifyLocalSyncChange();
}
