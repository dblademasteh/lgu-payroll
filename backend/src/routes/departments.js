import express from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { departmentCreateSchema, departmentUpdateSchema, departmentParamsSchema, departmentQuerySchema } from '../shared/contracts/departments.js';
import { AppError } from '../lib/errors.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', validate(departmentQuerySchema), async (req, res, next) => {
  try {
    const { search, page, limit } = req.query;
    const where = search
      ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { code: { contains: search, mode: 'insensitive' } }] }
      : {};
    const [departments, total] = await Promise.all([
      prisma.department.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { head: { select: { id: true, firstName: true, lastName: true } }, _count: { select: { employees: true } } },
      }),
      prisma.department.count({ where }),
    ]);
    res.json({ data: departments, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (e) {
    next(e);
  }
});

router.get('/:id', validate(departmentParamsSchema), async (req, res, next) => {
  try {
    const dept = await prisma.department.findUnique({
      where: { id: req.params.id },
      include: { head: true, employees: { where: { deletedAt: null }, select: { id: true, employeeNumber: true, firstName: true, lastName: true, position: true } } },
    });
    if (!dept) throw new AppError('Department not found', 404, 'NOT_FOUND');
    res.json({ data: dept });
  } catch (e) {
    next(e);
  }
});

router.post('/', requireRole('ADMIN', 'HR_MANAGER'), validate(departmentCreateSchema), async (req, res, next) => {
  try {
    const exists = await prisma.department.findUnique({ where: { code: req.body.code } });
    if (exists) throw new AppError('Department code already exists', 409, 'DUPLICATE');
    const dept = await prisma.department.create({ data: req.body });
    res.status(201).json({ data: dept });
  } catch (e) {
    next(e);
  }
});

router.patch('/:id', requireRole('ADMIN', 'HR_MANAGER'), validate(departmentUpdateSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.department.findUnique({ where: { id } });
    if (!existing) throw new AppError('Department not found', 404, 'NOT_FOUND');
    if (req.body.code && req.body.code !== existing.code) {
      const dup = await prisma.department.findUnique({ where: { code: req.body.code } });
      if (dup) throw new AppError('Department code already exists', 409, 'DUPLICATE');
    }
    const dept = await prisma.department.update({ where: { id }, data: req.body });
    res.json({ data: dept });
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', requireRole('ADMIN', 'HR_MANAGER'), validate(departmentParamsSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.department.findUnique({ where: { id } });
    if (!existing) throw new AppError('Department not found', 404, 'NOT_FOUND');
    await prisma.department.delete({ where: { id } });
    res.json({ message: 'Department deleted' });
  } catch (e) {
    next(e);
  }
});

export default router;