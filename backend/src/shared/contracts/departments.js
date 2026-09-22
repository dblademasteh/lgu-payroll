import { z } from 'zod';

export const departmentCreateSchema = z.object({
  body: z.object({
    code: z.string().min(1).max(10).regex(/^[A-Z0-9]+$/, 'Code must be uppercase alphanumeric'),
    name: z.string().min(1).max(100),
    headId: z.string().uuid().optional().nullable(),
    budget: z.string().regex(/^\d+(\.\d{1,2})?$/).optional().nullable(),
    description: z.string().max(500).optional().nullable(),
  }),
});

export const departmentUpdateSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    code: z.string().min(1).max(10).regex(/^[A-Z0-9]+$/).optional(),
    name: z.string().min(1).max(100).optional(),
    headId: z.string().uuid().optional().nullable(),
    budget: z.string().regex(/^\d+(\.\d{1,2})?$/).optional().nullable(),
    description: z.string().max(500).optional().nullable(),
  }),
});

export const departmentParamsSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export const departmentQuerySchema = z.object({
  query: z.object({
    search: z.string().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }),
});