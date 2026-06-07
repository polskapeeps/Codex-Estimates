import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  PageHeader,
} from '../../components/ui';
import { PencilIcon, PlusIcon, TrashIcon } from '../../components/icons';
import { ClientForm } from './ClientForm';
import { ProjectForm } from '../projects/ProjectForm';
import { JobCard } from '../projects/JobCard';
import { buildJobRows } from '../projects/jobsQuery';
import { useAllEstimates, useClient, useProjectsByClient } from '../../data/hooks';
import { clientRepo } from '../../data/repositories';
import { useUI } from '../../store/ui';

export function ClientDetailPage() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const toast = useUI((s) => s.toast);
  const client = useClient(clientId);
  const projects = useProjectsByClient(clientId);
  const estimates = useAllEstimates();

  const [editOpen, setEditOpen] = useState(false);
  const [jobOpen, setJobOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const rows = useMemo(
    () => buildJobRows(projects ?? [], client ? [client] : [], estimates ?? []),
    [projects, client, estimates],
  );

  if (!client) {
    return (
      <div>
        <PageHeader title="Client" back="/clients" />
        <EmptyState title="Loading…" />
      </div>
    );
  }

  const jobCount = projects?.length ?? 0;

  async function handleDelete() {
    await clientRepo.remove(client!.id);
    toast('Client deleted');
    navigate('/clients');
  }

  const details: { label: string; value?: string }[] = [
    { label: 'Company', value: client.company },
    { label: 'Phone', value: client.phone },
    { label: 'Email', value: client.email },
    { label: 'Address', value: client.address },
  ];

  return (
    <div>
      <PageHeader
        title={client.name}
        back="/clients"
        subtitle={jobCount > 0 ? `${jobCount} ${jobCount === 1 ? 'job' : 'jobs'}` : 'No jobs yet'}
        right={
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<PencilIcon size={16} />}
            onClick={() => setEditOpen(true)}
          >
            Edit
          </Button>
        }
      />

      <Card className="mb-5 divide-y divide-slate-100">
        {details
          .filter((d) => d.value)
          .map((d) => (
            <div key={d.label} className="flex justify-between gap-4 px-4 py-3">
              <span className="text-sm text-slate-500">{d.label}</span>
              <span className="text-right text-sm font-medium text-slate-800">{d.value}</span>
            </div>
          ))}
        {client.notes && (
          <div className="px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Notes</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{client.notes}</p>
          </div>
        )}
        {details.every((d) => !d.value) && !client.notes && (
          <div className="px-4 py-3 text-sm text-slate-400">No contact details yet.</div>
        )}
      </Card>

      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Jobs</h2>
        <Button size="sm" leftIcon={<PlusIcon size={16} />} onClick={() => setJobOpen(true)}>
          New job
        </Button>
      </div>

      {rows.length > 0 ? (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li key={row.project.id}>
              <JobCard row={row} />
            </li>
          ))}
        </ul>
      ) : (
        <Card className="px-4 py-6 text-center text-sm text-slate-500">
          No jobs for this client yet.
        </Card>
      )}

      <div className="mt-6">
        <Button
          variant="ghost"
          leftIcon={<TrashIcon size={18} />}
          onClick={() => setDeleteOpen(true)}
          disabled={jobCount > 0}
          className="text-red-600 hover:bg-red-50"
        >
          Delete client
        </Button>
        {jobCount > 0 && (
          <p className="mt-1 text-xs text-slate-400">
            Delete or reassign this client&apos;s jobs first.
          </p>
        )}
      </div>

      <ClientForm open={editOpen} onClose={() => setEditOpen(false)} client={client} />
      <ProjectForm open={jobOpen} onClose={() => setJobOpen(false)} defaultClientId={client.id} />
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete this client?"
        message="This removes the client record. This cannot be undone."
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}
