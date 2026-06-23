import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  Button,
  Card,
  ConfirmDialog,
  Field,
  Input,
  PageHeader,
  Select,
} from '../../components/ui';
import { DownloadIcon, UploadIcon } from '../../components/icons';
import { MoneyField, NumField, PercentField } from './rateFields';
import { useRates } from '../../data/hooks';
import { exportAll, importAll, ratesRepo } from '../../data/repositories';
import { makeDefaultRates } from '../../lib/estimate/defaults';
import { useUI } from '../../store/ui';
import { cn } from '../../lib/cn';
import type { BackupPayload, Rates } from '../../lib/types';

export function SettingsPage() {
  const rates = useRates();
  const toast = useUI((s) => s.toast);
  const [draft, setDraft] = useState<Rates | null>(null);
  const [saving, setSaving] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [pendingImport, setPendingImport] = useState<BackupPayload | null>(null);

  useEffect(() => {
    if (rates && draft === null) setDraft(structuredClone(rates));
  }, [rates, draft]);

  if (!draft) {
    return (
      <div>
        <PageHeader title="Settings" />
        <Card className="px-4 py-6 text-center text-sm text-slate-500">Loading…</Card>
      </div>
    );
  }

  const dirty = JSON.stringify(draft) !== JSON.stringify(rates);

  const update = (patch: Partial<Rates>) => setDraft((d) => ({ ...d!, ...patch }));
  const updateProd = (patch: Partial<Rates['productionRates']>) =>
    setDraft((d) => ({ ...d!, productionRates: { ...d!.productionRates, ...patch } }));
  const updatePrep = (patch: Partial<Rates['prepMultipliers']>) =>
    setDraft((d) => ({ ...d!, prepMultipliers: { ...d!.prepMultipliers, ...patch } }));
  const updateCompany = (patch: Partial<Rates['company']>) =>
    setDraft((d) => ({ ...d!, company: { ...d!.company, ...patch } }));

  async function save() {
    setSaving(true);
    try {
      await ratesRepo.update(draft!);
      toast('Settings saved');
    } finally {
      setSaving(false);
    }
  }

  async function reset() {
    await ratesRepo.reset();
    setDraft(makeDefaultRates());
    toast('Rates reset to defaults');
  }

  function onLogo(file: File) {
    const reader = new FileReader();
    reader.onload = () => updateCompany({ logoDataUrl: reader.result as string });
    reader.readAsDataURL(file);
  }

  async function exportData() {
    const payload = await exportAll();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `estimator-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Data exported');
  }

  async function onImportFile(file: File) {
    try {
      const payload = JSON.parse(await file.text()) as BackupPayload;
      setPendingImport(payload);
    } catch {
      toast('Could not read that file.', 'error');
    }
  }

  async function confirmImport() {
    if (!pendingImport) return;
    try {
      await importAll(pendingImport);
      window.location.reload();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Import failed.', 'error');
    }
  }

  return (
    <div className={cn(dirty && 'pb-24')}>
      <PageHeader title="Settings" subtitle="Your rates power every estimate — tune them to your real numbers." />

      {/* Company */}
      <Section title="Company" note="Shown on estimate PDFs.">
        <Field label="Business name">
          <Input
            value={draft.company.name}
            onChange={(e) => updateCompany({ name: e.target.value })}
            placeholder="Peeps Painting & Handyman"
          />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Phone">
            <Input
              value={draft.company.phone ?? ''}
              onChange={(e) => updateCompany({ phone: e.target.value })}
            />
          </Field>
          <Field label="Email">
            <Input
              value={draft.company.email ?? ''}
              onChange={(e) => updateCompany({ email: e.target.value })}
            />
          </Field>
        </div>
        <Field label="Address">
          <Input
            value={draft.company.address ?? ''}
            onChange={(e) => updateCompany({ address: e.target.value })}
          />
        </Field>
        <Field label="Logo" hint="Optional — appears on the PDF header.">
          <div className="flex items-center gap-3">
            {draft.company.logoDataUrl ? (
              <img
                src={draft.company.logoDataUrl}
                alt="Logo"
                className="h-12 w-12 rounded-lg object-contain ring-1 ring-slate-200"
              />
            ) : (
              <div className="grid h-12 w-12 place-items-center rounded-lg bg-slate-100 text-xs text-slate-400">
                None
              </div>
            )}
            <label className="cursor-pointer rounded-xl bg-white px-3 py-2 text-sm font-medium text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
              {draft.company.logoDataUrl ? 'Replace' : 'Upload'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && onLogo(e.target.files[0])}
              />
            </label>
            {draft.company.logoDataUrl && (
              <button
                type="button"
                onClick={() => updateCompany({ logoDataUrl: '' })}
                className="text-sm text-red-600"
              >
                Remove
              </button>
            )}
          </div>
        </Field>
      </Section>

      {/* Labor */}
      <Section title="Labor">
        <MoneyField
          label="Hourly rate"
          hint="Your charged labor rate per hour."
          cents={draft.hourlyRate}
          onChange={(c) => update({ hourlyRate: c })}
        />
      </Section>

      {/* Materials */}
      <Section title="Paint & materials">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <MoneyField
            label="Paint / gallon"
            cents={draft.paintCostPerGallon}
            onChange={(c) => update({ paintCostPerGallon: c })}
          />
          <MoneyField
            label="Primer / gallon"
            cents={draft.primerCostPerGallon}
            onChange={(c) => update({ primerCostPerGallon: c })}
          />
          <NumField
            label="Coverage"
            suffix="sqft/gal"
            value={draft.coverageSqftPerGallon}
            step={5}
            onChange={(v) => update({ coverageSqftPerGallon: v })}
          />
          <PercentField
            label="Sundries"
            hint="Tape, plastic, rollers"
            value={draft.sundriesPct}
            onChange={(v) => update({ sundriesPct: v })}
          />
        </div>
      </Section>

      {/* Production rates */}
      <Section title="Painting production" note="Sqft (or linft) applied per hour, per coat — incl. cut-in.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <NumField
            label="Walls"
            suffix="sqft/hr"
            value={draft.productionRates.walls}
            step={5}
            onChange={(v) => updateProd({ walls: v })}
          />
          <NumField
            label="Ceiling"
            suffix="sqft/hr"
            value={draft.productionRates.ceiling}
            step={5}
            onChange={(v) => updateProd({ ceiling: v })}
          />
          <NumField
            label="Trim"
            suffix="linft/hr"
            value={draft.productionRates.trim}
            step={5}
            onChange={(v) => updateProd({ trim: v })}
          />
        </div>
      </Section>

      {/* Prep + openings */}
      <Section title="Prep & openings" note="Prep multipliers scale total labor hours.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <NumField
            label="Light prep ×"
            value={draft.prepMultipliers.light}
            step={0.05}
            onChange={(v) => updatePrep({ light: v })}
          />
          <NumField
            label="Standard prep ×"
            value={draft.prepMultipliers.standard}
            step={0.05}
            onChange={(v) => updatePrep({ standard: v })}
          />
          <NumField
            label="Heavy prep ×"
            value={draft.prepMultipliers.heavy}
            step={0.05}
            onChange={(v) => updatePrep({ heavy: v })}
          />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <NumField
            label="Door area"
            suffix="sqft"
            value={draft.doorAreaSqft}
            onChange={(v) => update({ doorAreaSqft: v })}
          />
          <NumField
            label="Window area"
            suffix="sqft"
            value={draft.windowAreaSqft}
            onChange={(v) => update({ windowAreaSqft: v })}
          />
          <NumField
            label="Door labor"
            suffix="hr"
            value={draft.doorLaborHrs}
            step={0.25}
            onChange={(v) => update({ doorLaborHrs: v })}
          />
          <NumField
            label="Window labor"
            suffix="hr"
            value={draft.windowLaborHrs}
            step={0.25}
            onChange={(v) => update({ windowLaborHrs: v })}
          />
        </div>
        <Toggle
          label="Add primer automatically on heavy prep"
          checked={draft.primerOnHeavyPrep}
          onChange={(v) => update({ primerOnHeavyPrep: v })}
        />
      </Section>

      {/* Pricing */}
      <Section title="Pricing & estimate range">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <PercentField
            label="Markup"
            value={draft.markupPct}
            onChange={(v) => update({ markupPct: v })}
          />
          <PercentField label="Tax" value={draft.taxPct} onChange={(v) => update({ taxPct: v })} />
          <Field label="Tax applies to">
            <Select
              value={draft.taxAppliesTo}
              onChange={(e) => update({ taxAppliesTo: e.target.value as Rates['taxAppliesTo'] })}
            >
              <option value="materials">Materials only</option>
              <option value="all">Whole subtotal</option>
              <option value="none">No tax</option>
            </Select>
          </Field>
          <PercentField
            label="Confidence band"
            hint="± range around the estimate"
            value={draft.confidenceBandPct}
            onChange={(v) => update({ confidenceBandPct: v })}
          />
        </div>
      </Section>

      {/* Guardrails */}
      <Section title="Pricing guardrails">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <MoneyField
            label="Hard hourly floor"
            hint="Red warning below this effective hourly rate."
            cents={draft.hardFloorHourlyCents}
            onChange={(c) => update({ hardFloorHourlyCents: c })}
          />
          <MoneyField
            label="Hourly target"
            hint="Yellow warning between the hard floor and this target."
            cents={draft.targetHourlyCents}
            onChange={(c) => update({ targetHourlyCents: c })}
          />
          <MoneyField
            label="Ceiling sqft floor"
            hint="Flags ceiling labor priced below this per square foot."
            cents={draft.ceilingSqftFloorCents}
            onChange={(c) => update({ ceilingSqftFloorCents: c })}
          />
          <MoneyField
            label="Standalone window minimum"
            hint="Flags small non-bundled window jobs below this floor."
            cents={draft.windowStandaloneMinimumCents}
            onChange={(c) => update({ windowStandaloneMinimumCents: c })}
          />
          <MoneyField
            label="Job minimum"
            hint="$0 disables this optional warning."
            cents={draft.jobMinimumCents}
            onChange={(c) => update({ jobMinimumCents: c })}
          />
        </div>
      </Section>

      {/* General estimates */}
      <Section title="General estimates">
        <Link
          to="/library"
          className="flex items-center justify-between rounded-xl px-1 py-1 text-sm font-medium text-slate-700 hover:text-brand-700"
        >
          <span>Line-item library</span>
          <span className="text-brand-700">Manage →</span>
        </Link>
      </Section>

      {/* Backup & data */}
      <Section
        title="Backup & data"
        note="Move data between devices (phone ↔ PC) until cloud sync lands."
      >
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="secondary"
            fullWidth
            leftIcon={<DownloadIcon size={18} />}
            onClick={exportData}
          >
            Export all data
          </Button>
          <label className="flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-white text-sm font-medium text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
            <UploadIcon size={18} />
            Import data
            <input
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) onImportFile(e.target.files[0]);
                e.target.value = '';
              }}
            />
          </label>
        </div>
        <p className="text-xs text-slate-400">
          Importing replaces all jobs, clients, estimates, properties, rate book, and rates on
          this device.
        </p>
      </Section>

      <div className="mt-2">
        <Button variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => setResetOpen(true)}>
          Reset rates to defaults
        </Button>
      </div>

      {/* Sticky save bar */}
      {dirty && (
        <div className="fixed inset-x-0 bottom-16 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur pb-safe md:bottom-0 md:pl-60">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
            <span className="text-sm text-slate-500">Unsaved changes</span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => setDraft(rates ? structuredClone(rates) : null)}
                disabled={saving}
              >
                Discard
              </Button>
              <Button onClick={save} disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={reset}
        title="Reset all rates?"
        message="This restores every coefficient to the built-in defaults. Your company info and saved jobs are not affected."
        confirmLabel="Reset rates"
        danger
      />

      <ConfirmDialog
        open={Boolean(pendingImport)}
        onClose={() => setPendingImport(null)}
        onConfirm={confirmImport}
        title="Import and replace all data?"
        message="This overwrites everything currently on this device with the backup file. Export your current data first if you want to keep it."
        confirmLabel="Import & replace"
        danger
      />
    </div>
  );
}

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <section className="mb-5">
      <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
      {note && <p className="mb-2 text-xs text-slate-500">{note}</p>}
      <Card className={cn('space-y-4 p-4', !note && 'mt-2')}>{children}</Card>
    </section>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 text-left"
    >
      <span className="text-sm text-slate-700">{label}</span>
      <span
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors',
          checked ? 'bg-brand-600' : 'bg-slate-300',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
            checked ? 'left-0.5 translate-x-5' : 'left-0.5',
          )}
        />
      </span>
    </button>
  );
}
