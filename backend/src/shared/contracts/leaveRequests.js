import { z } from 'zod';

export const leaveCreateSchema = z.object({
  body: z.object({
    employeeId: z.string().uuid(),
    type: z.enum(['VACATION', 'SICK', 'EMERGENCY', 'MATERNITY', 'PATERNITY', 'SOLO_PARENT', 'OTHER']),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
    reason: z.string().max(500).optional().nullable(),
  }),
});

export const leaveUpdateSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    type: z.enum(['VACATION', 'SICK', 'EMERGENCY', 'MATERNITY', 'PATERNITY', 'SOLO_PARENT', 'OTHER']).optional(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']).optional(),
    reason: z.string().max(500).optional().nullable(),
  }),
});

export const leaveParamsSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export const leaveQuerySchema = z.object({
  query: z.object({
    employeeId: z.string().uuid().optional(),
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'all']).default('all'),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }),
});

export const holidayCreateSchema = z.object({
  body: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
    name: z.string().min(1).max(100),
  }),
});

export const holidayParamsSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});