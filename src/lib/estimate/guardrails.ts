import type { DocType, LineItem, MaterialsMode, Rates, Totals } from '../types';
import { formatMoney } from '../money';
import type { DocumentComputation } from './lineItems';

export type GuardrailSeverity = 'red' | 'yellow' | 'info';

export type GuardrailId =
  | 'effective-hourly'
  | 'ceiling-giveaway'
  | 'window-standalone'
  | 'intentional-discount'
  | 'job-minimum'
  | 'no-setup-time'
  | 'missing-materials'
  | 'no-markup'
  | 'ladder-without-modifier'
  | 'vague-scope'
  | 'missing-expiration'
  | 'missing-due-date';

export interface GuardrailWarning {
  id: GuardrailId;
  severity: GuardrailSeverity;
  title: string;
  message: string;
}

export interface GuardrailInput {
  lineItems: LineItem[];
  computation: DocumentComputation;
  totals: Totals;
  rates: Rates;
  materialsMode?: MaterialsMode;
  bundled?: boolean;
  docType?: DocType;
  validUntil?: string;
  dueDate?: string;
}

const ACCESS_RE = /\b(ladder|high[-\s]?access|stair|stairs|stairwell|second story|2nd|scaffold|scaffolding)\b/i;
const CEILING_RE = /\bceiling\b/i;

export function evaluateGuardrails(input: GuardrailInput): GuardrailWarning[] {
  const warnings: GuardrailWarning[] = [];
  const { computation, lineItems, rates, totals } = input;
  const materialsMode = input.materialsMode ?? 'in_estimate';

  addEffectiveHourlyWarning(warnings, computation, rates);
  addCeilingGiveawayWarnings(warnings, computation, rates);
  addWindowStandaloneWarning(warnings, computation, rates, Boolean(input.bundled));
  addIntentionalDiscountWarning(warnings, lineItems, computation);
  addJobMinimumWarning(warnings, totals, rates);
  addNoSetupTimeWarning(warnings, computation);
  addMissingMaterialsWarning(warnings, computation, materialsMode);
  addNoMarkupWarning(warnings, computation, rates);
  addLadderWithoutModifierWarning(warnings, lineItems);
  addVagueScopeWarning(warnings, lineItems);
  addMissingDocumentDateWarnings(warnings, input);

  return warnings;
}

function addEffectiveHourlyWarning(
  warnings: GuardrailWarning[],
  computation: DocumentComputation,
  rates: Rates,
) {
  if (computation.laborSubtotal <= 0 || computation.laborHours <= 0) return;
  const effectiveHourly = Math.round(computation.laborSubtotal / computation.laborHours);
  const math = `${formatMoney(computation.laborSubtotal)} / ${formatHours(
    computation.laborHours,
  )} = ${formatMoney(effectiveHourly)}/hr`;

  if (effectiveHourly < rates.hardFloorHourlyCents) {
    warnings.push({
      id: 'effective-hourly',
      severity: 'red',
      title: 'Below hard hourly floor',
      message: `${math}. Hard floor is ${formatMoney(rates.hardFloorHourlyCents)}/hr.`,
    });
  } else if (effectiveHourly < rates.targetHourlyCents) {
    warnings.push({
      id: 'effective-hourly',
      severity: 'yellow',
      title: 'Friendly hourly rate',
      message: `${math}. Target is ${formatMoney(rates.targetHourlyCents)}/hr.`,
    });
  }
}

function addCeilingGiveawayWarnings(
  warnings: GuardrailWarning[],
  computation: DocumentComputation,
  rates: Rates,
) {
  if (rates.ceilingSqftFloorCents <= 0) return;
  for (const { item, amount } of computation.lines) {
    if (item.category !== 'painting' || item.calcMode !== 'per_sqft') continue;
    if (!CEILING_RE.test(lineSearchText(item)) || item.qty <= 0) continue;

    const perSqft = Math.round(amount / item.qty);
    if (perSqft < rates.ceilingSqftFloorCents) {
      warnings.push({
        id: 'ceiling-giveaway',
        severity: 'red',
        title: 'Ceiling sqft giveaway',
        message: `${lineLabel(item)} works out to ${formatMoney(perSqft)}/sqft. Floor is ${formatMoney(
          rates.ceilingSqftFloorCents,
        )}/sqft.`,
      });
    }
  }
}

function addWindowStandaloneWarning(
  warnings: GuardrailWarning[],
  computation: DocumentComputation,
  rates: Rates,
  bundled: boolean,
) {
  if (bundled || rates.windowStandaloneMinimumCents <= 0) return;
  const windowSubtotal = computation.lines
    .filter((line) => line.item.category === 'windows' && line.amount > 0)
    .reduce((sum, line) => sum + line.amount, 0);
  if (windowSubtotal > 0 && windowSubtotal < rates.windowStandaloneMinimumCents) {
    warnings.push({
      id: 'window-standalone',
      severity: 'yellow',
      title: 'Standalone window floor',
      message: `Window work totals ${formatMoney(windowSubtotal)} before job totals. Standalone floor is ${formatMoney(
        rates.windowStandaloneMinimumCents,
      )}; tag the job bundled if this is an add-on.`,
    });
  }
}

