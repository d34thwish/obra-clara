export type PageMeta = {
  limit: number;
  offset: number;
  total: number;
  mode: 'demo' | 'production';
};
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public issues?: unknown,
  ) {
    super(message);
  }
}
async function request<T>(path: string, init?: RequestInit, signal?: AbortSignal): Promise<T> {
  const response = await fetch(path, {
    ...init,
    signal,
    headers: {
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });
  const body: any = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new ApiError(
      response.status,
      body.error || 'request_failed',
      body.message || 'No se pudo completar la solicitud.',
      body.issues,
    );
  return body as T;
}
const query = (v: Record<string, string | number | undefined>) => {
  const q = new URLSearchParams();
  Object.entries(v).forEach(([k, x]) => x !== undefined && x !== '' && q.set(k, String(x)));
  return q.toString();
};
export type ListResponse<T> = { data: T[]; meta: PageMeta };
export type Institution = {
  id: string;
  name: string;
  code: string;
  location?: string | null;
  amountMinor?: number | null;
  currency?: string | null;
  records: number;
  suppliers: number;
  trends?: { period: string; amountMinor: number; currency: string }[];
  related?: Procurement[];
  provenance?: Provenance[];
};
export type Supplier = {
  id: string;
  name: string;
  ruc?: string | null;
  amountMinor?: number | null;
  currency?: string | null;
  records: number;
  institutions: number;
  related?: Procurement[];
  provenance?: Provenance[];
};
export type Procurement = {
  id: string;
  identifier: string;
  stage: string;
  description?: string | null;
  institution?: { id: string; name: string } | null;
  supplier?: { id: string; name: string; ruc?: string | null } | null;
  currency?: string | null;
  estimatedAmountMinor?: number | null;
  awardAmountMinor?: number | null;
  contractAmountMinor?: number | null;
  paidAmountMinor?: number | null;
  date?: string | null;
  procedure?: string | null;
  status?: string | null;
  sourceUrl?: string | null;
  dataset?: { id: string; name: string } | null;
  provenance?: Provenance[];
};
export type Provenance = {
  sourceRecordId: string;
  retrievedAt?: string;
  originalFilename?: string;
  sha256?: string;
  sourceUrl?: string;
};
export type Dataset = {
  id: string;
  name: string;
  sourceInstitution: string;
  sourceUrl: string;
  coverageStart?: string | null;
  coverageEnd?: string | null;
  updateFrequency?: string | null;
  licenseStatus: string;
  limitations?: string | null;
  lastSuccessfulImport?: string | null;
  recordCount?: number;
};
export type Signal = {
  id: string;
  indicatorId: string;
  name: string;
  version: string;
  periodStart?: string;
  periodEnd?: string;
  institution?: { id: string; name: string } | null;
  supplier?: { id: string; name: string } | null;
  value: Record<string, unknown>;
  methodology: Record<string, unknown>;
  records?: Procurement[];
};
export const modeApi = {
  get: (signal?: AbortSignal) =>
    request<{ mode: 'demo' | 'production'; turnstileSiteKey?: string; turnstileRequired: boolean }>(
      '/api/v1/config',
      undefined,
      signal,
    ),
  overview: (signal?: AbortSignal) =>
    request<{
      data: {
        amountMinor: number | null;
        currency: string | null;
        procurements: number;
        suppliers: number;
        institutions: number;
        lastUpdate: string | null;
      };
      meta: { mode: 'demo' | 'production' };
    }>('/api/v1/overview', undefined, signal),
};
export const searchApi = {
  list: (q: string, signal?: AbortSignal) =>
    request<ListResponse<{ type: string; id: string; name: string; subtitle?: string }>>(
      '/api/v1/search?' + query({ q }),
      undefined,
      signal,
    ),
};
export const institutionsApi = {
  list: (p: Record<string, string | number | undefined>, s?: AbortSignal) =>
    request<ListResponse<Institution>>('/api/v1/institutions?' + query(p), undefined, s),
  get: (id: string, s?: AbortSignal) =>
    request<{ data: Institution; meta: { mode: string } }>(
      '/api/v1/institutions/' + encodeURIComponent(id),
      undefined,
      s,
    ),
};
export const suppliersApi = {
  list: (p: Record<string, string | number | undefined>, s?: AbortSignal) =>
    request<ListResponse<Supplier>>('/api/v1/suppliers?' + query(p), undefined, s),
  get: (id: string, s?: AbortSignal) =>
    request<{ data: Supplier; meta: { mode: string } }>(
      '/api/v1/suppliers/' + encodeURIComponent(id),
      undefined,
      s,
    ),
};
export const procurementsApi = {
  list: (p: Record<string, string | number | undefined>, s?: AbortSignal) =>
    request<ListResponse<Procurement>>('/api/v1/procurements?' + query(p), undefined, s),
  get: (id: string, s?: AbortSignal) =>
    request<{ data: Procurement; meta: { mode: string } }>(
      '/api/v1/procurements/' + encodeURIComponent(id),
      undefined,
      s,
    ),
};
export const datasetsApi = {
  list: (s?: AbortSignal) => request<ListResponse<Dataset>>('/api/v1/datasets', undefined, s),
  get: (id: string, s?: AbortSignal) =>
    request<{ data: Dataset }>('/api/v1/datasets/' + encodeURIComponent(id), undefined, s),
};
export const signalsApi = {
  list: (p: Record<string, string | number | undefined>, s?: AbortSignal) =>
    request<ListResponse<Signal>>('/api/v1/signals?' + query(p), undefined, s),
  get: (id: string, s?: AbortSignal) =>
    request<{ data: Signal }>('/api/v1/signals/' + encodeURIComponent(id), undefined, s),
};
export type SubmissionType =
  | 'feature'
  | 'dataset'
  | 'indicator'
  | 'correction'
  | 'documentation'
  | 'translation'
  | 'visualization'
  | 'general';
export const communityApi = {
  create: (payload: {
    type: SubmissionType;
    title: string;
    description: string;
    details: Record<string, string>;
    sourceUrl?: string;
    contact?: string;
    turnstileToken?: string;
  }) =>
    request<{ data: { id: string; status: string }; meta: { mode: string } }>(
      '/api/v1/submissions',
      { method: 'POST', body: JSON.stringify(payload) },
    ),
};
export type AdminSubmission = {
  id: string;
  type: SubmissionType;
  title: string;
  description: string;
  details: Record<string, string>;
  sourceUrl?: string | null;
  contactEmail?: string | null;
  status: string;
  createdAt: string;
  updatedAt?: string | null;
  history?: {
    id: string;
    fromStatus: string | null;
    toStatus: string;
    notes: string | null;
    createdAt: string;
    actor: string;
  }[];
};
export const adminApi = {
  list: (p: Record<string, string | number | undefined>, s?: AbortSignal) =>
    request<ListResponse<AdminSubmission>>('/api/v1/admin/submissions?' + query(p), undefined, s),
  get: (id: string, s?: AbortSignal) =>
    request<{ data: AdminSubmission }>(
      '/api/v1/admin/submissions/' + encodeURIComponent(id),
      undefined,
      s,
    ),
  update: (id: string, p: { status: string; notes?: string }) =>
    request<{ data: AdminSubmission }>('/api/v1/admin/submissions/' + encodeURIComponent(id), {
      method: 'PATCH',
      body: JSON.stringify(p),
    }),
};
