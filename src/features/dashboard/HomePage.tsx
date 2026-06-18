import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { isSameMonth, parseISO } from 'date-fns';
import { Button, Card, EmptyState } from '../../components/ui';
import { JobsIcon, PlusIcon } from '../../components/icons';
import { JobCard } from '../projects/JobCard';
import { buildJobRows } from '../projects/jobsQuery';
import { useAllEstimates, useClients, useProjects } from '../../data/hooks';
import { ACTIVE_STATUSES } from '../../lib/status';
import { formatMoneyWhole } from '../../lib/money';

export function HomePage() {
  const projects = useProjects();
  const clients = useClients();
  const estimates = useAllEstimates();
  const navigate = useNavigate();

  const rows = useMemo(
    () => buildJobRows(projects ?? [], clients ?? [], estimates ?? []),
    [projects, clients, estimates],
  );

  const stats = useMemo(() => {
    const list = projects ?? [];
    const active = list.filter((p) => ACTIVE_STATUSES.includes(p.status)).length;
    const awaiting = list.filter((p) => p.status === 'bid_sent').length;
    const now = new Date();
    let wonThisMonth = 0;
    for (const row of rows) {
      const p = row.project;
      if (p.status === 'won' && p.decisionAt && isSameMonth(parseISO(p.decisionAt), now)) {
        wonThisMonth += row.expected ?? 0;
      }
    }
    return { active, awaiting, wonThisMonth };
  }, [projects, rows]);

  const recent = useMemo(
    () =>
      [...rows]
        .filter((r) => r.project.status !== 'archived')
        .sort((a, b) => b.project.updatedAt.localeCompare(a.project.updatedAt))
        .slice(0, 5),
    [rows],
  );

  const hasData = (projects?.length ?? 0) > 0;

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Estimator</h1>
          <p className="text-sm text-slate-500">Your jobs at a glance</p>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-3 gap-2.5">
        <StatCard label="Active bids" value={String(stats.active)} />
        <StatCard label="Awaiting" value={String(stats.awaiting)} hint="bid sent" />
        <StatCard label="Won / mo" value={formatMoneyWhole(stats.wonThisMonth)} />
      </div>

      <Button
        fullWidth
        size="lg"
        leftIcon={<PlusIcon size={20} />}
        onClick={() => navigate('/estimate/new')}
        className="mb-6"
      >
        New Estimate
      </Button>

      <Card className="mb-6 border-l-4 border-brand-700 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Window cleaning</h2>
            <p className="mt-1 text-sm text-slate-500">
              Quick mobile quote for inside/outside glass, screens, tracks, and high access.
            </p>
          </div>
        </div>
        <Button
          fullWidth
          variant="secondary"
          className="mt-3"
          onClick={() => navigate('/window-estimator')}
        >
          Open window estimator
        </Button>
      </Card>

      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Recent jobs</h2>
        {hasData && (
          <Link to="/jobs" className="text-sm font-medium text-brand-700">
            View all
          </Link>
        )}
      </div>

      {!hasData ? (
        <EmptyState
          icon={<JobsIcon size={40} />}
          title="No jobs yet"
          message="Start your first estimate and it'll show up here."
          action={
            <Button leftIcon={<PlusIcon size={18} />} onClick={() => navigate('/estimate/new')}>
              New Estimate
            </Button>
          }
        />
      ) : recent.length === 0 ? (
        <Card className="px-4 py-6 text-center text-sm text-slate-500">
          All caught up — nothing active.
        </Card>
      ) : (
        <ul className="space-y-2">
          {recent.map((row) => (
            <li key={row.project.id}>
              <JobCard row={row} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="px-3 py-3.5">
      <p className="text-xl font-bold tabular-nums text-slate-900">{value}</p>
      <p className="mt-0.5 text-xs font-medium text-slate-500">{label}</p>
      {hint && <p className="text-[10px] uppercase tracking-wide text-slate-400">{hint}</p>}
    </Card>
  );
}
