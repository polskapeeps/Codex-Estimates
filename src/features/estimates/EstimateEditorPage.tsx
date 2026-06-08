import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Button,
  Card,
  Field,
  Input,
  PageHeader,
  Select,
  Textarea,
} from '../../components/ui';
import { PlusIcon } from '../../components/icons';
import { TradePicker } from '../../components/TradePicker';
import { PaintingCalculator } from '../painting/PaintingCalculator';
import { makeNewRoom } from '../painting/room';
import { ClientForm } from '../clients/ClientForm';
import { GeneralEditor } from '../general/GeneralEditor';
import { TotalsPanel } from './TotalsPanel';
import { saveEstimate } from './saveEstimate';
import { useClients, useEstimate, useLibraryItems, useProject, useRates } from '../../data/hooks';
import { libraryRepo } from '../../data/repositories';
import { useUI } from '../../store/ui';
import { computePaintingEstimate } from '../../lib/estimate/painting';
import { computeGeneralEstimate } from '../../lib/estimate/general';
import { computeTotals } from '../../lib/estimate/totals';
import { cn } from '../../lib/cn';
import type { LineItem, PricingMode, Rates, Room, Totals, Trade } from '../../lib/types';

interface DraftState {
  clientId: string;
  title: string;
  trade: Trade;
  pricingMode: PricingMode;
  rooms: Room[];
  lineItems: LineItem[];
  scopeNotes: string;
}

function zeroTotals(rates: Rates): Totals {
  return computeTotals({ materials: 0, labor: 0, laborHours: 0 }, rates);
}

