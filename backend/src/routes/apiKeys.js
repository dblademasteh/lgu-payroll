import express from 'express';
import crypto from 'crypto';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { apiKeyCreateSchema, apiKeyParamsSchema } from '../shared/contracts/apiKeys.js';
import { AppError } from '../lib/errors.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireRole('ADMIN'));

router.get('/', async (req, res, next) => {
  try {
    const keys = await prisma.apiKey.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, prefix: true, scopes: true, active: true, lastUsedAt: true, createdAt: true },
    });
    res.json({ data: keys });
  } catch (e) {
    next(e);
  }
});

router.post('/', validate(apiKeyCreateSchema), async (req, res, next) => {
  try {
    const { name, scopes } = req.body;
    const rawKey = `lp_${crypto.randomBytes(24).toString('hex')}`;
    const prefix = rawKey.slice(0, 8);
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const apiKey = await prisma.apiKey.create({
      data: { name, prefix, keyHash, scopes },
    });
    res.status(201).json({ data: { ...apiKey, key: rawKey } });
  } catch (e) {
    next(e);
  }
});

router.patch('/:id', requireRole('ADMIN'), validate(apiKeyParamsSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.apiKey.findUnique({ where: { id } });
    if (!existing) throw new AppError('API key not found', 404, 'NOT_FOUND');
    const updated = await prisma.apiKey.update({ where: { id }, data: { active: !existing.active } });
    res.json({ data: { ...updated, key: undefined } });
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', requireRole('ADMIN'), validate(apiKeyParamsSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.apiKey.delete({ where: { id } });
    res.json({ message: 'API key deleted' });
  } catch (e) {
    next(e);
  }
});

export default router;