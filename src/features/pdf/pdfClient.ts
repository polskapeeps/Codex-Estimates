import type { TDocumentDefinitions } from 'pdfmake/interfaces';

// pdfmake + its bundled fonts are heavy, so load them on demand (only when
// the user actually exports/prints) and cache the instance.
let cached: Promise<PdfMakeLike> | null = null;

interface PdfMakeLike {
  createPdf: (dd: TDocumentDefinitions) => { download: (name: string) => void; print: () => void };
  addVirtualFileSystem?: (vfs: unknown) => void;
  vfs?: unknown;
}

function loadPdfMake(): Promise<PdfMakeLike> {
  if (cached) return cached;
  cached = (async () => {
    const [pdfModule, vfsModule] = await Promise.all([
      import('pdfmake/build/pdfmake'),
      import('pdfmake/build/vfs_fonts'),
    ]);
    const pdfMake = ((pdfModule as { default?: PdfMakeLike }).default ??
      (pdfModule as unknown as PdfMakeLike)) as PdfMakeLike;
    const vfs =
      (vfsModule as { default?: unknown }).default ?? (vfsModule as unknown);
    if (typeof pdfMake.addVirtualFileSystem === 'function') {
      pdfMake.addVirtualFileSystem(vfs);
    } else {
      pdfMake.vfs = vfs;
    }
    return pdfMake;
  })();
  return cached;
}

function sanitize(name: string): string {
  return name.replace(/[^\w.-]+/g, '_').replace(/_+/g, '_').slice(0, 60) || 'estimate';
}

export async function downloadEstimatePdf(
  docDef: TDocumentDefinitions,
  filename: string,
): Promise<void> {
  const pdfMake = await loadPdfMake();
  pdfMake.createPdf(docDef).download(`${sanitize(filename)}.pdf`);
}

export async function printEstimatePdf(docDef: TDocumentDefinitions): Promise<void> {
  const pdfMake = await loadPdfMake();
  pdfMake.createPdf(docDef).print();
}
