import { useEffect, useState } from 'react';
import { Button, Field, Input, Modal, Textarea } from '../../components/ui';
import { propertyRepo } from '../../data/repositories';
import { useUI } from '../../store/ui';
import type { Property } from '../../lib/types';

interface PropertyFormProps {
  open: boolean;
  onClose: () => void;
  /** Required when creating a new property. */
  clientId: string;
  property?: Property; // present => edit
  onSaved?: (property: Property) => void;
}

const EMPTY = {
  label: '',
  address: '',
  measurements: '',
  accessNotes: '',
  ladderNotes: '',
  notes: '',
};

export function PropertyForm({ open, onClose, clientId, property, onSaved }: PropertyFormProps) {
  const toast = useUI((s) => s.toast);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!open) return;
    setError(undefined);
    setForm(
      property
        ? {
            label: property.label,
            address: property.address ?? '',
            measurements: property.measurements ?? '',
            accessNotes: property.accessNotes ?? '',
            ladderNotes: property.ladderNotes ?? '',
            notes: property.notes ?? '',
          }
        : EMPTY,
    );
  }, [open, property]);

  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleSave() {
    if (!form.label.trim()) {
      setError('Give this site a label (e.g. "Main house").');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        label: form.label.trim(),
        address: form.address.trim() || undefined,
        measurements: form.measurements.trim() || undefined,
        accessNotes: form.accessNotes.trim() || undefined,
        ladderNotes: form.ladderNotes.trim() || undefined,
        notes: form.notes.trim() || undefined,
      };
      const saved = property
        ? await propertyRepo.update(property.id, payload)
        : await propertyRepo.create({ clientId, ...payload });
      toast(property ? 'Property updated' : 'Property added');
      onSaved?.(saved);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save property.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={property ? 'Edit property' : 'New property'}
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
        <Field label="Label" required error={error}>
          <Input
            value={form.label}
            onChange={set('label')}
            placeholder="Main house · Rental — 2nd floor"
            autoFocus
          />
        </Field>
        <Field label="Address">
          <Input
            value={form.address}
            onChange={set('address')}
            placeholder="123 Main St, Philadelphia"
          />
        </Field>
        <Field label="Measurements" hint="Reusable room/area notes for this site.">
          <Textarea
            value={form.measurements}
            onChange={set('measurements')}
            rows={3}
            placeholder="Living room 14×16, 9ft ceilings; stairwell 18ft…"
          />
        </Field>
        <Field label="Access notes" hint="Parking, gate codes, tight access.">
          <Textarea
            value={form.accessNotes}
            onChange={set('accessNotes')}
            rows={2}
            placeholder="Park in rear alley; gate code 1234; dog on site"
          />
        </Field>
        <Field label="Ladder / height notes" hint="High windows, scaffold needs.">
          <Textarea
            value={form.ladderNotes}
            onChange={set('ladderNotes')}
            rows={2}
            placeholder="2nd-story front windows need extension ladder"
          />
        </Field>
        <Field label="Notes">
          <Textarea
            value={form.notes}
            onChange={set('notes')}
            rows={2}
            placeholder="Anything else worth remembering about this site"
          />
        </Field>
      </div>
    </Modal>
  );
}
