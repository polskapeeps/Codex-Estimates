import type { Content, TDocumentDefinitions } from 'pdfmake/interfaces';
import { formatMoney, formatMoneyWhole } from '../../lib/money';
import { formatDate } from '../../lib/format';
import type { CompanyInfo, MaterialsMode, Totals } from '../../lib/types';

/**
 * Clean, client-facing QUOTE PDF (v2 §6, §12). Prints SCOPE language only — no
 * hours, no rates, no internal notes (scope sounds professional; time sounds
 * negotiable). pdfmake → iOS share/print sheet via pdfClient (AirPrint, §12).
 */

export interface QuoteLine {
  description: string; // clientDescription / scope
  amount: number; // signed cents (credits negative)
  isCredit: boolean;
}

export interface QuotePdfContext {
  company: CompanyInfo;
  docLabel: string; // 'QUOTE' | 'ESTIMATE'
  clientName?: string;
  clientContact?: string;
  jobTitle: string;
  jobAddress?: string;
  lines: QuoteLine[];
  totals: Totals;
  materialsMode: MaterialsMode;
  validUntil?: string; // ISO
  issueDate: string; // ISO
  scopeNotes?: string;
}

const MUTED = '#64748b';
const INK = '#0f172a';
const LINE = '#e2e8f0';
const BRAND = '#1d4ed8';

function usableLogo(dataUrl?: string): string | undefined {
  if (!dataUrl) return undefined;
  return /^data:image\/(png|jpe?g)/i.test(dataUrl) ? dataUrl : undefined;
}

function headerBlock(ctx: QuotePdfContext): Content {
  const { company } = ctx;
  const logo = usableLogo(company.logoDataUrl);

  const companyStack: Content[] = [
    { text: company.name || 'PK Paints & Renovations', style: 'company' },
  ];
  const contact = [company.phone, company.email].filter(Boolean).join('  ·  ');
  if (contact) companyStack.push({ text: contact, color: MUTED, fontSize: 9, margin: [0, 2, 0, 0] });
  if (company.address) companyStack.push({ text: company.address, color: MUTED, fontSize: 9 });

  const left: Content = logo
    ? ({
        width: '*',
        columns: [
          { image: logo, fit: [48, 48], width: 48 },
          { stack: companyStack, margin: [10, 2, 0, 0] },
        ],
      } as unknown as Content)
    : ({ width: '*', stack: companyStack } as unknown as Content);

  const right: Content[] = [
    { text: ctx.docLabel, style: 'docTitle', alignment: 'right' },
    { text: formatDate(ctx.issueDate), alignment: 'right', color: MUTED, fontSize: 9, margin: [0, 2, 0, 0] },
  ];
  if (ctx.validUntil) {
    right.push({
      text: `Valid until ${formatDate(ctx.validUntil)}`,
      alignment: 'right',
      color: MUTED,
      fontSize: 9,
    });
  }

  return {
    columns: [left, { width: 'auto', stack: right }],
    margin: [0, 0, 0, 14],
  };
}

function clientBlock(ctx: QuotePdfContext): Content {
  return {
    columns: [
      {
        width: '*',
        stack: [
          { text: 'PREPARED FOR', style: 'label' },
          { text: ctx.clientName || '—', bold: true, margin: [0, 2, 0, 0] },
          ...(ctx.clientContact
            ? [{ text: ctx.clientContact, color: MUTED, fontSize: 9 } as Content]
            : []),
        ],
      },
      {
        width: '*',
        stack: [
          { text: 'JOB', style: 'label' },
          { text: ctx.jobTitle || '—', bold: true, margin: [0, 2, 0, 0] },
          ...(ctx.jobAddress
            ? [{ text: ctx.jobAddress, color: MUTED, fontSize: 9 } as Content]
            : []),
        ],
      },
    ],
    columnGap: 16,
    margin: [0, 0, 0, 6],
  };
}

function scopeTable(ctx: QuotePdfContext): Content[] {
  const body: Content[][] = [
    [
      { text: 'Scope of work', style: 'th' },
      { text: 'Amount', style: 'th', alignment: 'right' },
    ],
  ];
  for (const ln of ctx.lines) {
    body.push([
      { text: ln.description || 'Work', color: ln.isCredit ? '#15803d' : INK },
      {
        text: ln.isCredit ? `(${formatMoney(Math.abs(ln.amount))})` : formatMoney(ln.amount),
        alignment: 'right',
        color: ln.isCredit ? '#15803d' : INK,
      },
    ]);
  }
  return [
    { text: 'Scope & pricing', style: 'sectionTitle' },
    {
      table: { headerRows: 1, widths: ['*', 'auto'], body },
      layout: {
        hLineWidth: (i: number, node: { table: { body: unknown[] } }) =>
          i === 0 || i === 1 || i === node.table.body.length ? 0.5 : 0.25,
        vLineWidth: () => 0,
        hLineColor: () => LINE,
        paddingTop: () => 5,
        paddingBottom: () => 5,
      },
    },
  ];
}

