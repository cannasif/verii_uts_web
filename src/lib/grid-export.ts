export interface GridExportColumn {
  key: string;
  label: string;
}

type GridExportRow = Record<string, unknown>;

interface GridExportParams {
  fileName: string;
  columns: GridExportColumn[];
  rows: GridExportRow[];
}

const dynamicImport = (moduleName: string): Promise<unknown> => {
  return new Function('m', 'return import(m)')(moduleName) as Promise<unknown>;
};

function normalizeValue(value: unknown): string | number {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return value;
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

function mapExportRows(columns: GridExportColumn[], rows: GridExportRow[]) {
  return rows.map((row) => {
    const mapped: Record<string, string | number> = {};
    columns.forEach((column) => {
      mapped[column.label] = normalizeValue(row[column.key]);
    });
    return mapped;
  });
}

function downloadBlob(blob: Blob, fileName: string) {
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function fallbackExportExcel(params: GridExportParams) {
  const headers = params.columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join('');
  const body = params.rows
    .map((row) => {
      const cells = params.columns
        .map((column) => `<td>${escapeHtml(String(normalizeValue(row[column.key])))}</td>`)
        .join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');

  const html = `<!doctype html><html><head><meta charset="utf-8" /></head><body><table border="1"><thead><tr>${headers}</tr></thead><tbody>${body}</tbody></table></body></html>`;
  downloadBlob(new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' }), `${params.fileName}.xls`);
}

function fallbackExportPdf(params: GridExportParams) {
  const headers = params.columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join('');
  const body = params.rows
    .map((row) => {
      const cells = params.columns
        .map((column) => `<td>${escapeHtml(String(normalizeValue(row[column.key])))}</td>`)
        .join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');

  const html = `<!doctype html><html><head><meta charset="utf-8" /><title>${escapeHtml(params.fileName)}</title><style>body{font-family:Arial,sans-serif;padding:16px;}table{width:100%;border-collapse:collapse;}th,td{border:1px solid #d8dee8;padding:6px;text-align:left;font-size:12px;}th{background:#f8fafc;}</style></head><body><h2>${escapeHtml(params.fileName)}</h2><table><thead><tr>${headers}</tr></thead><tbody>${body}</tbody></table></body></html>`;
  const popup = window.open('', '_blank', 'noopener,noreferrer,width=1100,height=760');
  if (!popup) return;
  popup.document.open();
  popup.document.write(html);
  popup.document.close();
  popup.focus();
  popup.print();
}

interface XLSXModule {
  utils: {
    json_to_sheet: (data: Record<string, string | number>[]) => unknown;
    book_new: () => unknown;
    book_append_sheet: (workbook: unknown, sheet: unknown, name: string) => void;
  };
  writeFile: (workbook: unknown, filename: string) => void;
}

interface JsPdfConstructor {
  new (options?: { orientation?: 'landscape' }): { save: (filename: string) => void };
}

type AutoTableFn = (doc: unknown, options: Record<string, unknown>) => void;

export async function exportGridToExcel(params: GridExportParams) {
  try {
    const XLSX = (await dynamicImport('xlsx')) as XLSXModule;
    const worksheet = XLSX.utils.json_to_sheet(mapExportRows(params.columns, params.rows));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    XLSX.writeFile(workbook, `${params.fileName}.xlsx`);
  } catch {
    fallbackExportExcel(params);
  }
}

export async function exportGridToPdf(params: GridExportParams) {
  try {
    const [jspdfMod, autoTableMod] = await Promise.all([
      dynamicImport('jspdf') as Promise<{ default: JsPdfConstructor }>,
      dynamicImport('jspdf-autotable') as Promise<{ default: AutoTableFn }>,
    ]);
    const JsPdf = jspdfMod.default;
    const autoTable = autoTableMod.default;

    const rows = mapExportRows(params.columns, params.rows);
    const doc = new JsPdf({ orientation: 'landscape' });
    autoTable(doc, {
      head: [params.columns.map((column) => column.label)],
      body: rows.map((row) => params.columns.map((column) => row[column.label] ?? '')),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [27, 39, 66] },
      margin: { top: 20 },
    });
    doc.save(`${params.fileName}.pdf`);
  } catch {
    fallbackExportPdf(params);
  }
}
