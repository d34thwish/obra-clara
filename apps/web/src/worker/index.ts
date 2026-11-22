import { Hono } from 'hono';
import { secureHeaders } from 'hono/secure-headers';
import { demo } from './demo';
import {
  id,
  pagination,
  procurementFilters,
  submission,
  patchSubmission,
  transitions,
} from './schemas';
import { requireModerator, verifyTurnstile } from './security';
import type { Env, Auth } from './types';

type Vars = { auth: Auth };
const app = new Hono<{ Bindings: Env; Variables: Vars }>();
const mode = (e: Env): 'demo' | 'production' => (e.DEMO_MODE === 'true' ? 'demo' : 'production');
const response = <T>(data: T, e: Env, meta: Record<string, unknown> = {}) => ({
  data,
  meta: { mode: mode(e), ...meta },
});
const invalid = (c: any, issues: unknown) =>
  c.json({ error: 'validation_failed', message: 'Revisa los parámetros enviados.', issues }, 400);
const parse = <T>(
  schema: any,
  value: unknown,
): { ok: true; data: T } | { ok: false; error: any } => {
  const r = schema.safeParse(value);
  return r.success ? { ok: true, data: r.data } : { ok: false, error: r.error };
};
const camelProc = (x: any) => ({
  id: x.id,
  identifier: x.source_identifier,
  stage: x.stage,
  description: x.description,
  institution: x.institution_id ? { id: x.institution_id, name: x.institution_name } : null,
  supplier: x.supplier_id ? { id: x.supplier_id, name: x.supplier_name, ruc: x.ruc } : null,
  currency: x.currency,
  estimatedAmountMinor: x.estimated_amount_minor,
  awardAmountMinor: x.award_amount_minor,
  contractAmountMinor: x.contract_amount_minor,
  paidAmountMinor: x.paid_amount_minor,
  date: x.award_date || x.publication_date,
  procedure: x.procedure_type,
  status: x.status,
  sourceUrl: x.source_url,
  dataset: x.dataset_id ? { id: x.dataset_id, name: x.dataset_name } : null,
});

app.use(
  '*',
  secureHeaders({
    contentSecurityPolicy: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://challenges.cloudflare.com'],
      frameSrc: ['https://challenges.cloudflare.com'],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'", 'https://challenges.cloudflare.com'],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      frameAncestors: ["'none'"],
    },
    referrerPolicy: 'strict-origin-when-cross-origin',
    xContentTypeOptions: 'nosniff',
  }),
);
app.use('/api/*', async (c, next) => {
  c.header('Cache-Control', c.req.path.includes('/admin/') ? 'no-store' : 'public, max-age=30');
  const origin = c.req.header('Origin');
  if (origin) {
    const own = new URL(c.req.url).origin;
    const allowed = (c.env.CORS_ALLOWED_ORIGINS || '').split(',').map((x) => x.trim());
    if (origin !== own && !allowed.includes(origin))
      return c.json({ error: 'cors_denied', message: 'Origen no permitido.' }, 403);
    c.header('Access-Control-Allow-Origin', origin);
    c.header('Vary', 'Origin');
  }
  if (c.req.method === 'OPTIONS') {
    c.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS');
    c.header('Access-Control-Allow-Headers', 'Content-Type');
    return c.body(null, 204);
  }
  await next();
});
app.use('/api/v1/*', async (c, next) => {
  if (c.req.path.includes('/submissions') && c.req.method === 'POST') return next();
  const ip = c.req.header('CF-Connecting-IP') || 'unknown';
  const result = await c.env.PUBLIC_RATE_LIMITER.limit({ key: `${ip}:${c.req.path}` });
  if (!result.success)
    return c.json(
      { error: 'rate_limited', message: 'Demasiadas solicitudes. Intenta nuevamente pronto.' },
      429,
    );
  await next();
});

