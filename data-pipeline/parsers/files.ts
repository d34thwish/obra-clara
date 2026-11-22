import Papa from 'papaparse';
import ExcelJS from 'exceljs';
export async function* parseCsv(bytes: Uint8Array, delimiter?: string) {
  const text = new TextDecoder('utf-8', { fatal: false }).decode(bytes).replace(/^\uFEFF/, '');
  const parsed = Papa.parse<Record<string, unknown>>(text, {
    header: true,
    skipEmptyLines: 'greedy',
    delimiter: delimiter || '',
    transformHeader: (h) => h.trim(),
  });
  if (parsed.errors.some((e) => e.type === 'Quotes'))
    throw new Error(`CSV malformed: ${parsed.errors[0].message}`);
  for (let i = 0; i < parsed.data.length; i++) yield { row: parsed.data[i], rowNumber: i + 2 };
}
export async function* parseXlsx(bytes: Uint8Array) {
  if (bytes.byteLength > 50_000_000) throw new Error('XLSX exceeds 50 MB safety limit');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(bytes as any);
  for (const sheet of workbook.worksheets) {
    const headerRow = sheet.getRow(1);
    const headers = (headerRow.values as unknown[]).slice(1).map((v) => String(v ?? '').trim());
    if (!headers.some(Boolean)) continue;
    for (let n = 2; n <= sheet.rowCount; n++) {
      const values = (sheet.getRow(n).values as unknown[]).slice(1);
      if (!values.some((v) => v !== null && v !== undefined && v !== '')) continue;
      yield {
        row: Object.fromEntries(headers.map((h, i) => [h, cell(values[i])])),
        rowNumber: n,
        sheet: sheet.name,
      };
    }
  }
  function cell(v: unknown) {
    if (v && typeof v === 'object' && 'text' in (v as any)) return String((v as any).text);
    if (v instanceof Date) return v.toISOString().slice(0, 10);
    return v ?? '';
  }
}
