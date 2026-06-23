import { db, RATES_ID } from '../db';
import { ratesRepo } from './ratesRepo';
import { nowIso } from '../../lib/ids';
import type { BackupPayload } from '../../lib/types';

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
      ]);
      await db.clients.bulkPut(payload.clients);
      await db.projects.bulkPut(payload.projects);
      await db.estimates.bulkPut(payload.estimates ?? []);
      await db.libraryItems.bulkPut(payload.libraryItems ?? []);
      await db.rateEntries.bulkPut(payload.rateEntries ?? []);
      await db.properties.bulkPut(payload.properties ?? []);
      await db.rates.put({ id: RATES_ID, ...payload.rates });
    },
  );
}
