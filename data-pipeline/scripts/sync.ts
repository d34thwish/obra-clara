import { writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { oeceProceduresAdapter as adapter } from '../adapters/oece-procedures';
const url = process.env.OECE_DISTRIBUTION_URL;
const retrieved = await adapter.retrieve({ url });
const dir = 'data-pipeline/.staging';
await mkdir(dir, { recursive: true });
const hash = createHash('sha256').update(retrieved.bytes).digest('hex');
await writeFile(`${dir}/${hash}-${retrieved.filename}`, retrieved.bytes);
let count = 0;
for await (const row of adapter.parse(retrieved.bytes)) {
  adapter.normalize(row, ++count);
}
console.log(
  JSON.stringify({
    adapter: adapter.id,
    filename: retrieved.filename,
    sha256: hash,
    validatedRecords: count,
    status: 'validated-not-promoted',
  }),
);
