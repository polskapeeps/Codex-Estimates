import { estimateRepo, projectRepo } from '../../data/repositories';
import type { ProjectPatch } from '../../data/repositories';
import type { LineItem, PricingMode, Rates, Room, Totals, Trade } from '../../lib/types';

export interface SaveEstimateDraft {
  estimateId?: string; // present => update this estimate
  projectId?: string; // present => attach a new estimate to this project
  clientId: string;
  title: string;
  trade: Trade;
  pricingMode: PricingMode;
  rooms: Room[];
  lineItems: LineItem[];
  scopeNotes: string;
  ratesSnapshot: Rates;
  totals: Totals;
  status: 'draft' | 'final';
}

export interface SaveResult {
  projectId: string;
  estimateId: string;
}

/**
 * Persists an estimate and keeps its parent project in sync. Cross-entity
 * orchestration lives here (not in a repo) so each repository stays a thin,
 * swappable data-access layer.
 */
export async function saveEstimate(draft: SaveEstimateDraft): Promise<SaveResult> {
  const estimateFields = {
    trade: draft.trade,
    pricingMode: draft.pricingMode,
    rooms: draft.rooms,
    lineItems: draft.lineItems,
    ratesSnapshot: draft.ratesSnapshot,
    totals: draft.totals,
    scopeNotes: draft.scopeNotes,
    status: draft.status,
  };

  // Edit an existing estimate in place.
  if (draft.estimateId) {
    const updated = await estimateRepo.update(draft.estimateId, estimateFields);
    await projectRepo.update(updated.projectId, {
      title: draft.title,
      trade: draft.trade,
    });
    return { projectId: updated.projectId, estimateId: updated.id };
  }

  // Otherwise ensure we have a project to attach to.
  let projectId = draft.projectId;
  if (!projectId) {
    const project = await projectRepo.create({
      clientId: draft.clientId,
      title: draft.title,
      trade: draft.trade,
      status: 'estimating',
    });
    projectId = project.id;
  }

  const estimate = await estimateRepo.create({ projectId, ...estimateFields });

  // Link the estimate and reflect the latest title/trade on the project;
  // promote a fresh lead to "estimating".
  const project = await projectRepo.get(projectId);
  const patch: ProjectPatch = {
    title: draft.title,
    trade: draft.trade,
    estimateIds: [...(project?.estimateIds ?? []), estimate.id],
  };
  if (project?.status === 'lead') patch.status = 'estimating';
  await projectRepo.update(projectId, patch);

  return { projectId, estimateId: estimate.id };
}
