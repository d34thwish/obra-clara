import { readFile, writeFile, mkdtemp, rm, chmod } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const SOURCE_CONFIG = 'apps/web/wrangler.jsonc';
export const GENERATED_CONFIG = 'apps/web/dist/worker/wrangler.json';
export const ZERO_UUID = '00000000-0000-0000-0000-000000000000';
export const R2_PLACEHOLDER = 'obra-clara-raw-placeholder';
export const REQUIRED_BINDINGS = [
  'DB',
  'RAW_DATA',
  'ASSETS',
  'PUBLIC_RATE_LIMITER',
  'SUBMISSION_RATE_LIMITER',
];
export const REQUIRED_ENV = [
  'CLOUDFLARE_ACCOUNT_ID',
  'CLOUDFLARE_D1_DATABASE_ID',
  'CLOUDFLARE_R2_BUCKET_NAME',
  'PUBLIC_BASE_URL',
  'TURNSTILE_SITE_KEY',
  'TURNSTILE_HOSTNAME',
  'CLOUDFLARE_API_TOKEN',
  'TURNSTILE_SECRET_KEY',
];

export function validateEnvironment(env = process.env) {
  const errors = [];
  for (const key of REQUIRED_ENV) if (!env[key]?.trim()) errors.push(`Missing required ${key}.`);
  if (env.CLOUDFLARE_ACCOUNT_ID && !/^[a-f0-9]{32}$/i.test(env.CLOUDFLARE_ACCOUNT_ID))
    errors.push('CLOUDFLARE_ACCOUNT_ID must be a 32-character hexadecimal account ID.');
  if (
    env.CLOUDFLARE_D1_DATABASE_ID &&
    (!/^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(
      env.CLOUDFLARE_D1_DATABASE_ID,
    ) ||
      env.CLOUDFLARE_D1_DATABASE_ID === ZERO_UUID)
  )
    errors.push('CLOUDFLARE_D1_DATABASE_ID must be a real non-zero UUID.');
  if (
    env.CLOUDFLARE_R2_BUCKET_NAME &&
    (env.CLOUDFLARE_R2_BUCKET_NAME === R2_PLACEHOLDER ||
      !/^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])$/.test(env.CLOUDFLARE_R2_BUCKET_NAME))
  )
    errors.push('CLOUDFLARE_R2_BUCKET_NAME must be a valid non-placeholder R2 bucket name.');
  let publicUrl;
  try {
    publicUrl = new URL(env.PUBLIC_BASE_URL || '');
    if (
      publicUrl.protocol !== 'https:' ||
      publicUrl.pathname !== '/' ||
      publicUrl.search ||
      publicUrl.hash
    )
      throw new Error();
  } catch {
    errors.push(
      'PUBLIC_BASE_URL must be an HTTPS origin without path, query, fragment, or trailing content.',
    );
  }
  if (publicUrl && env.TURNSTILE_HOSTNAME && publicUrl.hostname !== env.TURNSTILE_HOSTNAME)
    errors.push('TURNSTILE_HOSTNAME must exactly match PUBLIC_BASE_URL hostname.');

  const accessKeys = ['ACCESS_TEAM_DOMAIN', 'ACCESS_AUD', 'MODERATOR_EMAILS'];
  const missingAccessKeys = accessKeys.filter((key) => !env[key]?.trim());
  if (missingAccessKeys.length) {
    errors.push(
      `Production deployment requires Cloudflare Access moderator configuration: ${missingAccessKeys.join(', ')}.`,
    );
  }

  if (env.DEMO_MODE && env.DEMO_MODE !== 'false')
    errors.push('Production deployment requires DEMO_MODE=false.');
  if (env.ENVIRONMENT && env.ENVIRONMENT !== 'production')
    errors.push('Production deployment requires ENVIRONMENT=production.');
  if (env.TURNSTILE_ACTION && env.TURNSTILE_ACTION !== 'community_submission')
    errors.push('TURNSTILE_ACTION must be community_submission.');
  if (env.TURNSTILE_DEV_BYPASS === 'true')
    errors.push('TURNSTILE_DEV_BYPASS must never be enabled in production.');
  return errors;
}

export function parseJsonc(text) {
  try {
    return JSON.parse(text);
  } catch {
    // Fall through to JSONC normalization for source configuration.
  }
  return JSON.parse(
    text
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '')
      .replace(/,\s*([}\]])/g, '$1'),
  );
}

