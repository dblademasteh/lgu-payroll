import { z } from 'zod';

export const reportQuerySchema = z.object({
  query: z.object({
    period: z.string().regex(/^\d{4}-\d{2}$/, 'Period must be YYYY-MM').optional(),
    type: z.enum(['payroll-summary', 'payslip-register', 'deductions-summary', 'government-contributions', 'tax-withholding', 'department-cost', 'overtime-report', 'leave-liability', 'year-end', 'all']).default('all'),
  }),
});

export const reportGenerateSchema = z.object({
  body: z.object({
    period: z.string().regex(/^\d{4}-\d{2}$/, 'Period must be YYYY-MM'),
    type: z.enum(['payroll-summary', 'payslip-register', 'deductions-summary', 'government-contributions', 'tax-withholding', 'department-cost', 'overtime-report', 'leave-liability', 'year-end']),
    format: z.enum(['json', 'pdf', 'excel']).default('json'),
  }),
});