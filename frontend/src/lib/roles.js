// Mirrors backend/src/shared/constants.js. Centralising role groups here keeps the
// client's view of the world in sync with the server's RBAC.
//
// ADMIN > HR_MANAGER > PAYROLL_MANAGER > DEPARTMENT_HEAD > AUDITOR > VIEWER
export const ROLES = {
  ADMIN: 'ADMIN',
  HR_MANAGER: 'HR_MANAGER',
  PAYROLL_MANAGER: 'PAYROLL_MANAGER',
  DEPARTMENT_HEAD: 'DEPARTMENT_HEAD',
  AUDITOR: 'AUDITOR',
  VIEWER: 'VIEWER',
};

// Oversight roles: can read payroll data, generate reports, manage employees
export const OVERSIGHT_ROLES = [
  ROLES.ADMIN,
  ROLES.HR_MANAGER,
  ROLES.PAYROLL_MANAGER,
  ROLES.DEPARTMENT_HEAD,
  ROLES.AUDITOR,
];

// Payroll management roles: can process payroll, manage deductions, taxes
export const PAYROLL_ROLES = [
  ROLES.ADMIN,
  ROLES.HR_MANAGER,
  ROLES.PAYROLL_MANAGER,
];

// Report generation roles — same set as oversight (whoever can oversee can
// also read/produce reports). Aliased, not duplicated, to keep one source of truth.
export const REPORT_ROLES = OVERSIGHT_ROLES;

export const isOversight = (role) => OVERSIGHT_ROLES.includes(role);
export const canManagePayroll = (role) => PAYROLL_ROLES.includes(role);
export const canViewReports = (role) => REPORT_ROLES.includes(role);