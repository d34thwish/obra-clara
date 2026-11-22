export type LicenseState =
  'verified_reusable' | 'attribution_required' | 'restricted' | 'not_specified' | 'awaiting_review';
export type Stage = 'process' | 'award' | 'contract' | 'order' | 'payment';
export interface SourceMetadata {
  id: string;
  datasetId: string;
  title: string;
  institution: string;
  catalogUrl: string;
  dictionaryUrl?: string;
  distributionUrl?: string;
  formats: ('csv' | 'xlsx')[];
  stage: Stage;
  licenseState: LicenseState;
  archivePermitted: boolean;
  derivativesPermitted: boolean;
  coverage?: string;
  updateFrequency?: string;
  limitations: string[];
  requiredHeaders: string[];
  knownHeaders: string[];
}
export interface SourceAdapter {
  metadata: SourceMetadata;
  parse(
    input: Uint8Array,
    filename: string,
  ): AsyncIterable<{ row: Record<string, unknown>; rowNumber: number; sheet?: string }>;
  normalize(row: Record<string, unknown>, rowNumber: number): NormalizedRecord;
}
export interface NormalizedRecord {
  sourceIdentifier: string;
  stage: Stage;
  description: string | null;
  institutionCode: string;
  institutionName: string;
  supplierRuc: string | null;
  supplierName: string | null;
  currency: string | null;
  estimatedAmountMinor: number | null;
  awardAmountMinor: number | null;
  contractAmountMinor: number | null;
  paidAmountMinor: number | null;
  originalAmountText: string | null;
  publicationDate: string | null;
  awardDate: string | null;
  procedureType: string | null;
  status: string | null;
  sourceRow: number;
  rawHash: string;
}
export interface ImportReport {
  sourceId: string;
  datasetId: string;
  mode: 'dry-run' | 'promote';
  filename: string;
  sha256: string;
  retrievedAt: string;
  recordCount: number;
  validCount: number;
  invalidCount: number;
  duplicateCount: number;
  unrecognizedFields: string[];
  missingRequired: Record<string, number>;
  warnings: string[];
  licenseState: LicenseState;
  archivedObjectKey?: string;
  inserted: number;
  updated: number;
  promotionStatus: string;
  errors: { row: number; message: string }[];
}
