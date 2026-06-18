import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Button, Card, Field, Input, Select } from '../../components/ui';
import { CopyIcon, PrinterIcon } from '../../components/icons';
import { cn } from '../../lib/cn';

type ServiceMode = 'interiorExterior' | 'exteriorOnly' | 'interiorOnly' | 'postPaint';
type Scope = 'small' | 'medium' | 'large' | 'custom';
type Condition = 'light' | 'standard' | 'heavy';
type Access = 'light' | 'standard' | 'tight' | 'high' | 'heavy';

interface Measurements {
  standardWindows: number;
  largeWindows: number;
  slidingDoors: number;
  screens: number;
  tracks: number;
  highWindows: number;
  hardWaterWindows: number;
}

interface Rates {
  windowBothRate: number;
  windowExteriorRate: number;
  windowInteriorRate: number;
  windowPostPaintRate: number;
  windowLargeAddon: number;
  windowSlidingDoorAddon: number;
  windowScreenRate: number;
  windowTrackRate: number;
  windowHighAccessRate: number;
  windowHardWaterRate: number;
  windowMinimumJob: number;
  windowOnsiteCreditPct: number;
  windowHourlyRate: number;
  quoteRounding: number;
}

const DEFAULT_RATES: Rates = {
  windowBothRate: 12,
  windowExteriorRate: 7,
  windowInteriorRate: 6,
  windowPostPaintRate: 18,
  windowLargeAddon: 8,
  windowSlidingDoorAddon: 6,
  windowScreenRate: 3,
  windowTrackRate: 2.5,
  windowHighAccessRate: 5,
  windowHardWaterRate: 14,
  windowMinimumJob: 175,
  windowOnsiteCreditPct: 8,
  windowHourlyRate: 60,
  quoteRounding: 25,
};

const EMPTY_MEASUREMENTS: Measurements = {
  standardWindows: 0,
  largeWindows: 0,
  slidingDoors: 0,
  screens: 0,
  tracks: 0,
  highWindows: 0,
  hardWaterWindows: 0,
};

const SCOPE_PRESETS: Record<Exclude<Scope, 'custom'>, Measurements> = {
  small: {
    ...EMPTY_MEASUREMENTS,
    standardWindows: 12,
    largeWindows: 2,
    slidingDoors: 1,
    screens: 12,
    tracks: 10,
  },
  medium: {
    ...EMPTY_MEASUREMENTS,
    standardWindows: 24,
    largeWindows: 4,
    slidingDoors: 2,
    screens: 20,
    tracks: 20,
    highWindows: 4,
  },
  large: {
    ...EMPTY_MEASUREMENTS,
    standardWindows: 34,
    largeWindows: 6,
    slidingDoors: 3,
    screens: 32,
    tracks: 32,
    highWindows: 10,
  },
};

const SERVICE_LABELS: Record<ServiceMode, string> = {
  interiorExterior: 'Inside + outside',
  exteriorOnly: 'Outside only',
  interiorOnly: 'Inside only',
  postPaint: 'Post-paint detail',
};

const CUSTOMER_SERVICE_LABELS: Record<ServiceMode, string> = {
  interiorExterior: 'inside and outside window cleaning',
  exteriorOnly: 'outside window cleaning',
  interiorOnly: 'inside window cleaning',
  postPaint: 'post-paint window detail',
};

const CONDITION_MODIFIERS: Record<Condition, { label: string; pct: number }> = {
  light: { label: 'Light soil', pct: -0.05 },
  standard: { label: 'Standard soil', pct: 0 },
  heavy: { label: 'Heavy buildup', pct: 0.12 },
};

const ACCESS_MODIFIERS: Record<Access, { label: string; pct: number }> = {
  light: { label: 'Easy access', pct: 0 },
  standard: { label: 'Standard access', pct: 0 },
  tight: { label: 'Tight access', pct: 0.05 },
  high: { label: 'Ladder-heavy access', pct: 0.08 },
  heavy: { label: 'Heavy protection', pct: 0.06 },
};

