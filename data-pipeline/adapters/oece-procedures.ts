import { createHash } from 'node:crypto';
import type { SourceAdapter, NormalizedRecord } from '../types';
function csvRows(text: string) {
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter(Boolean);
  const headers = lines
    .shift()!
    .split(';')
    .map((x) => x.trim());
  return lines.map((line) =>
    Object.fromEntries(line.split(';').map((v, i) => [headers[i], v.trim()])),
  );
}
function amountMinor(v: unknown) {
  if (!v) return null;
  const n = Number(String(v).replace(/,/g, ''));
  return Number.isFinite(n) ? Math.round(n * 100) : null;
}
export const oeceProceduresAdapter: SourceAdapter = {
  id: 'oece-procedures-awarded',
  institution: 'Organismo Especializado para las Contrataciones Públicas Eficientes (OECE)',
  catalogUrl:
    'https://www.datosabiertos.gob.pe/dataset/datos-de-la-convocatoria-o-invitaci%C3%B3n-de-las-entidades-organismo-especializado-para-las',
  formats: ['CSV', 'XLSX'],
  licenseStatus:
    'Dataset catalog entry does not specify a license; verify each distribution before reuse.',
  limitations: [
    'Coverage begins in 2018.',
    'Excludes ongoing, void, deserted or cancelled procedures per catalog description.',
    'Distribution URLs may change and must be configured.',
  ],
  async retrieve(config) {
    if (!config.url) throw new Error('OECE_DISTRIBUTION_URL is required; no endpoint is invented.');
    const r = await fetch(config.url, { redirect: 'follow' });
    if (!r.ok) throw new Error(`Download failed: ${r.status}`);
    return {
      bytes: new Uint8Array(await r.arrayBuffer()),
      filename: new URL(config.url).pathname.split('/').pop() || 'oece.csv',
      contentType: r.headers.get('content-type') || 'application/octet-stream',
    };
  },
  async *parse(bytes) {
    for (const row of csvRows(new TextDecoder('utf-8', { fatal: false }).decode(bytes))) yield row;
  },
  normalize(row, n): NormalizedRecord {
    const sourceIdentifier = String(row.CODIGO_CONVOCATORIA || row.ID_CONVOCATORIA || '').trim();
    if (!sourceIdentifier) throw new Error(`Missing source identifier at row ${n}`);
    return {
      sourceIdentifier,
      stage: 'award',
      description: String(row.DESCRIPCION || row.OBJETO_CONTRACTUAL || '').trim() || null,
      institutionCode: String(row.CODIGO_ENTIDAD || '').trim(),
      institutionName: String(row.ENTIDAD || row.NOMBRE_ENTIDAD || '').trim(),
      supplierRuc: null,
      supplierName: null,
      currency: String(row.MONEDA || 'PEN').trim() || null,
      awardAmountMinor: amountMinor(row.MONTO_ADJUDICADO || row.MONTO_REFERENCIAL),
      awardDate: String(row.FECHA_BUENA_PRO || row.FECHA_ADJUDICACION || '').trim() || null,
      sourceRow: n,
      rawHash: createHash('sha256').update(JSON.stringify(row)).digest('hex'),
    };
  },
};
