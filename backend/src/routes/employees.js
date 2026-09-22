import express from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validate, validateQuery } from '../middleware/validate.js';
import { employeeCreateSchema, employeeUpdateSchema, employeeParamsSchema, employeeQuerySchema } from '../shared/contracts/employees.js';
import { AppError } from '../lib/errors.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', validateQuery(employeeQuerySchema), async (req, res, next) => {
  try {
    const { search, department, status, page, limit } = req.query;
    const where = {};
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { employeeNumber: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (department) where.department = department;
    if (status && status !== 'all') where.status = status;
    where.deletedAt = null;

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        orderBy: { lastName: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.employee.count({ where }),
    ]);

    res.json({
      data: employees,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (e) {
    next(e);
  }
});

router.get('/departments', async (req, res, next) => {
  try {
    const departments = await prisma.employee.groupBy({
      by: ['department'],
      where: { department: { not: null }, deletedAt: null },
      _count: { department: true },
    });
    res.json({ data: departments.map((d) => ({ name: d.department, count: d._count.department })) });
  } catch (e) {
    next(e);
  }
});

router.get('/:id', validate(employeeParamsSchema), async (req, res, next) => {
  try {
    const employee = await prisma.employee.findUnique({ where: { id: req.params.id } });
    if (!employee || employee.deletedAt) throw new AppError('Employee not found', 404, 'NOT_FOUND');
    res.json({ data: employee });
  } catch (e) {
    next(e);
  }
});

router.post('/', requireRole('ADMIN', 'HR_MANAGER'), validate(employeeCreateSchema), async (req, res, next) => {
  try {
    const exists = await prisma.employee.findUnique({ where: { employeeNumber: req.body.employeeNumber } });
    if (exists) throw new AppError('Employee number already exists', 409, 'DUPLICATE');
    const employee = await prisma.employee.create({ data: req.body });
    res.status(201).json({ data: employee });
  } catch (e) {
    next(e);
  }
});

router.patch('/:id', requireRole('ADMIN', 'HR_MANAGER'), validate(employeeUpdateSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.employee.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) throw new AppError('Employee not found', 404, 'NOT_FOUND');
    if (req.body.employeeNumber && req.body.employeeNumber !== existing.employeeNumber) {
      const dup = await prisma.employee.findUnique({ where: { employeeNumber: req.body.employeeNumber } });
      if (dup) throw new AppError('Employee number already exists', 409, 'DUPLICATE');
    }
    const employee = await prisma.employee.update({ where: { id }, data: req.body });
    res.json({ data: employee });
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', requireRole('ADMIN', 'HR_MANAGER'), validate(employeeParamsSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.employee.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) throw new AppError('Employee not found', 404, 'NOT_FOUND');
    await prisma.employee.update({ where: { id }, data: { deletedAt: new Date(), status: 'INACTIVE' } });
    res.json({ message: 'Employee deleted' });
  } catch (e) {
    next(e);
  }
});

export default router;