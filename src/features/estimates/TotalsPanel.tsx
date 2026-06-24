import { useState, type ReactNode } from 'react';
import { ChevronDownIcon } from '../../components/icons';
import { formatMoney, formatMoneyWhole } from '../../lib/money';
import { cn } from '../../lib/cn';
import type { PricingMode, Totals } from '../../lib/types';

interface TotalsPanelProps {
  totals: Totals;
  pricingMode?: PricingMode;
  /** Extra breakdown rows shown above the money rows (e.g. gallons). */
  extra?: ReactNode;
  /** Always-visible action (e.g. Save), shown under the headline. */
  action?: ReactNode;
  /** Render as a sticky bottom bar (collapsible). */
  sticky?: boolean;
}

export function TotalsPanel({
  totals,
  pricingMode = 'full',
  extra,
  action,
  sticky,
}: TotalsPanelProps) {
  const [open, setOpen] = useState(!sticky);
  const showLabor = totals.labor !== 0 || totals.laborHours !== 0;
  const laborOnly = pricingMode === 'labor_only';

  const body = (
    <div className="mx-auto w-full max-w-[1000px]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left sm:px-5"
      >
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            {laborOnly ? 'Labor only' : 'Estimate'}
          </p>
          <p className="text-[30px] font-extrabold tracking-[-0.04em] tabular-nums text-brand-500 md:text-[36px]">
            {formatMoneyWhole(totals.total)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-right text-sm text-slate-500">
            {formatMoneyWhole(totals.low)} – {formatMoneyWhole(totals.high)}
            <span className="block text-xs text-slate-400">expected range</span>
          </p>
          <ChevronDownIcon
            size={20}
            className={cn('text-slate-400 transition-transform', open && 'rotate-180')}
          />
        </div>
      </button>

      {action && <div className="px-4 pb-3 sm:px-5">{action}</div>}

      {open && (
        <div className="border-t border-white/[0.06] px-4 py-3 sm:px-5">
          {extra}
          {laborOnly ? (
            <dl className="space-y-1.5 text-sm">
              <Row
                label={`Labor (${totals.laborHours.toFixed(1)} hrs)`}
                value={formatMoney(totals.labor)}
              />
              <div className="mt-1 flex items-center justify-between border-t border-slate-100 pt-2">
                <dt className="font-semibold text-slate-900">Total labor</dt>
                <dd className="font-bold tabular-nums text-slate-900">
                  {formatMoney(totals.total)}
                </dd>
              </div>
            </dl>
          ) : (
            <dl className="space-y-1.5 text-sm">
              <Row label="Materials" value={formatMoney(totals.materials)} />
              {showLabor && (
                <Row
                  label={`Labor (${totals.laborHours.toFixed(1)} hrs)`}
                  value={formatMoney(totals.labor)}
                />
              )}
              <Row label="Subtotal" value={formatMoney(totals.subtotal)} muted />
              <Row label="Markup" value={formatMoney(totals.markup)} />
              {totals.discounts !== 0 && (
                <Row label="Credit applied" value={`(${formatMoney(Math.abs(totals.discounts))})`} />
              )}
              <Row label="Tax" value={formatMoney(totals.tax)} />
              <div className="mt-1 flex items-center justify-between border-t border-slate-100 pt-2">
                <dt className="font-semibold text-slate-900">Total</dt>
                <dd className="font-bold tabular-nums text-slate-900">
                  {formatMoney(totals.total)}
                </dd>
              </div>
            </dl>
          )}
          <p className="mt-2 text-xs text-slate-400">
            {laborOnly
              ? 'Materials, markup, and tax not included.'
              : 'Rough estimate - subject to change after inspection.'}
          </p>
        </div>
      )}
    </div>
  );

  if (sticky) {
    return (
      <div className="fixed inset-x-0 bottom-16 z-40 border-t border-brand-600/35 bg-[#16120b]/95 shadow-[0_-12px_30px_rgba(0,0,0,0.3)] backdrop-blur-xl pb-safe md:bottom-0 md:pl-[272px]">
        {body}
      </div>
    );
  }

  return <div className="rounded-[18px] border border-white/[0.07] bg-[#1d1810]">{body}</div>;
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className={cn(muted ? 'text-slate-500' : 'text-slate-600')}>{label}</dt>
      <dd className={cn('tabular-nums', muted ? 'text-slate-600' : 'text-slate-800')}>{value}</dd>
    </div>
  );
}
