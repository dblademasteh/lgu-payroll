import express from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validate, validateQuery } from '../middleware/validate.js';
import { leaveCreateSchema, leaveUpdateSchema, leaveParamsSchema, leaveQuerySchema, holidayCreateSchema, holidayParamsSchema } from '../shared/contracts/leaveRequests.js';
import { AppError } from '../lib/errors.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', validateQuery(leaveQuerySchema), async (req, res, next) => {
  try {
    const { employeeId, status, startDate, endDate, page, limit } = req.query;
    const where = {};
    if (employeeId) where.employeeId = employeeId;
    else if (req.user.role === 'VIEWER' && req.user.externalId) {
      const emp = await prisma.employee.findUnique({ where: { employeeNumber: req.user.externalId } });
      if (emp) where.employeeId = emp.id;
    }
    if (status && status !== 'all') where.status = status;
    if (startDate) where.startDate = { gte: new Date(startDate) };
    if (endDate) where.endDate = { lte: new Date(endDate) };
    const [leaves, total] = await Promise.all([
      prisma.leaveRequest.findMany({
        where,
        orderBy: { startDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { employee: { select: { id: true, employeeNumber: true, firstName: true, lastName: true } } },
      }),
      prisma.leaveRequest.count({ where }),
    ]);
    res.json({ data: leaves, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (e) {
    next(e);
  }
});

router.get('/:id', validate(leaveParamsSchema), async (req, res, next) => {
  try {
    const leave = await prisma.leaveRequest.findUnique({
      where: { id: req.params.id },
      include: { employee: true },
    });
    if (!leave) throw new AppError('Leave request not found', 404, 'NOT_FOUND');
    res.json({ data: leave });
  } catch (e) {
    next(e);
  }
});

router.post('/', validate(leaveCreateSchema), async (req, res, next) => {
  try {
    const { employeeId, startDate, endDate } = req.body;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) throw new AppError('End date must be after start date', 400, 'VALIDATION_ERROR');
    const days = (end - start) / (1000 * 60 * 60 * 24) + 1;
    const leave = await prisma.leaveRequest.create({
      data: { ...req.body, startDate: start, endDate: end, days },
    });
    res.status(201).json({ data: leave });
  } catch (e) {
    next(e);
  }
});

router.patch('/:id', requireRole('ADMIN', 'HR_MANAGER', 'DEPARTMENT_HEAD'), validate(leaveUpdateSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.leaveRequest.findUnique({ where: { id } });
    if (!existing) throw new AppError('Leave request not found', 404, 'NOT_FOUND');
    const data = { ...req.body };
    if (data.status === 'APPROVED') {
      data.approvedBy = req.user.id;
      data.approvedAt = new Date();
    }
    if (data.startDate && data.endDate) {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      data.days = (end - start) / (1000 * 60 * 60 * 24) + 1;
      data.startDate = start;
      data.endDate = end;
    }
    const leave = await prisma.leaveRequest.update({ where: { id }, data });
    res.json({ data: leave });
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', requireRole('ADMIN', 'HR_MANAGER'), validate(leaveParamsSchema), async (req, res, next) => {
  try {
    const leave = await prisma.leaveRequest.findUnique({ where: { id: req.params.id } });
    if (!leave) throw new AppError('Leave request not found', 404, 'NOT_FOUND');
    await prisma.leaveRequest.delete({ where: { id: leave.id } });
    res.json({ message: 'Leave request deleted' });
  } catch (e) {
    next(e);
  }
});

// Holidays
router.get('/holidays', async (req, res, next) => {
  try {
    const holidays = await prisma.holiday.findMany({ orderBy: { date: 'asc' } });
    res.json({ data: holidays });
  } catch (e) {
    next(e);
  }
});

router.post('/holidays', requireRole('ADMIN', 'HR_MANAGER'), validate(holidayCreateSchema), async (req, res, next) => {
  try {
    const holiday = await prisma.holiday.create({ data: { ...req.body, date: new Date(req.body.date) } });
    res.status(201).json({ data: holiday });
  } catch (e) {
    next(e);
  }
});

router.delete('/holidays/:id', requireRole('ADMIN', 'HR_MANAGER'), validate(holidayParamsSchema), async (req, res, next) => {
  try {
    await prisma.holiday.delete({ where: { id: req.params.id } });
    res.json({ message: 'Holiday deleted' });
  } catch (e) {
    next(e);
  }
});

export default router;