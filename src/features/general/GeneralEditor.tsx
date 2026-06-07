import { useState, type ReactNode } from 'react';
import { Button, Card, Input, Select } from '../../components/ui';
import { TrashIcon } from '../../components/icons';
import { LibraryPickerModal } from './LibraryPickerModal';
import { LINE_UNITS, makeNewLineItem } from './lineItem';
import { lineTotal } from '../../lib/estimate/general';
import { centsToDollars, dollarsToCents, formatMoney } from '../../lib/money';
import type { LibraryItem, LineItem, LineUnit } from '../../lib/types';

interface GeneralEditorProps {
  lineItems: LineItem[];
  onChange: (items: LineItem[]) => void;
  /** When provided, enables the "Add from library" picker. */
  libraryItems?: LibraryItem[];
  /** When provided, shows a per-line "Save to library" action. */
  onSaveToLibrary?: (item: LineItem) => void;
}

export function GeneralEditor({
  lineItems,
  onChange,
  libraryItems,
  onSaveToLibrary,
}: GeneralEditorProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const update = (index: number, item: LineItem) =>
    onChange(lineItems.map((it, i) => (i === index ? item : it)));
  const remove = (index: number) => onChange(lineItems.filter((_, i) => i !== index));
  const add = () => onChange([...lineItems, makeNewLineItem()]);
  const addFromLibrary = (lib: LibraryItem) =>
    onChange([
      ...lineItems,
      makeNewLineItem({
        description: lib.description,
        unit: lib.unit,
        unitCost: lib.unitCost,
        laborHours: lib.laborHours,
        fromLibraryId: lib.id,
      }),
    ]);

  return (
    <div className="space-y-3">
      {lineItems.length === 0 && (
        <Card className="px-4 py-6 text-center text-sm text-slate-500">
          No line items yet. Add materials, labor, or fixed costs.
        </Card>
      )}

      {lineItems.map((item, i) => (
        <LineItemCard
          key={item.id}
          item={item}
          onChange={(it) => update(i, it)}
          onRemove={() => remove(i)}
          onSaveToLibrary={onSaveToLibrary}
        />
      ))}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Button variant="secondary" fullWidth onClick={add}>
          + Add line item
        </Button>
        {libraryItems && (
          <Button variant="secondary" fullWidth onClick={() => setPickerOpen(true)}>
            From library
          </Button>
        )}
      </div>

      {libraryItems && (
        <LibraryPickerModal
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          items={libraryItems}
          onPick={addFromLibrary}
        />
      )}
    </div>
  );
}

function LineItemCard({
  item,
  onChange,
  onRemove,
  onSaveToLibrary,
}: {
  item: LineItem;
  onChange: (item: LineItem) => void;
  onRemove: () => void;
  onSaveToLibrary?: (item: LineItem) => void;
}) {
  const set = <K extends keyof LineItem>(key: K, value: LineItem[K]) =>
    onChange({ ...item, [key]: value });

  return (
    <Card className="space-y-3 p-3">
      <div className="flex items-center gap-2">
        <Input
          value={item.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Description (e.g. Patch & skim ceiling)"
          className="flex-1"
        />
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove line"
          className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
        >
          <TrashIcon size={18} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <LabeledField label="Qty">
          <Input
            type="number"
            inputMode="decimal"
            min="0"
            step="1"
            value={item.qty}
            onChange={(e) => set('qty', Number.parseFloat(e.target.value) || 0)}
            className="text-center"
          />
        </LabeledField>
        <LabeledField label="Unit">
          <Select value={item.unit} onChange={(e) => set('unit', e.target.value as LineUnit)}>
            {LINE_UNITS.map((u) => (
              <option key={u.value} value={u.value}>
                {u.label}
              </option>
            ))}
          </Select>
        </LabeledField>
        <LabeledField label="Unit cost">
          <div className="relative">
            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
              $
            </span>
            <Input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={centsToDollars(item.unitCost)}
              onChange={(e) =>
                set('unitCost', dollarsToCents(Number.parseFloat(e.target.value) || 0))
              }
              className="pl-6"
            />
          </div>
        </LabeledField>
      </div>

      <div className="flex items-center justify-between">
        {onSaveToLibrary ? (
          <button
            type="button"
            onClick={() => onSaveToLibrary(item)}
            className="text-xs font-medium text-brand-700 hover:underline disabled:text-slate-300"
            disabled={!item.description.trim()}
          >
            Save to library
          </button>
        ) : (
          <span />
        )}
        <span className="text-sm font-semibold text-slate-900">
          {formatMoney(lineTotal(item))}
        </span>
      </div>
    </Card>
  );
}

function LabeledField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-slate-500">{label}</label>
      {children}
    </div>
  );
}
