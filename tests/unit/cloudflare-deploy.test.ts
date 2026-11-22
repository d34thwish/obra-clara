/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck -- deployment modules are dependency-free Node JavaScript.
import { afterEach, describe, expect, it } from 'vitest';
import { readFile, writeFile, rm, access } from 'node:fs/promises';
// @ts-ignore Node deployment module is intentionally dependency-free JavaScript.
import {
  assertGeneratedConfig,
  buildProductionConfig,
  createSecretsFile,
  parseJsonc,
  R2_PLACEHOLDER,
  validateEnvironment,
  ZERO_UUID,
} from '../../scripts/cloudflare/config.mjs';
// @ts-ignore Node deployment module is intentionally dependency-free JavaScript.
import { smokeTest } from '../../scripts/cloudflare/smoke-test.mjs';
// @ts-ignore Node deployment module is intentionally dependency-free JavaScript.
import { deployProduction } from '../../scripts/cloudflare/deploy-production.mjs';

const env: any = {
  CLOUDFLARE_ACCOUNT_ID: 'a'.repeat(32),
  CLOUDFLARE_D1_DATABASE_ID: '123e4567-e89b-42d3-a456-426614174000',
  CLOUDFLARE_R2_BUCKET_NAME: 'obra-clara-raw',
  PUBLIC_BASE_URL: 'https://obra.example',
  TURNSTILE_SITE_KEY: 'site',
  TURNSTILE_HOSTNAME: 'obra.example',
  CLOUDFLARE_API_TOKEN: 'token',
  TURNSTILE_SECRET_KEY: 'secret',
  ACCESS_TEAM_DOMAIN: 'obra.cloudflareaccess.com',
  ACCESS_AUD: 'test-access-audience',
  MODERATOR_EMAILS: 'moderator@example.com',
  DEMO_MODE: 'false',
  ENVIRONMENT: 'production',
  TURNSTILE_ACTION: 'community_submission',
};
const source = {
  name: 'obra-clara',
  main: 'src/worker/index.ts',
  compatibility_flags: ['nodejs_compat'],
  assets: { binding: 'ASSETS' },
  d1_databases: [{ binding: 'DB', database_id: ZERO_UUID }],
  r2_buckets: [{ binding: 'RAW_DATA', bucket_name: R2_PLACEHOLDER }],
  ratelimits: [{ name: 'PUBLIC_RATE_LIMITER' }, { name: 'SUBMISSION_RATE_LIMITER' }],
  vars: {},
};

function productionFetcher(adminResponse: Response) {
  return async (input: string) => {
    const path = new URL(input).pathname;
    if (path === '/api/v1/health') return Response.json({ ok: true, mode: 'production' });
    if (path === '/api/v1/config')
      return Response.json({
        mode: 'production',
        turnstileRequired: true,
        turnstileSiteKey: 'site',
      });
    if (path === '/api/v1/overview') return Response.json({ meta: { mode: 'production' } });
    if (path === '/api/openapi.json') return Response.json({ openapi: '3.1.0' });
    if (path.startsWith('/api/v1/admin')) return adminResponse;
    return new Response('<div id="root"></div>', { headers: { 'content-type': 'text/html' } });
  };
}

