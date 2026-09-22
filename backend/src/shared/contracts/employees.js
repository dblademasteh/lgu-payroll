import { z } from 'zod';

export const employeeCreateSchema = z.object({
  body: z.object({
    employeeNumber: z.string().min(1).max(50),
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
    middleName: z.string().max(100).optional().nullable(),
    email: z.string().email().max(255).optional().nullable(),
    department: z.string().max(100).optional().nullable(),
    position: z.string().max(100).optional().nullable(),
    hiredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
    monthlySalary: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid amount'),
    status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  }),
});

export const employeeUpdateSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    employeeNumber: z.string().min(1).max(50).optional(),
    firstName: z.string().min(1).max(100).optional(),
    lastName: z.string().min(1).max(100).optional(),
    middleName: z.string().max(100).optional().nullable(),
    email: z.string().email().max(255).optional().nullable(),
    department: z.string().max(100).optional().nullable(),
    position: z.string().max(100).optional().nullable(),
    hiredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    monthlySalary: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  }),
});

export const employeeParamsSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export const employeeQuerySchema = z.object({
  query: z.object({
    search: z.string().optional(),
    department: z.string().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'all']).default('all'),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }),
});