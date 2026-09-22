import express from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validate, validateQuery } from '../middleware/validate.js';
import { deductionCreateSchema, deductionUpdateSchema, deductionParamsSchema, deductionQuerySchema } from '../shared/contracts/payroll.js';
import { AppError } from '../lib/errors.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', validateQuery(deductionQuerySchema), async (req, res, next) => {
  try {
    const { type, isActive, page, limit } = req.query;
    const where = {};
    if (type && type !== 'all') where.type = type;
    if (isActive !== undefined) where.isActive = isActive;
    const [deductions, total] = await Promise.all([
      prisma.deduction.findMany({ where, orderBy: { name: 'asc' }, skip: (page - 1) * limit, take: limit }),
      prisma.deduction.count({ where }),
    ]);
    res.json({ data: deductions, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (e) {
    next(e);
  }
});

router.get('/:id', validate(deductionParamsSchema), async (req, res, next) => {
  try {
    const deduction = await prisma.deduction.findUnique({ where: { id: req.params.id } });
    if (!deduction) throw new AppError('Deduction not found', 404, 'NOT_FOUND');
    res.json({ data: deduction });
  } catch (e) {
    next(e);
  }
});

router.post('/', requireRole('ADMIN', 'HR_MANAGER', 'PAYROLL_MANAGER'), validate(deductionCreateSchema), async (req, res, next) => {
  try {
    const exists = await prisma.deduction.findUnique({ where: { code: req.body.code } });
    if (exists) throw new AppError('Deduction code already exists', 409, 'DUPLICATE');
    const deduction = await prisma.deduction.create({ data: req.body });
    res.status(201).json({ data: deduction });
  } catch (e) {
    next(e);
  }
});

router.patch('/:id', requireRole('ADMIN', 'HR_MANAGER', 'PAYROLL_MANAGER'), validate(deductionUpdateSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.deduction.findUnique({ where: { id } });
    if (!existing) throw new AppError('Deduction not found', 404, 'NOT_FOUND');
    const deduction = await prisma.deduction.update({ where: { id }, data: req.body });
    res.json({ data: deduction });
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', requireRole('ADMIN', 'HR_MANAGER', 'PAYROLL_MANAGER'), validate(deductionParamsSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.deduction.findUnique({ where: { id } });
    if (!existing) throw new AppError('Deduction not found', 404, 'NOT_FOUND');
    await prisma.deduction.delete({ where: { id } });
    res.json({ message: 'Deduction deleted' });
  } catch (e) {
    next(e);
  }
});

export default router;