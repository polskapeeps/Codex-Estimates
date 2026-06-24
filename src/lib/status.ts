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
    chipClass: 'status-chip status-chip--neutral',
    dotClass: 'status-dot--neutral',
  },
  estimating: {
    label: 'Estimating',
    chipClass: 'status-chip status-chip--gold',
    dotClass: 'status-dot--gold',
  },
  bid_sent: {
    label: 'Bid sent',
    chipClass: 'status-chip status-chip--gold',
    dotClass: 'status-dot--gold',
  },
  won: {
    label: 'Won',
    chipClass: 'status-chip status-chip--positive',
    dotClass: 'status-dot--positive',
  },
  lost: {
    label: 'Lost',
    chipClass: 'status-chip status-chip--negative',
    dotClass: 'status-dot--negative',
  },
  on_hold: {
    label: 'On hold',
    chipClass: 'status-chip status-chip--neutral',
    dotClass: 'status-dot--neutral',
  },
  archived: {
    label: 'Archived',
    chipClass: 'status-chip status-chip--muted',
    dotClass: 'status-dot--neutral',
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
