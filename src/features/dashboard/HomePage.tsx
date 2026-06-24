import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format, isSameMonth, parseISO } from 'date-fns';
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
    let outstanding = 0;
    let collectedThisMonth = 0;

    for (const estimate of estimates ?? []) {
      if (estimate.docType !== 'invoice') continue;
      if (estimate.paidStatus === 'paid') {
        if (estimate.paidDate && isSameMonth(parseISO(estimate.paidDate), now)) {
          collectedThisMonth += estimate.totals.total;
        }
      } else {
        outstanding += estimate.amountDue ?? estimate.totals.total;
      }
    }

    return { active, awaiting, outstanding, collectedThisMonth };
  }, [projects, estimates]);

  const recent = useMemo(
    () =>
      [...rows]
        .filter((row) => row.project.status !== 'archived')
        .sort((a, b) => b.project.updatedAt.localeCompare(a.project.updatedAt))
        .slice(0, 5),
    [rows],
  );

  const now = new Date();
  const greeting =
    now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening';
  const hasData = (projects?.length ?? 0) > 0;

  return (
    <div>
      <header className="mb-7 flex items-start justify-between gap-5 md:mb-8">
        <div>
          <h1 className="text-[30px] font-extrabold leading-tight tracking-[-0.04em] text-slate-900 md:text-[34px]">
            {greeting}, Peter
          </h1>
          <p className="mt-1.5 text-[15px] text-slate-500 md:text-base">
            Here’s where your jobs and money stand today.
          </p>
        </div>
        <div className="hidden pt-1 text-right sm:block">
          <p className="text-[13px] font-bold uppercase tracking-[0.04em] text-brand-700">
            {format(now, 'EEEE')}
          </p>
          <p className="mt-0.5 text-[18px] font-bold text-slate-200">
            {format(now, 'MMMM d, yyyy')}
          </p>
        </div>
      </header>

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-[18px]">
        <StatCard
          label="Active bids"
          value={String(stats.active)}
          hint={`${stats.awaiting} awaiting client`}
          gold
        />
        <StatCard
          label="Outstanding"
          value={formatMoneyWhole(stats.outstanding)}
          hint="unpaid invoices"
        />
        <StatCard
          label="Collected"
          value={formatMoneyWhole(stats.collectedThisMonth)}
          hint="paid this month"
          positive
        />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
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
          onClick={() => navigate('/estimate/new')}
        >
          Painting Calculator
        </Button>
      </div>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="pk-section-label">Recent jobs</h2>
        {hasData && (
          <Link to="/jobs" className="text-sm font-semibold text-brand-700 hover:text-brand-500">
            View all →
          </Link>
        )}
      </div>

      {!hasData ? (
        <EmptyState
          icon={<JobsIcon size={40} />}
          title="No jobs yet"
          message="Start your first quote and it’ll show up here."
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
        <ul className="pk-list">
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

function StatCard({
  label,
  value,
  hint,
  gold,
  positive,
}: {
  label: string;
  value: string;
  hint: string;
  gold?: boolean;
  positive?: boolean;
}) {
  return (
    <Card className="px-5 py-5 sm:px-6 sm:py-6">
      <p className="pk-section-label">{label}</p>
      <p
        className={`mt-2 text-[34px] font-extrabold tracking-[-0.045em] tabular-nums md:text-[42px] ${
          gold ? 'text-brand-500' : 'text-slate-900'
        }`}
      >
        {value}
      </p>
      <p className={`mt-1 text-sm ${positive ? 'font-semibold text-green-700' : 'text-slate-400'}`}>
        {hint}
      </p>
    </Card>
  );
}
