import { newId } from '../../lib/ids';
import type { CalcMode, LineItem, LineUnit, ReasonTag } from '../../lib/types';

/** UI metadata for each calc mode (v2 §4.1) — labels drive the row editor. */
export const CALC_MODES: {
  value: CalcMode;
  label: string;
  qtyLabel: string;
  rateLabel: string;
  unit: LineUnit;
}[] = [
  { value: 'per_hour', label: 'Per hour', qtyLabel: 'Hours', rateLabel: 'Rate / hr', unit: 'hr' },
  { value: 'per_unit', label: 'Per unit', qtyLabel: 'Count', rateLabel: 'Rate / unit', unit: 'ea' },
  { value: 'per_sqft', label: 'Per sq ft', qtyLabel: 'Sq ft', rateLabel: 'Rate / sqft', unit: 'sqft' },
  { value: 'flat', label: 'Flat amount', qtyLabel: 'Qty', rateLabel: 'Amount', unit: 'lump' },
  { value: 'material', label: 'Material', qtyLabel: 'Qty', rateLabel: 'Unit cost', unit: 'ea' },
  { value: 'credit', label: 'Credit', qtyLabel: 'Qty', rateLabel: 'Credit amount', unit: 'lump' },
];

export function calcModeMeta(mode: CalcMode | undefined) {
  return CALC_MODES.find((m) => m.value === mode) ?? CALC_MODES[0];
}

/** Reason tags for credit lines (v2 §5.4 + §15 barter_tool_credit). */
export const REASON_TAGS: { value: ReasonTag; label: string }[] = [
  { value: 'repeat_client', label: 'Repeat client' },
  { value: 'bundled_addon', label: 'Bundled add-on' },
  { value: 'courtesy_credit', label: 'Courtesy credit' },
  { value: 'referral_goodwill', label: 'Referral goodwill' },
  { value: 'barter_tool_credit', label: 'Barter / tool credit' },
  { value: 'other', label: 'Other' },
];

export function makeDocumentLine(mode: CalcMode = 'per_hour'): LineItem {
  const meta = calcModeMeta(mode);
  return {
    id: newId(),
    description: '',
    clientDescription: '',
    qty: 1,
    unit: meta.unit,
    unitCost: 0,
    calcMode: mode,
    ...(mode === 'credit' ? { reasonTag: 'courtesy_credit' as ReasonTag } : {}),
  };
}
