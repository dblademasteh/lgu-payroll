import express from 'express';
import authRoutes from './auth.js';
import employeeRoutes from './employees.js';
import payrollRoutes from './payroll.js';
import deductionRoutes from './deductions.js';
import departmentRoutes from './departments.js';
import payslipRoutes from './payslips.js';
import reportRoutes from './reports.js';
import leaveRoutes from './leave.js';
import settingsRoutes from './settings.js';
import apiKeyRoutes from './apiKeys.js';
import syncRoutes from './sync.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/employees', employeeRoutes);
router.use('/payroll', payrollRoutes);
router.use('/deductions', deductionRoutes);
router.use('/departments', departmentRoutes);
router.use('/payslips', payslipRoutes);
router.use('/reports', reportRoutes);
router.use('/leave', leaveRoutes);
router.use('/settings', settingsRoutes);
router.use('/api-keys', apiKeyRoutes);
router.use('/sync', syncRoutes);

export default router;