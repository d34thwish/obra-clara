import { z } from 'zod';
export const id = z
  .string()
  .min(1)
  .max(160)
  .regex(/^[A-Za-z0-9:_-]+$/);
export const pagination = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).max(1000000).default(0),
  q: z.string().trim().max(100).optional(),
  sort: z.enum(['name', 'amount', 'date']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
});
export const procurementFilters = pagination.extend({
  institution: z.string().max(160).optional(),
  supplier: z.string().max(160).optional(),
  procedure: z.string().max(120).optional(),
  status: z.string().max(80).optional(),
  stage: z.enum(['process', 'award', 'contract', 'order', 'payment']).optional(),
  dateFrom: z.string().date().optional(),
  dateTo: z.string().date().optional(),
  minAmount: z.coerce.number().int().min(0).optional(),
  maxAmount: z.coerce.number().int().min(0).optional(),
});
export const submission = z
  .object({
    type: z.enum([
      'feature',
      'dataset',
      'indicator',
      'correction',
      'documentation',
      'translation',
      'visualization',
      'general',
    ]),
    title: z.string().trim().min(5).max(160),
    description: z.string().trim().min(30).max(8000),
    details: z.record(z.string().max(80), z.string().trim().max(2000)).default({}),
    sourceUrl: z.string().url().max(1000).optional().or(z.literal('')),
    contact: z.string().email().max(254).optional().or(z.literal('')),
    turnstileToken: z.string().max(2048).optional(),
  })
  .superRefine((v, c) => {
    const req: Record<string, string[]> = {
      feature: ['problem', 'users', 'behavior', 'benefit'],
      dataset: ['sourceInstitution', 'officialUrl', 'format', 'usefulness'],
      indicator: ['calculation', 'requiredFields', 'limitations'],
      correction: ['recordReference', 'problem', 'expectedCorrection', 'evidence'],
      documentation: ['resource', 'improvement'],
      translation: ['resource', 'improvement', 'language'],
      visualization: ['problem', 'behavior'],
      general: [],
    };
    for (const k of req[v.type] || [])
      if (!v.details[k])
        c.addIssue({ code: 'custom', path: ['details', k], message: 'Campo requerido' });
  });
export const statuses = [
  'received',
  'under_review',
  'needs_information',
  'accepted',
  'rejected',
  'implemented',
  'closed',
] as const;
export const patchSubmission = z.object({
  status: z.enum(statuses),
  notes: z.string().trim().max(4000).optional(),
});
export const transitions: Record<string, string[]> = {
  received: ['under_review', 'rejected', 'closed'],
  under_review: ['needs_information', 'accepted', 'rejected', 'closed'],
  needs_information: ['under_review', 'closed'],
  accepted: ['implemented', 'closed'],
  rejected: ['under_review', 'closed'],
  implemented: ['closed'],
  closed: [],
};
