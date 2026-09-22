import { z } from 'zod';

export const apiKeyCreateSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    scopes: z.array(z.enum(['employees:read', 'payroll:read', 'payroll:write', 'reports:read', 'attendance:read'])).min(1),
  }),
});

export const apiKeyParamsSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});