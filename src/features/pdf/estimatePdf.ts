import type { Content, TDocumentDefinitions } from 'pdfmake/interfaces';
import { computePainting } from '../../lib/estimate/painting';
import { computeGeneral } from '../../lib/estimate/general';
import { lineItemAmount } from '../../lib/estimate/lineItems';
import { LINE_UNITS } from '../general/lineItem';
import { formatMoney, formatMoneyWhole } from '../../lib/money';
import { formatDate } from '../../lib/format';
import type { Client, CompanyInfo, Estimate, Project } from '../../lib/types';

export interface EstimatePdfContext {
  estimate: Estimate;
  project: Project;
  client?: Client;
  company: CompanyInfo;
}

const MUTED = '#64748b';
const INK = '#0f172a';
const LINE = '#e2e8f0';

// pdfmake supports PNG/JPEG data URLs for images (not SVG).
function usableLogo(dataUrl?: string): string | undefined {
  if (!dataUrl) return undefined;
  return /^data:image\/(png|jpe?g)/i.test(dataUrl) ? dataUrl : undefined;
}

function unitLabel(unit: string): string {
  return LINE_UNITS.find((u) => u.value === unit)?.label ?? unit;
}

function headerBlock(ctx: EstimatePdfContext): Content {
  const { company, estimate } = ctx;
  const logo = usableLogo(company.logoDataUrl);
  const laborOnly = estimate.pricingMode === 'labor_only';
  const docLabel = laborOnly ? 'LABOR-ONLY ESTIMATE' : (estimate.docType ?? 'estimate').toUpperCase();

  const companyStack: Content[] = [
    { text: company.name || 'Your Company', style: 'company' },
  ];
  const contact = [company.phone, company.email].filter(Boolean).join('  ·  ');
  if (contact) companyStack.push({ text: contact, color: MUTED, fontSize: 9, margin: [0, 2, 0, 0] });
  if (company.address) companyStack.push({ text: company.address, color: MUTED, fontSize: 9 });

  // Column items carry `width`, which pdfmake's `Content` union doesn't model.
  const left: Content = logo
    ? ({
        width: '*',
        columns: [
          { image: logo, fit: [48, 48], width: 48 },
          { stack: companyStack, margin: [10, 2, 0, 0] },
        ],
      } as unknown as Content)
    : ({ width: '*', stack: companyStack } as unknown as Content);

  return {
    columns: [
      left,
      {
        width: 'auto',
        stack: [
          {
            text: docLabel,
            style: 'docTitle',
            alignment: 'right',
          },
          {
            text: formatDate(estimate.createdAt),
            alignment: 'right',
            color: MUTED,
            fontSize: 9,
            margin: [0, 2, 0, 0],
          },
          { text: `Version ${estimate.version}`, alignment: 'right', color: MUTED, fontSize: 9 },
          ...(estimate.docType === 'invoice' && estimate.invoiceNumber
            ? [
                {
                  text: estimate.invoiceNumber,
                  alignment: 'right',
                  color: MUTED,
                  fontSize: 9,
                } as Content,
              ]
            : []),
          ...(estimate.docType === 'quote' && estimate.validUntil
            ? [
                {
                  text: `Valid until ${formatDate(estimate.validUntil)}`,
                  alignment: 'right',
                  color: MUTED,
                  fontSize: 9,
                } as Content,
              ]
            : []),
          ...(estimate.docType === 'invoice' && estimate.dueDate
            ? [
                {
                  text: `Due ${formatDate(estimate.dueDate)}`,
                  alignment: 'right',
                  color: MUTED,
                  fontSize: 9,
                } as Content,
              ]
            : []),
        ],
      },
    ],
    margin: [0, 0, 0, 14],
  };
}

