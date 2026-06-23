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
    const now = new Date();
    let outstanding = 0;
    let collectedThisMonth = 0;
    for (const est of estimates ?? []) {
      if (est.docType !== 'invoice') continue;
      if (est.paidStatus === 'paid') {
        if (est.paidDate && isSameMonth(parseISO(est.paidDate), now)) {
          collectedThisMonth += est.totals.total;
        }
      } else {
        // unpaid + partial: what's still owed (falls back to the full total)
        outstanding += est.amountDue ?? est.totals.total;
      }
    }
    return { active, outstanding, collectedThisMonth };
  }, [projects, estimates]);

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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">PK Estimator</h1>
          <p className="text-sm text-slate-500">Your jobs at a glance</p>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-3 gap-2.5">
        <StatCard label="Outstanding" value={formatMoneyWhole(stats.outstanding)} hint="unpaid invoices" />
        <StatCard label="Collected" value={formatMoneyWhole(stats.collectedThisMonth)} hint="this month" />
        <StatCard label="Active bids" value={String(stats.active)} hint="in progress" />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <Button
          fullWidth
          size="lg"
          leftIcon={<PlusIcon size={20} />}
          onClick={() => navigate('/quote/new')}
        >
          New Quote
        </Button>
        <Button
          fullWidth
          size="lg"
          variant="secondary"
          leftIcon={<PlusIcon size={20} />}
          onClick={() => navigate('/estimate/new')}
        >
          Painting Estimate
        </Button>
      </div>

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
          message="Start your first quote and it'll show up here."
          action={
            <Button leftIcon={<PlusIcon size={18} />} onClick={() => navigate('/quote/new')}>
              New Quote
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
