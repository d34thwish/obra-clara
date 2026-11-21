export interface IndicatorDefinition {
  id: string;
  name: string;
  description: string;
  calculation: string;
  requiredFields: string[];
  comparisonPopulation: string;
  thresholds: Record<string, number>;
  minimumSampleSize: number;
  limitations: string[];
  possibleExplanations: string[];
  version: string;
}
export function supplierConcentration(rows: { supplierId: string; amount: number }[]) {
  const total = rows.reduce((s, r) => s + r.amount, 0);
  const by = new Map<string, number>();
  rows.forEach((r) => by.set(r.supplierId, (by.get(r.supplierId) || 0) + r.amount));
  return [...by]
    .map(([supplierId, amount]) => ({
      supplierId,
      amount,
      share: total ? amount / total : 0,
      total,
    }))
    .sort((a, b) => b.share - a.share);
}
export const concentrationDefinition: IndicatorDefinition = {
  id: 'supplier-concentration',
  name: 'Concentración de proveedor',
  description:
    'Participación de un proveedor en adjudicaciones comparables de una entidad y periodo.',
  calculation: 'monto del proveedor / monto total comparable',
  requiredFields: ['institution_id', 'supplier_id', 'award_amount', 'award_date', 'currency'],
  comparisonPopulation: 'Adjudicaciones de igual moneda por entidad y periodo',
  thresholds: { review: 0.5 },
  minimumSampleSize: 5,
  limitations: [
    'La concentración no prueba irregularidad.',
    'Puede reflejar especialización o mercados pequeños.',
  ],
  possibleExplanations: ['Especialización', 'Oferta local limitada', 'Contratos plurianuales'],
  version: '1.0.0',
};
