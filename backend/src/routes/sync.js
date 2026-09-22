import express from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validate, validateQuery } from '../middleware/validate.js';
import { AppError } from '../lib/errors.js';
import { encrypt, decrypt } from '../lib/secrets.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireRole('ADMIN', 'HR_MANAGER'));

router.get('/logs', validateQuery(z.object({ query: z.object({ status: z.string().optional(), source: z.string().optional(), direction: z.string().optional(), page: z.coerce.number().int().positive().default(1), limit: z.coerce.number().int().positive().max(100).default(20) }) })), async (req, res, next) => {
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
    // Manual sync trigger - placeholder
    // In production, this would trigger the HRMS sync service
    const log = await prisma.syncLog.create({
      data: {
        source: 'MANUAL',
        direction: 'PULL',
        status: 'SUCCESS',
        processed: 0,
        message: 'Manual sync triggered (placeholder)',
      },
    });
    res.json({ message: 'Sync triggered', data: log });
  } catch (e) {
    next(e);
  }
});

router.get('/config', async (req, res, next) => {
  try {
    const config = await prisma.integrationConfig.findUnique({ where: { id: 'default' } });
    res.json({ data: config });
  } catch (e) {
    next(e);
  }
});

import { z } from 'zod';
export default router;