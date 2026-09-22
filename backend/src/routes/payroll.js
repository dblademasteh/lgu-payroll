import express from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validate, validateQuery } from '../middleware/validate.js';
import { payrollRunCreateSchema, payrollRunUpdateSchema, payrollRunParamsSchema, payrollRunQuerySchema } from '../shared/contracts/payroll.js';
import { AppError } from '../lib/errors.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', validateQuery(payrollRunQuerySchema), async (req, res, next) => {
  try {
    const { status, page, limit } = req.query;
    const where = status && status !== 'all' ? { status } : {};
    const [runs, total] = await Promise.all([
      prisma.payrollRun.findMany({
        where,
        orderBy: { period: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.payrollRun.count({ where }),
    ]);
    res.json({ data: runs, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (e) {
    next(e);
  }
});

router.get('/:id', validate(payrollRunParamsSchema), async (req, res, next) => {
  try {
    const run = await prisma.payrollRun.findUnique({
      where: { id: req.params.id },
      include: {
        records: {
          include: { employee: true, details: true },
        },
      },
    });
    if (!run) throw new AppError('Payroll run not found', 404, 'NOT_FOUND');
    res.json({ data: run });
  } catch (e) {
    next(e);
  }
});

router.post('/', requireRole('ADMIN', 'HR_MANAGER', 'PAYROLL_MANAGER'), validate(payrollRunCreateSchema), async (req, res, next) => {
  try {
    const exists = await prisma.payrollRun.findUnique({ where: { period: req.body.period } });
    if (exists) throw new AppError('Payroll run for this period already exists', 409, 'DUPLICATE');
    const run = await prisma.payrollRun.create({ data: { ...req.body, status: 'DRAFT' } });
    res.status(201).json({ data: run });
  } catch (e) {
    next(e);
  }
});

router.patch('/:id', requireRole('ADMIN', 'HR_MANAGER', 'PAYROLL_MANAGER'), validate(payrollRunUpdateSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.payrollRun.findUnique({ where: { id } });
    if (!existing) throw new AppError('Payroll run not found', 404, 'NOT_FOUND');
    const run = await prisma.payrollRun.update({ where: { id }, data: req.body });
    res.json({ data: run });
  } catch (e) {
    next(e);
  }
});

router.post('/:id/process', requireRole('ADMIN', 'HR_MANAGER', 'PAYROLL_MANAGER'), validate(payrollRunParamsSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const run = await prisma.payrollRun.findUnique({ where: { id }, include: { records: true } });
    if (!run) throw new AppError('Payroll run not found', 404, 'NOT_FOUND');
    if (run.status !== 'DRAFT' && run.status !== 'APPROVED') {
      throw new AppError('Only draft or approved runs can be processed', 400, 'INVALID_STATUS');
    }

    // Get active employees
    const employees = await prisma.employee.findMany({
      where: { status: 'ACTIVE', deletedAt: null },
      include: { payrollRecords: { where: { payrollRunId: id } } },
    });

    // Get active deductions
    const deductions = await prisma.deduction.findMany({ where: { isActive: true } });

    // Process each employee
    const records = [];
    for (const emp of employees) {
      const basicSalary = Number(emp.monthlySalary);
      const grossPay = basicSalary; // Simplified - add overtime/allowances later
      const taxableIncome = grossPay; // Simplified
      let totalDeductions = 0;
      const details = [];

      for (const ded of deductions) {
        let computed = 0;
        if (ded.amountType === 'FIXED') {
          computed = Number(ded.rateOrAmount);
        } else if (ded.amountType === 'PERCENTAGE') {
          const basis = ded.basis === 'GROSS' ? grossPay : (ded.basis === 'TAXABLE' ? taxableIncome : grossPay - totalDeductions);
          computed = basis * Number(ded.rateOrAmount) / 100;
        }
        totalDeductions += computed;
        details.push({
          deductionId: ded.id,
          type: ded.type,
          name: ded.name,
          amountType: ded.amountType,
          basis: ded.basis,
          rateOrAmount: ded.rateOrAmount,
          computedAmount: computed.toFixed(2),
          isMandatory: ded.isMandatory,
        });
      }

      const withholdingTax = 0; // Simplified - implement BIR tax table
      const netPay = grossPay - totalDeductions - withholdingTax;

      const record = await prisma.payrollRecord.upsert({
        where: { payrollRunId_employeeId: { payrollRunId: id, employeeId: emp.id } },
        update: {
          basicSalary,
          grossPay,
          totalDeductions,
          taxableIncome,
          withholdingTax,
          netPay,
          details: { deleteMany: {}, create: details },
        },
        create: {
          payrollRunId: id,
          employeeId: emp.id,
          basicSalary,
          grossPay,
          totalDeductions,
          taxableIncome,
          withholdingTax,
          netPay,
          details: { create: details },
        },
      });
      records.push(record);
    }

    const totals = records.reduce(
      (acc, r) => ({
        totalEmployees: acc.totalEmployees + 1,
        totalGrossPay: acc.totalGrossPay + Number(r.grossPay),
        totalDeductions: acc.totalDeductions + Number(r.totalDeductions),
        totalNetPay: acc.totalNetPay + Number(r.netPay),
      }),
      { totalEmployees: 0, totalGrossPay: 0, totalDeductions: 0, totalNetPay: 0 }
    );

    await prisma.payrollRun.update({
      where: { id },
      data: {
        status: 'PROCESSING',
        ...totals,
        totalGrossPay: totals.totalGrossPay.toFixed(2),
        totalDeductions: totals.totalDeductions.toFixed(2),
        totalNetPay: totals.totalNetPay.toFixed(2),
      },
    });

    res.json({ message: 'Payroll processed', data: { ...totals, records: records.length } });
  } catch (e) {
    next(e);
  }
});

router.post('/:id/approve', requireRole('ADMIN', 'HR_MANAGER'), validate(payrollRunParamsSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const run = await prisma.payrollRun.findUnique({ where: { id } });
    if (!run) throw new AppError('Payroll run not found', 404, 'NOT_FOUND');
    if (run.status !== 'PROCESSING') throw new AppError('Only processed runs can be approved', 400, 'INVALID_STATUS');
    const updated = await prisma.payrollRun.update({
      where: { id },
      data: { status: 'APPROVED', approvedBy: req.user.id, approvedAt: new Date() },
    });
    res.json({ data: updated });
  } catch (e) {
    next(e);
  }
});

router.post('/:id/complete', requireRole('ADMIN', 'HR_MANAGER'), validate(payrollRunParamsSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const run = await prisma.payrollRun.findUnique({ where: { id } });
    if (!run) throw new AppError('Payroll run not found', 404, 'NOT_FOUND');
    if (run.status !== 'APPROVED') throw new AppError('Only approved runs can be completed', 400, 'INVALID_STATUS');
    const updated = await prisma.payrollRun.update({
      where: { id },
      data: { status: 'COMPLETED', processedAt: new Date() },
    });
    // Generate payslips
    await prisma.payslip.createMany({
      data: (await prisma.payrollRecord.findMany({ where: { payrollRunId: id } })).map((r) => ({
        payrollRunId: id,
        employeeId: r.employeeId,
        payrollRecordId: r.id,
        status: 'GENERATED',
        generatedAt: new Date(),
      })),
      skipDuplicates: true,
    });
    res.json({ data: updated });
  } catch (e) {
    next(e);
  }
});

export default router;