import { describe, it, expect } from 'vitest';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runPipeline } from '../../data-pipeline/pipeline';
import { oeceProceduresAdapter } from '../../data-pipeline/adapters/oece-procedures';
describe('pipeline dry run', () => {
  it('validates, deduplicates and never writes Cloudflare', async () => {
    const csv =
      'CODIGO_CONVOCATORIA,ENTIDAD,CODIGO_ENTIDAD,VALOR_ESTIMADO,FECHA_CONVOCATORIA,EXTRA\nA1,Entidad,E1,"1.234,56",01/02/2026,x\nA1,Entidad,E1,10,01/02/2026,x';
    const dir = await mkdtemp(join(tmpdir(), 'obra-'));
    const { report, reportPath } = await runPipeline(oeceProceduresAdapter, {
      bytes: new TextEncoder().encode(csv),
      filename: 'x.csv',
      sourceUrl: 'https://example.test/x.csv',
      promote: false,
      outputDir: dir,
    });
    expect(report).toMatchObject({
      recordCount: 2,
      validCount: 1,
      duplicateCount: 1,
      promotionStatus: 'validated',
    });
    expect(report.unrecognizedFields).toContain('EXTRA');
    expect(JSON.parse(await readFile(reportPath, 'utf8')).mode).toBe('dry-run');
  });
  it('blocks promotion when license is not approved', async () => {
    delete process.env.LICENSE_APPROVED;
    await expect(
      runPipeline(oeceProceduresAdapter, {
        bytes: new TextEncoder().encode('CODIGO_CONVOCATORIA,ENTIDAD\nA1,E'),
        filename: 'x.csv',
        sourceUrl: 'https://example.test',
        promote: true,
        outputDir: '/tmp',
      }),
    ).rejects.toThrow('LICENSE_APPROVED');
  });
});
