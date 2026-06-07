import type { Project, ProjectStatus } from './types';
import { nowIso } from './ids';

export interface StatusMeta {
  label: string;
  /** Full Tailwind class literals (kept verbatim so the JIT compiler retains them). */
  chipClass: string;
  dotClass: string;
}

// Color coding per spec §18.
export const STATUS_META: Record<ProjectStatus, StatusMeta> = {
  lead: {
    label: 'Lead',
    chipClass: 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200',
    dotClass: 'bg-slate-400',
  },
  estimating: {
    label: 'Estimating',
    chipClass: 'bg-blue-100 text-blue-700 ring-1 ring-inset ring-blue-200',
    dotClass: 'bg-blue-500',
  },
  bid_sent: {
    label: 'Bid sent',
    chipClass: 'bg-amber-100 text-amber-800 ring-1 ring-inset ring-amber-200',
    dotClass: 'bg-amber-500',
  },
  won: {
    label: 'Won',
    chipClass: 'bg-green-100 text-green-700 ring-1 ring-inset ring-green-200',
    dotClass: 'bg-green-500',
  },
  lost: {
    label: 'Lost',
    chipClass: 'bg-red-100 text-red-700 ring-1 ring-inset ring-red-200',
    dotClass: 'bg-red-500',
  },
  on_hold: {
    label: 'On hold',
    chipClass: 'bg-purple-100 text-purple-700 ring-1 ring-inset ring-purple-200',
    dotClass: 'bg-purple-500',
  },
  archived: {
    label: 'Archived',
    chipClass: 'bg-slate-200 text-slate-500 ring-1 ring-inset ring-slate-300',
    dotClass: 'bg-slate-400',
  },
};

/** Statuses offered in the quick pipeline picker (archive is a separate action). */
export const PIPELINE_STATUSES: ProjectStatus[] = [
  'lead',
  'estimating',
  'bid_sent',
  'won',
  'lost',
  'on_hold',
];

/** Statuses considered "active" work (not decided, not archived). */
export const ACTIVE_STATUSES: ProjectStatus[] = ['lead', 'estimating', 'bid_sent'];

const DECISION_STATUSES: ProjectStatus[] = ['won', 'lost', 'on_hold'];

/**
 * Pure status transition: returns the patch to apply, including the
 * timestamp side-effects from spec §3 (bid_sent -> bidSentAt; a
 * won/lost/on_hold decision -> decisionAt).
 */
export function applyStatusChange(
  project: Pick<Project, 'status' | 'bidSentAt'>,
  next: ProjectStatus,
  now: string = nowIso(),
): Partial<Project> {
  const patch: Partial<Project> = { status: next, updatedAt: now };
  if (next === 'bid_sent' && !project.bidSentAt) {
    patch.bidSentAt = now;
  }
  if (DECISION_STATUSES.includes(next)) {
    patch.decisionAt = now;
  }
  return patch;
}

export function isArchived(status: ProjectStatus): boolean {
  return status === 'archived';
}
