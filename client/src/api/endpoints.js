const withLimit = (path, limit) => {
  if (limit === undefined || limit === null) {
    return path;
  }

  return `${path}?limit=${encodeURIComponent(limit)}`;
};

export const AUTH_ENDPOINTS = {
  login: '/auth/login',
  logout: '/auth/logout',
  registerSuperAdmin: '/auth/register-superadmin',
  forgotUsername: '/auth/forgot-username',
  forgotPassword: '/auth/forgot-password',
  resetPassword: '/auth/reset-password',
  completeInitialPassword: '/auth/complete-initial-password',
  sessions: '/auth/sessions',
  terminateSession: '/auth/sessions/terminate',
  mfaEnable: '/auth/mfa/enable',
  mfaDisable: '/auth/mfa/disable',
};

export const ATTENDANCE_ENDPOINTS = {
  own: (limit) => withLimit('/attendance/own', limit),
  team: (limit) => withLimit('/attendance/team', limit),
  all: (limit) => withLimit('/attendance/all', limit),
  monthlySummary: '/attendance/monthly-summary',
  checkIn: '/attendance/check-in',
  checkOut: '/attendance/check-out',
};

export const LEAVE_ENDPOINTS = {
  create: '/leaves',
  update: (leaveId) => `/leaves/${leaveId}`,
  own: '/leaves/own',
  team: '/leaves/team',
  all: '/leaves/all',
  policy: '/leaves/policy',
  balance: (employeeId) =>
    employeeId ? `/leaves/balance?employeeId=${encodeURIComponent(employeeId)}` : '/leaves/balance',
  cancel: (leaveId) => `/leaves/cancel/${leaveId}`,
  approve: (leaveId) => `/leaves/${leaveId}/approve`,
  reject: (leaveId) => `/leaves/${leaveId}/reject`,
  policyUpdate: (policyId) => `/leaves/policy/${policyId}`,
  policyDelete: (policyId) => `/leaves/policy/${policyId}`,
};

export const ANNOUNCEMENT_ENDPOINTS = {
  list: '/announcements',
  create: '/announcements',
  update: (announcementId) => `/announcements/${announcementId}`,
  delete: (announcementId) => `/announcements/${announcementId}`,
  dismiss: (announcementId) => `/announcements/${announcementId}/dismiss`,
};

export const PAYROLL_ENDPOINTS = {
  create: '/payroll',
  own: '/payroll/own',
  all: '/payroll/all',
  processAll: '/payroll/process',
  process: (runId) => `/payroll/${runId}/process`,
  generateSlipsAll: '/payroll/generate-slips',
  generateSlips: (runId) => `/payroll/${runId}/generate-slips`,
  lockAll: '/payroll/lock',
  lock: (runId) => `/payroll/${runId}/lock`,
  unlockAll: '/payroll/unlock',
  unlock: (runId) => `/payroll/${runId}/unlock`,
  download: (detailId) => `/payroll/download/${detailId}`,
};

export const EMPLOYEE_ENDPOINTS = {
  create: '/employees',
  list: (limit) => withLimit('/employees', limit),
  update: (employeeId) => `/employees/${employeeId}`,
  managers: ({ limit, department, search } = {}) => {
    const params = [];

    if (limit !== undefined && limit !== null) {
      params.push(`limit=${encodeURIComponent(limit)}`);
    }

    if (department) {
      params.push(`department=${encodeURIComponent(department)}`);
    }

    if (search) {
      params.push(`search=${encodeURIComponent(search)}`);
    }

    if (params.length === 0) {
      return '/employees/managers';
    }

    return `/employees/managers?${params.join('&')}`;
  },
  myTeam: (limit) => withLimit('/employees/my-team', limit),
  myProfile: '/employees/me/profile',
  profile: (employeeId) => `/employees/${employeeId}/profile`,
  activate: (employeeId) => `/employees/${employeeId}/activate`,
  deactivate: (employeeId) => `/employees/${employeeId}/deactivate`,
};

export const ROLE_ENDPOINTS = {
  list: '/roles',
  create: '/roles',
  update: (roleId) => `/roles/${roleId}`,
  delete: (roleId) => `/roles/${roleId}`,
  assignPermission: (roleId) => `/roles/${roleId}/assign-permission`,
  removePermission: (roleId) => `/roles/${roleId}/remove-permission`,
  permissions: (roleId) => `/roles/${roleId}/permissions`,
};

export const PERMISSION_ENDPOINTS = {
  list: '/permissions',
  create: '/permissions',
  update: (permissionId) => `/permissions/${permissionId}`,
  delete: (permissionId) => `/permissions/${permissionId}`,
  assignRole: (permissionId) => `/permissions/${permissionId}/assign-role`,
  removeRole: (permissionId) => `/permissions/${permissionId}/remove-role`,
};

export const DEPARTMENT_ENDPOINTS = {
  list: '/departments',
  create: '/departments',
  read: (departmentId) => `/departments/${departmentId}`,
  update: (departmentId) => `/departments/${departmentId}`,
  delete: (departmentId) => `/departments/${departmentId}`,
  assignManager: (departmentId) => `/departments/${departmentId}/assign-manager`,
};

export const DESIGNATION_ENDPOINTS = {
  list: '/designations',
  create: '/designations',
  hierarchy: '/designations/hierarchy',
  orgChart: '/designations/org-chart',
  read: (designationId) => `/designations/${designationId}`,
  update: (designationId) => `/designations/${designationId}`,
  delete: (designationId) => `/designations/${designationId}`,
  assign: (designationId) => `/designations/${designationId}/assign`,
};

export const USER_ENDPOINTS = {
  create: '/users/create-user',
  resetPassword: (employeeId) => `/users/${employeeId}/reset-password`,
};

export const DASHBOARD_ENDPOINTS = {
  summary: '/dashboard/summary',
  metrics: '/dashboard/metrics',
  hrMetrics: '/dashboard/hr-metrics',
  stats: '/dashboard/stats',
  activityFeed: '/dashboard/activity-feed',
};

export const ADMIN_ENDPOINTS = {
  auditLogs: '/admin/audit-logs',
};

// Additional endpoints for activity feed data
export const ACTIVITIES_ENDPOINTS = {
  announcements: (limit) => withLimit('/announcements', limit),
  payrollRuns: (limit) => withLimit('/payroll/runs', limit),
  pendingDepartments: '/departments?status=pending',
  appraisals: (limit) => withLimit('/performance-reviews/upcoming', limit),
};