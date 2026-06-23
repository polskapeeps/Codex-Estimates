import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Select,
} from '../../components/ui';
import { DownloadIcon, PencilIcon, PrinterIcon, TrashIcon } from '../../components/icons';
import { TotalsPanel } from './TotalsPanel';
import { useClient, useEstimate, useProject, useRates } from '../../data/hooks';
import { estimateRepo, projectRepo } from '../../data/repositories';
import { useUI } from '../../store/ui';
import { nowIso } from '../../lib/ids';
import { computePainting } from '../../lib/estimate/painting';
import { computeGeneral } from '../../lib/estimate/general';
import { computeDocumentEstimate, lineItemAmount } from '../../lib/estimate/lineItems';
import { evaluateGuardrails } from '../../lib/estimate/guardrails';
import { calcModeMeta } from '../documents/documentLine';
import { GuardrailPanel } from '../documents/GuardrailPanel';
import { DocumentViewToggle, type DocumentViewMode } from '../documents/DocumentViewToggle';
import {
  conversionLabel,
  convertDocument,
  docTypeLabel,
  nextDocType,
} from '../documents/documentLifecycle';
import { buildEstimateDocDefinition } from '../pdf/estimatePdf';
import { downloadEstimatePdf, printEstimatePdf } from '../pdf/pdfClient';
import { centsToDollars, dollarsToCents, formatMoney } from '../../lib/money';
import { formatDate } from '../../lib/format';
import { LINE_UNITS } from '../general/lineItem';
import type { Estimate, PaidStatus, PaymentMethod } from '../../lib/types';

