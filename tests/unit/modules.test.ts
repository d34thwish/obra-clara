import { describe, it, expect } from 'vitest';
import { ModuleRegistry } from '../../packages/core/src';
import { dataQualityModule } from '../../packages/modules/src';
describe('modules', () => {
  it('registers trusted build-time modules', () => {
    const r = new ModuleRegistry();
    r.register(dataQualityModule);
    expect(r.active()[0].id).toBe('data-quality');
  });
  it('rejects duplicates', () => {
    const r = new ModuleRegistry();
    r.register(dataQualityModule);
    expect(() => r.register(dataQualityModule)).toThrow();
  });
});
