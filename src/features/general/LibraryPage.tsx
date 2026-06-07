import { useMemo, useState } from 'react';
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Input,
  PageHeader,
} from '../../components/ui';
import { FileTextIcon, PencilIcon, PlusIcon, TrashIcon } from '../../components/icons';
import { LibraryItemForm } from './LibraryItemForm';
import { LINE_UNITS } from './lineItem';
import { useLibraryItems } from '../../data/hooks';
import { libraryRepo } from '../../data/repositories';
import { useUI } from '../../store/ui';
import { formatMoney } from '../../lib/money';
import type { LibraryItem } from '../../lib/types';

export function LibraryPage() {
  const items = useLibraryItems();
  const toast = useUI((s) => s.toast);
  const [query, setQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<LibraryItem | undefined>();
  const [deleting, setDeleting] = useState<LibraryItem | undefined>();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = items ?? [];
    if (!q) return list;
    return list.filter((i) =>
      [i.description, i.category].filter(Boolean).some((v) => v!.toLowerCase().includes(q)),
    );
  }, [items, query]);

  function openNew() {
    setEditing(undefined);
    setFormOpen(true);
  }
  function openEdit(item: LibraryItem) {
    setEditing(item);
    setFormOpen(true);
  }
  async function confirmDelete() {
    if (!deleting) return;
    await libraryRepo.remove(deleting.id);
    toast('Removed from library');
  }

  return (
    <div>
      <PageHeader
        title="Library"
        back="/settings"
        subtitle="Reusable line items for general estimates."
        right={
          <Button size="sm" leftIcon={<PlusIcon size={18} />} onClick={openNew}>
            New
          </Button>
        }
      />

      {(items?.length ?? 0) > 0 && (
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search library…"
          className="mb-4"
        />
      )}

      {items === undefined ? null : filtered.length === 0 ? (
        <EmptyState
          icon={<FileTextIcon size={40} />}
          title={query ? 'No matches' : 'Library is empty'}
          message={
            query
              ? 'Try a different search.'
              : 'Save line items here to reuse across general estimates.'
          }
          action={
            !query && (
              <Button leftIcon={<PlusIcon size={18} />} onClick={openNew}>
                New item
              </Button>
            )
          }
        />
      ) : (
        <ul className="space-y-2">
          {filtered.map((item) => (
            <li key={item.id}>
              <Card className="flex items-center gap-2 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-900">{item.description}</p>
                  <p className="text-xs text-slate-500">
                    {formatMoney(item.unitCost)} /{' '}
                    {LINE_UNITS.find((u) => u.value === item.unit)?.label ?? item.unit}
                    {item.laborHours ? ` · ${item.laborHours} hr` : ''}
                    {item.category ? ` · ${item.category}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openEdit(item)}
                  aria-label="Edit"
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <PencilIcon size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleting(item)}
                  aria-label="Delete"
                  className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                >
                  <TrashIcon size={18} />
                </button>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <LibraryItemForm open={formOpen} onClose={() => setFormOpen(false)} item={editing} />
      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(undefined)}
        onConfirm={confirmDelete}
        title="Remove this item?"
        message={deleting?.description}
        confirmLabel="Remove"
        danger
      />
    </div>
  );
}