app.get('/api/v1/health', (c) =>
  c.json({ ok: true, service: 'obra-clara', version: '0.2.0', mode: mode(c.env) }),
);
app.get('/api/v1/config', (c) =>
  c.json({
    mode: mode(c.env),
    turnstileSiteKey: c.env.TURNSTILE_SITE_KEY || undefined,
    turnstileRequired: c.env.DEMO_MODE !== 'true',
  }),
);
app.get('/api/v1/overview', async (c) => {
  if (mode(c.env) === 'demo')
    return c.json(
      response(
        {
          amountMinor: 797000000,
          currency: 'PEN',
          procurements: demo.procurements.length,
          suppliers: demo.suppliers.length,
          institutions: demo.institutions.length,
          lastUpdate: '2026-11-20T00:00:00Z',
        },
        c.env,
      ),
    );
  const [counts, amt, last] = await c.env.DB.batch([
    c.env.DB.prepare(
      "SELECT (SELECT COUNT(*) FROM procurement_records WHERE publication_status='published') procurements,(SELECT COUNT(*) FROM institutions) institutions,(SELECT COUNT(*) FROM suppliers) suppliers",
    ),
    c.env.DB.prepare(
      "SELECT currency,SUM(COALESCE(award_amount_minor,contract_amount_minor,estimated_amount_minor)) amount FROM procurement_records WHERE publication_status='published' GROUP BY currency",
    ),
    c.env.DB.prepare(
      "SELECT MAX(promoted_at) last_update FROM import_batches WHERE status='promoted'",
    ),
  ]);
  const currencies = amt.results as any[];
  return c.json(
    response(
      {
        ...(counts.results[0] || { procurements: 0, institutions: 0, suppliers: 0 }),
        amountMinor: currencies.length === 1 ? currencies[0].amount : null,
        currency: currencies.length === 1 ? currencies[0].currency : null,
        lastUpdate: (last.results[0] as any)?.last_update || null,
      },
      c.env,
    ),
  );
});

