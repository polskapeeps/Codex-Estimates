import { useEffect, useState } from 'react';
import { Button, Field, Input, Modal, Select } from '../../components/ui';
import { LINE_UNITS } from './lineItem';
import { libraryRepo } from '../../data/repositories';
import { useUI } from '../../store/ui';
import { centsToDollars, dollarsToCents } from '../../lib/money';
import type { LibraryItem, LineUnit } from '../../lib/types';

interface LibraryItemFormProps {
  open: boolean;
  onClose: () => void;
  item?: LibraryItem; // present => edit
  /** Prefill (e.g. when saving a line item to the library). */
  preset?: Partial<LibraryItem>;
}

interface FormState {
  description: string;
  unit: LineUnit;
  unitCostDollars: number;
  laborHours: string;
  category: string;
}

function fromItem(item?: LibraryItem, preset?: Partial<LibraryItem>): FormState {
  const src = item ?? preset;
  return {
    description: src?.description ?? '',
    unit: (src?.unit as LineUnit) ?? 'ea',
    unitCostDollars: centsToDollars(src?.unitCost ?? 0),
    laborHours: src?.laborHours != null ? String(src.laborHours) : '',
    category: src?.category ?? '',
  };
}

export function LibraryItemForm({ open, onClose, item, preset }: LibraryItemFormProps) {
  const toast = useUI((s) => s.toast);
  const [form, setForm] = useState<FormState>(fromItem());
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(fromItem(item, preset));
      setError(undefined);
    }
  }, [open, item, preset]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function save() {
    if (!form.description.trim()) {
      setError('Description is required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        description: form.description.trim(),
        unit: form.unit,
        unitCost: dollarsToCents(form.unitCostDollars || 0),
        laborHours: form.laborHours.trim() ? Number.parseFloat(form.laborHours) : undefined,
        category: form.category.trim() || undefined,
      };
      if (item) await libraryRepo.update(item.id, payload);
      else await libraryRepo.create(payload);
      toast(item ? 'Library item updated' : 'Saved to library');
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={item ? 'Edit library item' : 'New library item'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Description" required error={error}>
          <Input
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Patch & skim ceiling"
            autoFocus
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Unit">
            <Select value={form.unit} onChange={(e) => set('unit', e.target.value as LineUnit)}>
              {LINE_UNITS.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Unit cost">
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                $
              </span>
              <Input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={form.unitCostDollars}
                onChange={(e) => set('unitCostDollars', Number.parseFloat(e.target.value) || 0)}
                className="pl-7"
              />
            </div>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Labor hours" hint="Optional">
            <Input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.25"
              value={form.laborHours}
              onChange={(e) => set('laborHours', e.target.value)}
            />
          </Field>
          <Field label="Category" hint="Optional">
            <Input
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
              placeholder="Drywall"
            />
          </Field>
        </div>
      </div>
    </Modal>
  );
}
