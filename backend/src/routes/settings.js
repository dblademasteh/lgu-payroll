import express from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { settingsSchema, integrationConfigSchema, integrationConfigParamsSchema } from '../shared/contracts/settings.js';
import { encrypt, decrypt } from '../lib/secrets.js';
import { AppError } from '../lib/errors.js';

const router = express.Router();

router.use(requireAuth);

// User settings (appearance, notifications)
router.get('/preferences', async (req, res, next) => {
  try {
    let prefs = await prisma.notificationPreference.findUnique({ where: { userId: req.user.id } });
    if (!prefs) {
      prefs = await prisma.notificationPreference.create({ data: { userId: req.user.id } });
    }
    // Also get font/ui scale from localStorage (client-side) or settings table
    const settings = await prisma.setting.findUnique({ where: { userId_key: { userId: req.user.id, key: 'display' } } });
    res.json({ data: { ...prefs, display: settings?.value || { fontScale: 100, uiScale: 100 } } });
  } catch (e) {
    next(e);
  }
});

router.patch('/preferences', validate(settingsSchema), async (req, res, next) => {
  try {
    const { fontScale, uiScale, notifPrefs } = req.body;
    if (notifPrefs) {
      await prisma.notificationPreference.upsert({
        where: { userId: req.user.id },
        update: notifPrefs,
        create: { userId: req.user.id, ...notifPrefs },
      });
    }
    if (fontScale !== undefined || uiScale !== undefined) {
      await prisma.setting.upsert({
        where: { userId_key: { userId: req.user.id, key: 'display' } },
        update: { value: { fontScale: fontScale ?? 100, uiScale: uiScale ?? 100 } },
        create: { userId: req.user.id, key: 'display', value: { fontScale: fontScale ?? 100, uiScale: uiScale ?? 100 } },
      });
    }
    res.json({ message: 'Preferences saved' });
  } catch (e) {
    next(e);
  }
});

// Integration config (HRMS connection) - ADMIN/HR_MANAGER only
router.get('/integration', requireRole('ADMIN', 'HR_MANAGER'), async (req, res, next) => {
  try {
    let config = await prisma.integrationConfig.findUnique({ where: { id: 'default' } });
    if (!config) {
      config = await prisma.integrationConfig.create({ data: { id: 'default' } });
    }
    // Mask secrets
    const masked = {
      ...config,
      hrmsApiKeyEnc: config.hrmsApiKeyEnc ? '***set***' : null,
      hrmsWebhookSecretEnc: config.hrmsWebhookSecretEnc ? '***set***' : null,
    };
    res.json({ data: masked });
  } catch (e) {
    next(e);
  }
});

router.patch('/integration', requireRole('ADMIN', 'HR_MANAGER'), validate(integrationConfigSchema), async (req, res, next) => {
  try {
    const { hrmsApiKey, hrmsWebhookSecret, ...rest } = req.body;
    const data = { ...rest };
    if (hrmsApiKey !== undefined) data.hrmsApiKeyEnc = hrmsApiKey ? encrypt(hrmsApiKey) : null;
    if (hrmsWebhookSecret !== undefined) data.hrmsWebhookSecretEnc = hrmsWebhookSecret ? encrypt(hrmsWebhookSecret) : null;
    const config = await prisma.integrationConfig.upsert({
      where: { id: 'default' },
      update: data,
      create: { id: 'default', ...data },
    });
    // Mask secrets in response
    const masked = {
      ...config,
      hrmsApiKeyEnc: config.hrmsApiKeyEnc ? '***set***' : null,
      hrmsWebhookSecretEnc: config.hrmsWebhookSecretEnc ? '***set***' : null,
    };
    res.json({ data: masked });
  } catch (e) {
    next(e);
  }
});

router.post('/integration/test', requireRole('ADMIN', 'HR_MANAGER'), async (req, res, next) => {
  try {
    const config = await prisma.integrationConfig.findUnique({ where: { id: 'default' } });
    if (!config || !config.hrmsBaseUrl || !config.hrmsApiKeyEnc) {
      throw new AppError('Integration not configured', 400, 'NOT_CONFIGURED');
    }
    const apiKey = decrypt(config.hrmsApiKeyEnc);
    const response = await fetch(`${config.hrmsBaseUrl}/integrations/employees?limit=1`, {
      headers: { 'x-api-key': apiKey, 'Accept': 'application/json' },
      signal: AbortSignal.timeout(config.timeoutMs || 15000),
    });
    if (!response.ok) throw new AppError(`HRMS returned ${response.status}`, 502, 'HRMS_ERROR');
    const data = await response.json();
    res.json({ message: 'Connection successful', data: { employeeCount: data.data?.length ?? 0 } });
  } catch (e) {
    next(e);
  }
});

export default router;