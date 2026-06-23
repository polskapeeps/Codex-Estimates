import { useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  PageHeader,
  Textarea,
} from '../../components/ui';
import {
  ArchiveIcon,
  FileTextIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from '../../components/icons';
import { StatusControl } from './StatusControl';
import { ProjectForm } from './ProjectForm';
import { DocumentViewToggle, type DocumentViewMode } from '../documents/DocumentViewToggle';
import { useClient, useEstimatesByProject, useProject } from '../../data/hooks';
import { projectRepo } from '../../data/repositories';
import { useUI } from '../../store/ui';
import { computeDocumentEstimate } from '../../lib/estimate/lineItems';
import { evaluateGuardrails } from '../../lib/estimate/guardrails';
import { formatMoneyWhole, formatRange } from '../../lib/money';
import { formatDate, formatDateTime, humanize } from '../../lib/format';
import type { Estimate, Project, ProjectStatus } from '../../lib/types';

export function JobDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const toast = useUI((s) => s.toast);
  const project = useProject(projectId);
  const client = useClient(project?.clientId);
  const estimates = useEstimatesByProject(projectId);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [viewMode, setViewMode] = useState<DocumentViewMode>('internal');

  if (!project) {
    return (
      <div>
        <PageHeader title="Job" back="/jobs" />
        <EmptyState title="Loading…" />
      </div>
    );
  }

  async function changeStatus(status: ProjectStatus) {
    await projectRepo.setStatus(project!.id, status);
    toast(`Marked ${humanize(status).toLowerCase()}`);
  }

  async function toggleArchive() {
    const next: ProjectStatus = project!.status === 'archived' ? 'lead' : 'archived';
    await projectRepo.setStatus(project!.id, next);
    toast(next === 'archived' ? 'Job archived' : 'Job restored');
  }

  async function handleDelete() {
    await projectRepo.remove(project!.id);
    toast('Job deleted');
    navigate('/jobs');
  }

  const contact = [client?.phone, client?.email].filter(Boolean).join(' · ');

  return (
    <div>
      <PageHeader
        title={project.title}
        back="/jobs"
        subtitle={
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>{client?.name ?? '—'}</span>
            <span className="text-slate-300">•</span>
            <span className="capitalize">{project.trade}</span>
          </span>
        }
        right={<StatusControl status={project.status} onChange={changeStatus} />}
      />

      {/* Status timestamps */}
      {(project.bidSentAt || project.decisionAt) && (
        <div className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
          {project.bidSentAt && <span>Bid sent {formatDate(project.bidSentAt)}</span>}
          {project.decisionAt && <span>Decision {formatDate(project.decisionAt)}</span>}
        </div>
      )}

      {/* New estimate CTA */}
      <Link to={`/estimate/new?projectId=${project.id}`} className="mb-4 block">
        <Button fullWidth leftIcon={<PlusIcon size={18} />}>
          New estimate
        </Button>
      </Link>

      {/* Estimates */}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Documents</h2>
        <DocumentViewToggle value={viewMode} onChange={setViewMode} />
      </div>
      {estimates && estimates.length > 0 ? (
        <ul className="mb-5 space-y-2">
          {[...estimates].reverse().map((est) => {
            const warningCount = viewMode === 'internal' ? guardrailCount(est, project) : 0;
            const chain = chainLabel(est, estimates);
            return (
              <li key={est.id}>
                <Link
                  to={`/estimate/${est.id}`}
                  className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200 hover:bg-slate-50"
                >
                  <FileTextIcon size={20} className="shrink-0 text-slate-400" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900">
                      {(est.docType ?? 'estimate').toUpperCase()} v{est.version} ·{' '}
                      {formatMoneyWhole(est.totals.total)}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {viewMode === 'client'
                        ? scopeSummary(est)
                        : chain || formatRange(est.totals.low, est.totals.total, est.totals.high)}
                    </p>
                    {viewMode === 'internal' && chain && (
                      <p className="truncate text-xs text-slate-400">
                        {formatRange(est.totals.low, est.totals.total, est.totals.high)}
                      </p>
                    )}
                  </div>
                  {warningCount > 0 ? (
                    <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                      {warningCount}
                    </span>
                  ) : (
                    <span className="shrink-0 text-xs capitalize text-slate-400">{est.status}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <Card className="mb-5 px-4 py-6 text-center text-sm text-slate-500">
          No estimates yet. Create one above.
        </Card>
      )}

      {/* Client */}
      <SectionTitle>Client</SectionTitle>
      <Card className="mb-5 divide-y divide-slate-100">
        <Link
          to={client ? `/clients/${client.id}` : '#'}
          className="flex items-center justify-between px-4 py-3 hover:bg-slate-50"
        >
          <div className="min-w-0">
            <p className="font-medium text-slate-900">{client?.name ?? '—'}</p>
            {contact && <p className="truncate text-sm text-slate-500">{contact}</p>}
          </div>
          <span className="text-sm text-brand-700">View</span>
        </Link>
        {(project.address || client?.address) && (
          <div className="px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Job address</p>
            <p className="mt-0.5 text-sm text-slate-700">{project.address || client?.address}</p>
          </div>
        )}
      </Card>

      {/* Notes */}
      <SectionTitle>Notes</SectionTitle>
      <NotesCard projectId={project.id} value={project.notes} />

      {/* Tags */}
      {project.tags.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-1.5">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <SectionTitle>Actions</SectionTitle>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" leftIcon={<PencilIcon size={18} />} onClick={() => setEditOpen(true)}>
          Edit
        </Button>
        <Button variant="secondary" leftIcon={<ArchiveIcon size={18} />} onClick={toggleArchive}>
          {project.status === 'archived' ? 'Restore' : 'Archive'}
        </Button>
        <Button
          variant="danger"
          leftIcon={<TrashIcon size={18} />}
          onClick={() => setDeleteOpen(true)}
          className="col-span-2"
        >
          Delete job
        </Button>
      </div>

      <p className="mt-4 text-center text-xs text-slate-400">
        Created {formatDateTime(project.createdAt)}
      </p>

      <ProjectForm open={editOpen} onClose={() => setEditOpen(false)} project={project} />
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete this job?"
        message="This permanently removes the job and all its estimates. This cannot be undone."
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{children}</h2>
  );
}

function guardrailCount(est: Estimate, project: Project): number {
  if (est.trade !== 'general') return 0;
  const materialsMode = project.materialsMode ?? 'in_estimate';
  const documentEstimate = computeDocumentEstimate(est.lineItems, est.ratesSnapshot, {
    materialsMode,
  });
  return evaluateGuardrails({
    lineItems: est.lineItems,
    computation: documentEstimate.computation,
    totals: est.totals,
    rates: est.ratesSnapshot,
    materialsMode,
    bundled: project.bundled,
    docType: est.docType,
    validUntil: est.validUntil,
    dueDate: est.dueDate,
  }).length;
}

function scopeSummary(est: Estimate): string {
  if (est.trade === 'painting') {
    return est.rooms.map((room) => room.label).filter(Boolean).slice(0, 3).join(', ') || 'Painting scope';
  }
  return (
    est.lineItems
      .map((line) => line.clientDescription?.trim())
      .filter(Boolean)
      .slice(0, 2)
      .join(' · ') || est.scopeNotes || 'Scope to be confirmed'
  );
}

function chainLabel(est: Estimate, estimates: Estimate[]): string {
  if (!est.sourceDocumentId) return '';
  const source = estimates.find((candidate) => candidate.id === est.sourceDocumentId);
  if (!source) return 'Converted from another document';
  return `Converted from ${(source.docType ?? 'estimate').toUpperCase()} v${source.version}`;
}

function NotesCard({ projectId, value }: { projectId: string; value: string }) {
  const toast = useUI((s) => s.toast);
  const [text, setText] = useState(value);
  const [saving, setSaving] = useState(false);

  useEffect(() => setText(value), [value]);
  const dirty = text !== value;

  async function save() {
    setSaving(true);
    try {
      await projectRepo.update(projectId, { notes: text });
      toast('Notes saved');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="mb-5 p-3">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        placeholder="Scope, access, colors, reminders…"
        className="border-0 ring-0 focus:ring-0"
      />
      {dirty && (
        <div className="flex justify-end pt-2">
          <Button size="sm" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save notes'}
          </Button>
        </div>
      )}
    </Card>
  );
}
