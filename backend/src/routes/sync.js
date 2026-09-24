import express from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { AppError } from '../lib/errors.js';
import { syncService } from '../services/syncService.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireRole('ADMIN', 'HR_MANAGER'));

router.get('/logs', validate(z.object({ query: z.object({ status: z.string().optional(), source: z.string().optional(), direction: z.string().optional(), page: z.coerce.number().int().positive().default(1), limit: z.coerce.number().int().positive().max(100).default(20) }) })), async (req, res, next) => {
  try {
    const { status, source, direction, page, limit } = req.query;
    const where = {};
    if (status) where.status = status;
    if (source) where.source = source;
    if (direction) where.direction = direction;
    const [logs, total] = await Promise.all([
      prisma.syncLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      prisma.syncLog.count({ where }),
    ]);
    res.json({ data: logs, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (e) {
    next(e);
  }
});

router.post('/run', async (req, res, next) => {
  try {
    await syncService.loadConfig();
    const result = await syncService.pullEmployees();
    res.json({ message: 'Sync completed', data: result });
  } catch (e) {
    next(e);
  }
});

router.post('/pull-attendance', async (req, res, next) => {
  try {
    const { startDate, endDate, employeeId } = req.body;
    await syncService.loadConfig();
    const records = await syncService.pullAttendance({ startDate, endDate, employeeId });
    res.json({ message: 'Attendance pulled', data: records, count: records.length });
  } catch (e) {
    next(e);
  }
});

router.post('/webhook', async (req, res, next) => {
  try {
    const signature = req.headers['x-webhook-signature'];
    if (!signature) {
      throw new AppError('Missing webhook signature', 400, 'MISSING_SIGNATURE');
    }
    await syncService.loadConfig();
    const result = await syncService.handleWebhook(req.body, signature);
    res.json({ message: 'Webhook processed', data: result });
  } catch (e) {
    next(e);
  }
});

router.get('/logs', validate(z.object({ query: z.object({ status: z.string().optional(), source: z.string().optional(), direction: z.string().optional(), page: z.coerce.number().int().positive().default(1), limit: z.coerce.number().int().positive().max(100).default(20) }) })), async (req, res, next) => {
  try {
    const { status, source, direction, page, limit } = req.query;
    await syncService.loadConfig();
    const result = await syncService.getLogs({ status, source, direction, page, limit });
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get('/config', async (req, res, next) => {
  try {
    await syncService.loadConfig();
    const config = syncService.config;
    if (!config) {
      throw new AppError('Integration not configured', 404, 'NOT_CONFIGURED');
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

router.post('/poller/start', async (req, res, next) => {
  try {
    await syncService.startPoller();
    res.json({ message: 'Poller started' });
  } catch (e) {
    next(e);
  }
});

router.post('/poller/stop', async (req, res, next) => {
  try {
    syncService.stopPoller();
    res.json({ message: 'Poller stopped' });
  } catch (e) {
    next(e);
  }
});

router.get('/poller/status', async (req, res, next) => {
  try {
    res.json({ data: { running: syncService.isRunning } });
  } catch (e) {
    next(e);
  }
});

import { z } from 'zod';
export default router;