export function assertSourceConfig(config) {
  const errors = [];
  if (config.name !== 'obra-clara') errors.push('Worker name must remain obra-clara.');
  if (config.main !== 'src/worker/index.ts')
    errors.push('Worker main must remain src/worker/index.ts.');
  if (!config.compatibility_flags?.includes('nodejs_compat'))
    errors.push('nodejs_compat compatibility flag is missing.');
  if (config.triggers?.crons?.length)
    errors.push('Production source config must not contain Cron triggers.');
  const bindings = new Set([
    ...(config.d1_databases || []).map((x) => x.binding),
    ...(config.r2_buckets || []).map((x) => x.binding),
    ...(config.ratelimits || []).map((x) => x.name),
    config.assets?.binding,
  ]);
  for (const binding of REQUIRED_BINDINGS)
    if (!bindings.has(binding)) errors.push(`Missing expected binding ${binding}.`);
  return errors;
}

export function buildProductionConfig(source, env) {
  const config = structuredClone(source);
  const db = config.d1_databases?.find((x) => x.binding === 'DB');
  const bucket = config.r2_buckets?.find((x) => x.binding === 'RAW_DATA');
  if (!db || db.database_id !== ZERO_UUID)
    throw new Error('Expected the DB placeholder exactly once in source config.');
  if (!bucket || bucket.bucket_name !== R2_PLACEHOLDER)
    throw new Error('Expected the R2 placeholder exactly once in source config.');
  db.database_id = env.CLOUDFLARE_D1_DATABASE_ID;
  bucket.bucket_name = env.CLOUDFLARE_R2_BUCKET_NAME;
  config.account_id = env.CLOUDFLARE_ACCOUNT_ID;
  config.vars = {
    DEMO_MODE: 'false',
    ENVIRONMENT: 'production',
    ACCESS_TEAM_DOMAIN: env.ACCESS_TEAM_DOMAIN || '',
    ACCESS_AUD: env.ACCESS_AUD || '',
    MODERATOR_EMAILS: env.MODERATOR_EMAILS || '',
    TURNSTILE_SITE_KEY: env.TURNSTILE_SITE_KEY,
    TURNSTILE_HOSTNAME: env.TURNSTILE_HOSTNAME,
    TURNSTILE_ACTION: 'community_submission',
    CORS_ALLOWED_ORIGINS: env.CORS_ALLOWED_ORIGINS || '',
  };
  return config;
}

export function assertGeneratedConfig(config, env) {
  const errors = [];
  const bindings = new Set([
    ...(config.d1_databases || []).map((x) => x.binding),
    ...(config.r2_buckets || []).map((x) => x.binding),
    ...(config.ratelimits || []).map((x) => x.name),
    config.assets?.binding,
  ]);
  for (const binding of REQUIRED_BINDINGS)
    if (!bindings.has(binding)) errors.push(`Generated config is missing binding ${binding}.`);
  if (!config.compatibility_flags?.includes('nodejs_compat'))
    errors.push('Generated config is missing nodejs_compat.');
  if (!config.assets?.directory)
    errors.push('Generated Wrangler config is missing assets.directory.');
  if (config.name !== 'obra-clara' || config.topLevelName !== 'obra-clara')
    errors.push('Generated config targets the wrong Worker.');
  if (config.main !== 'index.js')
    errors.push('Generated config must target the built index.js entry point.');
  if (
    config.d1_databases?.find((x) => x.binding === 'DB')?.database_id !==
    env.CLOUDFLARE_D1_DATABASE_ID
  )
    errors.push('Generated DB binding does not match validated production D1 ID.');
  if (
    config.r2_buckets?.find((x) => x.binding === 'RAW_DATA')?.bucket_name !==
    env.CLOUDFLARE_R2_BUCKET_NAME
  )
    errors.push('Generated R2 binding does not match validated production bucket.');
  if (config.vars?.DEMO_MODE !== 'false' || config.vars?.ENVIRONMENT !== 'production')
    errors.push('Generated config is not in production mode.');
  if (JSON.stringify(config).includes('obra-clara-preview') || config.name === 'obra-clara-preview')
    errors.push('Preview-only Worker configuration detected.');
  return errors;
}

export async function createSecretsFile(secret) {
  const dir = await mkdtemp(join(tmpdir(), 'obra-clara-secrets-'));
  const file = join(dir, 'secrets.json');
  await writeFile(file, JSON.stringify({ TURNSTILE_SECRET_KEY: secret }), { mode: 0o600 });
  await chmod(file, 0o600);
  return { file, cleanup: () => rm(dir, { recursive: true, force: true }) };
}

export async function readConfig(path = SOURCE_CONFIG) {
  return parseJsonc(await readFile(path, 'utf8'));
}
export async function writeConfig(path, value) {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}
