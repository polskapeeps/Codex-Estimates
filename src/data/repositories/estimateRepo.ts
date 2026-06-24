import { db } from '../db';
import { newId, nowIso } from '../../lib/ids';
import type { Estimate } from '../../lib/types';
import type { EstimateInput, EstimatePatch, EstimateRepository } from './interfaces';
import { makeSyncChange, notifyLocalSyncChange } from './syncQueue';

class DexieEstimateRepository implements EstimateRepository {
  get(id: string): Promise<Estimate | undefined> {
    return db.estimates.get(id);
  }

  getAll(): Promise<Estimate[]> {
    return db.estimates.toArray();
  }

  byProject(projectId: string): Promise<Estimate[]> {
    return db.estimates
      .where('projectId')
      .equals(projectId)
      .sortBy('version');
  }

  async nextVersion(projectId: string): Promise<number> {
    const existing = await this.byProject(projectId);
    return existing.reduce((max, e) => Math.max(max, e.version), 0) + 1;
  }

  async create(input: EstimateInput): Promise<Estimate> {
    const now = nowIso();
    const version = input.version ?? (await this.nextVersion(input.projectId));
    const estimate: Estimate = {
      ...input,
      version,
      id: newId(),
      createdAt: now,
      updatedAt: now,
    };
    await db.transaction('rw', db.estimates, db.syncChanges, async () => {
      await db.estimates.add(estimate);
      await db.syncChanges.put(makeSyncChange('estimates', estimate.id, 'upsert', now));
    });
    notifyLocalSyncChange();
    return estimate;
  }

  async update(id: string, patch: EstimatePatch): Promise<Estimate> {
    const now = nowIso();
    await db.transaction('rw', db.estimates, db.syncChanges, async () => {
      await db.estimates.update(id, { ...patch, updatedAt: now });
      await db.syncChanges.put(makeSyncChange('estimates', id, 'upsert', now));
    });
    notifyLocalSyncChange();
    const updated = await db.estimates.get(id);
    if (!updated) throw new Error(`Estimate ${id} not found`);
    return updated;
  }

  async remove(id: string): Promise<void> {
    const now = nowIso();
    await db.transaction('rw', db.estimates, db.syncChanges, async () => {
      await db.estimates.delete(id);
      await db.syncChanges.put(makeSyncChange('estimates', id, 'delete', now));
    });
    notifyLocalSyncChange();
  }
}

export const estimateRepo: EstimateRepository = new DexieEstimateRepository();
