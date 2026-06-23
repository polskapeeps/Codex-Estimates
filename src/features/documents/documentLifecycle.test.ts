import { describe, expect, it } from 'vitest';
import {
  docTypeLabel,
  nextDocType,
  nextInvoiceNumberFrom,
} from './documentLifecycle';

describe('document lifecycle helpers', () => {
  it('moves documents through estimate to quote to invoice', () => {
    expect(nextDocType(undefined)).toBe('quote');
    expect(nextDocType('estimate')).toBe('quote');
    expect(nextDocType('quote')).toBe('invoice');
    expect(nextDocType('invoice')).toBeNull();
  });

  it('labels missing doc types as legacy estimates', () => {
    expect(docTypeLabel(undefined)).toBe('ESTIMATE');
    expect(docTypeLabel('quote')).toBe('QUOTE');
  });

  it('generates the next PK invoice number from existing invoices', () => {
    expect(nextInvoiceNumberFrom([])).toBe('PK-0001');
    expect(nextInvoiceNumberFrom(['PK-0001', undefined, 'PK-0009'])).toBe('PK-0010');
    expect(nextInvoiceNumberFrom(['bad', 'PK-0101', 'pk-0007'])).toBe('PK-0102');
  });
});