app.get('/api/v1/search', async (c) => {
  const q = (c.req.query('q') || '').trim();
  if (!q) return c.json(response([], c.env, { limit: 20, offset: 0, total: 0 }));
  if (q.length > 100) return invalid(c, [{ path: ['q'], message: 'Máximo 100 caracteres' }]);
  if (mode(c.env) === 'demo') {
    const rows = [
      ...demo.institutions.map((x) => ({
        type: 'institution',
        id: x.id,
        name: x.name,
        subtitle: x.code,
      })),
      ...demo.suppliers.map((x) => ({ type: 'supplier', id: x.id, name: x.name, subtitle: x.ruc })),
      ...demo.procurements.map((x) => ({
        type: 'procurement',
        id: x.id,
        name: x.identifier,
        subtitle: x.description,
      })),
    ].filter((x) => JSON.stringify(x).toLowerCase().includes(q.toLowerCase()));
    return c.json(response(rows, c.env, { limit: 20, offset: 0, total: rows.length }));
  }
  const sanitized = q.replace(/["*:^()]/g, ' ').trim();
  if (!sanitized) return c.json(response([], c.env, { limit: 20, offset: 0, total: 0 }));
  const r = await c.env.DB.prepare(
    'SELECT entity_type type,entity_id id,display_name name,aliases subtitle FROM search_index WHERE search_index MATCH ? LIMIT 20',
  )
    .bind(
      sanitized
        .split(/\s+/)
        .map((x) => `"${x}"*`)
        .join(' AND '),
    )
    .all();
  return c.json(response(r.results, c.env, { limit: 20, offset: 0, total: r.results.length }));
});

app.get('/api/v1/institutions', async (c) => {
  const p = parse<any>(pagination, c.req.query());
  if (!p.ok) return invalid(c, p.error.issues);
  const { limit, offset, q } = p.data;
  if (mode(c.env) === 'demo') {
    const rows = demo.institutions.filter(
      (x) => !q || x.name.toLowerCase().includes(q.toLowerCase()),
    );
    return c.json(
      response(rows.slice(offset, offset + limit), c.env, { limit, offset, total: rows.length }),
    );
  }
  const like = `%${q || ''}%`;
  const [rows, count] = await c.env.DB.batch([
    c.env.DB.prepare(
      `SELECT i.id,i.official_name name,i.source_identifier code,l.department location,COUNT(DISTINCT p.id) records,COUNT(DISTINCT p.supplier_id) suppliers,CASE WHEN COUNT(DISTINCT p.currency)=1 THEN SUM(p.award_amount_minor) END amountMinor,CASE WHEN COUNT(DISTINCT p.currency)=1 THEN MAX(p.currency) END currency FROM institutions i LEFT JOIN locations l ON l.id=i.location_id LEFT JOIN procurement_records p ON p.institution_id=i.id AND p.publication_status='published' WHERE i.official_name LIKE ? GROUP BY i.id ORDER BY i.official_name LIMIT ? OFFSET ?`,
    ).bind(like, limit, offset),
    c.env.DB.prepare('SELECT COUNT(*) total FROM institutions WHERE official_name LIKE ?').bind(
      like,
    ),
  ]);
  return c.json(
    response(rows.results, c.env, { limit, offset, total: (count.results[0] as any)?.total || 0 }),
  );
});
app.get('/api/v1/institutions/:id', async (c) => {
  const v = id.safeParse(c.req.param('id'));
  if (!v.success) return invalid(c, v.error.issues);
  if (mode(c.env) === 'demo') {
    const x = demo.institutions.find((x) => x.id === v.data);
    if (!x) return c.json({ error: 'not_found', message: 'Institución no encontrada.' }, 404);
    return c.json(
      response(
        {
          ...x,
          related: demo.procurements.filter((p) => p.institution?.id === x.id),
          trends: [{ period: '2026', amountMinor: x.amountMinor, currency: 'PEN' }],
          provenance: [],
        },
        c.env,
      ),
    );
  }
  const x = await c.env.DB.prepare(
    'SELECT i.id,i.official_name name,i.source_identifier code,l.department location FROM institutions i LEFT JOIN locations l ON l.id=i.location_id WHERE i.id=?',
  )
    .bind(v.data)
    .first<any>();
  if (!x) return c.json({ error: 'not_found', message: 'Institución no encontrada.' }, 404);
  const [r, t, a] = await c.env.DB.batch([
    c.env.DB.prepare(
      `SELECT p.*,i.official_name institution_name,s.official_name supplier_name,s.ruc,d.name dataset_name FROM procurement_records p LEFT JOIN institutions i ON i.id=p.institution_id LEFT JOIN suppliers s ON s.id=p.supplier_id LEFT JOIN datasets d ON d.id=p.dataset_id WHERE p.institution_id=? AND p.publication_status='published' ORDER BY COALESCE(p.award_date,p.publication_date) DESC LIMIT 50`,
    ).bind(v.data),
    c.env.DB.prepare(
      `SELECT substr(COALESCE(award_date,publication_date),1,4) period,currency,SUM(award_amount_minor) amountMinor FROM procurement_records WHERE institution_id=? AND publication_status='published' AND award_amount_minor IS NOT NULL GROUP BY period,currency ORDER BY period`,
    ).bind(v.data),
    c.env.DB.prepare(
      `SELECT COUNT(*) records,COUNT(DISTINCT supplier_id) suppliers FROM procurement_records WHERE institution_id=? AND publication_status='published'`,
    ).bind(v.data),
  ]);
  return c.json(
    response(
      {
        ...x,
        ...(a.results[0] as Record<string, unknown>),
        related: (r.results as any[]).map(camelProc),
        trends: t.results,
      },
      c.env,
    ),
  );
});

app.get('/api/v1/suppliers', async (c) => {
  const p = parse<any>(pagination, c.req.query());
  if (!p.ok) return invalid(c, p.error.issues);
  const { limit, offset, q } = p.data;
  if (mode(c.env) === 'demo') {
    const rows = demo.suppliers.filter(
      (x) => !q || (x.name + x.ruc).toLowerCase().includes(q.toLowerCase()),
    );
    return c.json(
      response(rows.slice(offset, offset + limit), c.env, { limit, offset, total: rows.length }),
    );
  }
  const like = `%${q || ''}%`;
  const [rows, count] = await c.env.DB.batch([
    c.env.DB.prepare(
      `SELECT s.id,s.official_name name,s.ruc,COUNT(DISTINCT p.id) records,COUNT(DISTINCT p.institution_id) institutions,CASE WHEN COUNT(DISTINCT p.currency)=1 THEN SUM(p.award_amount_minor) END amountMinor,CASE WHEN COUNT(DISTINCT p.currency)=1 THEN MAX(p.currency) END currency FROM suppliers s LEFT JOIN procurement_records p ON p.supplier_id=s.id AND p.publication_status='published' WHERE s.official_name LIKE ? OR s.ruc LIKE ? GROUP BY s.id ORDER BY s.official_name LIMIT ? OFFSET ?`,
    ).bind(like, like, limit, offset),
    c.env.DB.prepare(
      'SELECT COUNT(*) total FROM suppliers WHERE official_name LIKE ? OR ruc LIKE ?',
    ).bind(like, like),
  ]);
  return c.json(
    response(rows.results, c.env, { limit, offset, total: (count.results[0] as any)?.total || 0 }),
  );
});
app.get('/api/v1/suppliers/:id', async (c) => {
  const v = id.safeParse(c.req.param('id'));
  if (!v.success) return invalid(c, v.error.issues);
  if (mode(c.env) === 'demo') {
    const x = demo.suppliers.find((x) => x.id === v.data);
    if (!x) return c.json({ error: 'not_found', message: 'Proveedor no encontrado.' }, 404);
    return c.json(
      response(
        { ...x, related: demo.procurements.filter((p) => p.supplier?.id === x.id), provenance: [] },
        c.env,
      ),
    );
  }
  const x = await c.env.DB.prepare('SELECT id,official_name name,ruc FROM suppliers WHERE id=?')
    .bind(v.data)
    .first<any>();
  if (!x) return c.json({ error: 'not_found', message: 'Proveedor no encontrado.' }, 404);
  const [r, a] = await c.env.DB.batch([
    c.env.DB.prepare(
      `SELECT p.*,i.official_name institution_name,s.official_name supplier_name,s.ruc,d.name dataset_name FROM procurement_records p LEFT JOIN institutions i ON i.id=p.institution_id LEFT JOIN suppliers s ON s.id=p.supplier_id LEFT JOIN datasets d ON d.id=p.dataset_id WHERE p.supplier_id=? AND p.publication_status='published' ORDER BY COALESCE(p.award_date,p.publication_date) DESC LIMIT 50`,
    ).bind(v.data),
    c.env.DB.prepare(
      `SELECT COUNT(*) records,COUNT(DISTINCT institution_id) institutions,CASE WHEN COUNT(DISTINCT currency)=1 THEN SUM(award_amount_minor) END amountMinor,CASE WHEN COUNT(DISTINCT currency)=1 THEN MAX(currency) END currency FROM procurement_records WHERE supplier_id=? AND publication_status='published'`,
    ).bind(v.data),
  ]);
  return c.json(
    response(
      {
        ...x,
        ...(a.results[0] as Record<string, unknown>),
        related: (r.results as any[]).map(camelProc),
      },
      c.env,
    ),
  );
});

app.get('/api/v1/procurements', async (c) => {
  const p = parse<any>(procurementFilters, c.req.query());
  if (!p.ok) return invalid(c, p.error.issues);
  const {
    limit,
    offset,
    institution,
    supplier,
    stage,
    status,
    dateFrom,
    dateTo,
    minAmount,
    maxAmount,
  } = p.data;
  if (mode(c.env) === 'demo') {
    const rows = demo.procurements.filter(
      (x) =>
        (!institution || x.institution?.id === institution) &&
        (!supplier || x.supplier?.id === supplier) &&
        (!stage || x.stage === stage),
    );
    return c.json(
      response(rows.slice(offset, offset + limit), c.env, { limit, offset, total: rows.length }),
    );
  }
  const clauses = ["p.publication_status='published'"],
    bind: any[] = [];
  for (const [x, col] of [
    [institution, 'p.institution_id'],
    [supplier, 'p.supplier_id'],
    [stage, 'p.stage'],
    [status, 'p.status'],
    [dateFrom, 'COALESCE(p.award_date,p.publication_date)>='],
    [dateTo, 'COALESCE(p.award_date,p.publication_date)<='],
  ] as any[]) {
    if (x) {
      clauses.push(col.endsWith('=') ? `${col}?` : `${col}=?`);
      bind.push(x);
    }
  }
  if (minAmount !== undefined) {
    clauses.push(
      'COALESCE(p.award_amount_minor,p.contract_amount_minor,p.estimated_amount_minor)>=?',
    );
    bind.push(minAmount);
  }
  if (maxAmount !== undefined) {
    clauses.push(
      'COALESCE(p.award_amount_minor,p.contract_amount_minor,p.estimated_amount_minor)<=?',
    );
    bind.push(maxAmount);
  }
  const where = clauses.join(' AND ');
  const [rows, count] = await c.env.DB.batch([
    c.env.DB.prepare(
      `SELECT p.*,i.official_name institution_name,s.official_name supplier_name,s.ruc,d.name dataset_name FROM procurement_records p LEFT JOIN institutions i ON i.id=p.institution_id LEFT JOIN suppliers s ON s.id=p.supplier_id LEFT JOIN datasets d ON d.id=p.dataset_id WHERE ${where} ORDER BY COALESCE(p.award_date,p.publication_date) DESC LIMIT ? OFFSET ?`,
    ).bind(...bind, limit, offset),
    c.env.DB.prepare(`SELECT COUNT(*) total FROM procurement_records p WHERE ${where}`).bind(
      ...bind,
    ),
  ]);
  return c.json(
    response((rows.results as any[]).map(camelProc), c.env, {
      limit,
      offset,
      total: (count.results[0] as any)?.total || 0,
    }),
  );
});
app.get('/api/v1/procurements/:id', async (c) => {
  const v = id.safeParse(c.req.param('id'));
  if (!v.success) return invalid(c, v.error.issues);
  if (mode(c.env) === 'demo') {
    const x = demo.procurements.find((x) => x.id === v.data);
    if (!x) return c.json({ error: 'not_found', message: 'Contratación no encontrada.' }, 404);
    return c.json(response({ ...x, provenance: [{ sourceRecordId: x.identifier }] }, c.env));
  }
  const x = await c.env.DB.prepare(
    `SELECT p.*,i.official_name institution_name,s.official_name supplier_name,s.ruc,d.name dataset_name FROM procurement_records p LEFT JOIN institutions i ON i.id=p.institution_id LEFT JOIN suppliers s ON s.id=p.supplier_id LEFT JOIN datasets d ON d.id=p.dataset_id WHERE p.id=? AND p.publication_status='published'`,
  )
    .bind(v.data)
    .first<any>();
  if (!x) return c.json({ error: 'not_found', message: 'Contratación no encontrada.' }, 404);
  const provenance = await c.env.DB.prepare(
    `SELECT sl.source_record_id sourceRecordId,b.retrieved_at retrievedAt,b.original_filename originalFilename,b.sha256,d.source_url sourceUrl FROM source_lineage sl JOIN import_batches b ON b.id=(SELECT import_batch_id FROM procurement_records WHERE id=sl.procurement_id) JOIN datasets d ON d.id=b.dataset_id WHERE sl.procurement_id=?`,
  )
    .bind(v.data)
    .all();
  return c.json(response({ ...camelProc(x), provenance: provenance.results }, c.env));
});

app.get('/api/v1/datasets', async (c) => {
  if (mode(c.env) === 'demo')
    return c.json(
      response(demo.datasets, c.env, { limit: 100, offset: 0, total: demo.datasets.length }),
    );
  const r = await c.env.DB.prepare(
    `SELECT d.id,d.name,d.source_institution sourceInstitution,d.source_url sourceUrl,d.coverage_start coverageStart,d.coverage_end coverageEnd,d.update_frequency updateFrequency,d.license_status licenseStatus,d.limitations,MAX(CASE WHEN b.status='promoted' THEN b.promoted_at END) lastSuccessfulImport,SUM(CASE WHEN b.status='promoted' THEN b.record_count ELSE 0 END) recordCount FROM datasets d LEFT JOIN import_batches b ON b.dataset_id=d.id GROUP BY d.id ORDER BY d.name`,
  ).all();
  return c.json(response(r.results, c.env, { limit: 100, offset: 0, total: r.results.length }));
});
app.get('/api/v1/datasets/:id', async (c) => {
  const v = id.safeParse(c.req.param('id'));
  if (!v.success) return invalid(c, v.error.issues);
  if (mode(c.env) === 'demo') {
    const x = demo.datasets.find((x) => x.id === v.data);
    return x
      ? c.json(response(x, c.env))
      : c.json({ error: 'not_found', message: 'Dataset no encontrado.' }, 404);
  }
  const x = await c.env.DB.prepare('SELECT * FROM datasets WHERE id=?').bind(v.data).first();
  return x
    ? c.json(response(x, c.env))
    : c.json({ error: 'not_found', message: 'Dataset no encontrado.' }, 404);
});
app.get('/api/v1/signals', async (c) => {
  const p = parse<any>(pagination, c.req.query());
  if (!p.ok) return invalid(c, p.error.issues);
  if (mode(c.env) === 'demo')
    return c.json(response(demo.signals, c.env, { ...p.data, total: demo.signals.length }));
  const r = await c.env.DB.prepare(
    `SELECT f.id,e.indicator_id indicatorId,e.indicator_version version,d.name,f.period_start periodStart,f.period_end periodEnd,i.id institutionId,i.official_name institutionName,s.id supplierId,s.official_name supplierName,f.value_json valueJson,f.methodology_snapshot_json methodologyJson FROM analytical_findings f JOIN indicator_executions e ON e.id=f.execution_id JOIN indicator_definitions d ON d.id=e.indicator_id AND d.version=e.indicator_version LEFT JOIN institutions i ON i.id=f.institution_id LEFT JOIN suppliers s ON s.id=f.supplier_id WHERE e.status='published' ORDER BY e.executed_at DESC LIMIT ? OFFSET ?`,
  )
    .bind(p.data.limit, p.data.offset)
    .all();
  const rows = (r.results as any[]).map((x) => ({
    ...x,
    institution: x.institutionId ? { id: x.institutionId, name: x.institutionName } : null,
    supplier: x.supplierId ? { id: x.supplierId, name: x.supplierName } : null,
    value: JSON.parse(x.valueJson),
    methodology: JSON.parse(x.methodologyJson),
  }));
  return c.json(response(rows, c.env, { ...p.data, total: rows.length }));
});
app.get('/api/v1/signals/:id', async (c) => {
  const v = id.safeParse(c.req.param('id'));
  if (!v.success) return invalid(c, v.error.issues);
  if (mode(c.env) === 'demo') {
    const x = demo.signals.find((x) => x.id === v.data);
    return x
      ? c.json(response({ ...x, records: demo.procurements }, c.env))
      : c.json({ error: 'not_found', message: 'Señal no encontrada.' }, 404);
  }
  const x = await c.env.DB.prepare('SELECT * FROM analytical_findings WHERE id=?')
    .bind(v.data)
    .first<any>();
  if (!x) return c.json({ error: 'not_found', message: 'Señal no encontrada.' }, 404);
  const rr = await c.env.DB.prepare(
    `SELECT p.*,i.official_name institution_name,s.official_name supplier_name,s.ruc FROM finding_records fr JOIN procurement_records p ON p.id=fr.procurement_id LEFT JOIN institutions i ON i.id=p.institution_id LEFT JOIN suppliers s ON s.id=p.supplier_id WHERE fr.finding_id=? AND p.publication_status='published'`,
  )
    .bind(v.data)
    .all();
  return c.json(
    response(
      {
        ...x,
        value: JSON.parse(x.value_json),
        methodology: JSON.parse(x.methodology_snapshot_json),
        records: (rr.results as any[]).map(camelProc),
      },
      c.env,
    ),
  );
});

app.post('/api/v1/submissions', async (c) => {
  const length = Number(c.req.header('content-length') || 0);
  if (length > 16000)
    return c.json(
      { error: 'payload_too_large', message: 'El envío supera el límite permitido.' },
      413,
    );
  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'invalid_json', message: 'El cuerpo JSON no es válido.' }, 400);
  }
  const p = submission.safeParse(body);
  if (!p.success) return invalid(c, p.error.issues);
  const ip = c.req.header('CF-Connecting-IP') || 'unknown';
  const limited = await c.env.SUBMISSION_RATE_LIMITER.limit({ key: ip });
  if (!limited.success)
    return c.json({ error: 'rate_limited', message: 'Demasiados envíos. Intenta más tarde.' }, 429);
  const challenge = await verifyTurnstile(c.env, p.data.turnstileToken, ip);
  if (!challenge.success)
    return c.json(
      { error: challenge.error, message: 'No se pudo verificar que eres una persona.' },
      403,
    );
  const sid = `OC-${crypto.randomUUID()}`,
    now = new Date().toISOString();
  if (mode(c.env) === 'demo') return c.json(response({ id: sid, status: 'received' }, c.env), 201);
  await c.env.DB.batch([
    c.env.DB.prepare(
      'INSERT INTO community_submissions(id,type,title,description,details_json,source_url,contact_email,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)',
    ).bind(
      sid,
      p.data.type,
      p.data.title,
      p.data.description,
      JSON.stringify(p.data.details),
      p.data.sourceUrl || null,
      p.data.contact || null,
      'received',
      now,
      now,
    ),
    c.env.DB.prepare(
      'INSERT INTO audit_logs(id,event_type,created_at,metadata_json) VALUES(?,?,?,?)',
    ).bind(
      crypto.randomUUID(),
      'submission_received',
      now,
      JSON.stringify({ submissionId: sid, type: p.data.type }),
    ),
  ]);
  return c.json(response({ id: sid, status: 'received' }, c.env), 201);
});

