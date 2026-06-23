import { useMemo, useState, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { addDays } from 'date-fns';
import {
  Button,
  Card,
  Chip,
  Field,
  Input,
  PageHeader,
  Select,
  Textarea,
} from '../../components/ui';
import { DownloadIcon, PrinterIcon, TrashIcon } from '../../components/icons';
import { TotalsPanel } from '../estimates/TotalsPanel';
import { saveEstimate } from '../estimates/saveEstimate';
import { useClients, useRateBookByCategory, useRates } from '../../data/hooks';
import { useUI } from '../../store/ui';
import {
  bucketOf,
  computeDocumentEstimate,
  difficultyPctFor,
  lineItemAmount,
} from '../../lib/estimate/lineItems';
import { buildQuoteDocDefinition, type QuoteLine } from '../pdf/quotePdf';
import { downloadEstimatePdf, printEstimatePdf } from '../pdf/pdfClient';
import { centsToDollars, dollarsToCents, formatMoney } from '../../lib/money';
import {
  CALC_MODES,
  CATEGORIES,
  REASON_TAGS,
  calcModeMeta,
  makeDocumentLine,
  makeLineFromRateEntry,
} from './documentLine';
import type {
  CalcMode,
  DifficultyModifier,
  LineItem,
  MaterialsMode,
  RateCategory,
  RateEntry,
  ReasonTag,
} from '../../lib/types';

const QUICK_ADD: CalcMode[] = ['per_hour', 'per_unit', 'material', 'credit'];

export function DocumentBuilderPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useUI((s) => s.toast);
  const clients = useClients();
  const rates = useRates();

  const [clientId, setClientId] = useState(params.get('clientId') ?? '');
  const [jobTitle, setJobTitle] = useState('');
  const [jobAddress, setJobAddress] = useState('');
  const [materialsMode, setMaterialsMode] = useState<MaterialsMode>('in_estimate');
  const [category, setCategory] = useState<RateCategory>('painting');
  const [lines, setLines] = useState<LineItem[]>([]);
  const [scopeNotes, setScopeNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const selectedClient = clients?.find((c) => c.id === clientId);
  const chips = useRateBookByCategory(category);
  const categoryMeta = CATEGORIES.find((c) => c.value === category);
  const modifiers = rates?.difficultyModifiers ?? [];

  const estimate = useMemo(
    () => (rates ? computeDocumentEstimate(lines, rates, { materialsMode }) : null),
    [lines, rates, materialsMode],
  );

  function update(index: number, item: LineItem) {
    setLines((prev) => prev.map((it, i) => (i === index ? item : it)));
  }
  function remove(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }
  function add(mode: CalcMode) {
    setLines((prev) => [...prev, makeDocumentLine(mode)]);
  }
  function addFromEntry(entry: RateEntry) {
    setLines((prev) => [...prev, makeLineFromRateEntry(entry)]);
  }

  function buildCtx() {
    if (!rates || !estimate) return null;
    const quoteLines: QuoteLine[] = estimate.computation.lines.map((lc) => ({
      description:
        lc.item.clientDescription?.trim() ||
        lc.item.description?.trim() ||
        calcModeMeta(lc.item.calcMode).label,
      amount: lc.amount,
      isCredit: lc.bucket === 'credit',
    }));
    return {
      company: rates.company,
      docLabel: 'QUOTE',
      clientName: selectedClient?.name,
      clientContact:
        [selectedClient?.phone, selectedClient?.email].filter(Boolean).join('  ·  ') || undefined,
      jobTitle: jobTitle.trim() || 'Untitled job',
      jobAddress: jobAddress.trim() || selectedClient?.address || undefined,
      lines: quoteLines,
      totals: estimate.totals,
      materialsMode,
      validUntil: addDays(new Date(), 30).toISOString(),
      issueDate: new Date().toISOString(),
      scopeNotes: scopeNotes.trim() || undefined,
    } as const;
  }

  async function runPdf(action: 'print' | 'download') {
    const ctx = buildCtx();
    if (!ctx) return;
    if (lines.length === 0) {
      toast('Add at least one line first.', 'error');
      return;
    }
    setBusy(true);
    try {
      const docDef = buildQuoteDocDefinition(ctx);
      if (action === 'print') await printEstimatePdf(docDef);
      else await downloadEstimatePdf(docDef, `Quote-${ctx.clientName ?? ctx.jobTitle}`);
    } catch {
      toast('Could not generate the PDF.', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function handleSave() {
    if (!rates || !estimate) return;
    if (!clientId) {
      toast('Pick a client first.', 'error');
      return;
    }
    if (lines.length === 0) {
      toast('Add at least one line first.', 'error');
      return;
    }
    setBusy(true);
    try {
      const { projectId } = await saveEstimate({
        clientId,
        title: jobTitle.trim() || 'Untitled job',
        trade: 'general',
        pricingMode: 'full',
        docType: 'quote',
        materialsMode,
        rooms: [],
        lineItems: lines,
        scopeNotes,
        ratesSnapshot: rates,
        totals: estimate.totals,
        status: 'draft',
      });
      toast('Quote saved');
      navigate(`/jobs/${projectId}`);
    } catch {
      toast('Could not save the quote.', 'error');
    } finally {
      setBusy(false);
    }
  }

  const noClients = (clients?.length ?? 0) === 0;

  return (
    <div className="pb-40">
      <PageHeader title="New Quote" subtitle="Tap-add line items, then print a clean PDF" back />

      <div className="space-y-4">
        <Card className="space-y-3 p-4">
          <Field label="Client" required>
            {noClients ? (
              <p className="text-sm text-slate-500">
                No clients yet.{' '}
                <button
                  type="button"
                  className="font-medium text-brand-700 hover:underline"
                  onClick={() => navigate('/clients')}
                >
                  Add a client
                </button>{' '}
                first.
              </p>
            ) : (
              <Select value={clientId} onChange={(e) => setClientId(e.target.value)}>
                <option value="">Select a client…</option>
                {clients?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Job title">
            <Input
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. Interior repaint + window add-on"
            />
          </Field>
          <Field label="Job address" hint="Defaults to the client address on the PDF if left blank">
            <Input
              value={jobAddress}
              onChange={(e) => setJobAddress(e.target.value)}
              placeholder="Street, city"
            />
          </Field>
          <Field label="Materials">
            <Select
              value={materialsMode}
              onChange={(e) => setMaterialsMode(e.target.value as MaterialsMode)}
            >
              <option value="in_estimate">In the estimate (marked up + taxed)</option>
              <option value="separate">Billed separately (at cost)</option>
            </Select>
          </Field>
        </Card>

        <Card className="space-y-3 p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Rate Book — tap to add
          </h2>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <Chip key={c.value} active={category === c.value} onClick={() => setCategory(c.value)}>
                {c.label}
              </Chip>
            ))}
          </div>
          {categoryMeta?.warning && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-inset ring-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-900">
              {categoryMeta.warning}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {(chips ?? []).length === 0 ? (
              <p className="text-sm text-slate-400">No rates in this category yet.</p>
            ) : (
              chips!.map((entry) => (
                <Chip key={entry.id} onClick={() => addFromEntry(entry)}>
                  {entry.label}
                  <span className="ml-1.5 text-xs opacity-70">
                    {formatMoney(entry.defaultRate)}
                  </span>
                </Chip>
              ))
            )}
          </div>
        </Card>

        <div>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Line items
          </h2>
          <div className="space-y-3">
            {lines.length === 0 && (
              <Card className="px-4 py-6 text-center text-sm text-slate-500">
                No lines yet. Tap a button below to add labor, per-unit work, materials, or a credit.
              </Card>
            )}
            {lines.map((item, i) => (
              <LineRow
                key={item.id}
                item={item}
                modifiers={modifiers}
                onChange={(it) => update(i, it)}
                onRemove={() => remove(i)}
              />
            ))}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {QUICK_ADD.map((mode) => (
              <Button key={mode} variant="secondary" size="sm" onClick={() => add(mode)}>
                + {calcModeMeta(mode).label}
              </Button>
            ))}
          </div>
        </div>

        <Field label="Notes (optional)">
          <Textarea
            rows={3}
            value={scopeNotes}
            onChange={(e) => setScopeNotes(e.target.value)}
            placeholder="Anything the client should see — access, timing, exclusions."
          />
        </Field>

        <div className="grid grid-cols-2 gap-2">
          <Button leftIcon={<PrinterIcon size={18} />} onClick={() => runPdf('print')} disabled={busy}>
            Print quote
          </Button>
          <Button
            variant="secondary"
            leftIcon={<DownloadIcon size={18} />}
            onClick={() => runPdf('download')}
            disabled={busy}
          >
            Export PDF
          </Button>
        </div>
      </div>

      {estimate && (
        <TotalsPanel
          totals={estimate.totals}
          sticky
          action={
            <Button fullWidth onClick={handleSave} disabled={busy}>
              Save quote
            </Button>
          }
        />
      )}
    </div>
  );
}

function LineRow({
  item,
  modifiers,
  onChange,
  onRemove,
}: {
  item: LineItem;
  modifiers: DifficultyModifier[];
  onChange: (item: LineItem) => void;
  onRemove: () => void;
}) {
  const meta = calcModeMeta(item.calcMode);
  const isCredit = item.calcMode === 'credit';
  const isPerUnit = item.calcMode === 'per_unit';
  // Materials and credits don't take difficulty uplift (see lineItemAmount).
  const showModifiers = !isCredit && item.calcMode !== 'material' && modifiers.length > 0;
  const amount = lineItemAmount(item);

  const set = <K extends keyof LineItem>(key: K, value: LineItem[K]) =>
    onChange({ ...item, [key]: value });

  function changeMode(mode: CalcMode) {
    const next: LineItem = { ...item, calcMode: mode, unit: calcModeMeta(mode).unit };
    if (mode === 'credit' && !next.reasonTag) next.reasonTag = 'courtesy_credit';
    onChange(next);
  }

  function toggleModifier(id: string) {
    const active = item.modifierIds ?? [];
    const next = active.includes(id) ? active.filter((m) => m !== id) : [...active, id];
    onChange({ ...item, modifierIds: next, difficultyPct: difficultyPctFor(next, modifiers) });
  }

  return (
    <Card className="space-y-3 p-3">
      <div className="flex items-center gap-2">
        <Select
          value={item.calcMode ?? 'per_hour'}
          onChange={(e) => changeMode(e.target.value as CalcMode)}
          className="w-40"
        >
          {CALC_MODES.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </Select>
        <span
          className={
            'ml-auto text-sm font-semibold tabular-nums ' +
            (bucketOf(item.calcMode) === 'credit' ? 'text-green-700' : 'text-slate-900')
          }
        >
          {formatMoney(amount)}
        </span>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove line"
          className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
        >
          <TrashIcon size={18} />
        </button>
      </div>

      <Input
        value={item.clientDescription ?? ''}
        onChange={(e) => set('clientDescription', e.target.value)}
        placeholder="Scope shown to the client (e.g. 5 fixtures installed incl. high-access)"
      />

      <div className="grid grid-cols-2 gap-2">
        <LabeledField label={meta.qtyLabel}>
          <Input
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            value={item.qty}
            onChange={(e) => set('qty', Number.parseFloat(e.target.value) || 0)}
          />
        </LabeledField>
        <LabeledField label={meta.rateLabel}>
          <MoneyInput
            cents={item.unitCost}
            onChange={(cents) => set('unitCost', cents)}
          />
        </LabeledField>
        {isPerUnit && (
          <LabeledField label="Access premium / unit">
            <MoneyInput
              cents={item.accessPremiumCents ?? 0}
              onChange={(cents) => set('accessPremiumCents', cents)}
            />
          </LabeledField>
        )}
        {isCredit && (
          <LabeledField label="Reason (required)">
            <Select
              value={item.reasonTag ?? ''}
              onChange={(e) => set('reasonTag', (e.target.value || undefined) as ReasonTag | undefined)}
            >
              {REASON_TAGS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </Select>
          </LabeledField>
        )}
      </div>

      {showModifiers && (
        <div>
          <p className="mb-1.5 text-[11px] font-medium text-slate-500">Difficulty</p>
          <div className="flex flex-wrap gap-1.5">
            {modifiers.map((m) => (
              <Chip
                key={m.id}
                active={(item.modifierIds ?? []).includes(m.id)}
                onClick={() => toggleModifier(m.id)}
              >
                {m.label}
                <span className="ml-1 text-xs opacity-70">+{Math.round(m.pct * 100)}%</span>
              </Chip>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

function MoneyInput({ cents, onChange }: { cents: number; onChange: (cents: number) => void }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
        $
      </span>
      <Input
        type="number"
        inputMode="decimal"
        min="0"
        step="0.01"
        value={centsToDollars(cents)}
        onChange={(e) => onChange(dollarsToCents(Number.parseFloat(e.target.value) || 0))}
        className="pl-6"
      />
    </div>
  );
}

function LabeledField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-slate-500">{label}</label>
      {children}
    </div>
  );
}