describe('production configuration safety', () => {
  it('accepts a complete environment', () => expect(validateEnvironment(env)).toEqual([]));
  it.each(['ACCESS_TEAM_DOMAIN', 'ACCESS_AUD', 'MODERATOR_EMAILS'])(
    'requires production Access setting %s',
    (key) => {
      expect(validateEnvironment({ ...env, [key]: '' }).join(' ')).toContain(
        'requires Cloudflare Access moderator configuration',
      );
    },
  );
  it.each([
    [{ ...env, CLOUDFLARE_D1_DATABASE_ID: ZERO_UUID }, 'non-zero UUID'],
    [{ ...env, CLOUDFLARE_R2_BUCKET_NAME: R2_PLACEHOLDER }, 'non-placeholder'],
    [{ ...env, PUBLIC_BASE_URL: 'http://obra.example' }, 'HTTPS'],
    [{ ...env, TURNSTILE_HOSTNAME: 'other.example' }, 'exactly match'],
    [{ ...env, TURNSTILE_SECRET_KEY: '' }, 'Missing required TURNSTILE_SECRET_KEY'],
    [{ ...env, TURNSTILE_DEV_BYPASS: 'true' }, 'never be enabled'],
  ])('rejects unsafe values', (candidate, message) =>
    expect(validateEnvironment(candidate).join(' ')).toContain(message),
  );
  it('patches only known production fields', () => {
    const c = buildProductionConfig(source, env);
    expect(c.name).toBe('obra-clara');
    expect(c.d1_databases[0].database_id).toBe(env.CLOUDFLARE_D1_DATABASE_ID);
    expect(c.vars).toMatchObject({
      DEMO_MODE: 'false',
      ENVIRONMENT: 'production',
      TURNSTILE_ACTION: 'community_submission',
    });
    expect(JSON.stringify(source)).toContain(ZERO_UUID);
  });
  it('requires generated assets directory and rejects preview', () => {
    const generated = buildProductionConfig(source, env);
    expect(assertGeneratedConfig(generated, env)).toContain(
      'Generated Wrangler config is missing assets.directory.',
    );
    generated.assets.directory = '../client';
    generated.main = 'index.js';
    generated.topLevelName = 'obra-clara';
    generated.name = 'obra-clara-preview';
    expect(assertGeneratedConfig(generated, env).join(' ')).toContain('Preview');
  });
  it('creates and removes a restricted secret file', async () => {
    const x = await createSecretsFile('secret');
    expect(JSON.parse(await readFile(x.file, 'utf8'))).toEqual({ TURNSTILE_SECRET_KEY: 'secret' });
    await x.cleanup();
    await expect(access(x.file)).rejects.toThrow();
  });
});

describe('smoke tests', () => {
  it('accepts production responses and a protected 401 admin response', async () => {
    await expect(
      smokeTest(
        env.PUBLIC_BASE_URL,
        productionFetcher(new Response('', { status: 401 })) as any,
      ),
    ).resolves.toBeUndefined();
  });

  it('accepts a genuine Cloudflare Access login redirect', async () => {
    const response = new Response(null, {
      status: 302,
      headers: {
        location: new URL(
          '/cdn-cgi/access/login/test-audience?redirect_url=%2Fadmin',
          'https://obra-team.cloudflareaccess.com',
        ).href,
      },
    });
    await expect(
      smokeTest(env.PUBLIC_BASE_URL, productionFetcher(response) as any),
    ).resolves.toBeUndefined();
  });

  it.each([
    [200, undefined],
    [301, 'https://attacker.example/login'],
    [302, '/unrelated-login'],
    [404, undefined],
    [500, undefined],
  ])(
    'rejects unprotected or unexpected admin response HTTP %s',
    async (status, location) => {
      const headers = location ? { location } : undefined;
      const response = new Response(null, { status, headers });
      await expect(
        smokeTest(env.PUBLIC_BASE_URL, productionFetcher(response) as any),
      ).rejects.toThrow('unexpected HTTP');
    },
  );

  it('fails on demo mode or a public admin response', async () => {
    const fetcher = async (input: string) => {
      const path = new URL(input).pathname;
      if (path === '/api/v1/health') return Response.json({ ok: true, mode: 'demo' });
      if (path === '/api/v1/config') return Response.json({ mode: 'demo' });
      if (path === '/api/v1/overview') return Response.json({ meta: { mode: 'demo' } });
      if (path === '/api/openapi.json') return Response.json({});
      if (path.startsWith('/api/v1/admin')) return Response.json({ data: [] });
      return new Response('<div id="root"></div>');
    };
    await expect(smokeTest(env.PUBLIC_BASE_URL, fetcher as any)).rejects.toThrow(
      'smoke tests failed',
    );
  });
});

describe('restoration', () => {
  const path = 'apps/web/wrangler.jsonc';
  let original: string;
  afterEach(async () => {
    if (original) await writeFile(path, original);
    await rm('deployment-diagnostics', { recursive: true, force: true });
  });
  it('restores source config after migration/build failure', async () => {
    original = await readFile(path, 'utf8');
    const runner = async () => {
      throw new Error('simulated command failure');
    };
    await expect(
      deployProduction({ env, runner, preflightFn: async () => parseJsonc(original) } as any),
    ).rejects.toThrow('simulated');
    expect(await readFile(path, 'utf8')).toBe(original);
  });
});