app.use('/api/v1/admin/*', requireModerator);
app.get('/api/v1/admin/submissions', async (c) => {
  const p = parse<any>(
    pagination.extend({
      status: pagination.shape.q.optional(),
      type: pagination.shape.q.optional(),
      dateFrom: pagination.shape.q.optional(),
    }),
    c.req.query(),
  );
  if (!p.ok) return invalid(c, p.error.issues);
  const clauses = ['1=1'],
    b: any[] = [];
  if (p.data.status) {
    clauses.push('status=?');
    b.push(p.data.status);
  }
  if (p.data.type) {
    clauses.push('type=?');
    b.push(p.data.type);
  }
  if (p.data.dateFrom) {
    clauses.push('created_at>=?');
    b.push(p.data.dateFrom);
  }
  const where = clauses.join(' AND ');
  const [rows, count] = await c.env.DB.batch([
    c.env.DB.prepare(
      `SELECT id,type,title,description,details_json,source_url,contact_email,status,created_at,updated_at FROM community_submissions WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    ).bind(...b, p.data.limit, p.data.offset),
    c.env.DB.prepare(`SELECT COUNT(*) total FROM community_submissions WHERE ${where}`).bind(...b),
  ]);
  return c.json(
    response(
      (rows.results as any[]).map((x) => ({
        ...x,
        details: JSON.parse(x.details_json || '{}'),
        sourceUrl: x.source_url,
        contactEmail: x.contact_email,
        createdAt: x.created_at,
        updatedAt: x.updated_at,
      })),
      c.env,
      { limit: p.data.limit, offset: p.data.offset, total: (count.results[0] as any)?.total || 0 },
    ),
  );
});
app.get('/api/v1/admin/submissions/:id', async (c) => {
  const v = id.safeParse(c.req.param('id'));
  if (!v.success) return invalid(c, v.error.issues);
  const x = await c.env.DB.prepare('SELECT * FROM community_submissions WHERE id=?')
    .bind(v.data)
    .first<any>();
  if (!x) return c.json({ error: 'not_found', message: 'Envío no encontrado.' }, 404);
  const h = await c.env.DB.prepare(
    'SELECT id,actor_subject actor,from_status fromStatus,to_status toStatus,notes,created_at createdAt FROM moderation_events WHERE submission_id=? ORDER BY created_at',
  )
    .bind(v.data)
    .all();
  return c.json(
    response(
      {
        ...x,
        details: JSON.parse(x.details_json || '{}'),
        contactEmail: x.contact_email,
        sourceUrl: x.source_url,
        createdAt: x.created_at,
        updatedAt: x.updated_at,
        history: h.results,
      },
      c.env,
    ),
  );
});
app.patch('/api/v1/admin/submissions/:id', async (c) => {
  const i = id.safeParse(c.req.param('id'));
  if (!i.success) return invalid(c, i.error.issues);
  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'invalid_json', message: 'JSON inválido.' }, 400);
  }
  const p = patchSubmission.safeParse(body);
  if (!p.success) return invalid(c, p.error.issues);
  const current = await c.env.DB.prepare('SELECT status FROM community_submissions WHERE id=?')
    .bind(i.data)
    .first<{ status: string }>();
  if (!current) return c.json({ error: 'not_found', message: 'Envío no encontrado.' }, 404);
  if (!transitions[current.status]?.includes(p.data.status))
    return c.json(
      {
        error: 'invalid_transition',
        message: `No se permite pasar de ${current.status} a ${p.data.status}.`,
      },
      409,
    );
  if (['rejected', 'needs_information'].includes(p.data.status) && !p.data.notes)
    return c.json({ error: 'notes_required', message: 'Esta decisión requiere una nota.' }, 400);
  const now = new Date().toISOString(),
    event = crypto.randomUUID(),
    auth = c.get('auth');
  await c.env.DB.batch([
    c.env.DB.prepare(
      'UPDATE community_submissions SET status=?,updated_at=? WHERE id=? AND status=?',
    ).bind(p.data.status, now, i.data, current.status),
    c.env.DB.prepare(
      'INSERT INTO moderation_events(id,submission_id,actor_subject,from_status,to_status,notes,created_at) VALUES(?,?,?,?,?,?,?)',
    ).bind(event, i.data, auth.email, current.status, p.data.status, p.data.notes || null, now),
    c.env.DB.prepare(
      'INSERT INTO audit_logs(id,event_type,actor_subject,created_at,metadata_json) VALUES(?,?,?,?,?)',
    ).bind(
      crypto.randomUUID(),
      'moderation_status_changed',
      auth.subject,
      now,
      JSON.stringify({
        submissionId: i.data,
        eventId: event,
        from: current.status,
        to: p.data.status,
      }),
    ),
  ]);
  const updated = await c.env.DB.prepare('SELECT * FROM community_submissions WHERE id=?')
    .bind(i.data)
    .first<any>();
  return c.json(response(updated, c.env));
});

app.get('/api/openapi.json', (c) =>
  c.json({
    openapi: '3.1.0',
    info: { title: 'Obra Clara API', version: '0.2.0' },
    paths: Object.fromEntries(
      [
        '/api/v1/health',
        '/api/v1/config',
        '/api/v1/overview',
        '/api/v1/search',
        '/api/v1/institutions',
        '/api/v1/institutions/{id}',
        '/api/v1/suppliers',
        '/api/v1/suppliers/{id}',
        '/api/v1/procurements',
        '/api/v1/procurements/{id}',
        '/api/v1/datasets',
        '/api/v1/datasets/{id}',
        '/api/v1/signals',
        '/api/v1/signals/{id}',
        '/api/v1/submissions',
        '/api/v1/admin/submissions',
        '/api/v1/admin/submissions/{id}',
      ].map((x) => [x, { get: { responses: { '200': { description: 'Respuesta JSON' } } } }]),
    ),
  }),
);
app.notFound((c) => c.json({ error: 'not_found', message: 'Recurso no encontrado.' }, 404));
app.onError((e, c) => {
  console.error('request_failed', {
    name: e.name,
    message: e.message,
    requestId: c.req.header('cf-ray'),
  });
  return c.json({ error: 'internal_error', message: 'No se pudo completar la solicitud.' }, 500);
});
export default { fetch: app.fetch };
export { app };
