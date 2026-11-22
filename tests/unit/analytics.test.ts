import { describe, it, expect } from 'vitest';
import { supplierConcentration } from '../../packages/analytics/src';
describe('supplier concentration', () => {
  it('uses comparable total', () => {
    const r = supplierConcentration([
      { supplierId: 'a', amount: 75 },
      { supplierId: 'b', amount: 25 },
    ]);
    expect(r[0]).toMatchObject({ supplierId: 'a', share: 0.75, total: 100 });
  });
  it('handles zero safely', () => {
    expect(supplierConcentration([{ supplierId: 'a', amount: 0 }])[0].share).toBe(0);
  });
});
