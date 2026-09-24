import express from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { z } from 'zod';
import { AppError } from '../lib/errors.js';

const router = express.Router();

router.use(requireAuth);

const overtimeCreateSchema = z.object({
  body: z.object({
    payrollRunId: z.string().uuid(),
    employeeId: z.string().uuid(),
    overtimeHours: z.number().min(0).default(0),
    overtimeRate: z.number().min(0).default(0), // multiplier (e.g., 1.25 for 125%)
    allowances: z.number().min(0).default(0),
    remarks: z.string().max(500).optional().nullable(),
  }),
});

const overtimeUpdateSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    overtimeHours: z.number().min(0).optional(),
    overtimeRate: z.number().min(0).optional(),
    allowances: z.number().min(0).optional(),
    remarks: z.string().max(500).optional().nullable(),
  }),
});

const overtimeParamsSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

const overtimeQuerySchema = z.object({
  query: z.object({
    payrollRunId: z.string().uuid().optional(),
    employeeId: z.string().uuid().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }),
});

// Get overtime/allowances entries
router.get('/', validate(overtimeQuerySchema), async (req, res, next) => {
  try {
    const { payrollRunId, employeeId, page, limit } = req.query;
    const where = {};
    if (payrollRunId) where.payrollRunId = payrollRunId;
    if (employeeId) where.employeeId = employeeId;

    const [entries, total] = await Promise.all([
      prisma.overtimeAllowance.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { employee: true, payrollRun: true },
      }),
      prisma.overtimeAllowance.count({ where }),
    ]);

    res.json({ data: entries, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (e) {
    next(e);
  }
});

// Get single entry
router.get('/:id', validate(overtimeParamsSchema), async (req, res, next) => {
  try {
    const entry = await prisma.overtimeAllowance.findUnique({
      where: { id: req.params.id },
      include: { employee: true, payrollRun: true },
    });
    if (!entry) throw new AppError('Entry not found', 404, 'NOT_FOUND');
    res.json({ data: entry });
  } catch (e) {
    next(e);
  }
});

// Create entry
router.post('/', requireRole('ADMIN', 'HR_MANAGER', 'PAYROLL_MANAGER'), validate(overtimeCreateSchema), async (req, res, next) => {
  try {
    const { payrollRunId, employeeId, overtimeHours, overtimeRate, allowances, remarks } = req.body;
    
    // Verify payroll run exists
    const run = await prisma.payrollRun.findUnique({ where: { id: payrollRunId } });
    if (!run) throw new AppError('Payroll run not found', 404, 'NOT_FOUND');
    
    // Verify employee exists
    const emp = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!emp || emp.deletedAt) throw new AppError('Employee not found', 404, 'NOT_FOUND');

    const overtimePay = Number(overtimeHours) * Number(overtimeRate) * (Number(emp.monthlySalary) / 160); // Assuming 160 hours/month

    const entry = await prisma.overtimeAllowance.create({
      data: {
        payrollRunId,
        employeeId,
        overtimeHours,
        overtimeRate,
        overtimePay: overtimePay.toFixed(2),
        allowances,
        remarks,
      },
      include: { employee: true, payrollRun: true },
    });

    res.status(201).json({ data: entry });
  } catch (e) {
    if (e instanceof AppError) throw e;
    if (e?.code === 'P2002') throw new AppError('Entry for this employee and payroll run already exists', 409, 'DUPLICATE');
    next(e);
  }
});

// Update entry
router.patch('/:id', requireRole('ADMIN', 'HR_MANAGER', 'PAYROLL_MANAGER'), validate(overtimeUpdateSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { overtimeHours, overtimeRate, allowances, remarks } = req.body;

    const existing = await prisma.overtimeAllowance.findUnique({ 
      where: { id },
      include: { employee: true },
    });
    if (!existing) throw new AppError('Entry not found', 404, 'NOT_FOUND');

    const overtimePay = overtimeHours !== undefined && overtimeRate !== undefined
      ? (Number(overtimeHours) * Number(overtimeRate) * (Number(existing.employee.monthlySalary) / 160)).toFixed(2)
      : overtimeHours !== undefined
        ? (Number(overtimeHours) * Number(existing.overtimeRate) * (Number(existing.employee.monthlySalary) / 160)).toFixed(2)
        : overtimeRate !== undefined
          ? (Number(existing.overtimeHours) * Number(overtimeRate) * (Number(existing.employee.monthlySalary) / 160)).toFixed(2)
          : existing.overtimePay;

    const entry = await prisma.overtimeAllowance.update({
      where: { id },
      data: {
        overtimeHours,
        overtimeRate,
        overtimePay,
        allowances,
        remarks,
      },
      include: { employee: true, payrollRun: true },
    });

    res.json({ data: entry });
  } catch (e) {
    next(e);
  }
});

// Delete entry
router.delete('/:id', requireRole('ADMIN', 'HR_MANAGER', 'PAYROLL_MANAGER'), validate(overtimeParamsSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.overtimeAllowance.findUnique({ where: { id } });
    if (!existing) throw new AppError('Entry not found', 404, 'NOT_FOUND');
    await prisma.overtimeAllowance.delete({ where: { id } });
    res.json({ message: 'Entry deleted' });
  } catch (e) {
    next(e);
  }
});

// Bulk upsert for payroll run
router.post('/bulk', requireRole('ADMIN', 'HR_MANAGER', 'PAYROLL_MANAGER'), validate(z.object({
  body: z.object({
    payrollRunId: z.string().uuid(),
    entries: z.array(z.object({
      employeeId: z.string().uuid(),
      overtimeHours: z.number().min(0).default(0),
      overtimeRate: z.number().min(0).default(0),
      allowances: z.number().min(0).default(0),
      remarks: z.string().max(500).optional().nullable(),
    })),
  }),
})), async (req, res, next) => {
  try {
    const { payrollRunId, entries } = req.body;

    const run = await prisma.payrollRun.findUnique({ where: { id: payrollRunId } });
    if (!run) throw new AppError('Payroll run not found', 404, 'NOT_FOUND');

    const results = [];
    for (const entry of entries) {
      const emp = await prisma.employee.findUnique({ where: { id: entry.employeeId } });
      if (!emp || emp.deletedAt) continue;

      const overtimePay = Number(entry.overtimeHours) * Number(entry.overtimeRate) * (Number(emp.monthlySalary) / 160);

      const upserted = await prisma.overtimeAllowance.upsert({
        where: {
          payrollRunId_employeeId: { payrollRunId, employeeId: entry.employeeId },
        },
        update: {
          overtimeHours: entry.overtimeHours,
          overtimeRate: entry.overtimeRate,
          overtimePay: overtimePay.toFixed(2),
          allowances: entry.allowances,
          remarks: entry.remarks,
        },
        create: {
          payrollRunId,
          employeeId: entry.employeeId,
          overtimeHours: entry.overtimeHours,
          overtimeRate: entry.overtimeRate,
          overtimePay: overtimePay.toFixed(2),
          allowances: entry.allowances,
          remarks: entry.remarks,
        },
        include: { employee: true, payrollRun: true },
      });
      results.push(upserted);
    }

    res.json({ data: results });
  } catch (e) {
    next(e);
  }
});

export default router;