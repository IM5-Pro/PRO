export const ROLES = Object.freeze({
  EMPLOYEE: 'employee',
  MANAGER: 'manager',
  HR_ADMIN: 'hr_admin',
  DEPT_ADMIN: 'dept_admin',
  SUPER_ADMIN: 'super_admin',
});

const ROLE_ALIASES = {
  employee: ROLES.EMPLOYEE,
  manager: ROLES.MANAGER,
  hr_admin: ROLES.HR_ADMIN,
  super_admin: ROLES.SUPER_ADMIN,
  hr: ROLES.HR_ADMIN,
  admin: ROLES.HR_ADMIN,
};

export const normalizeRole = (role) => {
  if (!role || typeof role !== 'string') {
    return '';
  }

  const normalized = role.trim().toLowerCase();
  return ROLE_ALIASES[normalized] || normalized;
};

export const isHrRole = (role) => {
  const normalizedRole = normalizeRole(role);
  return normalizedRole === ROLES.HR_ADMIN || normalizedRole === ROLES.SUPER_ADMIN;
};

export const canAccessPayrollRuns = (role) => isHrRole(role);
