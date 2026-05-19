/**
 * Portal navigation + API probes for permission verification (see server/scripts/verifyPortalNavPermissions.js).
 * `shipped: false` pages are hidden from sidebar until backend UI is ready.
 */

export const UNSHIPPED_HR_PAGE_IDS = new Set([
  'meeting-room',
  'workflows',
  'letter-templates',
  'exit-clearance',
]);

/** @type {Record<string, Array<{ id: string, apiProbes?: Array<{ resource: string, action: string }> }>>} */
export const PORTAL_NAV_API_PROBES = {
  EMPLOYEE: [
    { id: 'dashboard' },
    { id: 'attendance', apiProbes: [{ resource: 'attendance', action: 'view_own' }] },
    { id: 'leaves', apiProbes: [{ resource: 'leaves', action: 'read' }] },
    { id: 'payroll', apiProbes: [{ resource: 'payroll', action: 'view_own' }] },
    { id: 'performance', apiProbes: [{ resource: 'performance', action: 'view_review' }, { resource: 'performance', action: 'goal_view' }] },
    { id: 'announcements' },
    { id: 'resignation', apiProbes: [{ resource: 'resignations', action: 'create' }] },
  ],
  MANAGER: [
    { id: 'dashboard' },
    { id: 'team' },
    { id: 'attendance', apiProbes: [{ resource: 'attendance', action: 'view_team' }] },
    { id: 'leaves', apiProbes: [{ resource: 'leaves', action: 'list' }] },
    { id: 'performance', apiProbes: [{ resource: 'performance', action: 'view_review' }] },
    { id: 'performance-management', apiProbes: [{ resource: 'performance', action: 'goal_view' }] },
    { id: 'attendance-approvals', apiProbes: [{ resource: 'attendance', action: 'approve' }] },
  ],
  HR_ADMIN: [
    { id: 'dashboard' },
    { id: 'user-management', apiProbes: [{ resource: 'employees', action: 'list' }] },
    { id: 'leaves-attendance', apiProbes: [{ resource: 'attendance', action: 'view_all' }, { resource: 'leaves', action: 'list' }] },
    { id: 'hr-payroll', apiProbes: [{ resource: 'payroll', action: 'view_all' }] },
    { id: 'recruitment', apiProbes: [{ resource: 'recruitment', action: 'view_jobs' }] },
    { id: 'performance-management', apiProbes: [{ resource: 'performance', action: 'view_review' }] },
    { id: 'org-structure', apiProbes: [{ resource: 'designation', action: 'list' }] },
  ],
  DEPT_ADMIN: [
    { id: 'dashboard' },
    { id: 'attendance-approvals', apiProbes: [{ resource: 'attendance', action: 'approve' }] },
    { id: 'performance-management', apiProbes: [{ resource: 'performance', action: 'view_review' }] },
  ],
  SUPER_ADMIN: [
    { id: 'dashboard' },
    { id: 'employees', apiProbes: [{ resource: 'employees', action: 'list' }] },
    { id: 'departments', apiProbes: [{ resource: 'department', action: 'list' }] },
    { id: 'roles-permissions', apiProbes: [{ resource: 'roles', action: 'list' }] },
  ],
};

export const filterShippedPages = (pages = []) =>
  pages.filter((page) => !UNSHIPPED_HR_PAGE_IDS.has(page.id));
