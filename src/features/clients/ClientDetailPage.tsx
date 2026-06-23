import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  PageHeader,
} from '../../components/ui';
import { MapPinIcon, PencilIcon, PlusIcon, TrashIcon } from '../../components/icons';
import { ClientForm } from './ClientForm';
import { ProjectForm } from '../projects/ProjectForm';
import { PropertyForm } from '../properties/PropertyForm';
import { JobCard } from '../projects/JobCard';
import { buildJobRows } from '../projects/jobsQuery';
import {
  useAllEstimates,
  useClient,
  useProjectsByClient,
  usePropertiesByClient,
} from '../../data/hooks';
import { clientRepo, propertyRepo } from '../../data/repositories';
import { useUI } from '../../store/ui';
import type { Property } from '../../lib/types';

export function ClientDetailPage() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const toast = useUI((s) => s.toast);
  const client = useClient(clientId);
  const projects = useProjectsByClient(clientId);
  const properties = usePropertiesByClient(clientId);
  const estimates = useAllEstimates();

  const [editOpen, setEditOpen] = useState(false);
  const [jobOpen, setJobOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [propertyFormOpen, setPropertyFormOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | undefined>();
  const [deleteProperty, setDeleteProperty] = useState<Property | undefined>();

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
    // Client delete is only enabled with no jobs, but it may still own saved
    // properties — remove them too so we don't orphan rows in the DB / backup.
    await Promise.all((properties ?? []).map((p) => propertyRepo.remove(p.id)));
    await clientRepo.remove(client!.id);
    toast('Client deleted');
    navigate('/clients');
  }

  function openNewProperty() {
    setEditingProperty(undefined);
    setPropertyFormOpen(true);
  }

  function openEditProperty(property: Property) {
    setEditingProperty(property);
    setPropertyFormOpen(true);
  }

  async function handleDeleteProperty() {
    if (!deleteProperty) return;
    await propertyRepo.remove(deleteProperty.id);
    toast('Property deleted');
    setDeleteProperty(undefined);
  }

  const tags = client.tags ?? [];
  const details: { label: string; value?: string }[] = [
    { label: 'Company', value: client.company },
    { label: 'Phone', value: client.phone },
    { label: 'Email', value: client.email },
    { label: 'Address', value: client.address },
    {
      label: 'Preferred payment',
      value: client.preferredPaymentMethod
        ? client.preferredPaymentMethod.charAt(0).toUpperCase() +
          client.preferredPaymentMethod.slice(1)
        : undefined,
    },
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

      {tags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

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
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Properties</h2>
        <Button size="sm" variant="secondary" leftIcon={<PlusIcon size={16} />} onClick={openNewProperty}>
          Add property
        </Button>
      </div>

      {properties && properties.length > 0 ? (
        <ul className="mb-5 space-y-2">
          {properties.map((property) => {
            const meta = [property.accessNotes, property.ladderNotes]
              .filter(Boolean)
              .join(' · ');
            return (
              <li key={property.id}>
                <Card className="flex items-start gap-3 px-4 py-3">
                  <MapPinIcon size={18} className="mt-0.5 shrink-0 text-slate-400" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900">{property.label}</p>
                    {property.address && (
                      <p className="truncate text-sm text-slate-500">{property.address}</p>
                    )}
                    {meta && <p className="mt-0.5 truncate text-xs text-slate-400">{meta}</p>}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      aria-label="Edit property"
                      onClick={() => openEditProperty(property)}
                      className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    >
                      <PencilIcon size={16} />
                    </button>
                    <button
                      type="button"
                      aria-label="Delete property"
                      onClick={() => setDeleteProperty(property)}
                      className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <TrashIcon size={16} />
                    </button>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      ) : (
        <Card className="mb-5 px-4 py-5 text-center text-sm text-slate-500">
          No saved sites yet. Add one to reuse measurements + access notes on jobs.
        </Card>
      )}

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
      <PropertyForm
        open={propertyFormOpen}
        onClose={() => setPropertyFormOpen(false)}
        clientId={client.id}
        property={editingProperty}
      />
      <ConfirmDialog
        open={Boolean(deleteProperty)}
        onClose={() => setDeleteProperty(undefined)}
        onConfirm={handleDeleteProperty}
        title="Delete this property?"
        message="This removes the saved site and its notes. Jobs linked to it keep their own address. This cannot be undone."
        confirmLabel="Delete"
        danger
      />
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
