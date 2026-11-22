import { basename } from 'node:path';
import { oeceProceduresAdapter as adapter } from '../adapters/oece-procedures';
import { runPipeline } from '../pipeline';
const promote = process.argv.includes('--promote');
const url = process.env.OECE_DISTRIBUTION_URL;
if (!url)
  throw new Error('OECE_DISTRIBUTION_URL is required; distribution URLs are never invented.');
const parsed = new URL(url);
if (!['https:'].includes(parsed.protocol)) throw new Error('Distribution URL must use HTTPS.');
const response = await fetch(url, { redirect: 'follow' });
if (!response.ok) throw new Error(`Retrieval failed: ${response.status}`);
const bytes = new Uint8Array(await response.arrayBuffer());
const filename = basename(parsed.pathname) || 'oece-source.csv';
const { report, reportPath } = await runPipeline(adapter, {
  bytes,
  filename,
  sourceUrl: url,
  promote,
  outputDir: process.env.IMPORT_REPORT_DIR || 'import-reports',
});
console.log(
  JSON.stringify({
    reportPath,
    status: report.promotionStatus,
    valid: report.validCount,
    invalid: report.invalidCount,
    duplicates: report.duplicateCount,
  }),
);
if (report.invalidCount > 0) process.exitCode = 2;