function addIntentionalDiscountWarning(
  warnings: GuardrailWarning[],
  lineItems: LineItem[],
  computation: DocumentComputation,
) {
  const creditLines = lineItems.filter((item) => item.calcMode === 'credit');
  if (creditLines.length === 0) return;

  const missingReason = creditLines.filter(
    (item) => !item.reasonTag || (item.reasonTag === 'other' && !item.internalNote?.trim()),
  );
  if (missingReason.length > 0) {
    warnings.push({
      id: 'intentional-discount',
      severity: 'red',
      title: 'Credit needs a reason',
      message: `${missingReason.length} credit line${missingReason.length === 1 ? '' : 's'} need a reason tag${
        missingReason.some((line) => line.reasonTag === 'other') ? ' and note' : ''
      }. Total credit is ${formatMoney(Math.abs(computation.discounts))}.`,
    });
  }
}

function addJobMinimumWarning(
  warnings: GuardrailWarning[],
  totals: Totals,
  rates: Rates,
) {
  if (rates.jobMinimumCents <= 0 || totals.total <= 0) return;
  if (totals.total < rates.jobMinimumCents) {
    warnings.push({
      id: 'job-minimum',
      severity: 'yellow',
      title: 'Below job minimum',
      message: `Total is ${formatMoney(totals.total)}. Job minimum is ${formatMoney(
        rates.jobMinimumCents,
      )}.`,
    });
  }
}

function addNoSetupTimeWarning(
  warnings: GuardrailWarning[],
  computation: DocumentComputation,
) {
  const hasServiceRevenue = computation.laborSubtotal > 0;
  if (!hasServiceRevenue || computation.laborHours > 0) return;
  warnings.push({
    id: 'no-setup-time',
    severity: 'yellow',
    title: 'No setup time recorded',
    message: 'Labor is priced, but no hours are recorded for setup, travel, masking, loading, or cleanup.',
  });
}

function addMissingMaterialsWarning(
  warnings: GuardrailWarning[],
  computation: DocumentComputation,
  materialsMode: MaterialsMode,
) {
  if (materialsMode === 'separate' || computation.materialsSubtotal > 0) return;
  const serviceLines = computation.lines.filter((line) => line.bucket === 'labor' && line.amount > 0);
  const hasNonWindowService = serviceLines.some((line) => line.item.category !== 'windows');
  if (!hasNonWindowService) return;

  warnings.push({
    id: 'missing-materials',
    severity: 'yellow',
    title: 'No materials line',
    message: 'No material cost is included. Add materials or switch the job to materials separate.',
  });
}

function addNoMarkupWarning(
  warnings: GuardrailWarning[],
  computation: DocumentComputation,
  rates: Rates,
) {
  const hasSubtotal = computation.laborSubtotal + computation.materialsSubtotal > 0;
  if (!hasSubtotal || rates.markupPct > 0) return;
  warnings.push({
    id: 'no-markup',
    severity: 'yellow',
    title: 'Markup is off',
    message: 'Markup is set to 0%, so overhead and margin are not being added to this document.',
  });
}

function addLadderWithoutModifierWarning(
  warnings: GuardrailWarning[],
  lineItems: LineItem[],
) {
  const uncovered = lineItems.filter((item) => {
    if (!ACCESS_RE.test(lineSearchText(item))) return false;
    if ((item.accessPremiumCents ?? 0) > 0) return false;
    if ((item.modifierIds ?? []).some((id) => /access|ladder/i.test(id))) return false;
    if (/(second|high-access)/i.test(item.rateEntryId ?? '')) return false;
    return true;
  });
  if (uncovered.length === 0) return;

  warnings.push({
    id: 'ladder-without-modifier',
    severity: 'yellow',
    title: 'Access mentioned without uplift',
    message: `${uncovered.length} line${uncovered.length === 1 ? '' : 's'} mention ladder/high access without an access premium or modifier.`,
  });
}

function addVagueScopeWarning(
  warnings: GuardrailWarning[],
  lineItems: LineItem[],
) {
  const vague = lineItems.filter((item) => {
    if (item.calcMode === 'material' || item.calcMode === 'credit') return false;
    const scope = item.clientDescription?.trim() ?? '';
    if (!scope) return true;
    return scope.split(/\s+/).filter(Boolean).length < 3;
  });
  if (vague.length === 0) return;

  warnings.push({
    id: 'vague-scope',
    severity: 'info',
    title: 'Scope could be clearer',
    message: `${vague.length} service line${vague.length === 1 ? '' : 's'} need more client-facing scope language before printing.`,
  });
}

function addMissingDocumentDateWarnings(
  warnings: GuardrailWarning[],
  input: GuardrailInput,
) {
  if (input.docType === 'quote' && !input.validUntil?.trim()) {
    warnings.push({
      id: 'missing-expiration',
      severity: 'yellow',
      title: 'Quote expiration missing',
      message: 'Quotes should carry a valid-until date before they are sent.',
    });
  }
  if (input.docType === 'invoice' && !input.dueDate?.trim()) {
    warnings.push({
      id: 'missing-due-date',
      severity: 'yellow',
      title: 'Invoice due date missing',
      message: 'Invoices should carry a due date or payment terms before they are sent.',
    });
  }
}

function lineSearchText(item: LineItem): string {
  return [item.description, item.clientDescription, item.internalNote, item.rateEntryId]
    .filter(Boolean)
    .join(' ');
}

function lineLabel(item: LineItem): string {
  return item.clientDescription?.trim() || item.description?.trim() || 'This line';
}

function formatHours(hours: number): string {
  return `${Number.isInteger(hours) ? hours.toFixed(0) : hours.toFixed(1)} hr`;
}
