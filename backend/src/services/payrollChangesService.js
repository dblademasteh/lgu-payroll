import { prisma } from '../lib/prisma.js';

// Period "2025-07" -> { startDate, endDate, fiscalYear }. Dates are emitted as
// full ISO-8601 datetimes (Prisma @db.Date columns reject bare "YYYY-MM-DD").
function periodDates(period) {
  const [year, month] = period.split('-').map(Number);
  return {
    startDate: new Date(Date.UTC(year, month - 1, 1)).toISOString(),
    endDate: new Date(Date.UTC(year, month, 0)).toISOString(),
    fiscalYear: year,
  };
}

// Returns payroll changes since `since` as a replayable, idempotent event list.
// Contract consumed by LGU-HRMS payrollAdapter.sync():
//   POST {payrollBase}/api/v1/payroll/changes  { since } -> { records: [{entity, action, payload}] }
// Entities are emitted in dependency order (period -> run -> record) so a consumer
// can upsert them sequentially. Run events carry the SOURCE PayrollStatus; CANCELLED
// runs are omitted entirely.
export async function getPayrollChanges(since) {
  const sinceDate = since ? new Date(since) : null;
  const runIds = new Set();

  if (sinceDate) {
    const [runs, records, payslips] = await Promise.all([
      prisma.payrollRun.findMany({ where: { updatedAt: { gt: sinceDate } }, select: { id: true } }),
      prisma.payrollRecord.findMany({ where: { updatedAt: { gt: sinceDate } }, select: { payrollRunId: true } }),
      prisma.payslip.findMany({ where: { updatedAt: { gt: sinceDate } }, select: { payrollRunId: true } }),
    ]);
    runs.forEach((r) => runIds.add(r.id));
    records.forEach((r) => runIds.add(r.payrollRunId));
    payslips.forEach((r) => runIds.add(r.payrollRunId));
  }

  const runs = await prisma.payrollRun.findMany({
    where: sinceDate ? (runIds.size ? { id: { in: [...runIds] } } : { id: { in: [] } }) : {},
    orderBy: { updatedAt: 'asc' },
    include: {
      records: {
        include: {
          employee: { select: { employeeNumber: true, firstName: true, lastName: true } },
          details: { include: { deduction: { select: { code: true, name: true } } } },
        },
      },
      payslips: {
        select: { status: true, generatedAt: true, distributedAt: true, pdfPath: true, payrollRecordId: true },
      },
    },
  });

  const recordsOut = [];
  for (const run of runs) {
    if (run.status === 'CANCELLED') continue;

    const dates = periodDates(run.period);
    recordsOut.push({
      entity: 'period',
      action: 'upsert',
      occurredAt: run.updatedAt.toISOString(),
      payload: { name: run.period, period: run.period, ...dates },
    });
    recordsOut.push({
      entity: 'run',
      action: 'upsert',
      occurredAt: run.updatedAt.toISOString(),
      payload: {
        externalId: run.id,
        period: run.period,
        name: run.name,
        status: run.status,
        runDate: dates.endDate,
        processedAt: run.processedAt ? run.processedAt.toISOString() : null,
        approvedAt: run.approvedAt ? run.approvedAt.toISOString() : null,
        totalEmployees: run.totalEmployees,
        totalGrossPay: run.totalGrossPay.toString(),
        totalDeductions: run.totalDeductions.toString(),
        totalNetPay: run.totalNetPay.toString(),
      },
    });

    for (const rec of run.records) {
      const payslip = run.payslips.find(
        (p) => p.payrollRecordId === rec.id && (p.status === 'GENERATED' || p.status === 'DISTRIBUTED')
      );
      recordsOut.push({
        entity: 'record',
        action: 'upsert',
        occurredAt: rec.updatedAt.toISOString(),
        payload: {
          externalId: rec.id,
          runExternalId: run.id,
          employeeNumber: rec.employee ? rec.employee.employeeNumber : null,
          employeeName: rec.employee ? `${rec.employee.firstName} ${rec.employee.lastName}` : null,
          basicSalary: rec.basicSalary.toString(),
          overtimePay: rec.overtimePay.toString(),
          allowances: rec.allowances.toString(),
          grossPay: rec.grossPay.toString(),
          totalDeductions: rec.totalDeductions.toString(),
          taxableIncome: rec.taxableIncome.toString(),
          withholdingTax: rec.withholdingTax.toString(),
          netPay: rec.netPay.toString(),
          details: rec.details.map((d) => ({
            code: d.deduction ? d.deduction.code : d.name,
            name: d.name,
            type: d.type,
            amountType: d.amountType,
            basis: d.basis,
            rateOrAmount: d.rateOrAmount.toString(),
            computedAmount: d.computedAmount.toString(),
            isMandatory: d.isMandatory,
          })),
          payslip: payslip
            ? {
                status: payslip.status,
                generatedAt: payslip.generatedAt ? payslip.generatedAt.toISOString() : null,
                distributedAt: payslip.distributedAt ? payslip.distributedAt.toISOString() : null,
                pdfUrl: payslip.pdfPath ?? null,
              }
            : null,
        },
      });
    }
  }

  return { records: recordsOut, count: recordsOut.length };
}