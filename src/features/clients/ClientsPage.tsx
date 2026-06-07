import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, EmptyState, Field, Input, PageHeader } from '../../components/ui';
import { ClientsIcon, PlusIcon, SearchIcon } from '../../components/icons';
import { useClients, useProjects } from '../../data/hooks';
import { ClientForm } from './ClientForm';
import { ACTIVE_STATUSES } from '../../lib/status';
import type { Client } from '../../lib/types';

export function ClientsPage() {
  const clients = useClients();
  const projects = useProjects();
  const [query, setQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);

  const jobsByClient = useMemo(() => {
    const map = new Map<string, { total: number; active: number }>();
    for (const p of projects ?? []) {
      const entry = map.get(p.clientId) ?? { total: 0, active: 0 };
      entry.total += 1;
      if (ACTIVE_STATUSES.includes(p.status)) entry.active += 1;
      map.set(p.clientId, entry);
    }
    return map;
  }, [projects]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = clients ?? [];
    if (!q) return list;
    return list.filter((c) =>
      [c.name, c.company, c.phone, c.email, c.address]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q)),
    );
  }, [clients, query]);

  return (
    <div>
      <PageHeader
        title="Clients"
        subtitle={clients ? `${clients.length} total` : undefined}
        right={
          <Button size="sm" leftIcon={<PlusIcon size={18} />} onClick={() => setFormOpen(true)}>
            New
          </Button>
        }
      />

      {(clients?.length ?? 0) > 0 && (
        <Field className="mb-4">
          <div className="relative">
            <SearchIcon
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search clients…"
              className="pl-10"
            />
          </div>
        </Field>
      )}

      {clients === undefined ? null : filtered.length === 0 ? (
        <EmptyState
          icon={<ClientsIcon size={40} />}
          title={query ? 'No matches' : 'No clients yet'}
          message={query ? 'Try a different search.' : 'Add your first client to get started.'}
          action={
            !query && (
              <Button leftIcon={<PlusIcon size={18} />} onClick={() => setFormOpen(true)}>
                New client
              </Button>
            )
          }
        />
      ) : (
        <ul className="space-y-2">
          {filtered.map((client) => (
            <ClientRow
              key={client.id}
              client={client}
              jobs={jobsByClient.get(client.id)}
            />
          ))}
        </ul>
      )}

      <ClientForm open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  );
}

function ClientRow({
  client,
  jobs,
}: {
  client: Client;
  jobs?: { total: number; active: number };
}) {
  const sub = [client.company, client.phone].filter(Boolean).join(' · ');
  return (
    <li>
      <Link
        to={`/clients/${client.id}`}
        className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3.5 ring-1 ring-slate-200 transition-colors hover:bg-slate-50"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-slate-900">{client.name}</p>
          {sub && <p className="truncate text-sm text-slate-500">{sub}</p>}
        </div>
        {jobs && jobs.total > 0 && (
          <span className="shrink-0 text-right text-xs text-slate-500">
            <span className="font-medium text-slate-700">{jobs.total}</span>{' '}
            {jobs.total === 1 ? 'job' : 'jobs'}
            {jobs.active > 0 && (
              <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 font-medium text-brand-700">
                {jobs.active} active
              </span>
            )}
          </span>
        )}
      </Link>
    </li>
  );
}
