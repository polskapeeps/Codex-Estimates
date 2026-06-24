import { db } from '../db';
import { newId, nowIso } from '../../lib/ids';
import { applyStatusChange } from '../../lib/status';
import type { Project, ProjectStatus } from '../../lib/types';
import type { ProjectInput, ProjectPatch, ProjectRepository } from './interfaces';
import { makeSyncChange, notifyLocalSyncChange } from './syncQueue';

class DexieProjectRepository implements ProjectRepository {
  getAll(): Promise<Project[]> {
    return db.projects.orderBy('updatedAt').reverse().toArray();
  }

  get(id: string): Promise<Project | undefined> {
    return db.projects.get(id);
  }

  byClient(clientId: string): Promise<Project[]> {
    return db.projects.where('clientId').equals(clientId).reverse().sortBy('updatedAt');
  }

  async create(input: ProjectInput): Promise<Project> {
    const now = nowIso();
    const project: Project = {
      ...input,
      tags: input.tags ?? [],
      notes: input.notes ?? '',
      id: newId(),
      photoIds: [],
      estimateIds: [],
      createdAt: now,
      updatedAt: now,
    };
    await db.transaction('rw', db.projects, db.syncChanges, async () => {
      await db.projects.add(project);
      await db.syncChanges.put(makeSyncChange('projects', project.id, 'upsert', now));
    });
    notifyLocalSyncChange();
    return project;
  }

  async update(id: string, patch: ProjectPatch): Promise<Project> {
    const now = nowIso();
    await db.transaction('rw', db.projects, db.syncChanges, async () => {
      await db.projects.update(id, { ...patch, updatedAt: now });
      await db.syncChanges.put(makeSyncChange('projects', id, 'upsert', now));
    });
    notifyLocalSyncChange();
    return this.getOrThrow(id);
  }

  async setStatus(id: string, status: ProjectStatus): Promise<Project> {
    const project = await this.getOrThrow(id);
    const patch = applyStatusChange(project, status);
    const changedAt = patch.updatedAt ?? nowIso();
    await db.transaction('rw', db.projects, db.syncChanges, async () => {
      await db.projects.update(id, patch);
      await db.syncChanges.put(makeSyncChange('projects', id, 'upsert', changedAt));
    });
    notifyLocalSyncChange();
    return this.getOrThrow(id);
  }

  async remove(id: string): Promise<void> {
    const now = nowIso();
    const estimateIds = await db.estimates.where('projectId').equals(id).primaryKeys();
    await db.transaction('rw', db.projects, db.estimates, db.syncChanges, async () => {
      await db.estimates.where('projectId').equals(id).delete();
      await db.projects.delete(id);
      await db.syncChanges.bulkPut([
        makeSyncChange('projects', id, 'delete', now),
        ...estimateIds.map((estimateId) =>
          makeSyncChange('estimates', String(estimateId), 'delete', now),
        ),
      ]);
    });
    notifyLocalSyncChange();
  }

  private async getOrThrow(id: string): Promise<Project> {
    const project = await db.projects.get(id);
    if (!project) throw new Error(`Project ${id} not found`);
    return project;
  }
}

export const projectRepo: ProjectRepository = new DexieProjectRepository();
