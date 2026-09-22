const ROLE_HIERARCHY = {
  ADMIN: 5,
  HR_MANAGER: 4,
  PAYROLL_MANAGER: 3,
  DEPARTMENT_HEAD: 2,
  AUDITOR: 1,
  VIEWER: 0,
};

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
    }
    const userLevel = ROLE_HIERARCHY[req.user.role] ?? 0;
    const requiredLevel = Math.max(...allowedRoles.map((r) => ROLE_HIERARCHY[r] ?? 0));
    if (userLevel < requiredLevel) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Insufficient role' } });
    }
    next();
  };
}

export function canManagePayroll(role) {
  return ['ADMIN', 'HR_MANAGER', 'PAYROLL_MANAGER'].includes(role);
}

export function canViewReports(role) {
  return ['ADMIN', 'HR_MANAGER', 'PAYROLL_MANAGER', 'DEPARTMENT_HEAD', 'AUDITOR'].includes(role);
}

export function isOversight(role) {
  return ['ADMIN', 'HR_MANAGER', 'PAYROLL_MANAGER', 'DEPARTMENT_HEAD', 'AUDITOR'].includes(role);
}