const RATE_FIELDS: Array<{ key: keyof Rates; label: string; step?: number }> = [
  { key: 'windowBothRate', label: 'Inside + outside/window', step: 0.5 },
  { key: 'windowExteriorRate', label: 'Outside only/window', step: 0.5 },
  { key: 'windowInteriorRate', label: 'Inside only/window', step: 0.5 },
  { key: 'windowPostPaintRate', label: 'Post-paint/window', step: 0.5 },
  { key: 'windowLargeAddon', label: 'Large glass add-on', step: 0.5 },
  { key: 'windowSlidingDoorAddon', label: 'Sliding door add-on', step: 0.5 },
  { key: 'windowScreenRate', label: 'Screen each', step: 0.5 },
  { key: 'windowTrackRate', label: 'Tracks/sills each', step: 0.5 },
  { key: 'windowHighAccessRate', label: 'High access add-on', step: 0.5 },
  { key: 'windowHardWaterRate', label: 'Hard-water add-on', step: 0.5 },
  { key: 'windowMinimumJob', label: 'Window minimum job', step: 5 },
  { key: 'windowOnsiteCreditPct', label: 'On-site credit %', step: 1 },
  { key: 'windowHourlyRate', label: 'Hourly check', step: 1 },
  { key: 'quoteRounding', label: 'Quote rounding', step: 1 },
];

const MEASUREMENT_FIELDS: Array<{ key: keyof Measurements; label: string }> = [
  { key: 'standardWindows', label: 'Standard windows' },
  { key: 'largeWindows', label: 'Large windows' },
  { key: 'slidingDoors', label: 'Sliding doors' },
  { key: 'screens', label: 'Screens' },
  { key: 'tracks', label: 'Tracks/sills' },
  { key: 'highWindows', label: 'High access windows' },
  { key: 'hardWaterWindows', label: 'Hard-water windows' },
];

