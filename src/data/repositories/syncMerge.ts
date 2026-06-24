import type { CloudRecord, SyncChange } from '../syncTypes';

export type SyncResolution = 'push_local' | 'apply_cloud';

/**
 * Last-write-wins decision for a record changed both locally and remotely.
 * ISO timestamps compare lexicographically because they are UTC ISO strings.
 */
export function resolveConflict(
  localChange: SyncChange,
  cloudRecord: CloudRecord,
): SyncResolution {
  return localChange.changedAt > cloudRecord.client_updated_at
    ? 'push_local'
    : 'apply_cloud';
}
