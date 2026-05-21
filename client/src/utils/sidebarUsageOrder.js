import { ROLES } from './roles';

/** Always first in the sidebar (any role). */
export const PINNED_TOP_PAGE_ORDER = {
  dashboard: 0,
  announcements: 1,
};

/**
 * Section order by role — overview & communications stay on top.
 * Lower number = higher in sidebar.
 */
export const ROLE_SECTION_USAGE_ORDER = {
  [ROLES.EMPLOYEE]: {
    overview: 0,
    communications: 10,
    workplace: 20,
    separation: 80,
    account: 999,
  },
  [ROLES.MANAGER]: {
    overview: 0,
    communications: 10,
    approvals: 20,
    workplace: 30,
    team: 40,
    talent: 50,
    account: 999,
  },
  [ROLES.DEPT_ADMIN]: {
    overview: 0,
    communications: 10,
    approvals: 20,
    workplace: 30,
    organization: 40,
    talent: 50,
    account: 999,
  },
  [ROLES.HR_ADMIN]: {
    overview: 0,
    communications: 10,
    workforce: 20,
    'time-attendance': 30,
    compensation: 40,
    talent: 50,
    organization: 60,
    separation: 70,
    services: 80,
    administration: 90,
    account: 999,
  },
  [ROLES.SUPER_ADMIN]: {
    overview: 0,
    communications: 10,
    governance: 20,
    separation: 40,
    system: 50,
    account: 999,
  },
};

/**
 * Page order within a section (high-frequency workflows first).
 * Pinned pages (dashboard, announcements) override via PINNED_TOP_PAGE_ORDER.
 */
export const ROLE_PAGE_USAGE_ORDER = {
  [ROLES.EMPLOYEE]: {
    attendance: 100,
    leaves: 110,
    payroll: 120,
    'insurance-details': 130,
    'employee-profile': 140,
    performance: 150,
    resignation: 200,
    settings: 900,
  },
  [ROLES.MANAGER]: {
    'attendance-approvals': 100,
    leaves: 110,
    'resignation': 120,
    'tool-provisioning': 130,
    team: 140,
    attendance: 150,
    payroll: 160,
    'employee-profile': 170,
    'performance-management': 180,
    analytics: 190,
    reports: 200,
    performance: 210,
    'team-collaboration': 220,
    settings: 900,
  },
  [ROLES.DEPT_ADMIN]: {
    'attendance-approvals': 100,
    'tool-provisioning': 110,
    attendance: 120,
    leaves: 130,
    'insurance-details': 140,
    'org-structure': 150,
    'performance-management': 160,
    settings: 900,
  },
  [ROLES.HR_ADMIN]: {
    'insurance-approvals': 100,
    'insurance-cycles': 105,
    'profile-approvals': 110,
    'user-management': 120,
    'leaves-attendance': 130,
    'attendance-approvals': 140,
    'hr-payroll': 150,
    recruitment: 160,
    'manpower-planning': 170,
    'employee-bulk-ops': 180,
    'shift-management': 190,
    'performance-management': 200,
    'org-structure': 210,
    masters: 220,
    'projects-admin': 230,
    resignation: 240,
    'exit-clearance': 250,
    'tool-provisioning': 260,
    'admin-panel-config': 270,
    settings: 900,
  },
  [ROLES.SUPER_ADMIN]: {
    employees: 100,
    departments: 110,
    'org-structure': 120,
    'roles-permissions': 130,
    'role-transfer': 140,
    'employee-bulk-ops': 150,
    'projects-admin': 160,
    resignation: 170,
    'system-settings': 180,
    'audit-logs': 190,
    'ui-components': 200,
    settings: 900,
  },
};

const resolvePageOrder = (page, role) => {
  if (PINNED_TOP_PAGE_ORDER[page.id] !== undefined) {
    return PINNED_TOP_PAGE_ORDER[page.id];
  }
  const rolePages = ROLE_PAGE_USAGE_ORDER[role] || {};
  if (rolePages[page.id] !== undefined) {
    return rolePages[page.id];
  }
  return typeof page.order === 'number' ? page.order + 500 : 500;
};

/**
 * Apply role-based usage ordering while keeping dashboard & announcements pinned on top.
 */
export const prioritizePagesForRole = (pages = [], role) => {
  if (!role) return pages;
  return pages.map((page) => ({
    ...page,
    order: resolvePageOrder(page, role),
  }));
};

export const getSectionOrderForRole = (category, role) => {
  if (!role) {
    return null;
  }
  const roleSections = ROLE_SECTION_USAGE_ORDER[role];
  if (roleSections?.[category] !== undefined) {
    return roleSections[category];
  }
  return null;
};
