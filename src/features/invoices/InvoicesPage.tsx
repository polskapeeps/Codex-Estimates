import { useMemo } from 'react';
import { isBefore, isSameMonth, parseISO, startOfDay } from 'date-fns';
import { Link } from 'react-router-dom';
import { Card, EmptyState, PageHeader } from '../../components/ui';
import { ReceiptIcon } from '../../components/icons';
import { useAllEstimates, useClients, useProjects } from '../../data/hooks';
import { formatDate } from '../../lib/format';
import { formatMoneyWhole } from '../../lib/money';
import { cn } from '../../lib/cn';
import type { Estimate } from '../../lib/types';

export function InvoicesPage() {
  const estimates = useAllEstimates();
  const projects = useProjects();
  const clients = useClients();

  const rows = useMemo(() => {
    const projectMap = new Map((projects ?? []).map((project) => [project.id, project]));
    const clientMap = new Map((clients ?? []).map((client) => [client.id, client]));

    return (estimates ?? [])
      .filter((estimate) => estimate.docType === 'invoice')
      .map((invoice) => {
        const project = projectMap.get(invoice.projectId);
        const client = project ? clientMap.get(project.clientId) : undefined;
        return { invoice, project, client };
      })
      .sort((a, b) =>
        (b.invoice.issueDate ?? b.invoice.createdAt).localeCompare(
          a.invoice.issueDate ?? a.invoice.createdAt,
        ),
      );
  }, [clients, estimates, projects]);

  const summary = useMemo(() => {
    const now = new Date();
    let outstanding = 0;
    let paidThisMonth = 0;
    let paidCount = 0;

    for (const { invoice } of rows) {
      if (invoice.paidStatus === 'paid') {
        if (invoice.paidDate && isSameMonth(parseISO(invoice.paidDate), now)) {
          paidThisMonth += invoice.totals.total;
          paidCount += 1;
        }
      } else {
        outstanding += invoice.amountDue ?? invoice.totals.total;
      }
    }

    return { outstanding, paidThisMonth, paidCount };
  }, [rows]);

  return (
    <div>
      <PageHeader
        title="Invoices"
        subtitle="Track what’s billed, paid, and still owed."
      />

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <SummaryCard
          label="Outstanding"
          value={formatMoneyWhole(summary.outstanding)}
          hint={`${rows.filter(({ invoice }) => invoice.paidStatus !== 'paid').length} open invoices`}
          gold
        />
        <SummaryCard
          label="Paid this month"
          value={formatMoneyWhole(summary.paidThisMonth)}
          hint={`${summary.paidCount} cleared`}
          positive
        />
      </div>

      {estimates === undefined ? null : rows.length === 0 ? (
        <EmptyState
          icon={<ReceiptIcon size={40} />}
          title="No invoices yet"
          message="Convert a quote to an invoice and it will appear here automatically."
        />
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="hidden grid-cols-[110px_minmax(0,1fr)_110px_100px_110px] gap-3 border-b border-white/[0.06] px-5 py-3 text-[12px] font-bold uppercase tracking-[0.06em] text-slate-400 sm:grid">
            <span>Invoice</span>
            <span>Client / job</span>
            <span>Issued</span>
            <span>Status</span>
            <span className="text-right">Amount</span>
          </div>
          <div className="divide-y divide-white/[0.055]">
            {rows.map(({ invoice, project, client }) => {
              const status = invoiceStatus(invoice);
              return (
                <Link
                  key={invoice.id}
                  to={`/estimate/${invoice.id}`}
                  className="grid gap-2 px-4 py-4 hover:bg-brand-600/[0.045] sm:grid-cols-[110px_minmax(0,1fr)_110px_100px_110px] sm:items-center sm:gap-3 sm:px-5"
                >
                  <span className="text-sm font-bold text-brand-500">
                    {invoice.invoiceNumber || `INV-${invoice.version}`}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-slate-900">
                      {client?.name ?? 'Unknown client'}
                    </span>
                    <span className="block truncate text-xs text-slate-400">
                      {project?.title ?? 'Untitled job'}
                    </span>
                  </span>
                  <span className="text-sm text-slate-500">
                    {formatDate(invoice.issueDate ?? invoice.createdAt)}
                  </span>
                  <span
                    className={cn(
                      'w-fit rounded-full border px-2.5 py-1 text-xs font-bold',
                      status.className,
                    )}
                  >
                    {status.label}
                  </span>
                  <span className="text-left text-base font-bold tabular-nums text-slate-900 sm:text-right">
                    {formatMoneyWhole(
                      invoice.paidStatus === 'paid'
                        ? invoice.totals.total
                        : invoice.amountDue ?? invoice.totals.total,
                    )}
                  </span>
                </Link>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

function SummaryCard({
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
    <Card className="px-5 py-5">
      <p className="pk-section-label">{label}</p>
      <p className={cn('mt-2 text-[34px] font-extrabold tracking-[-0.04em] tabular-nums', gold ? 'text-brand-500' : 'text-slate-900')}>
        {value}
      </p>
      <p className={cn('mt-1 text-sm', positive ? 'text-green-700' : 'text-slate-400')}>
        {hint}
      </p>
    </Card>
  );
}

function invoiceStatus(invoice: Estimate): { label: string; className: string } {
  if (invoice.paidStatus === 'paid') {
    return {
      label: 'Paid',
      className: 'border-[#7fbf95]/20 bg-[#7fbf95]/15 text-[#8fd0a6]',
    };
  }
  if (invoice.paidStatus === 'partial') {
    return {
      label: 'Partial',
      className: 'border-brand-600/25 bg-brand-600/[0.14] text-[#ebc069]',
    };
  }
  if (
    invoice.dueDate &&
    isBefore(parseISO(invoice.dueDate), startOfDay(new Date()))
  ) {
    return {
      label: 'Overdue',
      className: 'border-[#c87b6b]/25 bg-[#c87b6b]/15 text-[#e0a595]',
    };
  }
  return {
    label: 'Due',
    className: 'border-brand-600/25 bg-brand-600/[0.14] text-[#ebc069]',
  };
}
