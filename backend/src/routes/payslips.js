import express from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validate, validateQuery } from '../middleware/validate.js';
import { AppError } from '../lib/errors.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', validateQuery(z.object({ query: z.object({ runId: z.string().uuid().optional(), employeeId: z.string().uuid().optional(), status: z.enum(['PENDING', 'GENERATED', 'DISTRIBUTED', 'CANCELLED', 'all']).default('all'), page: z.coerce.number().int().positive().default(1), limit: z.coerce.number().int().positive().max(100).default(20) }) })), async (req, res, next) => {
  try {
    const { runId, employeeId, status, page, limit } = req.query;
    const where = {};
    if (runId) where.payrollRunId = runId;
    if (employeeId) where.employeeId = employeeId;
    if (status && status !== 'all') where.status = status;
    const [payslips, total] = await Promise.all([
      prisma.payslip.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { employee: true, payrollRun: true },
      }),
      prisma.payslip.count({ where }),
    ]);
    res.json({ data: payslips, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (e) {
    next(e);
  }
});

router.get('/:id', validate(z.object({ params: z.object({ id: z.string().uuid() }) })), async (req, res, next) => {
  try {
    const payslip = await prisma.payslip.findUnique({
      where: { id: req.params.id },
      include: { employee: true, payrollRun: true, payrollRecord: { include: { details: true } } },
    });
    if (!payslip) throw new AppError('Payslip not found', 404, 'NOT_FOUND');
    res.json({ data: payslip });
  } catch (e) {
    next(e);
  }
});

router.post('/:id/distribute', requireRole('ADMIN', 'HR_MANAGER', 'PAYROLL_MANAGER'), validate(z.object({ params: z.object({ id: z.string().uuid() }) })), async (req, res, next) => {
  try {
    const payslip = await prisma.payslip.findUnique({ where: { id: req.params.id } });
    if (!payslip) throw new AppError('Payslip not found', 404, 'NOT_FOUND');
    if (payslip.status !== 'GENERATED') throw new AppError('Only generated payslips can be distributed', 400, 'INVALID_STATUS');
    const updated = await prisma.payslip.update({ where: { id: payslip.id }, data: { status: 'DISTRIBUTED', distributedAt: new Date() } });
    res.json({ data: updated });
  } catch (e) {
    next(e);
  }
});

router.post('/bulk-distribute', requireRole('ADMIN', 'HR_MANAGER', 'PAYROLL_MANAGER'), validate(z.object({ body: z.object({ runId: z.string().uuid() }) })), async (req, res, next) => {
  try {
    const { runId } = req.body;
    await prisma.payslip.updateMany({ where: { payrollRunId: runId, status: 'GENERATED' }, data: { status: 'DISTRIBUTED', distributedAt: new Date() } });
    res.json({ message: 'Payslips distributed' });
  } catch (e) {
    next(e);
  }
});

import { z } from 'zod';
export default router;