import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  PageHeader,
} from '../../components/ui';
import { DownloadIcon, PencilIcon, PrinterIcon, TrashIcon } from '../../components/icons';
import { TotalsPanel } from './TotalsPanel';
import { useClient, useEstimate, useProject, useRates } from '../../data/hooks';
import { estimateRepo, projectRepo } from '../../data/repositories';
import { useUI } from '../../store/ui';
import { computePainting } from '../../lib/estimate/painting';
import { computeGeneral } from '../../lib/estimate/general';
import { lineItemAmount } from '../../lib/estimate/lineItems';
import { calcModeMeta } from '../documents/documentLine';
import { buildEstimateDocDefinition } from '../pdf/estimatePdf';
import { downloadEstimatePdf, printEstimatePdf } from '../pdf/pdfClient';
import { formatMoney } from '../../lib/money';
import { formatDate } from '../../lib/format';
import { LINE_UNITS } from '../general/lineItem';

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
              return (
                <div key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {item.clientDescription?.trim() || item.description || 'Untitled'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {item.calcMode
                        ? calcModeMeta(item.calcMode).label
                        : `${item.qty} ${
                            LINE_UNITS.find((u) => u.value === item.unit)?.label ?? item.unit
                          } × ${formatMoney(item.unitCost)}`}
                    </p>
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
