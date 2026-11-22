import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { oeceProceduresAdapter as adapter } from '../adapters/oece-procedures';
import { runPipeline } from '../pipeline';
const file = process.argv[2];
if (!file) throw new Error('Usage: pnpm data:validate <csv-or-xlsx>');
const { report } = await runPipeline(adapter, {
  bytes: new Uint8Array(await readFile(file)),
  filename: basename(file),
  sourceUrl: `file://${file}`,
  promote: false,
  outputDir: 'import-reports',
});
console.log(JSON.stringify(report, null, 2));
if (report.invalidCount) process.exitCode = 2;
