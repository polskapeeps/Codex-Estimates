// Pure list logic for the Jobs browse screen (search / sort / filter).
// No React, no Dexie — easy to reason about and unit-test.
import type { Client, Estimate, Project, ProjectStatus, Trade } from '../../lib/types';

export type SortKey = 'date' | 'client' | 'amount' | 'status';
export type SortDir = 'asc' | 'desc';

export interface JobRow {
  project: Project;
  clientName: string;
  /** Headline numbers from the latest estimate (null when none exists yet). */
  expected: number | null;
  low: number | null;
  high: number | null;
}

export interface JobFilter {
  query: string;
  statuses: ProjectStatus[]; // empty = all
  trades: Trade[]; // empty = all
  showArchived: boolean;
  sortKey: SortKey;
  sortDir: SortDir;
}

export const DEFAULT_JOB_FILTER: JobFilter = {
  query: '',
  statuses: [],
  trades: [],
  showArchived: false,
  sortKey: 'date',
  sortDir: 'desc',
};

// Order used when sorting by status (pipeline progression).
const STATUS_ORDER: Record<ProjectStatus, number> = {
  lead: 0,
  estimating: 1,
  bid_sent: 2,
  won: 3,
  on_hold: 4,
  lost: 5,
  archived: 6,
};

/** Latest estimate per project = highest version number. */
function latestByProject(estimates: Estimate[]): Map<string, Estimate> {
  const map = new Map<string, Estimate>();
  for (const e of estimates) {
    const current = map.get(e.projectId);
    if (!current || e.version > current.version) map.set(e.projectId, e);
  }
  return map;
}

export function buildJobRows(
  projects: Project[],
  clients: Client[],
  estimates: Estimate[],
): JobRow[] {
  const clientName = new Map(clients.map((c) => [c.id, c.name]));
  const latest = latestByProject(estimates);
  return projects.map((project) => {
    const est = latest.get(project.id);
    return {
      project,
      clientName: clientName.get(project.clientId) ?? 'Unknown client',
      expected: est ? est.totals.total : null,
      low: est ? est.totals.low : null,
      high: est ? est.totals.high : null,
    };
  });
}

export function filterAndSortJobs(rows: JobRow[], filter: JobFilter): JobRow[] {
  const q = filter.query.trim().toLowerCase();

  let out = rows.filter((row) => {
    const { project } = row;
    if (project.status === 'archived' && !filter.showArchived) return false;
    if (filter.statuses.length && !filter.statuses.includes(project.status)) return false;
    if (filter.trades.length && !filter.trades.includes(project.trade)) return false;
    if (q) {
      const haystack = [row.clientName, project.title, project.address ?? '']
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const dir = filter.sortDir === 'asc' ? 1 : -1;
  out = [...out].sort((a, b) => {
    let cmp = 0;
    switch (filter.sortKey) {
      case 'date':
        cmp = a.project.updatedAt.localeCompare(b.project.updatedAt);
        break;
      case 'client':
        cmp = a.clientName.localeCompare(b.clientName);
        break;
      case 'amount':
        cmp = (a.expected ?? -1) - (b.expected ?? -1);
        break;
      case 'status':
        cmp = STATUS_ORDER[a.project.status] - STATUS_ORDER[b.project.status];
        break;
    }
    if (cmp === 0) cmp = a.project.updatedAt.localeCompare(b.project.updatedAt);
    return cmp * dir;
  });

  return out;
}
