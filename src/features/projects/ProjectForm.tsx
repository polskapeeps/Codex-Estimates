import { useEffect, useState } from 'react';
import { Button, Field, Input, Modal, Select, Textarea } from '../../components/ui';
import { PlusIcon } from '../../components/icons';
import { ClientForm } from '../clients/ClientForm';
import { PropertyForm } from '../properties/PropertyForm';
import { TradePicker } from '../../components/TradePicker';
import { projectRepo } from '../../data/repositories';
import { useClients, usePropertiesByClient } from '../../data/hooks';
import { useUI } from '../../store/ui';
import { PIPELINE_STATUSES, STATUS_META } from '../../lib/status';
import type { Project, ProjectStatus, Trade } from '../../lib/types';

interface ProjectFormProps {
  open: boolean;
  onClose: () => void;
  project?: Project; // present => edit
  defaultClientId?: string;
  onSaved?: (project: Project) => void;
}

interface FormState {
  clientId: string;
  propertyId: string;
  title: string;
  address: string;
  trade: Trade;
  status: ProjectStatus;
  tags: string;
  notes: string;
}

const empty = (clientId = ''): FormState => ({
  clientId,
  propertyId: '',
  title: '',
  address: '',
  trade: 'painting',
  status: 'lead',
  tags: '',
  notes: '',
});

export function ProjectForm({
  open,
  onClose,
  project,
  defaultClientId,
  onSaved,
}: ProjectFormProps) {
  const clients = useClients();
  const toast = useUI((s) => s.toast);
  const [form, setForm] = useState<FormState>(empty());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [clientFormOpen, setClientFormOpen] = useState(false);
  const [propertyFormOpen, setPropertyFormOpen] = useState(false);
  const properties = usePropertiesByClient(form.clientId || undefined);

  useEffect(() => {
    if (!open) return;
    setError(undefined);
    setForm(
      project
        ? {
            clientId: project.clientId,
            propertyId: project.propertyId ?? '',
            title: project.title,
            address: project.address ?? '',
            trade: project.trade,
            status: project.status,
            tags: project.tags.join(', '),
            notes: project.notes ?? '',
          }
        : empty(defaultClientId),
    );
  }, [open, project, defaultClientId]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function handleSave() {
    if (!form.clientId) {
      setError('Pick a client (or add one).');
      return;
    }
    if (!form.title.trim()) {
      setError('Job title is required.');
      return;
    }
    setSaving(true);
    try {
      const tags = form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      const payload = {
        clientId: form.clientId,
        propertyId: form.propertyId || undefined,
        title: form.title.trim(),
        address: form.address.trim() || undefined,
        trade: form.trade,
        status: form.status,
        tags,
        notes: form.notes.trim(),
      };
      const saved = project
        ? await projectRepo.update(project.id, payload)
        : await projectRepo.create(payload);
      toast(project ? 'Job updated' : 'Job created');
      onSaved?.(saved);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save job.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={project ? 'Edit job' : 'New job'}
        footer={
          <>
            <Button variant="secondary" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Client" required error={error}>
            <div className="flex gap-2">
              <Select
                value={form.clientId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, clientId: e.target.value, propertyId: '' }))
                }
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

          {form.clientId && (
            <Field label="Property" hint="Saved site — reuses its access & ladder notes.">
              <div className="flex gap-2">
                <Select
                  value={form.propertyId}
                  onChange={(e) => set('propertyId', e.target.value)}
                  className="flex-1"
                >
                  <option value="">None</option>
                  {(properties ?? []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </Select>
                <Button
                  variant="secondary"
                  leftIcon={<PlusIcon size={18} />}
                  onClick={() => setPropertyFormOpen(true)}
                >
                  New
                </Button>
              </div>
            </Field>
          )}

          <Field label="Job title" required>
            <Input
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Interior repaint — 2nd floor"
            />
          </Field>

          <Field label="Trade">
            <TradePicker value={form.trade} onChange={(t) => set('trade', t)} />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Status">
              <Select
                value={form.status}
                onChange={(e) => set('status', e.target.value as ProjectStatus)}
              >
                {PIPELINE_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_META[s].label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Tags" hint="Comma-separated">
              <Input
                value={form.tags}
                onChange={(e) => set('tags', e.target.value)}
                placeholder="repeat, referral"
              />
            </Field>
          </div>

          <Field label="Job address" hint="Defaults are fine if same as client">
            <Input
              value={form.address}
              onChange={(e) => set('address', e.target.value)}
              placeholder="123 Main St, Philadelphia"
            />
          </Field>

          <Field label="Notes">
            <Textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              rows={3}
              placeholder="Scope, access, colors, reminders…"
            />
          </Field>
        </div>
      </Modal>

      <ClientForm
        open={clientFormOpen}
        onClose={() => setClientFormOpen(false)}
        onSaved={(c) => setForm((f) => ({ ...f, clientId: c.id, propertyId: '' }))}
      />

      {form.clientId && (
        <PropertyForm
          open={propertyFormOpen}
          onClose={() => setPropertyFormOpen(false)}
          clientId={form.clientId}
          onSaved={(p) => set('propertyId', p.id)}
        />
      )}
    </>
  );
}
