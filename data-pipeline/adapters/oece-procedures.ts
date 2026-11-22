import { createHash } from 'node:crypto';
import { parseCsv, parseXlsx } from '../parsers/files';
import { normalizeCurrency, normalizeDate, parseMoneyMinor } from '../normalizers/values';
import type { NormalizedRecord, SourceAdapter } from '../types';
const first = (r: Record<string, unknown>, keys: string[]) =>
  keys.map((k) => r[k]).find((v) => v !== undefined && String(v).trim() !== '');
export const oeceProceduresAdapter: SourceAdapter = {
  metadata: {
    id: 'oece-convocatorias',
    datasetId: 'oece-convocatorias',
    title: 'Datos de la Convocatoria o Invitación de las entidades',
    institution: 'Organismo Especializado para las Contrataciones Públicas Eficientes (OECE)',
    catalogUrl:
      'https://www.datosabiertos.gob.pe/dataset/datos-de-la-convocatoria-o-invitaci%C3%B3n-de-las-entidades-organismo-especializado-para-las',
    dictionaryUrl:
      'https://www.datosabiertos.gob.pe/sites/default/files/DATOS%20DE%20LA%20CONVOCATORIA%20O%20INVITACI%C3%93N%20DE%20LAS%20ENTIDADES%20-%20DICCIONARIO%20-%20OSCE.xlsx',
    formats: ['csv', 'xlsx'],
    stage: 'process',
    licenseState: 'not_specified',
    archivePermitted: false,
    derivativesPermitted: false,
    coverage:
      'Procedimientos adjudicados cuya convocatoria o invitación corresponde a 2018 en adelante',
    updateFrequency: 'unknown',
    limitations: [
      'La licencia del catálogo no está especificada.',
      'La convocatoria es un proceso; no es una adjudicación, contrato ni pago.',
      'No contiene por sí sola un proveedor ganador verificable.',
    ],
    requiredHeaders: ['CODIGO_CONVOCATORIA'],
    knownHeaders: [
      'CODIGO_CONVOCATORIA',
      'ID_CONVOCATORIA',
      'DESCRIPCION',
      'OBJETO_CONTRACTUAL',
      'CODIGO_ENTIDAD',
      'ENTIDAD',
      'NOMBRE_ENTIDAD',
      'MONEDA',
      'MONTO_REFERENCIAL',
      'VALOR_ESTIMADO',
      'FECHA_CONVOCATORIA',
      'TIPO_PROCEDIMIENTO',
      'ESTADO',
    ],
  },
  async *parse(input, filename) {
    yield* filename.toLowerCase().endsWith('.xlsx') ? parseXlsx(input) : parseCsv(input);
  },
  normalize(row, n): NormalizedRecord {
    const sourceIdentifier = String(
      first(row, ['CODIGO_CONVOCATORIA', 'ID_CONVOCATORIA']) ?? '',
    ).trim();
    if (!sourceIdentifier) throw new Error('Missing CODIGO_CONVOCATORIA');
    const currency = normalizeCurrency(first(row, ['MONEDA'])) || 'PEN';
    const original = first(row, ['VALOR_ESTIMADO', 'MONTO_REFERENCIAL']);
    return {
      sourceIdentifier,
      stage: 'process',
      description: String(first(row, ['DESCRIPCION', 'OBJETO_CONTRACTUAL']) ?? '').trim() || null,
      institutionCode: String(first(row, ['CODIGO_ENTIDAD']) ?? '').trim(),
      institutionName: String(first(row, ['ENTIDAD', 'NOMBRE_ENTIDAD']) ?? '').trim(),
      supplierRuc: null,
      supplierName: null,
      currency,
      estimatedAmountMinor: parseMoneyMinor(original, currency),
      awardAmountMinor: null,
      contractAmountMinor: null,
      paidAmountMinor: null,
      originalAmountText: original == null ? null : String(original),
      publicationDate: normalizeDate(first(row, ['FECHA_CONVOCATORIA'])),
      awardDate: null,
      procedureType: String(first(row, ['TIPO_PROCEDIMIENTO']) ?? '').trim() || null,
      status: String(first(row, ['ESTADO']) ?? '').trim() || null,
      sourceRow: n,
      rawHash: createHash('sha256').update(JSON.stringify(row)).digest('hex'),
    };
  },
};
