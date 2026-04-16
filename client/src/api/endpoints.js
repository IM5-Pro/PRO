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
  manual: '/attendance/manual',
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
  updateProfile: '/employees/profile/update',
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

// ============================================================================
// MANPOWER PLANNING ENDPOINTS
// ============================================================================

export const MANPOWER_PLANNING_ENDPOINTS = {
  /**
   * Get workforce planning metrics summary
   * Returns: totalStrength, openPositions, pendingApprovals, departmentEfficiency
   * Path: GET /api/manpower-planning/metrics
   */
  metrics: '/manpower-planning/metrics',

  /**
   * Get open job positions with pagination and optional department filter
   * Query params: limit, skip, department
   * Path: GET /api/manpower-planning/open-positions
   */
  openPositions: (options = {}) => {
    const params = [];
    if (options.limit) params.push(`limit=${encodeURIComponent(options.limit)}`);
    if (options.skip) params.push(`skip=${encodeURIComponent(options.skip)}`);
    if (options.department) params.push(`department=${encodeURIComponent(options.department)}`);
    return params.length > 0 ? `/manpower-planning/open-positions?${params.join('&')}` : '/manpower-planning/open-positions';
  },

  /**
   * Get pending leave/approval requests with pagination
   * Query params: limit, skip
   * Path: GET /api/manpower-planning/pending-approvals
   */
  pendingApprovals: (options = {}) => {
    const params = [];
    if (options.limit) params.push(`limit=${encodeURIComponent(options.limit)}`);
    if (options.skip) params.push(`skip=${encodeURIComponent(options.skip)}`);
    return params.length > 0 ? `/manpower-planning/pending-approvals?${params.join('&')}` : '/manpower-planning/pending-approvals';
  },

  /**
   * Get department-wise workforce summary
   * Returns: departments array with strength, budget, efficiency
   * Path: GET /api/manpower-planning/departments-summary
   */
  departmentsSummary: '/manpower-planning/departments-summary',

  /**
   * Get workforce trend data for visualization
   * Query params: period (week, month, quarter, year)
   * Path: GET /api/manpower-planning/trends
   */
  trends: (period = 'month') => `/manpower-planning/trends?period=${encodeURIComponent(period)}`,
};

// Additional endpoints for activity feed data
export const ACTIVITIES_ENDPOINTS = {
  announcements: (limit) => withLimit('/announcements', limit),
  payrollRuns: (limit) => withLimit('/payroll/runs', limit),
  pendingDepartments: '/departments?status=pending',
  appraisals: (limit) => withLimit('/performance-reviews/upcoming', limit),
};

export const EDUCATION_ENDPOINTS = {
  list: (employeeId) => `/education/${employeeId}`,
  add: (employeeId) => `/education/${employeeId}`,
  update: (id) => `/education/${id}`,
  delete: (id) => `/education/${id}`,
};

export const EXPERIENCE_ENDPOINTS = {
  list: (employeeId) => `/experience/${employeeId}`,
  add: (employeeId) => `/experience/${employeeId}`,
  update: (id) => `/experience/${id}`,
  delete: (id) => `/experience/${id}`,
};

export const PAYROLL_DETAIL_ENDPOINTS = {
  get: (employeeId) => `/payroll/${employeeId}`,
  update: (employeeId) => `/payroll/${employeeId}`,
};

export const PERFORMANCE_ENDPOINTS = {
  get: (employeeId) => `/performance/${employeeId}`,
  update: (employeeId) => `/performance/${employeeId}`,
};

export const DOCUMENT_ENDPOINTS = {
  list: (employeeId) => `/documents/${employeeId}`,
  upload: (employeeId) => `/documents/${employeeId}`,
};

export const ASSET_ENDPOINTS = {
  list: (employeeId) => `/assets/${employeeId}`,
  add: (employeeId) => `/assets/${employeeId}`,
  update: (id) => `/assets/${id}`,
  delete: (id) => `/assets/${id}`,
};

export const SYSTEM_ACCESS_ENDPOINTS = {
  get: (employeeId) => `/system-access/${employeeId}`,
  update: (employeeId) => `/system-access/${employeeId}`,
};

export const RESIGNATION_ENDPOINTS = {
  create: '/resignations',
  myResignation: '/resignations/my',
  teamResignations: '/resignations/team',
  all: (options = {}) => {
    const params = [];
    if (options.status) params.push(`status=${encodeURIComponent(options.status)}`);
    if (options.limit) params.push(`limit=${encodeURIComponent(options.limit)}`);
    if (options.skip) params.push(`skip=${encodeURIComponent(options.skip)}`);
    if (options.sortBy) params.push(`sortBy=${encodeURIComponent(options.sortBy)}`);
    return params.length > 0 ? `/resignations/all?${params.join('&')}` : '/resignations/all';
  },
  get: (resignationId) => `/resignations/${resignationId}`,
  update: (resignationId) => `/resignations/${resignationId}`,
  approve: (resignationId) => `/resignations/${resignationId}/approve`,
  reject: (resignationId) => `/resignations/${resignationId}/reject`,
  cancel: (resignationId) => `/resignations/${resignationId}/cancel`,
  stats: '/resignations/stats',
};

export const NOTIFICATION_ENDPOINTS = {
  list: (limit) => withLimit('/notifications', limit),
  all: '/notifications/all',
  unread: '/notifications/unread-count',
  mark: (notificationId) => `/notifications/${notificationId}/read`,
  markAll: '/notifications/mark-all-read',
  delete: (notificationId) => `/notifications/${notificationId}`,
  deleteAll: '/notifications/delete-all',
  summary: '/notifications/summary',
  pendingApprovals: '/notifications/pending-approvals',
  leavePending: '/notifications/leaves/pending',
  attendanceIssues: '/notifications/attendance/issues',
  payrollUpdates: '/notifications/payroll/updates',
  announcements: '/notifications/announcements',
  systemAlerts: '/notifications/system/alerts',
};