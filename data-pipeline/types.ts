export interface SourceAdapter {
  id: string;
  institution: string;
  catalogUrl: string;
  formats: string[];
  licenseStatus: string;
  limitations: string[];
  retrieve(config: {
    url?: string;
  }): Promise<{ bytes: Uint8Array; filename: string; contentType: string }>;
  parse(bytes: Uint8Array): AsyncIterable<Record<string, unknown>>;
  normalize(row: Record<string, unknown>, rowNumber: number): NormalizedRecord;
}
export interface NormalizedRecord {
  sourceIdentifier: string;
  stage: 'process' | 'award' | 'contract' | 'order';
  description: string | null;
  institutionCode: string;
  institutionName: string;
  supplierRuc: string | null;
  supplierName: string | null;
  currency: string | null;
  awardAmountMinor: number | null;
  awardDate: string | null;
  sourceRow: number;
  rawHash: string;
}
