import express from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validate, validateQuery } from '../middleware/validate.js';
import { reportQuerySchema, reportGenerateSchema } from '../shared/contracts/reports.js';
import { AppError } from '../lib/errors.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireRole('ADMIN', 'HR_MANAGER', 'PAYROLL_MANAGER', 'DEPARTMENT_HEAD', 'AUDITOR'));

router.get('/', validateQuery(reportQuerySchema), async (req, res, next) => {
  try {
    const { period, type } = req.query;
    const targetPeriod = period || new Date().toISOString().slice(0, 7); // Default to current month

    const runs = await prisma.payrollRun.findMany({
      where: { period: targetPeriod },
      include: { records: { include: { employee: true, details: true } } },
    });

    if (runs.length === 0) {
      return res.json({ data: { message: 'No payroll data for this period', period: targetPeriod } });
    }

    const run = runs[0];
    const records = run.records;

    // Generate different report types
    const generateReport = (reportType) => {
      switch (reportType) {
        case 'payroll-summary':
          return {
            period: targetPeriod,
            runName: run.name,
            totalEmployees: records.length,
            totalGrossPay: records.reduce((sum, r) => sum + Number(r.grossPay), 0).toFixed(2),
            totalDeductions: records.reduce((sum, r) => sum + Number(r.totalDeductions), 0).toFixed(2),
            totalNetPay: records.reduce((sum, r) => sum + Number(r.netPay), 0).toFixed(2),
            employees: records.map((r) => ({
              employeeNumber: r.employee.employeeNumber,
              name: `${r.employee.firstName} ${r.employee.lastName}`,
              department: r.employee.department,
              basicSalary: r.basicSalary,
              grossPay: r.grossPay,
              totalDeductions: r.totalDeductions,
              withholdingTax: r.withholdingTax,
              netPay: r.netPay,
            })),
          };
        case 'deductions-summary':
          const deductionTotals = {};
          for (const r of records) {
            for (const d of r.details) {
              const key = `${d.name} (${d.type})`;
              if (!deductionTotals[key]) deductionTotals[key] = { type: d.type, total: 0, count: 0 };
              deductionTotals[key].total += Number(d.computedAmount);
              deductionTotals[key].count++;
            }
          }
          return { period: targetPeriod, deductions: deductionTotals };
        case 'government-contributions':
          const govTypes = ['GOVERNMENT'];
          const govDeductions = {};
          for (const r of records) {
            for (const d of r.details) {
              if (govTypes.includes(d.type)) {
                const key = d.name;
                if (!govDeductions[key]) govDeductions[key] = { total: 0, employees: [] };
                govDeductions[key].total += Number(d.computedAmount);
                govDeductions[key].employees.push({ employeeNumber: r.employee.employeeNumber, name: `${r.employee.firstName} ${r.employee.lastName}`, amount: d.computedAmount });
              }
            }
          }
          return { period: targetPeriod, contributions: govDeductions };
        case 'tax-withholding':
          return {
            period: targetPeriod,
            totalWithholdingTax: records.reduce((sum, r) => sum + Number(r.withholdingTax), 0).toFixed(2),
            employees: records.map((r) => ({
              employeeNumber: r.employee.employeeNumber,
              name: `${r.employee.firstName} ${r.employee.lastName}`,
              taxableIncome: r.taxableIncome,
              withholdingTax: r.withholdingTax,
            })),
          };
        case 'department-cost':
          const deptCosts = {};
          for (const r of records) {
            const dept = r.employee.department || 'Unassigned';
            if (!deptCosts[dept]) deptCosts[dept] = { employees: 0, grossPay: 0, deductions: 0, netPay: 0 };
            deptCosts[dept].employees++;
            deptCosts[dept].grossPay += Number(r.grossPay);
            deptCosts[dept].deductions += Number(r.totalDeductions);
            deptCosts[dept].netPay += Number(r.netPay);
          }
          return { period: targetPeriod, departments: deptCosts };
        default:
          return { message: `Report type ${reportType} not implemented` };
      }
    };

    if (type && type !== 'all') {
      return res.json({ data: generateReport(type) });
    }

    // Return all report summaries
    const summaries = [
      'payroll-summary',
      'deductions-summary',
      'government-contributions',
      'tax-withholding',
      'department-cost',
    ].map((t) => ({ type: t, ...generateReport(t) }));

    res.json({ data: { period: targetPeriod, reports: summaries } });
  } catch (e) {
    next(e);
  }
});

router.post('/generate', validate(reportGenerateSchema), async (req, res, next) => {
  try {
    // Report generation is handled by the GET endpoint with type parameter
    // This endpoint could trigger PDF/Excel generation in the future
    res.json({ message: 'Report generation initiated', data: req.body });
  } catch (e) {
    next(e);
  }
});

export default router;