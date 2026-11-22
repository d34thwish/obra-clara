import { spawn } from 'node:child_process';
import { readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const varsPath = resolve(root, 'apps/web/.dev.vars');
const testVars = [
  'DEMO_MODE=true',
  'ENVIRONMENT=development',
  'TURNSTILE_DEV_BYPASS=true',
  '',
].join('\n');

function runPnpm(args) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm', args, {
      cwd: root,
      env: process.env,
      shell: process.platform === 'win32',
      stdio: 'inherit',
    });

    child.once('error', rejectRun);
    child.once('close', (code, signal) => {
      if (code === 0) {
        resolveRun();
      } else {
        rejectRun(
          new Error(
            `pnpm ${args.join(' ')} exited with ${signal ? `signal ${signal}` : `code ${code}`}.`,
          ),
        );
      }
    });
  });
}

async function main() {
  let previousVars;
  try {
    previousVars = await readFile(varsPath);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  try {
    await writeFile(varsPath, testVars, { mode: 0o600 });
    // The Cloudflare Vite plugin bakes local Worker vars into the preview build.
    // Keep this demo-only configuration out of production builds and restore any
    // developer-local vars immediately after the E2E build has finished.
    await runPnpm(['build']);
  } finally {
    if (previousVars) {
      await writeFile(varsPath, previousVars);
    } else {
      await rm(varsPath, { force: true });
    }
  }

  await runPnpm(['exec', 'playwright', 'test']);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
