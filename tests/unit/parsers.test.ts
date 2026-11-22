import { describe, it, expect } from 'vitest';
import ExcelJS from 'exceljs';
import { parseCsv, parseXlsx } from '../../data-pipeline/parsers/files';
import {
  normalizeCurrency,
  normalizeDate,
  parseMoneyMinor,
} from '../../data-pipeline/normalizers/values';
describe('source parsers', () => {
  it('handles BOM, quoted delimiters and newlines', async () => {
    const rows = [];
    for await (const x of parseCsv(
      new TextEncoder().encode(
        '\uFEFFCODIGO_CONVOCATORIA,DESCRIPCION\nA1,"texto, con coma\ny salto"',
      ),
    ))
      rows.push(x);
    expect(rows[0].row.DESCRIPCION).toBe('texto, con coma\ny salto');
  });
  it('parses XLSX sheets', async () => {
    const b = new ExcelJS.Workbook(),
      s = b.addWorksheet('Datos');
    s.addRow(['CODIGO_CONVOCATORIA', 'ENTIDAD']);
    s.addRow(['A1', 'Entidad']);
    const bytes = new Uint8Array(await b.xlsx.writeBuffer());
    const rows = [];
    for await (const x of parseXlsx(bytes)) rows.push(x);
    expect(rows[0]).toMatchObject({
      row: { CODIGO_CONVOCATORIA: 'A1', ENTIDAD: 'Entidad' },
      sheet: 'Datos',
    });
  });
});
describe('normalization', () => {
  it.each([
    ['1,234.56', 123456],
    ['1.234,56', 123456],
    ['1234,5', 123450],
    ['', null],
  ])('parses %s', (v, e) => expect(parseMoneyMinor(v)).toBe(e));
  it('normalizes currency/date', () => {
    expect(normalizeCurrency('soles')).toBe('PEN');
    expect(normalizeDate('31/01/2026')).toBe('2026-01-31');
  });
  it('rejects invalid amount/date', () => {
    expect(() => parseMoneyMinor('abc')).toThrow();
    expect(() => normalizeDate('31/02/2026')).toThrow();
  });
});
