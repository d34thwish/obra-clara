import { describe, it, expect } from 'vitest';
import { app } from '../../apps/web/src/worker/index';
const limiter = { limit: async () => ({ success: true }) };
const env: any = {
  DEMO_MODE: 'true',
  ENVIRONMENT: 'development',
  TURNSTILE_DEV_BYPASS: 'true',
  PUBLIC_RATE_LIMITER: limiter,
  SUBMISSION_RATE_LIMITER: limiter,
};
describe('demo API', () => {
  it('serves dynamic resources', async () => {
    for (const path of [
      '/api/v1/overview',
      '/api/v1/institutions',
      '/api/v1/suppliers',
      '/api/v1/procurements',
      '/api/v1/signals',
    ])
      expect((await app.request(path, {}, env)).status).toBe(200);
  });
  it('rejects empty and unsafe input correctly', async () => {
    expect((await app.request('/api/v1/search?q=', {}, env)).status).toBe(200);
    expect((await app.request('/api/v1/procurements?limit=999', {}, env)).status).toBe(400);
  });
  it('persists only after validated submission shape', async () => {
    const bad = await app.request(
      '/api/v1/submissions',
      { method: 'POST', body: '{}', headers: { 'content-type': 'application/json' } },
      env,
    );
    expect(bad.status).toBe(400);
    const good = await app.request(
      '/api/v1/submissions',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          type: 'general',
          title: 'Propuesta válida',
          description: 'Descripción con extensión suficiente para ser aceptada.',
          details: {},
        }),
      },
      env,
    );
    expect(good.status).toBe(201);
    expect(((await good.json()) as any).data.id).toMatch(/^OC-/);
  });
  it('fails admin closed without Access config', async () =>
    expect((await app.request('/api/v1/admin/submissions', {}, env)).status).toBe(403));
});
