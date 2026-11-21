import { readFile } from 'node:fs/promises';
import { oeceProceduresAdapter as adapter } from '../adapters/oece-procedures';
const f = process.argv[2];
if (!f) throw new Error('Usage: pnpm data:validate <csv-file>');
const bytes = new Uint8Array(await readFile(f));
let ok = 0;
const errors: string[] = [];
for await (const row of adapter.parse(bytes)) {
  try {
    adapter.normalize(row, ok + errors.length + 1);
    ok++;
  } catch (e) {
    errors.push(String(e));
  }
}
console.log(
  JSON.stringify({ ok, errors: errors.slice(0, 100), errorCount: errors.length }, null, 2),
);
if (errors.length) process.exitCode = 1;