export function EstimateEditorPage() {
  const [params] = useSearchParams();
  const { estimateId } = useParams();
  const navigate = useNavigate();
  const toast = useUI((s) => s.toast);
  const rates = useRates();
  const clients = useClients();
  const library = useLibraryItems();

  const projectIdParam = params.get('projectId') ?? undefined;
  const editingEstimate = useEstimate(estimateId);
  const boundProjectId = estimateId ? editingEstimate?.projectId : projectIdParam;
  const sourceProject = useProject(boundProjectId);

  const [draft, setDraft] = useState<DraftState | null>(null);
  const [clientFormOpen, setClientFormOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  // Initialise the draft once the data it depends on is available.
  useEffect(() => {
    if (draft) return;
    if (estimateId) {
      if (editingEstimate && sourceProject) {
        setDraft({
          clientId: sourceProject.clientId,
          title: sourceProject.title,
          trade: editingEstimate.trade,
          pricingMode: editingEstimate.pricingMode ?? 'full',
          rooms: editingEstimate.rooms.length ? editingEstimate.rooms : [makeNewRoom()],
          lineItems: editingEstimate.lineItems,
          scopeNotes: editingEstimate.scopeNotes ?? '',
        });
      }
    } else if (projectIdParam) {
      if (sourceProject) {
        setDraft({
          clientId: sourceProject.clientId,
          title: sourceProject.title,
          trade: sourceProject.trade,
          pricingMode: 'full',
          rooms: [makeNewRoom()],
          lineItems: [],
          scopeNotes: '',
        });
      }
    } else {
      setDraft({
        clientId: '',
        title: '',
        trade: 'painting',
        pricingMode: 'full',
        rooms: [makeNewRoom()],
        lineItems: [],
        scopeNotes: '',
      });
    }
  }, [draft, estimateId, editingEstimate, sourceProject, projectIdParam]);

  const painting = useMemo(
    () =>
      rates && draft?.trade === 'painting'
        ? computePaintingEstimate(draft.rooms, rates, draft.pricingMode)
        : null,
    [rates, draft],
  );
  const general = useMemo(
    () =>
      rates && draft?.trade === 'general'
        ? computeGeneralEstimate(draft.lineItems, rates)
        : null,
    [rates, draft],
  );

  if (!draft || !rates) {
    return (
      <div>
        <PageHeader title={estimateId ? 'Edit estimate' : 'New estimate'} back />
        <Card className="px-4 py-6 text-center text-sm text-slate-500">Loading…</Card>
      </div>
    );
  }

  const totals = painting?.totals ?? general?.totals ?? zeroTotals(rates);
  const clientFixed = Boolean(estimateId || projectIdParam);
  const update = (patch: Partial<DraftState>) => setDraft((d) => ({ ...d!, ...patch }));

  async function handleSave() {
    setError(undefined);
    if (!draft!.clientId) {
      setError('Pick a client first.');
      return;
    }
    if (!draft!.title.trim()) {
      setError('Give the job a title.');
      return;
    }
    setSaving(true);
    try {
      const result = await saveEstimate({
        estimateId,
        projectId: boundProjectId,
        clientId: draft!.clientId,
        title: draft!.title.trim(),
        trade: draft!.trade,
        pricingMode: draft!.trade === 'painting' ? draft!.pricingMode : 'full',
        rooms: draft!.trade === 'painting' ? draft!.rooms : [],
        lineItems: draft!.trade === 'general' ? draft!.lineItems : [],
        scopeNotes: draft!.scopeNotes,
        ratesSnapshot: rates!,
        totals,
        status: 'draft',
      });
      toast('Estimate saved');
      navigate(`/estimate/${result.estimateId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the estimate.');
      setSaving(false);
    }
  }

  const selectedClient = clients?.find((c) => c.id === draft.clientId);

  const extra =
    draft.trade === 'painting' && painting ? (
      <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
        <span>
          {painting.computation.paintGallons} gal paint
          {draft.pricingMode === 'labor_only' ? ' not included' : ''}
        </span>
        {painting.computation.primerGallons > 0 && (
          <span>
            {painting.computation.primerGallons} gal primer
            {draft.pricingMode === 'labor_only' ? ' not included' : ''}
          </span>
        )}
        <span>{Math.round(painting.computation.totalAppliedSqft)} sqft applied</span>
      </div>
    ) : null;

  return (
    <div className="pb-64">
      <PageHeader title={estimateId ? 'Edit estimate' : 'New estimate'} back />

      {/* Client */}
      <section className="mb-5">
        <h2 className="mb-2 text-sm font-semibold text-slate-800">Client</h2>
        {clientFixed ? (
          <Card className="px-4 py-3">
            <p className="font-medium text-slate-900">{selectedClient?.name ?? '—'}</p>
          </Card>
        ) : (
          <Field error={error && !draft.clientId ? error : undefined}>
            <div className="flex gap-2">
              <Select
                value={draft.clientId}
                onChange={(e) => update({ clientId: e.target.value })}
                className="flex-1"
              >
                <option value="">Select client…</option>
                {(clients ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.company ? ` (${c.company})` : ''}
                  </option>
                ))}
              </Select>
              <Button
                variant="secondary"
                leftIcon={<PlusIcon size={18} />}
                onClick={() => setClientFormOpen(true)}
              >
                New
              </Button>
            </div>
          </Field>
        )}
      </section>

      {/* Job + trade */}
      <section className="mb-5 space-y-4">
        <Field label="Job title">
          <Input
            value={draft.title}
            onChange={(e) => update({ title: e.target.value })}
            placeholder="Interior repaint — 2nd floor"
          />
        </Field>
        <Field label="Trade">
          <TradePicker value={draft.trade} onChange={(trade) => update({ trade })} />
        </Field>
        {draft.trade === 'painting' && (
          <Field label="Pricing mode">
            <PricingModePicker
              value={draft.pricingMode}
              onChange={(pricingMode) => update({ pricingMode })}
            />
          </Field>
        )}
      </section>

      {/* Calculator */}
      <section className="mb-5">
        <h2 className="mb-2 text-sm font-semibold text-slate-800">
          {draft.trade === 'painting' ? 'Rooms' : 'Line items'}
        </h2>
        {draft.trade === 'painting' && painting ? (
          <PaintingCalculator
            rooms={draft.rooms}
            computation={painting.computation}
            onChange={(rooms) => update({ rooms })}
          />
        ) : (
          <GeneralEditor
            lineItems={draft.lineItems}
            onChange={(lineItems) => update({ lineItems })}
            libraryItems={library ?? []}
            onSaveToLibrary={async (item) => {
              await libraryRepo.create({
                description: item.description,
                unit: item.unit,
                unitCost: item.unitCost,
                laborHours: item.laborHours,
              });
              toast('Saved to library');
            }}
          />
        )}
      </section>

      {/* Scope notes */}
      <section className="mb-5">
        <Field label="Scope / notes" hint="Shown on the estimate PDF.">
          <Textarea
            value={draft.scopeNotes}
            onChange={(e) => update({ scopeNotes: e.target.value })}
            rows={3}
            placeholder="Walls and ceilings, two coats, customer-supplied colors…"
          />
        </Field>
      </section>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <TotalsPanel
        totals={totals}
        pricingMode={draft.trade === 'painting' ? draft.pricingMode : 'full'}
        extra={extra}
        sticky
        action={
          <Button fullWidth onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : estimateId ? 'Save changes' : 'Save estimate'}
          </Button>
        }
      />

      <ClientForm
        open={clientFormOpen}
        onClose={() => setClientFormOpen(false)}
        onSaved={(c) => update({ clientId: c.id })}
      />
    </div>
  );
}

function PricingModePicker({
  value,
  onChange,
}: {
  value: PricingMode;
  onChange: (value: PricingMode) => void;
}) {
  const options: { value: PricingMode; label: string }[] = [
    { value: 'full', label: 'Full' },
    { value: 'labor_only', label: 'Labor only' },
  ];
  return (
    <div className="grid grid-cols-2 overflow-hidden rounded-xl ring-1 ring-inset ring-slate-300">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            'h-11 text-sm font-medium transition-colors',
            value === option.value
              ? 'bg-brand-600 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-50',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