export function WindowEstimatorPage() {
  const [scope, setScope] = useState<Scope>('medium');
  const [serviceMode, setServiceMode] = useState<ServiceMode>('interiorExterior');
  const [condition, setCondition] = useState<Condition>('standard');
  const [access, setAccess] = useState<Access>('standard');
  const [measurements, setMeasurements] = useState<Measurements>(SCOPE_PRESETS.medium);
  const [rates, setRates] = useState<Rates>(DEFAULT_RATES);
  const [onsiteCredit, setOnsiteCredit] = useState(true);
  const [includeSupplies, setIncludeSupplies] = useState(true);
  const [showRates, setShowRates] = useState(false);
  const [copied, setCopied] = useState(false);

  const estimate = useMemo(
    () =>
      calculateWindowEstimate({
        measurements,
        rates,
        serviceMode,
        condition,
        access,
        onsiteCredit,
        includeSupplies,
      }),
    [access, condition, includeSupplies, measurements, onsiteCredit, rates, serviceMode],
  );

  const applyScope = (nextScope: Scope) => {
    setScope(nextScope);
    if (nextScope !== 'custom') {
      setMeasurements(SCOPE_PRESETS[nextScope]);
    }
  };

  const setMeasurement = (key: keyof Measurements, value: number) => {
    setScope('custom');
    setMeasurements((current) => ({ ...current, [key]: cleanNumber(value) }));
  };

  const copyQuote = async () => {
    try {
      await navigator.clipboard.writeText(estimate.customerCopy);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700 dark:text-blue-300">
          Window cleaning
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Quick window estimate</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Fair middle-market rates for a medium-large home, adjustable before you send.
        </p>
      </header>

      <Card className="sticky top-2 z-10 overflow-hidden border-t-4 border-brand-700 p-4 md:static">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Flat quote</p>
            <p className="mt-1 text-4xl font-black tracking-tight text-slate-950 dark:text-white">
              {formatCurrency(estimate.quoteTotal)}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-100 px-3 py-2 text-right dark:bg-slate-800">
            <p className="text-xs font-medium text-slate-500">Per opening</p>
            <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {formatCurrency(estimate.pricePerOpening, 2)}
            </p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs font-semibold">
          <RangePill label="Low" value={estimate.range.low} className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-200" />
          <RangePill label="Fair" value={estimate.range.fair} className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-200" />
          <RangePill label="High" value={estimate.range.high} className="bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200" />
        </div>
        <div className="mt-3 flex gap-2">
          <Button fullWidth variant="secondary" leftIcon={<CopyIcon size={17} />} onClick={copyQuote}>
            {copied ? 'Copied' : 'Copy'}
          </Button>
          <Button fullWidth variant="secondary" leftIcon={<PrinterIcon size={17} />} onClick={() => window.print()}>
            Print
          </Button>
        </div>
      </Card>

      <Section title="Scope">
        <Segmented
          value={scope}
          options={[
            ['small', 'Small'],
            ['medium', 'Medium'],
            ['large', 'Large'],
            ['custom', 'Custom'],
          ]}
          onChange={(value) => applyScope(value as Scope)}
        />
      </Section>

      <Section title="Cleaning service">
        <Segmented
          value={serviceMode}
          options={[
            ['interiorExterior', SERVICE_LABELS.interiorExterior],
            ['exteriorOnly', SERVICE_LABELS.exteriorOnly],
            ['interiorOnly', SERVICE_LABELS.interiorOnly],
            ['postPaint', SERVICE_LABELS.postPaint],
          ]}
          onChange={(value) => setServiceMode(value as ServiceMode)}
        />
      </Section>

      <Section title="Counts">
        <div className="grid grid-cols-2 gap-3">
          {MEASUREMENT_FIELDS.map((field) => (
            <Field key={field.key} label={field.label}>
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                value={measurements[field.key]}
                onChange={(event) => setMeasurement(field.key, Number(event.target.value))}
              />
            </Field>
          ))}
        </div>
      </Section>

      <Section title="Condition and access">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Condition">
            <Select value={condition} onChange={(event) => setCondition(event.target.value as Condition)}>
              <option value="light">Light soil</option>
              <option value="standard">Standard soil</option>
              <option value="heavy">Heavy buildup</option>
            </Select>
          </Field>
          <Field label="Access">
            <Select value={access} onChange={(event) => setAccess(event.target.value as Access)}>
              <option value="light">Easy access</option>
              <option value="standard">Standard access</option>
              <option value="tight">Tight access</option>
              <option value="high">Ladder-heavy access</option>
              <option value="heavy">Heavy protection</option>
            </Select>
          </Field>
        </div>
        <div className="mt-3 grid gap-2">
          <Toggle
            checked={onsiteCredit}
            label="Already on site for painting"
            onChange={setOnsiteCredit}
          />
          <Toggle
            checked={includeSupplies}
            label="Include cleaning supplies"
            onChange={setIncludeSupplies}
          />
        </div>
      </Section>

      <Section title="Customer copy">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
          {estimate.customerCopy}
        </div>
      </Section>

      <Section title="Internal check">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <Metric label="Openings" value={String(estimate.openingCount)} />
          <Metric label="Hours" value={formatNumber(estimate.hours, 1)} />
          <Metric label="Hourly recovery" value={`${formatCurrency(estimate.effectiveHourly)}/hr`} />
          <Metric label="Subtotal" value={formatCurrency(estimate.beforeMinimum)} />
        </div>
        <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
          {estimate.rows.map((row) => (
            <div
              key={row.label}
              className="grid grid-cols-[1fr_auto] gap-3 border-b border-slate-200 px-3 py-2 text-sm last:border-b-0 dark:border-slate-800"
            >
              <div>
                <p className="font-medium text-slate-800 dark:text-slate-200">{row.label}</p>
                <p className="text-xs text-slate-500">{row.impact}</p>
              </div>
              <p className="font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(row.amount)}</p>
            </div>
          ))}
        </div>
        {estimate.warnings.length > 0 && (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
            <p className="font-semibold">Check before sending</p>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              {estimate.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        )}
      </Section>

      <Card className="overflow-hidden">
        <button
          type="button"
          onClick={() => setShowRates((current) => !current)}
          className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-slate-800 dark:text-slate-100"
        >
          Pricing settings
          <span className="text-brand-700">{showRates ? '-' : '+'}</span>
        </button>
        {showRates && (
          <div className="grid grid-cols-2 gap-3 border-t border-slate-200 p-4 dark:border-slate-800">
            {RATE_FIELDS.map((field) => (
              <Field key={field.key} label={field.label}>
                <Input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step={field.step ?? 1}
                  value={rates[field.key]}
                  onChange={(event) =>
                    setRates((current) => ({
                      ...current,
                      [field.key]: cleanNumber(Number(event.target.value)),
                    }))
                  }
                />
              </Field>
            ))}
            <Button
              className="col-span-2"
              variant="secondary"
              onClick={() => setRates(DEFAULT_RATES)}
            >
              Restore fair defaults
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

function calculateWindowEstimate({
  measurements,
  rates,
  serviceMode,
  condition,
  access,
  onsiteCredit,
  includeSupplies,
}: {
  measurements: Measurements;
  rates: Rates;
  serviceMode: ServiceMode;
  condition: Condition;
  access: Access;
  onsiteCredit: boolean;
  includeSupplies: boolean;
}) {
  const rows: Array<{ label: string; impact: string; amount: number }> = [];
  const baseRate = getBaseRate(serviceMode, rates);
  const largeRate = baseRate + rates.windowLargeAddon;
  const sliderRate = baseRate + rates.windowSlidingDoorAddon;
  const addRow = (label: string, quantity: number, rate: number) => {
    if (quantity <= 0 || rate <= 0) return 0;
    const amount = quantity * rate;
    rows.push({ label, impact: `${formatNumber(quantity, 0)} x ${formatCurrency(rate, 2)}`, amount });
    return amount;
  };

  const lineSubtotal =
    addRow('Standard windows', measurements.standardWindows, baseRate) +
    addRow('Large windows', measurements.largeWindows, largeRate) +
    addRow('Sliding doors', measurements.slidingDoors, sliderRate) +
    addRow('Screens', measurements.screens, rates.windowScreenRate) +
    addRow('Tracks and sills', measurements.tracks, rates.windowTrackRate) +
    addRow('High-access add-on', measurements.highWindows, rates.windowHighAccessRate) +
    addRow('Hard-water add-on', measurements.hardWaterWindows, rates.windowHardWaterRate);

  const conditionMod = CONDITION_MODIFIERS[condition];
  const accessMod = ACCESS_MODIFIERS[access];
  const adjustedSubtotal = lineSubtotal * Math.max(0.35, 1 + conditionMod.pct + accessMod.pct);

  if (conditionMod.pct !== 0) {
    rows.push({
      label: conditionMod.label,
      impact: formatPercent(conditionMod.pct),
      amount: lineSubtotal * conditionMod.pct,
    });
  }
  if (accessMod.pct !== 0) {
    rows.push({
      label: accessMod.label,
      impact: formatPercent(accessMod.pct),
      amount: lineSubtotal * accessMod.pct,
    });
  }

  const onsiteCreditAmount = onsiteCredit ? adjustedSubtotal * (rates.windowOnsiteCreditPct / 100) : 0;
  if (onsiteCreditAmount > 0) {
    rows.push({
      label: 'On-site bundle credit',
      impact: `-${formatNumber(rates.windowOnsiteCreditPct, 0)}%`,
      amount: -onsiteCreditAmount,
    });
  }

  const supplies = includeSupplies ? getSupplyAllowance(measurements) : 0;
  if (supplies > 0) {
    rows.push({ label: 'Cleaning supply allowance', impact: 'Included', amount: supplies });
  }

  const beforeMinimum = adjustedSubtotal - onsiteCreditAmount + supplies;
  const minimumApplied = beforeMinimum < rates.windowMinimumJob;
  const quoteTotal = roundUp(Math.max(beforeMinimum, rates.windowMinimumJob), rates.quoteRounding);
  const openingCount = getOpeningCount(measurements);
  const hours = estimateHours(measurements, serviceMode, condition, access);
  const laborRecovery = Math.max(0, quoteTotal - supplies);
  const effectiveHourly = hours > 0 ? laborRecovery / hours : 0;
  const pricePerOpening = quoteTotal / Math.max(openingCount, 1);
  const warnings = buildWarnings({
    measurements,
    openingCount,
    minimumApplied,
    effectiveHourly,
    hourlyCheck: rates.windowHourlyRate,
    serviceMode,
  });
  const customerCopy = buildCustomerCopy({
    serviceMode,
    measurements,
    quoteTotal,
    onsiteCredit,
    includeSupplies,
  });

  return {
    quoteTotal,
    beforeMinimum,
    range: {
      low: roundUp(Math.max(rates.windowMinimumJob, beforeMinimum * 0.9), rates.quoteRounding),
      fair: quoteTotal,
      high: roundUp(Math.max(quoteTotal, beforeMinimum * 1.22), rates.quoteRounding),
    },
    openingCount,
    hours,
    effectiveHourly,
    pricePerOpening,
    warnings,
    rows,
    customerCopy,
  };
}

function buildCustomerCopy({
  serviceMode,
  measurements,
  quoteTotal,
  onsiteCredit,
  includeSupplies,
}: {
  serviceMode: ServiceMode;
  measurements: Measurements;
  quoteTotal: number;
  onsiteCredit: boolean;
  includeSupplies: boolean;
}) {
  const openingCount = getOpeningCount(measurements);
  const included = [`${openingCount} priced glass openings`];
  if (measurements.screens > 0) included.push(`${measurements.screens} screens`);
  if (measurements.tracks > 0) included.push(`${measurements.tracks} tracks/sills`);
  if (measurements.highWindows > 0) included.push(`${measurements.highWindows} high-access windows`);
  if (measurements.hardWaterWindows > 0) included.push(`${measurements.hardWaterWindows} hard-water windows`);
  if (includeSupplies) included.push('cleaning supplies');

  const exclusions = [];
  if (measurements.hardWaterWindows <= 0) exclusions.push('hard-water stain removal');
  if (serviceMode !== 'postPaint') exclusions.push('paint or adhesive scraping');
  exclusions.push('storm window disassembly', 'damaged screen repair', 'unusual access not counted above');

  const onsite = onsiteCredit
    ? 'The price includes an on-site bundle credit because this is being added while already working at the house.'
    : 'No on-site bundle credit is included.';

  return `${capitalize(CUSTOMER_SERVICE_LABELS[serviceMode])} for the home: ${formatCurrency(
    quoteTotal,
  )}. Includes ${included.join(', ')}. ${onsite} ${capitalize(
    exclusions.join(', '),
  )} are priced separately unless listed above.`;
}

function buildWarnings({
  measurements,
  openingCount,
  minimumApplied,
  effectiveHourly,
  hourlyCheck,
  serviceMode,
}: {
  measurements: Measurements;
  openingCount: number;
  minimumApplied: boolean;
  effectiveHourly: number;
  hourlyCheck: number;
  serviceMode: ServiceMode;
}) {
  const warnings: string[] = [];
  if (openingCount <= 0) {
    warnings.push('No priced window openings were found. Add standard, large, or sliding-door counts before quoting.');
  }
  if (minimumApplied) {
    warnings.push('Window minimum applied for setup, tools, cleanup, and scheduling time.');
  }
  if (effectiveHourly > 0 && effectiveHourly < hourlyCheck * 0.85) {
    warnings.push('Effective hourly recovery is below the configured window cleaning check rate.');
  }
  if (serviceMode === 'postPaint') {
    warnings.push('Post-paint detail covers normal paint specks. Confirm heavy scraping or construction debris on site.');
  }
  if (measurements.hardWaterWindows > 0) {
    warnings.push('Hard-water removal may need a test spot before promising full restoration.');
  }
  if (measurements.highWindows > 0) {
    warnings.push('Confirm ladder placement and interior access for high windows.');
  }
  return warnings;
}

function getBaseRate(serviceMode: ServiceMode, rates: Rates) {
  if (serviceMode === 'exteriorOnly') return rates.windowExteriorRate;
  if (serviceMode === 'interiorOnly') return rates.windowInteriorRate;
  if (serviceMode === 'postPaint') return rates.windowPostPaintRate;
  return rates.windowBothRate;
}

function estimateHours(
  measurements: Measurements,
  serviceMode: ServiceMode,
  condition: Condition,
  access: Access,
) {
  const standardMinutesByService: Record<ServiceMode, number> = {
    interiorExterior: 7.5,
    exteriorOnly: 4.5,
    interiorOnly: 4,
    postPaint: 10,
  };
  const standardMinutes = standardMinutesByService[serviceMode];
  const minutes =
    measurements.standardWindows * standardMinutes +
    measurements.largeWindows * (standardMinutes + 3) +
    measurements.slidingDoors * (standardMinutes + 2) +
    measurements.screens * 1.5 +
    measurements.tracks * 2 +
    measurements.highWindows * 3 +
    measurements.hardWaterWindows * 7;
  const lift =
    Math.max(0, CONDITION_MODIFIERS[condition].pct) + Math.max(0, ACCESS_MODIFIERS[access].pct);
  return Math.max(getOpeningCount(measurements) > 0 ? 1.5 : 0, (minutes / 60) * (1 + lift));
}

function getOpeningCount(measurements: Measurements) {
  return measurements.standardWindows + measurements.largeWindows + measurements.slidingDoors;
}

function getSupplyAllowance(measurements: Measurements) {
  const workload = getOpeningCount(measurements) + measurements.screens * 0.5 + measurements.tracks * 0.5;
  if (workload <= 0) return 0;
  if (workload < 20) return 12;
  if (workload < 45) return 20;
  return 30;
}

function Toggle({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex min-h-11 items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5 accent-brand-700"
      />
      {label}
    </label>
  );
}

function Segmented({
  value,
  options,
  onChange,
}: {
  value: string;
  options: Array<[string, string]>;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map(([optionValue, label]) => (
        <button
          key={optionValue}
          type="button"
          onClick={() => onChange(optionValue)}
          className={cn(
            'min-h-12 rounded-xl border px-3 text-sm font-semibold transition-colors',
            value === optionValue
              ? 'border-brand-700 bg-brand-50 text-brand-700 dark:bg-blue-950 dark:text-blue-200'
              : 'border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="p-4">
      <h2 className="mb-3 text-base font-bold text-slate-900 dark:text-slate-100">{title}</h2>
      {children}
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 font-bold text-slate-900 dark:text-slate-100">{value}</p>
    </div>
  );
}

function RangePill({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className: string;
}) {
  return (
    <div className={cn('rounded-xl px-2 py-2', className)}>
      <p>{formatCurrency(value)}</p>
      <p className="text-[10px] uppercase tracking-wide opacity-75">{label}</p>
    </div>
  );
}

function roundUp(value: number, increment: number) {
  const step = Math.max(Number(increment) || 1, 1);
  return Math.ceil(value / step) * step;
}

function cleanNumber(value: number) {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function formatCurrency(value: number, digits = 0) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value || 0);
}

function formatNumber(value: number, digits: number) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value || 0);
}

function formatPercent(value: number) {
  const sign = value > 0 ? '+' : '';
  return `${sign}${Math.round(value * 100)}%`;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
