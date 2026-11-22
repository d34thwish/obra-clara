import { spawn } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const configPath = resolve(root, 'apps/web/wrangler.jsonc');
const originalConfig = await readFile(configPath, 'utf8');

function replaceOnce(source, pattern, replacement, description) {
  if (!pattern.test(source)) throw new Error(`Could not prepare preview config: ${description}`);
  return source.replace(pattern, replacement);
}

function run(command, args) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(command, args, {
      cwd: root,
      env: { ...process.env, WRANGLER_SEND_METRICS: 'false' },
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });
    child.once('error', rejectRun);
    child.once('exit', (code, signal) => {
      if (code === 0) resolveRun();
      else rejectRun(new Error(`${command} ${args.join(' ')} failed (${signal || code})`));
    });
  });
}

try {
  // This preview deliberately runs with synthetic demo data and no production
  // D1/R2 resources. Never let this script reuse production Cloudflare credentials.
  if (process.env.CLOUDFLARE_API_TOKEN || process.env.CLOUDFLARE_API_KEY) {
    throw new Error('Temporary preview must not run with production Cloudflare credentials.');
  }

  let previewConfig = originalConfig;
  previewConfig = replaceOnce(
    previewConfig,
    /"name":\s*"obra-clara"/,
    '"name": "obra-clara-preview"',
    'Worker name',
  );
  previewConfig = replaceOnce(
    previewConfig,
    /\s*"d1_databases":\s*\[[\s\S]*?\],\n/,
    '\n',
    'production D1 binding',
  );
  previewConfig = replaceOnce(
    previewConfig,
    /\s*"r2_buckets":\s*\[[^\]]*\],\n/,
    '\n',
    'production R2 binding',
  );
  previewConfig = replaceOnce(
    previewConfig,
    /"DEMO_MODE":\s*"false"/,
    '"DEMO_MODE": "true"',
    'demo mode',
  );
  previewConfig = replaceOnce(
    previewConfig,
    /"ENVIRONMENT":\s*"production"/,
    '"ENVIRONMENT": "development"',
    'development environment',
  );
  previewConfig = replaceOnce(
    previewConfig,
    /"TURNSTILE_ACTION":\s*"community_submission"/,
    '"TURNSTILE_ACTION": "community_submission",\n    "TURNSTILE_DEV_BYPASS": "true"',
    'demo-only Turnstile bypass',
  );

  await writeFile(configPath, previewConfig, 'utf8');
  console.log('Building Obra Clara in explicit demo mode…');
  await run('pnpm', ['build']);
  console.log('Deploying an isolated Cloudflare temporary preview…');
  console.log('Wrangler will print both the temporary site URL and a claim URL.');
  await run('pnpm', [
    'exec',
    'wrangler',
    'deploy',
    '--config',
    'apps/web/dist/worker/wrangler.json',
    '--temporary',
    '--message',
    'Obra Clara isolated demo preview',
  ]);
} finally {
  await writeFile(configPath, originalConfig, 'utf8');
}
