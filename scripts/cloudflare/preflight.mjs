#!/usr/bin/env node
import { access, readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { assertSourceConfig, readConfig, SOURCE_CONFIG, validateEnvironment } from './config.mjs';

export async function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: process.platform === 'win32',
      ...options,
    });
    child.on('error', reject);
    child.on('exit', (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`${command} ${args.join(' ')} failed with exit code ${code}.`)),
    );
  });
}

export async function preflight({ authenticate = true, env = process.env } = {}) {
  const errors = validateEnvironment(env);
  await access('pnpm-lock.yaml').catch(() =>
    errors.push('Run from the repository root: pnpm-lock.yaml not found.'),
  );
  const config = await readConfig(SOURCE_CONFIG).catch((e) => {
    errors.push(`Cannot read ${SOURCE_CONFIG}: ${e.message}`);
    return null;
  });
  if (config) errors.push(...assertSourceConfig(config));
  const packageJson = JSON.parse(await readFile('package.json', 'utf8'));
  if (packageJson.packageManager !== 'pnpm@11.28.9')
    errors.push('packageManager must remain pnpm@11.28.9.');
  if (errors.length) throw new Error(`Production preflight failed:\n- ${errors.join('\n- ')}`);
  if (authenticate) await run('pnpm', ['exec', 'wrangler', 'whoami'], { env });
  console.log('Production preflight passed. No resources were modified.');
  return config;
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href)
  preflight().catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  });