function invoiceInfoBlock(ctx: EstimatePdfContext): Content[] {
  const { estimate } = ctx;
  if (estimate.docType !== 'invoice') return [];
  const amountDue = estimate.amountDue ?? estimate.totals.total;
  const rows: Content[][] = [
    [
      { text: 'Invoice #', style: 'label' },
      { text: estimate.invoiceNumber ?? '—', bold: true },
      { text: 'Amount due', style: 'label' },
      { text: formatMoney(amountDue), bold: true, alignment: 'right' },
    ],
    [
      { text: 'Issue date', style: 'label' },
      { text: formatDate(estimate.issueDate ?? estimate.createdAt) },
      { text: 'Due', style: 'label' },
      { text: formatDate(estimate.dueDate), alignment: 'right' },
    ],
    [
      { text: 'Terms', style: 'label' },
      { text: estimate.terms ?? 'Due on receipt' },
      { text: 'Payment', style: 'label' },
      { text: paymentMethodLabel(estimate.paymentMethod), alignment: 'right' },
    ],
  ];

  return [
    ...(estimate.paidStatus === 'paid'
      ? [
          {
            text: 'PAID',
            alignment: 'right',
            bold: true,
            color: '#15803d',
            fontSize: 20,
            margin: [0, 0, 0, 4],
          } as Content,
        ]
      : []),
    {
      table: { widths: ['auto', '*', 'auto', '*'], body: rows },
      layout: {
        hLineWidth: () => 0,
        vLineWidth: () => 0,
        paddingTop: () => 2,
        paddingBottom: () => 2,
      },
      margin: [0, 8, 0, 0],
    },
  ];
}

function clientBlock(ctx: EstimatePdfContext): Content {
  const { client, project } = ctx;
  const contact = [client?.phone, client?.email].filter(Boolean).join('  ·  ');
  const address = project.address || client?.address;
  return {
    columns: [
      {
        width: '*',
        stack: [
          { text: 'PREPARED FOR', style: 'label' },
          { text: client?.name ?? '—', bold: true, margin: [0, 2, 0, 0] },
          ...(contact ? [{ text: contact, color: MUTED, fontSize: 9 } as Content] : []),
        ],
      },
      {
        width: '*',
        stack: [
          { text: 'JOB', style: 'label' },
          { text: project.title, bold: true, margin: [0, 2, 0, 0] },
          ...(address ? [{ text: address, color: MUTED, fontSize: 9 } as Content] : []),
        ],
      },
    ],
    columnGap: 16,
    margin: [0, 0, 0, 6],
  };
}

function paintingBreakdown(ctx: EstimatePdfContext): Content[] {
  const comp = computePainting(ctx.estimate.rooms, ctx.estimate.ratesSnapshot);
  const laborOnly = ctx.estimate.pricingMode === 'labor_only';
  const body: Content[][] = [
    [
      { text: 'Room', style: 'th' },
      { text: 'Surfaces', style: 'th' },
      { text: 'Size (ft)', style: 'th', alignment: 'right' },
      { text: 'Applied sqft', style: 'th', alignment: 'right' },
      { text: 'Hours', style: 'th', alignment: 'right' },
    ],
  ];
  for (const rc of comp.rooms) {
    const surfaces =
      [rc.room.walls && 'Walls', rc.room.ceiling && 'Ceiling', rc.room.trim && 'Trim']
        .filter(Boolean)
        .join(', ') || '—';
    body.push([
      { text: rc.room.label || 'Room' },
      {
        text: `${surfaces} · ${rc.room.coats} coats · ${rc.room.prepLevel} prep`,
        fontSize: 9,
        color: MUTED,
      },
      { text: `${rc.room.length}×${rc.room.width}×${rc.room.height}`, alignment: 'right' },
      { text: String(Math.round(rc.appliedSqft)), alignment: 'right' },
      { text: rc.totalHours.toFixed(1), alignment: 'right' },
    ]);
  }

  const materialsLine = [
    `${comp.paintGallons} gal paint${laborOnly ? ' not included' : ''}`,
    comp.primerGallons > 0
      ? `${comp.primerGallons} gal primer${laborOnly ? ' not included' : ''}`
      : null,
    `${comp.laborHours.toFixed(1)} labor hrs`,
  ]
    .filter(Boolean)
    .join('   ·   ');

  return [
    { text: 'Scope breakdown', style: 'sectionTitle' },
    {
      table: { headerRows: 1, widths: ['*', '*', 'auto', 'auto', 'auto'], body },
      layout: tableLayout(),
    },
    { text: materialsLine, color: MUTED, fontSize: 9, margin: [0, 6, 0, 0] },
  ];
}

