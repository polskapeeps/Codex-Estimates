import { useMemo, useState } from 'react';
import { Input, Modal } from '../../components/ui';
import { LINE_UNITS } from './lineItem';
import { formatMoney } from '../../lib/money';
import type { LibraryItem } from '../../lib/types';

interface LibraryPickerModalProps {
  open: boolean;
  onClose: () => void;
  items: LibraryItem[];
  onPick: (item: LibraryItem) => void;
}

export function LibraryPickerModal({ open, onClose, items, onPick }: LibraryPickerModalProps) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) =>
      [i.description, i.category].filter(Boolean).some((v) => v!.toLowerCase().includes(q)),
    );
  }, [items, query]);

  return (
    <Modal open={open} onClose={onClose} title="Add from library">
      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">
          Your library is empty. Save a line item to reuse it later.
        </p>
      ) : (
        <div className="space-y-3">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search library…"
            autoFocus
          />
          <ul className="-mx-1 max-h-80 space-y-1 overflow-y-auto">
            {filtered.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => {
                    onPick(item);
                    onClose();
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {item.description}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatMoney(item.unitCost)} /{' '}
                      {LINE_UNITS.find((u) => u.value === item.unit)?.label ?? item.unit}
                      {item.category ? ` · ${item.category}` : ''}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-medium text-brand-700">Add</span>
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-3 py-4 text-center text-sm text-slate-400">No matches.</li>
            )}
          </ul>
        </div>
      )}
    </Modal>
  );
}
