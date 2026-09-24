import { z } from 'zod';

export const payrollRunCreateSchema = z.object({
  body: z.object({
    period: z.string().regex(/^\d{4}-\d{2}$/, 'Period must be YYYY-MM'),
    name: z.string().min(1).max(200),
    remarks: z.string().max(1000).optional(),
  }),
});

export const payrollRunUpdateSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    name: z.string().min(1).max(200).optional(),
    status: z.enum(['DRAFT', 'PROCESSING', 'APPROVED', 'COMPLETED', 'CANCELLED']).optional(),
    remarks: z.string().max(1000).optional().nullable(),
  }),
});

export const payrollRunParamsSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export const payrollRunQuerySchema = z.object({
  query: z.object({
    status: z.enum(['DRAFT', 'PROCESSING', 'APPROVED', 'COMPLETED', 'CANCELLED', 'all']).default('all'),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }),
});

export const payrollChangesSchema = z.object({
  body: z.object({
    since: z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'Invalid since timestamp').optional(),
  }),
});

export const deductionCreateSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    code: z.string().min(1).max(50).regex(/^[A-Z0-9_]+$/, 'Code must be uppercase alphanumeric with underscores'),
    type: z.enum(['GOVERNMENT', 'TAX', 'LOAN', 'OTHER']),
    amountType: z.enum(['FIXED', 'PERCENTAGE', 'TABLE']),
    basis: z.enum(['GROSS', 'TAXABLE', 'NET']),
    rateOrAmount: z.string().regex(/^\d+(\.\d{1,4})?$/, 'Invalid rate/amount'),
    isMandatory: z.boolean().default(false),
    description: z.string().max(500).optional().nullable(),
  }),
});

export const deductionUpdateSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    type: z.enum(['GOVERNMENT', 'TAX', 'LOAN', 'OTHER']).optional(),
    amountType: z.enum(['FIXED', 'PERCENTAGE', 'TABLE']).optional(),
    basis: z.enum(['GROSS', 'TAXABLE', 'NET']).optional(),
    rateOrAmount: z.string().regex(/^\d+(\.\d{1,4})?$/).optional(),
    isMandatory: z.boolean().optional(),
    isActive: z.boolean().optional(),
    description: z.string().max(500).optional().nullable(),
  }),
});

export const deductionParamsSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export const deductionQuerySchema = z.object({
  query: z.object({
    type: z.enum(['GOVERNMENT', 'TAX', 'LOAN', 'OTHER', 'all']).default('all'),
    isActive: z.coerce.boolean().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }),
});