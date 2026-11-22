#!/usr/bin/env node
import { readFile, writeFile, access, mkdir } from 'node:fs/promises';
import { preflight, run } from './preflight.mjs';
import {
  assertGeneratedConfig,
  buildProductionConfig,
  createSecretsFile,
  GENERATED_CONFIG,
  parseJsonc,
  SOURCE_CONFIG,
  writeConfig,
} from './config.mjs';
import { smokeTest } from './smoke-test.mjs';

export async function deployProduction({
  env = process.env,
  runner = run,
  smoke = smokeTest,
  preflightFn = preflight,
} = {}) {
  const startedAt = new Date().toISOString();
  const diagnostics = { startedAt, deployment: 'not-started', smokeTests: 'not-run' };
  const original = await readFile(SOURCE_CONFIG, 'utf8');
  let secrets;
  try {
    const source = await preflightFn({ authenticate: true, env });
    const production = buildProductionConfig(source, env);
    await writeConfig(SOURCE_CONFIG, production);

    await runner(
      'pnpm',
      ['exec', 'wrangler', 'd1', 'migrations', 'list', 'DB', '--remote', '--config', SOURCE_CONFIG],
      { env },
    );
    await runner(
      'pnpm',
      [
        'exec',
        'wrangler',
        'd1',
        'migrations',
        'apply',
        'DB',
        '--remote',
        '--config',
        SOURCE_CONFIG,
      ],
      { env },
    );
    await runner('pnpm', ['build'], { env });

    await access(GENERATED_CONFIG).catch(() => {
      throw new Error(`Build completed without expected generated config: ${GENERATED_CONFIG}`);
    });
    const generated = parseJsonc(await readFile(GENERATED_CONFIG, 'utf8'));
    const generatedErrors = assertGeneratedConfig(generated, env);
    if (generatedErrors.length)
      throw new Error(`Generated deployment config is unsafe:\n- ${generatedErrors.join('\n- ')}`);

    secrets = await createSecretsFile(env.TURNSTILE_SECRET_KEY);
    await runner(
      'pnpm',
      ['exec', 'wrangler', 'deploy', '--config', GENERATED_CONFIG, '--secrets-file', secrets.file],
      { env },
    );
    diagnostics.deployment = 'succeeded';

    try {
      await smoke(env.PUBLIC_BASE_URL);
      diagnostics.smokeTests = 'succeeded';
    } catch (error) {
      diagnostics.smokeTests = 'failed';
      throw new Error(
        `Deployment succeeded but smoke tests failed. Roll back the Worker version before retrying. ${error.message}`,
      );
    }
    diagnostics.completedAt = new Date().toISOString();
    console.log('Production deployment and smoke tests succeeded.');
    return diagnostics;
  } catch (error) {
    diagnostics.error = error.message;
    throw error;
  } finally {
    await writeFile(SOURCE_CONFIG, original);
    await secrets?.cleanup();
    await mkdir('deployment-diagnostics', { recursive: true });
    await writeFile(
      'deployment-diagnostics/last-production-deploy.json',
      `${JSON.stringify(diagnostics, null, 2)}\n`,
    );
  }
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href)
  deployProduction().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
