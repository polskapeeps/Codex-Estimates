import type { Content, TDocumentDefinitions } from 'pdfmake/interfaces';
import { computePainting } from '../../lib/estimate/painting';
import { computeGeneral, lineTotal } from '../../lib/estimate/general';
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
          { text: 'ESTIMATE', style: 'docTitle', alignment: 'right' },
          {
            text: formatDate(estimate.createdAt),
            alignment: 'right',
            color: MUTED,
            fontSize: 9,
            margin: [0, 2, 0, 0],
          },
          { text: `Version ${estimate.version}`, alignment: 'right', color: MUTED, fontSize: 9 },
        ],
      },
    ],
    margin: [0, 0, 0, 14],
  };
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
    `${comp.paintGallons} gal paint`,
    comp.primerGallons > 0 ? `${comp.primerGallons} gal primer` : null,
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
      { text: item.description || 'Untitled' },
      { text: String(item.qty), alignment: 'right' },
      { text: unitLabel(item.unit) },
      { text: formatMoney(item.unitCost), alignment: 'right' },
      { text: formatMoney(lineTotal(item)), alignment: 'right' },
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
  const rows: [string, string][] = [['Materials', formatMoney(t.materials)]];
  if (t.labor !== 0 || t.laborHours !== 0) {
    rows.push([`Labor (${t.laborHours.toFixed(1)} hrs)`, formatMoney(t.labor)]);
  }
  rows.push(['Subtotal', formatMoney(t.subtotal)]);
  rows.push(['Markup', formatMoney(t.markup)]);
  rows.push(['Tax', formatMoney(t.tax)]);

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
          {
            text: `Range: ${formatMoneyWhole(t.low)} – ${formatMoneyWhole(t.high)}`,
            alignment: 'right',
            color: MUTED,
            fontSize: 9,
            margin: [0, 6, 0, 0],
          },
          {
            text: 'Rough estimate · final price subject to on-site inspection.',
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
      ...breakdown,
      totalsBlock(ctx),
      ...notesAndSignature(ctx),
    ],
  };
}