function totalsBlock(ctx: QuotePdfContext): Content {
  const t = ctx.totals;
  const rows: [string, string][] = [['Subtotal', formatMoney(t.subtotal)]];
  if (t.markup !== 0) rows.push(['Markup', formatMoney(t.markup)]);
  if (t.discounts !== 0) rows.push(['Credit applied', `(${formatMoney(Math.abs(t.discounts))})`]);
  if (t.tax !== 0) rows.push(['Tax', formatMoney(t.tax)]);

  const body: Content[][] = rows.map(([label, value]) => [
    { text: label, color: MUTED },
    { text: value, alignment: 'right' },
  ]);

  return {
    columns: [
      { width: '*', text: '' },
      {
        width: 230,
        stack: [
          { table: { widths: ['*', 'auto'], body }, layout: 'noBorders' },
          { canvas: [{ type: 'line', x1: 0, y1: 4, x2: 230, y2: 4, lineColor: LINE }] },
          {
            columns: [
              { text: 'Total', bold: true, fontSize: 13 },
              { text: formatMoney(t.total), alignment: 'right', bold: true, fontSize: 13 },
            ],
            margin: [0, 6, 0, 0],
          },
          ...(ctx.materialsMode === 'separate'
            ? [
                {
                  text: 'Materials billed separately (at cost; receipts provided).',
                  alignment: 'right',
                  color: MUTED,
                  fontSize: 8,
                  italics: true,
                  margin: [0, 4, 0, 0],
                } as Content,
              ]
            : []),
        ],
      },
    ],
    margin: [0, 12, 0, 0],
  };
}

function notesAndSignature(ctx: QuotePdfContext): Content[] {
  const out: Content[] = [];
  if (ctx.scopeNotes?.trim()) {
    out.push({ text: 'Notes', style: 'sectionTitle' });
    out.push({ text: ctx.scopeNotes, fontSize: 9, color: '#334155' });
  }
  out.push({
    columns: [
      {
        width: '*',
        stack: [
          { text: 'Accepted by', style: 'label', margin: [0, 28, 0, 0] },
          { canvas: [{ type: 'line', x1: 0, y1: 8, x2: 200, y2: 8, lineColor: INK }] },
        ],
      },
      {
        width: 'auto',
        stack: [
          { text: 'Date', style: 'label', margin: [0, 28, 0, 0] },
          { canvas: [{ type: 'line', x1: 0, y1: 8, x2: 120, y2: 8, lineColor: INK }] },
        ],
      },
    ],
    columnGap: 24,
  });
  return out;
}

export function buildQuoteDocDefinition(ctx: QuotePdfContext): TDocumentDefinitions {
  return {
    pageSize: 'LETTER',
    pageMargins: [40, 40, 40, 56],
    defaultStyle: { fontSize: 10, color: '#1e293b', lineHeight: 1.15 },
    info: { title: `${ctx.docLabel} — ${ctx.jobTitle}` },
    styles: {
      company: { fontSize: 13, bold: true, color: INK },
      docTitle: { fontSize: 22, bold: true, color: BRAND, characterSpacing: 1 },
      label: { fontSize: 8, bold: true, color: '#94a3b8', characterSpacing: 0.5 },
      sectionTitle: { fontSize: 11, bold: true, color: INK, margin: [0, 14, 0, 4] },
      th: { bold: true, fontSize: 9, color: '#475569' },
    },
    footer: (currentPage: number, pageCount: number): Content => ({
      columns: [
        {
          text: 'Thank you for the opportunity. Pricing subject to on-site confirmation.',
          fontSize: 8,
          color: '#94a3b8',
          margin: [40, 12, 0, 0],
        },
        {
          text: `${currentPage} / ${pageCount}`,
          alignment: 'right',
          fontSize: 8,
          color: '#94a3b8',
          margin: [0, 12, 40, 0],
        },
      ],
    }),
    content: [
      headerBlock(ctx),
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineColor: LINE }], margin: [0, 0, 0, 12] },
      clientBlock(ctx),
      ...scopeTable(ctx),
      totalsBlock(ctx),
      ...notesAndSignature(ctx),
    ],
  };
}

/** Headline range string for the on-screen total (whole dollars). */
export function quoteRangeLabel(totals: Totals): string {
  return `${formatMoneyWhole(totals.low)} – ${formatMoneyWhole(totals.high)}`;
}