function generalBreakdown(ctx: EstimatePdfContext): Content[] {
  const comp = computeGeneral(ctx.estimate.lineItems);
  const scopeOnly = ctx.estimate.docType === 'quote' || ctx.estimate.docType === 'invoice';
  if (scopeOnly) {
    const body: Content[][] = [
      [
        { text: 'Scope of work', style: 'th' },
        { text: 'Amount', style: 'th', alignment: 'right' },
      ],
    ];
    for (const item of comp.lineItems) {
      const isCredit = item.calcMode === 'credit';
      body.push([
        {
          text: item.clientDescription?.trim() || 'Scope to be confirmed',
          color: isCredit ? '#15803d' : INK,
        },
        {
          text: isCredit
            ? `(${formatMoney(Math.abs(lineItemAmount(item)))})`
            : formatMoney(lineItemAmount(item)),
          alignment: 'right',
          color: isCredit ? '#15803d' : INK,
        },
      ]);
    }
    return [
      { text: 'Scope & pricing', style: 'sectionTitle' },
      {
        table: { headerRows: 1, widths: ['*', 'auto'], body },
        layout: tableLayout(),
      },
    ];
  }

  const body: Content[][] = [
    [
      { text: 'Description', style: 'th' },
      { text: 'Qty', style: 'th', alignment: 'right' },
      { text: 'Unit', style: 'th' },
      { text: 'Unit cost', style: 'th', alignment: 'right' },
      { text: 'Total', style: 'th', alignment: 'right' },
    ],
  ];
  for (const item of comp.lineItems) {
    body.push([
      { text: item.clientDescription?.trim() || item.description || 'Untitled' },
      { text: String(item.qty), alignment: 'right' },
      { text: unitLabel(item.unit) },
      { text: formatMoney(item.unitCost), alignment: 'right' },
      { text: formatMoney(lineItemAmount(item)), alignment: 'right' },
    ]);
  }
  return [
    { text: 'Line items', style: 'sectionTitle' },
    {
      table: { headerRows: 1, widths: ['*', 'auto', 'auto', 'auto', 'auto'], body },
      layout: tableLayout(),
    },
  ];
}

function totalsBlock(ctx: EstimatePdfContext): Content {
  const t = ctx.estimate.totals;
  const laborOnly = ctx.estimate.pricingMode === 'labor_only';
  const isInvoice = ctx.estimate.docType === 'invoice';
  const amountDue = ctx.estimate.amountDue ?? t.total;
  const rows: [string, string][] = laborOnly
    ? [[`Labor only (${t.laborHours.toFixed(1)} hrs)`, formatMoney(t.labor)]]
    : [['Materials', formatMoney(t.materials)]];

  if (!laborOnly && (t.labor !== 0 || t.laborHours !== 0)) {
    rows.push([`Labor (${t.laborHours.toFixed(1)} hrs)`, formatMoney(t.labor)]);
  }
  if (!laborOnly) {
    rows.push(['Subtotal', formatMoney(t.subtotal)]);
    rows.push(['Markup', formatMoney(t.markup)]);
    if (t.discounts !== 0) rows.push(['Credit applied', `(${formatMoney(Math.abs(t.discounts))})`]);
    rows.push(['Tax', formatMoney(t.tax)]);
  }

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
              { text: isInvoice ? 'Amount due' : laborOnly ? 'Total labor' : 'Total', bold: true, fontSize: 13 },
              {
                text: formatMoney(isInvoice ? amountDue : t.total),
                alignment: 'right',
                bold: true,
                fontSize: 13,
              },
            ],
            margin: [0, 6, 0, 0],
          },
          {
            text: `Range: ${formatMoneyWhole(t.low)} – ${formatMoneyWhole(t.high)}`,
            alignment: 'right',
            color: MUTED,
            fontSize: 9,
            margin: [0, 6, 0, 0],
          },
          {
            text: laborOnly
              ? 'Labor-only estimate - materials, markup, and tax not included.'
              : isInvoice
                ? `${ctx.estimate.terms ?? 'Due on receipt'} · Payment: ${paymentMethodLabel(ctx.estimate.paymentMethod)}`
              : 'Rough estimate - final price subject to on-site inspection.',
            alignment: 'right',
            color: MUTED,
            fontSize: 8,
            italics: true,
            margin: [0, 2, 0, 0],
          },
        ],
      },
    ],
    margin: [0, 12, 0, 0],
  };
}

