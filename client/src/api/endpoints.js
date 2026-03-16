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
  own: '/leaves/own',
  team: '/leaves/team',
  all: '/leaves/all',
  policy: '/leaves/policy',
  balance: (employeeId) =>
    employeeId ? `/leaves/balance?employeeId=${encodeURIComponent(employeeId)}` : '/leaves/balance',
  cancel: (leaveId) => `/leaves/cancel/${leaveId}`,
  approve: (leaveId) => `/leaves/${leaveId}/approve`,
  reject: (leaveId) => `/leaves/${leaveId}/reject`,
};

export const ANNOUNCEMENT_ENDPOINTS = {
  list: '/announcements',
  create: '/announcements',
  update: (announcementId) => `/announcements/${announcementId}`,
  delete: (announcementId) => `/announcements/${announcementId}`,
  dismiss: (announcementId) => `/announcements/${announcementId}/dismiss`,
};

export const PAYROLL_ENDPOINTS = {
  own: '/payroll/own',
  all: '/payroll/all',
  process: (runId) => `/payroll/${runId}/process`,
  download: (detailId) => `/payroll/download/${detailId}`,
};

export const EMPLOYEE_ENDPOINTS = {
  create: '/employees',
  list: (limit) => withLimit('/employees', limit),
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
};

export const ROLE_ENDPOINTS = {
  list: '/roles',
  assignPermission: (roleId) => `/roles/${roleId}/assign-permission`,
};

export const PERMISSION_ENDPOINTS = {
  list: '/permissions',
  assignRole: (permissionId) => `/permissions/${permissionId}/assign-role`,
};

export const DEPARTMENT_ENDPOINTS = {
  list: '/departments',
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

// Additional endpoints for activity feed data
export const ACTIVITIES_ENDPOINTS = {
  announcements: (limit) => withLimit('/announcements', limit),
  payrollRuns: (limit) => withLimit('/payroll/runs', limit),
  pendingDepartments: '/departments?status=pending',
  appraisals: (limit) => withLimit('/performance-reviews/upcoming', limit),
};