import { describe, it, expect } from 'vitest';
import { submission, transitions, procurementFilters } from '../../apps/web/src/worker/schemas';
describe('schemas', () => {
  it('requires structured indicator fields', () =>
    expect(
      submission.safeParse({
        type: 'indicator',
        title: 'Indicador claro',
        description: 'Descripción suficientemente extensa para validar.',
        details: {},
      }).success,
    ).toBe(false));
  it('accepts valid correction', () =>
    expect(
      submission.safeParse({
        type: 'correction',
        title: 'Corrección clara',
        description: 'Descripción suficientemente extensa para validar.',
        details: { recordReference: 'X', problem: 'P', expectedCorrection: 'C', evidence: 'E' },
      }).success,
    ).toBe(true));
  it('validates pagination', () =>
    expect(procurementFilters.safeParse({ limit: '1000' }).success).toBe(false));
  it('enforces transitions', () => {
    expect(transitions.received).toContain('under_review');
    expect(transitions.closed).toHaveLength(0);
  });
});
