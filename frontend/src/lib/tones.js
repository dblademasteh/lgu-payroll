const PAYROLL_RUN_TONES = { COMPLETED: 'success', PROCESSING: 'accent', APPROVED: 'warning', DRAFT: 'muted' };

const PAYSLIP_TONES = { GENERATED: 'success', DISTRIBUTED: 'accent', PENDING: 'warning', CANCELLED: 'error' };

const EMPLOYEE_TONES = { ACTIVE: 'success', INACTIVE: 'muted' };

const LEAVE_TONES = { APPROVED: 'success', PENDING: 'warning', REJECTED: 'error', CANCELLED: 'muted' };

const DEDUCTION_TONES = { GOVERNMENT: 'success', TAX: 'error', LOAN: 'warning', OTHER: 'muted' };

const REPORT_CATEGORY_TONES = { PAYROLL: 'accent', DEDUCTIONS: 'warning', GOVERNMENT: 'success', TAX: 'error', ANALYSIS: 'muted' };

function toneFrom(map, value) {
  return map[value] || 'muted';
}

export function getStatusTone(status, domain = 'payroll') {
  const maps = {
    payroll: PAYROLL_RUN_TONES,
    payslip: PAYSLIP_TONES,
    employee: EMPLOYEE_TONES,
    leave: LEAVE_TONES,
  };
  return toneFrom(maps[domain] || PAYROLL_RUN_TONES, status);
}

export function getDeductionTone(type) {
  return toneFrom(DEDUCTION_TONES, type);
}

export function getCategoryTone(category) {
  return toneFrom(REPORT_CATEGORY_TONES, category);
}