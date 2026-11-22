import { createHash, randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { stableId } from './normalizers/values';
import type { ImportReport, NormalizedRecord, SourceAdapter } from './types';
import { CloudflareD1, CloudflareR2 } from './importers/cloudflare';
export async function runPipeline(
  adapter: SourceAdapter,
  input: {
    bytes: Uint8Array;
    filename: string;
    sourceUrl: string;
    promote: boolean;
    outputDir: string;
  },
) {
  const now = new Date().toISOString(),
    sha = createHash('sha256').update(input.bytes).digest('hex'),
    seen = new Set<string>(),
    records: NormalizedRecord[] = [],
    errors: { row: number; message: string }[] = [],
    missing: Record<string, number> = {},
    unknown = new Set<string>();
  let recordCount = 0,
    duplicates = 0;
  for await (const parsed of adapter.parse(input.bytes, input.filename)) {
    recordCount++;
    Object.keys(parsed.row)
      .filter((k) => !adapter.metadata.knownHeaders.includes(k))
      .forEach((k) => unknown.add(k));
    for (const h of adapter.metadata.requiredHeaders)
      if (!parsed.row[h]) missing[h] = (missing[h] || 0) + 1;
    try {
      const n = adapter.normalize(parsed.row, parsed.rowNumber),
        key = `${n.sourceIdentifier}:${n.stage}`;
      if (seen.has(key)) {
        duplicates++;
        continue;
      }
      seen.add(key);
      records.push(n);
    } catch (e) {
      errors.push({ row: parsed.rowNumber, message: e instanceof Error ? e.message : String(e) });
    }
  }
  const report: ImportReport = {
    sourceId: adapter.metadata.id,
    datasetId: adapter.metadata.datasetId,
    mode: input.promote ? 'promote' : 'dry-run',
    filename: input.filename,
    sha256: sha,
    retrievedAt: now,
    recordCount,
    validCount: records.length,
    invalidCount: errors.length,
    duplicateCount: duplicates,
    unrecognizedFields: [...unknown],
    missingRequired: missing,
    warnings: [...adapter.metadata.limitations],
    licenseState: adapter.metadata.licenseState,
    inserted: 0,
    updated: 0,
    promotionStatus: input.promote ? 'awaiting-promotion' : 'validated',
    errors: errors.slice(0, 500),
  };
  if (input.promote) {
    if (process.env.LICENSE_APPROVED !== 'true')
      throw new Error('Promotion blocked: LICENSE_APPROVED must equal true.');
    if (!adapter.metadata.derivativesPermitted)
      throw new Error(
        `Promotion blocked: ${adapter.metadata.licenseState} does not permit published derivatives.`,
      );
    for (const k of ['CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_API_TOKEN', 'D1_DATABASE_ID'])
      if (!process.env[k]) throw new Error(`Promotion blocked: missing ${k}`);
    const db = new CloudflareD1(
      process.env.CLOUDFLARE_ACCOUNT_ID!,
      process.env.D1_DATABASE_ID!,
      process.env.CLOUDFLARE_API_TOKEN!,
    );
    const batchId = `batch:${randomUUID()}`;
    if (adapter.metadata.archivePermitted) {
      for (const k of ['R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME'])
        if (!process.env[k]) throw new Error(`Archive blocked: missing ${k}`);
      const date = new Date(),
        key = `${adapter.metadata.id}/${date.getUTCFullYear()}/${String(date.getUTCMonth() + 1).padStart(2, '0')}/${sha}/${path.basename(input.filename)}`;
      const r2 = new CloudflareR2(
        process.env.CLOUDFLARE_ACCOUNT_ID!,
        process.env.R2_ACCESS_KEY_ID!,
        process.env.R2_SECRET_ACCESS_KEY!,
        process.env.R2_BUCKET_NAME!,
      );
      await r2.put(key, input.bytes, { sha256: sha, source: input.sourceUrl, retrieved: now });
      report.archivedObjectKey = key;
    }
    await db.query(
      `INSERT INTO datasets(id,name,source_institution,source_url,coverage_start,update_frequency,license_status,limitations,created_at) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,source_url=excluded.source_url,license_status=excluded.license_status,limitations=excluded.limitations`,
      [
        adapter.metadata.datasetId,
        adapter.metadata.title,
        adapter.metadata.institution,
        adapter.metadata.catalogUrl,
        adapter.metadata.coverage || null,
        adapter.metadata.updateFrequency || null,
        adapter.metadata.licenseState,
        adapter.metadata.limitations.join('\n'),
        now,
      ],
    );
    const existing = await db.query(
      `SELECT id,status FROM import_batches WHERE dataset_id=? AND sha256=?`,
      [adapter.metadata.datasetId, sha],
    );
    if (existing?.results?.some((x: any) => x.status === 'promoted'))
      throw new Error('This exact source hash is already promoted.');
    await db.query(
      `INSERT INTO import_batches(id,dataset_id,retrieved_at,original_filename,sha256,parser_version,normalization_version,status,record_count,errors_json,warnings_json,archived_object_key,report_json) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        batchId,
        adapter.metadata.datasetId,
        now,
        input.filename,
        sha,
        '2.0.0',
        '2.0.0',
        'promoting',
        records.length,
        JSON.stringify(errors),
        JSON.stringify(report.warnings),
        report.archivedObjectKey || null,
        JSON.stringify(report),
      ],
    );
    for (let i = 0; i < records.length; i += 50) {
      const chunk = records.slice(i, i + 50);
      for (const n of chunk) {
        const institutionId = stableId('institution', n.institutionCode || n.institutionName),
          recordId = stableId(
            'procurement',
            `${adapter.metadata.datasetId}:${n.sourceIdentifier}:${n.stage}`,
          );
        await db.query(
          `INSERT INTO institutions(id,source_identifier,official_name,created_at,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(source_identifier) DO UPDATE SET official_name=excluded.official_name,updated_at=excluded.updated_at`,
          [
            institutionId,
            n.institutionCode || institutionId,
            n.institutionName || 'Nombre no disponible',
            now,
            now,
          ],
        );
        await db.query(
          `INSERT INTO procurement_records(id,dataset_id,import_batch_id,source_identifier,stage,description,institution_id,currency,estimated_amount_minor,award_amount_minor,contract_amount_minor,paid_amount_minor,original_amount_text,publication_date,award_date,procedure_type,status,source_url,source_payload_hash,is_demo,publication_status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(dataset_id,source_identifier,stage) DO UPDATE SET import_batch_id=excluded.import_batch_id,description=excluded.description,institution_id=excluded.institution_id,currency=excluded.currency,estimated_amount_minor=excluded.estimated_amount_minor,source_payload_hash=excluded.source_payload_hash,publication_status='staging',updated_at=excluded.updated_at`,
          [
            recordId,
            adapter.metadata.datasetId,
            batchId,
            n.sourceIdentifier,
            n.stage,
            n.description,
            institutionId,
            n.currency,
            n.estimatedAmountMinor,
            n.awardAmountMinor,
            n.contractAmountMinor,
            n.paidAmountMinor,
            n.originalAmountText,
            n.publicationDate,
            n.awardDate,
            n.procedureType,
            n.status,
            input.sourceUrl,
            n.rawHash,
            0,
            'staging',
            now,
            now,
          ],
        );
        await db.query(
          `INSERT OR REPLACE INTO source_lineage(id,procurement_id,source_record_id,row_number,raw_object_key,field_map_json) VALUES(?,?,?,?,?,?)`,
          [
            `lineage:${batchId}:${n.sourceRow}`,
            recordId,
            n.sourceIdentifier,
            n.sourceRow,
            report.archivedObjectKey || null,
            JSON.stringify({ stage: n.stage }),
          ],
        );
        report.inserted++;
      }
    }
    await db.query(
      `UPDATE procurement_records SET publication_status='superseded' WHERE dataset_id=? AND publication_status='published' AND import_batch_id<>?`,
      [adapter.metadata.datasetId, batchId],
    );
    await db.query(
      `UPDATE procurement_records SET publication_status='published' WHERE import_batch_id=?`,
      [batchId],
    );
    await db.query(
      `DELETE FROM search_index WHERE entity_id IN (SELECT id FROM institutions UNION SELECT id FROM procurement_records)`,
    );
    await db.query(
      `INSERT INTO search_index(entity_type,entity_id,display_name,aliases) SELECT 'institution',id,official_name,source_identifier FROM institutions`,
    );
    await db.query(
      `INSERT INTO search_index(entity_type,entity_id,display_name,aliases) SELECT 'procurement',id,source_identifier,COALESCE(description,'') FROM procurement_records WHERE publication_status='published'`,
    );
    report.promotionStatus = 'promoted';
    await db.query(
      `UPDATE import_batches SET status='promoted',promoted_at=?,report_json=? WHERE id=?`,
      [new Date().toISOString(), JSON.stringify(report), batchId],
    );
  }
  await mkdir(input.outputDir, { recursive: true });
  const reportPath = path.join(input.outputDir, `${adapter.metadata.id}-${sha.slice(0, 12)}.json`);
  await writeFile(reportPath, JSON.stringify(report, null, 2));
  return { report, reportPath };
}
