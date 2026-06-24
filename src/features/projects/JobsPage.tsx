import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Chip, EmptyState, Input, PageHeader, Select } from '../../components/ui';
import { JobsIcon, PlusIcon, SearchIcon } from '../../components/icons';
import { useAllEstimates, useClients, useProjects } from '../../data/hooks';
import { JobCard } from './JobCard';
import { ProjectForm } from './ProjectForm';
import {
  DEFAULT_JOB_FILTER,
  buildJobRows,
  filterAndSortJobs,
  type JobFilter,
  type SortDir,
  type SortKey,
} from './jobsQuery';
import { PIPELINE_STATUSES, STATUS_META } from '../../lib/status';
import type { ProjectStatus, Trade } from '../../lib/types';

const SORT_OPTIONS: { value: string; label: string; key: SortKey; dir: SortDir }[] = [
  { value: 'date_desc', label: 'Newest first', key: 'date', dir: 'desc' },
  { value: 'date_asc', label: 'Oldest first', key: 'date', dir: 'asc' },
  { value: 'client_asc', label: 'Client A–Z', key: 'client', dir: 'asc' },
  { value: 'amount_desc', label: 'Amount high→low', key: 'amount', dir: 'desc' },
  { value: 'amount_asc', label: 'Amount low→high', key: 'amount', dir: 'asc' },
  { value: 'status_asc', label: 'Status', key: 'status', dir: 'asc' },
];

export function JobsPage() {
  const navigate = useNavigate();
  const projects = useProjects();
  const clients = useClients();
  const estimates = useAllEstimates();
  const [filter, setFilter] = useState<JobFilter>(DEFAULT_JOB_FILTER);
  const [formOpen, setFormOpen] = useState(false);

  const rows = useMemo(
    () => buildJobRows(projects ?? [], clients ?? [], estimates ?? []),
    [projects, clients, estimates],
  );
  const visible = useMemo(() => filterAndSortJobs(rows, filter), [rows, filter]);

  const toggleStatus = (s: ProjectStatus) =>
    setFilter((f) => ({
      ...f,
      statuses: f.statuses.includes(s)
        ? f.statuses.filter((x) => x !== s)
        : [...f.statuses, s],
    }));

  const toggleTrade = (t: Trade) =>
    setFilter((f) => ({
      ...f,
      trades: f.trades.includes(t) ? f.trades.filter((x) => x !== t) : [...f.trades, t],
    }));

  const sortValue =
    SORT_OPTIONS.find((o) => o.key === filter.sortKey && o.dir === filter.sortDir)?.value ??
    'date_desc';

  const hasJobs = (projects?.length ?? 0) > 0;

  return (
    <div>
      <PageHeader
        title="Jobs"
        subtitle={hasJobs ? `${visible.length} of ${projects!.length}` : undefined}
        right={
          <>
            <Button
              size="sm"
              variant="secondary"
              className="hidden sm:inline-flex"
              onClick={() => setFormOpen(true)}
            >
              New job
            </Button>
            <Button
              size="sm"
              leftIcon={<PlusIcon size={18} />}
              onClick={() => navigate('/quote/new')}
            >
              New quote
            </Button>
          </>
        }
      />

      {hasJobs && (
        <div className="mb-4 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <SearchIcon
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <Input
                value={filter.query}
                onChange={(e) => setFilter((f) => ({ ...f, query: e.target.value }))}
                placeholder="Search client, title, address…"
                className="pl-10"
              />
            </div>
            <Select
              aria-label="Sort"
              value={sortValue}
              onChange={(e) => {
                const opt = SORT_OPTIONS.find((o) => o.value === e.target.value)!;
                setFilter((f) => ({ ...f, sortKey: opt.key, sortDir: opt.dir }));
              }}
              className="w-40 shrink-0"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
            {PIPELINE_STATUSES.map((s) => (
              <Chip
                key={s}
                active={filter.statuses.includes(s)}
                onClick={() => toggleStatus(s)}
              >
                {STATUS_META[s].label}
              </Chip>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Trade
            </span>
            <Chip active={filter.trades.includes('painting')} onClick={() => toggleTrade('painting')}>
              Painting
            </Chip>
            <Chip active={filter.trades.includes('general')} onClick={() => toggleTrade('general')}>
              General
            </Chip>
            <span className="ml-auto">
              <Chip
                active={filter.showArchived}
                onClick={() => setFilter((f) => ({ ...f, showArchived: !f.showArchived }))}
              >
                {filter.showArchived ? 'Hiding archived' : 'Show archived'}
              </Chip>
            </span>
          </div>
        </div>
      )}

      {projects === undefined ? null : !hasJobs ? (
        <EmptyState
          icon={<JobsIcon size={40} />}
          title="No jobs yet"
          message="Create a job to start tracking leads and estimates."
          action={
            <Button leftIcon={<PlusIcon size={18} />} onClick={() => setFormOpen(true)}>
              New job
            </Button>
          }
        />
      ) : visible.length === 0 ? (
        <EmptyState title="No matches" message="Adjust your search or filters." />
      ) : (
        <ul className="pk-list">
          {visible.map((row) => (
            <li key={row.project.id}>
              <JobCard row={row} />
            </li>
          ))}
        </ul>
      )}

      <ProjectForm open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  );
}
