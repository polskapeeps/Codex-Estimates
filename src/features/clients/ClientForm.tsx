import { useEffect, useState } from 'react';
import { Button, Field, Input, Modal, Select, Textarea } from '../../components/ui';
import { clientRepo } from '../../data/repositories';
import { useUI } from '../../store/ui';
import type { Client, PaymentMethod } from '../../lib/types';

interface ClientFormProps {
  open: boolean;
  onClose: () => void;
  client?: Client; // present => edit
  onSaved?: (client: Client) => void;
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'check', label: 'Check' },
  { value: 'card', label: 'Card' },
  { value: 'zelle', label: 'Zelle' },
  { value: 'venmo', label: 'Venmo' },
  { value: 'other', label: 'Other' },
];

const EMPTY = {
  name: '',
  company: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
  tags: '',
  preferredPaymentMethod: '',
};

export function ClientForm({ open, onClose, client, onSaved }: ClientFormProps) {
  const toast = useUI((s) => s.toast);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!open) return;
    setError(undefined);
    setForm(
      client
        ? {
            name: client.name,
            company: client.company ?? '',
            phone: client.phone ?? '',
            email: client.email ?? '',
            address: client.address ?? '',
            notes: client.notes ?? '',
            tags: (client.tags ?? []).join(', '),
            preferredPaymentMethod: client.preferredPaymentMethod ?? '',
          }
        : EMPTY,
    );
  }, [open, client]);

  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleSave() {
    if (!form.name.trim()) {
      setError('Client name is required.');
      return;
    }
    setSaving(true);
    try {
      const tags = form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      const payload = {
        name: form.name.trim(),
        company: form.company.trim() || undefined,
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        address: form.address.trim() || undefined,
        notes: form.notes.trim() || undefined,
        tags,
        preferredPaymentMethod:
          (form.preferredPaymentMethod as PaymentMethod) || undefined,
      };
      const saved = client
        ? await clientRepo.update(client.id, payload)
        : await clientRepo.create(payload);
      toast(client ? 'Client updated' : 'Client added');
      onSaved?.(saved);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save client.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={client ? 'Edit client' : 'New client'}
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
        <Field label="Name" required error={error}>
          <Input
            value={form.name}
            onChange={set('name')}
            placeholder="Jane Homeowner"
            autoFocus
          />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Phone">
            <Input value={form.phone} onChange={set('phone')} type="tel" placeholder="(215) 555-0100" />
          </Field>
          <Field label="Email">
            <Input value={form.email} onChange={set('email')} type="email" placeholder="jane@email.com" />
          </Field>
        </div>
        <Field label="Company">
          <Input value={form.company} onChange={set('company')} placeholder="Optional" />
        </Field>
        <Field label="Address">
          <Input value={form.address} onChange={set('address')} placeholder="123 Main St, Philadelphia" />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Tags" hint="Comma-separated, e.g. repeat, referral">
            <Input value={form.tags} onChange={set('tags')} placeholder="repeat, has_connections" />
          </Field>
          <Field label="Preferred payment" hint="Suggested when invoicing.">
            <Select value={form.preferredPaymentMethod} onChange={set('preferredPaymentMethod')}>
              <option value="">No preference</option>
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Notes">
          <Textarea value={form.notes} onChange={set('notes')} rows={3} placeholder="Anything worth remembering" />
        </Field>
      </div>
    </Modal>
  );
}
