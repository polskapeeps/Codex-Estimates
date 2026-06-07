import { newId } from '../../lib/ids';
import type { LineItem, LineUnit } from '../../lib/types';

export const LINE_UNITS: { value: LineUnit; label: string }[] = [
  { value: 'ea', label: 'each' },
  { value: 'sqft', label: 'sq ft' },
  { value: 'linft', label: 'lin ft' },
  { value: 'hr', label: 'hour' },
  { value: 'day', label: 'day' },
  { value: 'lump', label: 'lump sum' },
];

export function makeNewLineItem(overrides: Partial<LineItem> = {}): LineItem {
  return { id: newId(), description: '', qty: 1, unit: 'ea', unitCost: 0, ...overrides };
}
