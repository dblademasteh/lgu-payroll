import { z } from 'zod';

export const settingsSchema = z.object({
  body: z.object({
    fontScale: z.number().int().min(80).max(130).optional(),
    uiScale: z.number().int().min(80).max(130).optional(),
    notifPrefs: z.object({
      inApp: z.boolean().optional(),
      email: z.boolean().optional(),
      payroll: z.boolean().optional(),
      deductions: z.boolean().optional(),
      reports: z.boolean().optional(),
      system: z.boolean().optional(),
    }).optional(),
  }),
});

export const integrationConfigSchema = z.object({
  body: z.object({
    hrmsBaseUrl: z.string().url().optional().nullable(),
    hrmsApiKey: z.string().optional().nullable(),
    hrmsWebhookSecret: z.string().optional().nullable(),
    pollerEnabled: z.boolean().optional(),
    intervalMin: z.number().int().min(1).max(1440).optional(),
    timeoutMs: z.number().int().min(1000).max(60000).optional(),
    ingestPath: z.string().optional(),
    forwardingEnabled: z.boolean().optional(),
  }),
});

export const integrationConfigParamsSchema = z.object({
  params: z.object({ id: z.literal('default') }),
});