function notesAndSignature(ctx: EstimatePdfContext): Content[] {
  const out: Content[] = [];
  if (ctx.estimate.scopeNotes?.trim()) {
    out.push({ text: 'Notes & scope', style: 'sectionTitle' });
    out.push({ text: ctx.estimate.scopeNotes, fontSize: 9, color: '#334155' });
  }
  out.push({
    columns: [
      {
        width: '*',
        stack: [
          { text: 'Accepted by', style: 'label', margin: [0, 24, 0, 0] },
          { canvas: [{ type: 'line', x1: 0, y1: 8, x2: 200, y2: 8, lineColor: INK }] },
        ],
      },
      {
        width: 'auto',
        stack: [
          { text: 'Date', style: 'label', margin: [0, 24, 0, 0] },
          { canvas: [{ type: 'line', x1: 0, y1: 8, x2: 120, y2: 8, lineColor: INK }] },
        ],
      },
    ],
    columnGap: 24,
  });
  return out;
}

function tableLayout() {
  return {
    hLineWidth: (i: number, node: { table: { body: unknown[] } }) =>
      i === 0 || i === 1 || i === node.table.body.length ? 0.5 : 0.25,
    vLineWidth: () => 0,
    hLineColor: () => LINE,
    paddingTop: () => 4,
    paddingBottom: () => 4,
  };
}

export function buildEstimateDocDefinition(ctx: EstimatePdfContext): TDocumentDefinitions {
  const breakdown =
    ctx.estimate.trade === 'painting' ? paintingBreakdown(ctx) : generalBreakdown(ctx);

  return {
    pageSize: 'LETTER',
    pageMargins: [40, 40, 40, 56],
    defaultStyle: { fontSize: 10, color: '#1e293b', lineHeight: 1.15 },
    info: { title: `Estimate — ${ctx.project.title}` },
    styles: {
      company: { fontSize: 13, bold: true, color: INK },
      docTitle: { fontSize: 22, bold: true, color: '#1d4ed8', characterSpacing: 1 },
      label: { fontSize: 8, bold: true, color: '#94a3b8', characterSpacing: 0.5 },
      sectionTitle: { fontSize: 11, bold: true, color: INK, margin: [0, 14, 0, 4] },
      th: { bold: true, fontSize: 9, color: '#475569' },
    },
    footer: (currentPage: number, pageCount: number): Content => ({
      columns: [
        {
          text: 'This is an estimate only and is subject to change after inspection.',
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
      ...invoiceInfoBlock(ctx),
      ...breakdown,
      totalsBlock(ctx),
      ...notesAndSignature(ctx),
    ],
  };
}

function paymentMethodLabel(method: string | undefined): string {
  if (!method) return 'Cash';
  return method.charAt(0).toUpperCase() + method.slice(1);
}
