import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
describe('migration', () => {
  it('contains required provenance and moderation tables', () => {
    const sql = readFileSync('migrations/0001_initial.sql', 'utf8');
    for (const name of [
      'import_batches',
      'source_lineage',
      'community_submissions',
      'moderation_events',
      'analytical_findings',
    ])
      expect(sql).toContain(`CREATE TABLE ${name}`);
  });
});
