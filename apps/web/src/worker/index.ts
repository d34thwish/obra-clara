import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { z } from 'zod';
import { createRemoteJWKSet, jwtVerify } from 'jose';
type Env = {
  DB: D1Database;
  RAW_DATA: R2Bucket;
  ASSETS: Fetcher;
  DEMO_MODE: string;
  ACCESS_TEAM_DOMAIN: string;
  ACCESS_AUD: string;
  TURNSTILE_SECRET_KEY?: string;
};
const app = new Hono<{ Bindings: Env }>();
app.use(
  '*',
  secureHeaders({
    contentSecurityPolicy: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
    },
  }),
);
app.use('/api/*', cors({ origin: '*' }));
app.use('/api/*', async (c, next) => {
  const key = c.req.header('CF-Connecting-IP') || 'local';
  const bucket = Math.floor(Date.now() / 60000);
  const cache = (caches as unknown as { default: Cache }).default;
  const req = new Request(`https://limit.local/${key}/${bucket}`);
  const hit = await cache.match(req);
  const count = hit ? Number(await hit.text()) : 0;
  if (count > 120) return c.json({ error: 'rate_limited' }, 429);
  await cache.put(
    req,
    new Response(String(count + 1), { headers: { 'Cache-Control': 'max-age=60' } }),
  );
  await next();
});
const demo = {
  institutions: [
    { id: 'inst-demo-1', name: 'Municipalidad Provincial Demostrativa', code: 'DEMO-ENT-001' },
  ],
  suppliers: [
    { id: 'sup-demo-1', name: 'Servicios Andinos de Demostración S.A.C.', ruc: '20000000001' },
  ],
  procurements: [
    { id: 'proc-demo-1', identifier: 'DEMO-2026-001', amount_minor: 32000000, currency: 'PEN' },
  ],
};
app.get('/api/v1/health', (c) =>
  c.json({
    ok: true,
    service: 'obra-clara',
    mode: c.env.DEMO_MODE === 'true' ? 'demo' : 'production',
  }),
);
app.get('/api/v1/search', async (c) => {
  const q = (c.req.query('q') || '').slice(0, 100);
  if (c.env.DEMO_MODE === 'true') {
    const all = [
      ...demo.institutions.map((x) => ({ ...x, type: 'institution' })),
      ...demo.suppliers.map((x) => ({ ...x, type: 'supplier' })),
      ...demo.procurements.map((x) => ({ ...x, type: 'procurement' })),
    ];
    return c.json({
      data: all.filter((x) => JSON.stringify(x).toLowerCase().includes(q.toLowerCase())),
      demo: true,
    });
  }
  const rows = await c.env.DB.prepare(
    'SELECT entity_type, entity_id, display_name FROM search_index WHERE search_index MATCH ? LIMIT 25',
  )
    .bind(q + '*')
    .all();
  return c.json({ data: rows.results, demo: false });
});
app.get('/api/v1/procurements', async (c) => {
  const limit = Math.min(Number(c.req.query('limit') || 20), 100),
    offset = Math.max(Number(c.req.query('offset') || 0), 0);
  if (c.env.DEMO_MODE === 'true')
    return c.json({ data: demo.procurements, meta: { limit, offset, demo: true } });
  const r = await c.env.DB.prepare(
    'SELECT id,source_identifier,description,stage,status,currency,award_amount_minor FROM procurement_records ORDER BY award_date DESC LIMIT ? OFFSET ?',
  )
    .bind(limit, offset)
    .all();
  return c.json({ data: r.results, meta: { limit, offset, demo: false } });
});
app.get('/api/v1/datasets', async (c) => {
  if (c.env.DEMO_MODE === 'true')
    return c.json({
      data: [{ id: 'oece-procedures', status: 'adapter-ready', verifiedImport: false }],
    });
  const r = await c.env.DB.prepare(
    'SELECT id,name,source_institution,source_url,coverage_start,update_frequency,license_status FROM datasets ORDER BY name',
  ).all();
  return c.json({ data: r.results });
});
app.post('/api/v1/submissions', async (c) => {
  const body = await c.req.json();
  const p = z
    .object({
      type: z.enum([
        'feature',
        'dataset',
        'indicator',
        'correction',
        'documentation',
        'translation',
        'visualization',
        'general',
      ]),
      title: z.string().min(5).max(160),
      description: z.string().min(30).max(8000),
      sourceUrl: z.string().url().optional().or(z.literal('')),
      contact: z.string().email().optional().or(z.literal('')),
    })
    .safeParse(body);
  if (!p.success) return c.json({ error: 'validation_failed', issues: p.error.issues }, 400);
  if (c.env.DEMO_MODE === 'true')
    return c.json(
      { id: `OC-DEMO-${crypto.randomUUID().slice(0, 8)}`, status: 'received', demo: true },
      201,
    );
  const id = `OC-${crypto.randomUUID()}`;
  await c.env.DB.prepare(
    'INSERT INTO community_submissions(id,type,title,description,source_url,contact_email,status,created_at) VALUES(?,?,?,?,?,?,?,?)',
  )
    .bind(
      id,
      p.data.type,
      p.data.title,
      p.data.description,
      p.data.sourceUrl || null,
      p.data.contact || null,
      'received',
      new Date().toISOString(),
    )
    .run();
  return c.json({ id, status: 'received' }, 201);
});
async function requireAdmin(c: any, next: any) {
  const token = c.req.header('Cf-Access-Jwt-Assertion');
  if (!token || !c.env.ACCESS_TEAM_DOMAIN || !c.env.ACCESS_AUD)
    return c.json({ error: 'unauthorized' }, 401);
  try {
    const issuer = `https://${c.env.ACCESS_TEAM_DOMAIN}`;
    const jwks = createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`));
    await jwtVerify(token, jwks, { issuer, audience: c.env.ACCESS_AUD });
    await next();
  } catch {
    return c.json({ error: 'unauthorized' }, 401);
  }
}
app.get('/api/v1/admin/submissions', requireAdmin, async (c) => {
  const r = await c.env.DB.prepare(
    'SELECT * FROM community_submissions ORDER BY created_at DESC LIMIT 100',
  ).all();
  return c.json({ data: r.results });
});
app.get('/api/openapi.json', (c) =>
  c.json({
    openapi: '3.1.0',
    info: {
      title: 'Obra Clara API',
      version: '1.0.0',
      description: 'API pública de datos con procedencia.',
    },
    servers: [{ url: '/' }],
    paths: {
      '/api/v1/search': {
        get: {
          summary: 'Búsqueda global',
          parameters: [{ name: 'q', in: 'query', schema: { type: 'string' } }],
          responses: { '200': { description: 'Resultados' } },
        },
      },
      '/api/v1/procurements': {
        get: {
          summary: 'Contrataciones paginadas',
          responses: { '200': { description: 'Lista' } },
        },
      },
      '/api/v1/datasets': {
        get: { summary: 'Catálogo de datasets', responses: { '200': { description: 'Lista' } } },
      },
    },
  }),
);
app.onError((e, c) => {
  console.error('request_failed', { name: e.name, message: e.message });
  return c.json({ error: 'internal_error', message: 'No se pudo completar la solicitud.' }, 500);
});
export default {
  fetch: app.fetch,
  async scheduled(_: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(
      env.DB.prepare(
        'INSERT INTO audit_logs(id,event_type,created_at,metadata_json) VALUES(?,?,?,?)',
      )
        .bind(crypto.randomUUID(), 'scheduled_source_check', new Date().toISOString(), '{}')
        .run(),
    );
  },
};
