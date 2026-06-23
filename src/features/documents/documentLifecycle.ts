import { addDays } from 'date-fns';
import { estimateRepo, projectRepo } from '../../data/repositories';
import { nowIso } from '../../lib/ids';
import type { DocType, DocumentStatus, Estimate } from '../../lib/types';

export function docTypeLabel(docType: DocType | undefined): string {
  return (docType ?? 'estimate').toUpperCase();
}

export function nextDocType(docType: DocType | undefined): DocType | null {
  const current = docType ?? 'estimate';
  if (current === 'estimate') return 'quote';
  if (current === 'quote') return 'invoice';
  return null;
}

export function conversionLabel(target: DocType): string {
  if (target === 'quote') return 'Convert to quote';
  if (target === 'invoice') return 'Convert to invoice';
  return 'Convert';
}

export function defaultValidUntil(from = new Date()): string {
  return addDays(from, 30).toISOString();
}

export function defaultInvoiceDueDate(from = new Date()): string {
  return from.toISOString();
}

export async function convertDocument(source: Estimate, target: DocType): Promise<Estimate> {
  if (target === 'estimate') throw new Error('Cannot convert a document back to an estimate.');
  const expected = nextDocType(source.docType);
  if (expected !== target) {
    throw new Error(`Cannot convert ${source.docType ?? 'estimate'} to ${target}.`);
  }

  const project = await projectRepo.get(source.projectId);
  if (!project) throw new Error('Parent job not found.');

  const now = nowIso();
  const invoiceFields =
    target === 'invoice'
      ? {
          invoiceNumber: await nextInvoiceNumber(),
          issueDate: now,
          dueDate: defaultInvoiceDueDate(),
          terms: 'Due on receipt',
          amountDue: source.totals.total,
          paidStatus: 'unpaid' as const,
          paymentMethod: 'cash' as const,
        }
      : {};

  const converted = await estimateRepo.create({
    projectId: source.projectId,
    trade: source.trade,
    pricingMode: source.pricingMode,
    docType: target,
    sourceDocumentId: source.id,
    rooms: structuredClone(source.rooms),
    lineItems: structuredClone(source.lineItems),
    ratesSnapshot: structuredClone(source.ratesSnapshot),
    totals: structuredClone(source.totals),
    scopeNotes: source.scopeNotes,
    status: defaultStatusFor(target),
    validUntil: target === 'quote' ? defaultValidUntil() : source.validUntil,
    ...invoiceFields,
  });

  await projectRepo.update(project.id, {
    estimateIds: [...(project.estimateIds ?? []), converted.id],
  });
  if (target === 'quote' && (project.status === 'lead' || project.status === 'estimating')) {
    await projectRepo.setStatus(project.id, 'bid_sent');
  }

  return converted;
}

export async function nextInvoiceNumber(): Promise<string> {
  const estimates = await estimateRepo.getAll();
  return nextInvoiceNumberFrom(estimates.map((estimate) => estimate.invoiceNumber));
}

export function nextInvoiceNumberFrom(invoiceNumbers: Array<string | undefined>): string {
  const max = invoiceNumbers.reduce((highest, invoiceNumber) => {
    const match = /^PK-(\d+)$/i.exec(invoiceNumber ?? '');
    return match ? Math.max(highest, Number.parseInt(match[1], 10)) : highest;
  }, 0);
  return `PK-${String(max + 1).padStart(4, '0')}`;
}

function defaultStatusFor(docType: DocType): DocumentStatus {
  if (docType === 'invoice') return 'invoiced';
  return 'draft';
}