export function EstimatePreviewPage() {
  const { estimateId } = useParams();
  const navigate = useNavigate();
  const toast = useUI((s) => s.toast);
  const estimate = useEstimate(estimateId);
  const project = useProject(estimate?.projectId);
  const client = useClient(project?.clientId);
  const rates = useRates();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [convertBusy, setConvertBusy] = useState(false);
  const [viewMode, setViewMode] = useState<DocumentViewMode>('internal');

  const painting = useMemo(
    () =>
      estimate?.trade === 'painting'
        ? computePainting(estimate.rooms, estimate.ratesSnapshot)
        : null,
    [estimate],
  );
  const general = useMemo(
    () => (estimate?.trade === 'general' ? computeGeneral(estimate.lineItems) : null),
    [estimate],
  );
  const documentEstimate = useMemo(
    () =>
      estimate?.trade === 'general'
        ? computeDocumentEstimate(estimate.lineItems, estimate.ratesSnapshot, {
            materialsMode: project?.materialsMode,
          })
        : null,
    [estimate, project?.materialsMode],
  );
  const guardrails = useMemo(
    () =>
      estimate && documentEstimate
        ? evaluateGuardrails({
            lineItems: estimate.lineItems,
            computation: documentEstimate.computation,
            totals: estimate.totals,
            rates: estimate.ratesSnapshot,
            materialsMode: project?.materialsMode,
            bundled: project?.bundled,
            docType: estimate.docType,
            validUntil: estimate.validUntil,
            dueDate: estimate.dueDate,
          })
        : [],
    [documentEstimate, estimate, project?.bundled, project?.materialsMode],
  );
  const pricingMode = estimate?.pricingMode ?? 'full';

  if (!estimate) {
    return (
      <div>
        <PageHeader title="Estimate" back />
        <EmptyState title="Loading…" />
      </div>
    );
  }

  async function runPdf(action: 'print' | 'download') {
    if (!estimate || !project) return;
    setPdfBusy(true);
    try {
      const docDef = buildEstimateDocDefinition({
        estimate,
        project,
        client,
        company: rates?.company ?? estimate.ratesSnapshot.company,
      });
      if (action === 'print') {
        await printEstimatePdf(docDef);
      } else {
        await downloadEstimatePdf(
          docDef,
          `Estimate-${client?.name ?? project.title}-v${estimate.version}`,
        );
      }
    } catch {
      toast('Could not generate the PDF.', 'error');
    } finally {
      setPdfBusy(false);
    }
  }

  async function handleDelete() {
    await estimateRepo.remove(estimate!.id);
    const proj = await projectRepo.get(estimate!.projectId);
    if (proj) {
      await projectRepo.update(proj.id, {
        estimateIds: proj.estimateIds.filter((id) => id !== estimate!.id),
      });
    }
    toast('Estimate deleted');
    navigate(`/jobs/${estimate!.projectId}`);
  }

  async function handleConvert() {
    const target = nextDocType(estimate!.docType);
    if (!target) return;
    setConvertBusy(true);
    try {
      const converted = await convertDocument(estimate!, target);
      toast(`${docTypeLabel(target)} created`);
      navigate(`/estimate/${converted.id}`);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not convert the document.', 'error');
    } finally {
      setConvertBusy(false);
    }
  }

  const targetDocType = nextDocType(estimate.docType);

  return (
    <div>
      <PageHeader
        title={project?.title ?? 'Estimate'}
        back={project ? `/jobs/${project.id}` : true}
        subtitle={
          <span className="flex flex-wrap items-center gap-x-2">
            <span>{client?.name ?? '—'}</span>
            <span className="text-slate-300">•</span>
            <span>v{estimate.version}</span>
            <span className="text-slate-300">•</span>
            <span>{formatDate(estimate.createdAt)}</span>
          </span>
        }
      />

      <div className="mb-5 space-y-2">
        <div className="flex justify-end">
          <DocumentViewToggle value={viewMode} onChange={setViewMode} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            leftIcon={<PrinterIcon size={18} />}
            onClick={() => runPdf('print')}
            disabled={pdfBusy}
          >
            Print
          </Button>
          <Button
            variant="secondary"
            leftIcon={<DownloadIcon size={18} />}
            onClick={() => runPdf('download')}
            disabled={pdfBusy}
          >
            Export PDF
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {targetDocType && (
            <Button
              variant="secondary"
              onClick={handleConvert}
              disabled={convertBusy}
              className="col-span-2"
            >
              {convertBusy ? 'Converting...' : conversionLabel(targetDocType)}
            </Button>
          )}
          <Button
            variant="secondary"
            leftIcon={<PencilIcon size={18} />}
            onClick={() => navigate(`/estimate/${estimate.id}/edit`)}
          >
            Edit
          </Button>
          <Button
            variant="secondary"
            leftIcon={<TrashIcon size={18} />}
            onClick={() => setDeleteOpen(true)}
            className="text-red-600"
          >
            Delete
          </Button>
        </div>
      </div>

      {viewMode === 'internal' && guardrails.length > 0 && (
        <div className="mb-5">
          <GuardrailPanel warnings={guardrails} />
        </div>
      )}

      {estimate.docType === 'invoice' && (
        <InvoiceMetaPanel estimate={estimate} />
      )}

      <div className="mb-5">
        <TotalsPanel
          totals={estimate.totals}
          pricingMode={pricingMode}
          extra={
            painting ? (
              <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                <span>
                  {painting.paintGallons} gal paint
                  {pricingMode === 'labor_only' ? ' not included' : ''}
                </span>
                {painting.primerGallons > 0 && (
                  <span>
                    {painting.primerGallons} gal primer
                    {pricingMode === 'labor_only' ? ' not included' : ''}
                  </span>
                )}
                <span>{Math.round(painting.totalAppliedSqft)} sqft applied</span>
              </div>
            ) : undefined
          }
        />
      </div>

      {/* Breakdown */}
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Breakdown
      </h2>

      {painting && (
        <ul className="mb-5 space-y-2">
          {painting.rooms.map((rc) => (
            <Card key={rc.room.id} className="px-4 py-3">
              <div className="flex items-center justify-between">
                <p className="font-medium text-slate-900">{rc.room.label}</p>
                <p className="text-sm text-slate-500">{rc.totalHours.toFixed(1)} hrs</p>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                {rc.room.length}×{rc.room.width}×{rc.room.height} ft ·{' '}
                {[
                  rc.room.walls && 'walls',
                  rc.room.ceiling && 'ceiling',
                  rc.room.trim && 'trim',
                ]
                  .filter(Boolean)
                  .join(', ') || 'no surfaces'}{' '}
                · {rc.room.coats} coats · {rc.room.prepLevel} prep
              </p>
              <p className="mt-0.5 text-xs text-slate-400">
                {Math.round(rc.appliedSqft)} sqft applied · {rc.room.doors} doors ·{' '}
                {rc.room.windows} windows
              </p>
            </Card>
          ))}
        </ul>
      )}

      {general && (
        <Card className="mb-5 divide-y divide-slate-100">
          {general.lineItems.length === 0 ? (
            <p className="px-4 py-3 text-sm text-slate-400">No line items.</p>
          ) : (
            general.lineItems.map((item) => {
              const isCredit = item.calcMode === 'credit';
              const scope = item.clientDescription?.trim() || 'Scope to be confirmed';
              return (
                <div key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {viewMode === 'client' ? scope : scope || item.description || 'Untitled'}
                    </p>
                    {viewMode === 'internal' && (
                      <>
                        <p className="text-xs text-slate-500">
                          {item.calcMode
                            ? `${calcModeMeta(item.calcMode).label} · ${item.qty} ${
                                LINE_UNITS.find((u) => u.value === item.unit)?.label ?? item.unit
                              } × ${formatMoney(item.unitCost)}`
                            : `${item.qty} ${
                                LINE_UNITS.find((u) => u.value === item.unit)?.label ?? item.unit
                              } × ${formatMoney(item.unitCost)}`}
                        </p>
                        {item.internalNote && (
                          <p className="truncate text-xs text-slate-400">{item.internalNote}</p>
                        )}
                      </>
                    )}
                  </div>
                  <span
                    className={
                      'shrink-0 text-sm font-semibold ' +
                      (isCredit ? 'text-green-700' : 'text-slate-900')
                    }
                  >
                    {formatMoney(lineItemAmount(item))}
                  </span>
                </div>
              );
            })
          )}
        </Card>
      )}

      {estimate.scopeNotes && (
        <>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Scope / notes
          </h2>
          <Card className="mb-5 px-4 py-3">
            <p className="whitespace-pre-wrap text-sm text-slate-700">{estimate.scopeNotes}</p>
          </Card>
        </>
      )}

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete this estimate?"
        message="This removes the estimate from the job. This cannot be undone."
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}

function InvoiceMetaPanel({ estimate }: { estimate: Estimate }) {
  const toast = useUI((s) => s.toast);
  const amountDue = estimate.amountDue ?? estimate.totals.total;

  async function patch(patch: Partial<Estimate>, message = 'Invoice updated') {
    await estimateRepo.update(estimate.id, patch);
    toast(message);
  }

  async function updatePaidStatus(paidStatus: PaidStatus) {
    const paid = paidStatus === 'paid';
    await patch(
      {
        paidStatus,
        paidDate: paid ? estimate.paidDate ?? nowIso() : undefined,
        amountDue: paid ? 0 : amountDue || estimate.totals.total,
        status: paid ? 'paid' : 'invoiced',
      },
      paid ? 'Invoice marked paid' : 'Invoice updated',
    );
  }

  return (
    <Card className="mb-5 space-y-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Invoice
        </h2>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium capitalize text-slate-600">
          {estimate.paidStatus ?? 'unpaid'}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Invoice #">
          <Input
            defaultValue={estimate.invoiceNumber ?? ''}
            onBlur={(e) => patch({ invoiceNumber: e.currentTarget.value.trim() || undefined })}
          />
        </Field>
        <Field label="Issue date">
          <Input
            type="date"
            value={dateInputFromIso(estimate.issueDate ?? estimate.createdAt)}
            onChange={(e) => patch({ issueDate: dateInputToIso(e.currentTarget.value) })}
          />
        </Field>
        <Field label="Due date">
          <Input
            type="date"
            value={dateInputFromIso(estimate.dueDate)}
            onChange={(e) => patch({ dueDate: dateInputToIso(e.currentTarget.value) })}
          />
        </Field>
        <Field label="Amount due">
          <MoneyInput
            cents={amountDue}
            onChange={(cents) => patch({ amountDue: cents })}
          />
        </Field>
        <Field label="Paid status">
          <Select
            value={estimate.paidStatus ?? 'unpaid'}
            onChange={(e) => updatePaidStatus(e.currentTarget.value as PaidStatus)}
          >
            <option value="unpaid">Unpaid</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
          </Select>
        </Field>
        <Field label="Payment method">
          <Select
            value={estimate.paymentMethod ?? 'cash'}
            onChange={(e) => patch({ paymentMethod: e.currentTarget.value as PaymentMethod })}
          >
            <option value="cash">Cash</option>
            <option value="check">Check</option>
            <option value="card">Card</option>
            <option value="zelle">Zelle</option>
            <option value="venmo">Venmo</option>
            <option value="other">Other</option>
          </Select>
        </Field>
      </div>
      <Field label="Terms">
        <Input
          defaultValue={estimate.terms ?? 'Due on receipt'}
          onBlur={(e) => patch({ terms: e.currentTarget.value.trim() || undefined })}
        />
      </Field>
      {estimate.paidDate && (
        <p className="text-xs text-slate-500">Paid {formatDate(estimate.paidDate)}</p>
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
        onChange={(e) => onChange(dollarsToCents(Number.parseFloat(e.currentTarget.value) || 0))}
        className="pl-6"
      />
    </div>
  );
}

function dateInputFromIso(iso?: string): string {
  return iso ? iso.slice(0, 10) : '';
}

function dateInputToIso(value: string): string | undefined {
  return value ? new Date(`${value}T12:00:00`).toISOString() : undefined;
}
