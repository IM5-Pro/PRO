import { normalizeRole, ROLES } from '../utils/roles';
import {
  STANDARD_PAGE_COMPONENTS,
  HR_PAGE_COMPONENTS,
  MANAGER_PAGE_COMPONENTS,
  SUPER_ADMIN_PAGE_COMPONENTS,
  DEPT_ADMIN_PAGE_COMPONENTS,
  OPERATIONS_PAGE_COMPONENTS,
} from '../components/UnifiedDashboard/pageRegistry';

const ROLE_PAGE_MAP = {
  [ROLES.EMPLOYEE]: STANDARD_PAGE_COMPONENTS,
  [ROLES.MANAGER]: { ...STANDARD_PAGE_COMPONENTS, ...MANAGER_PAGE_COMPONENTS },
  [ROLES.HR_ADMIN]: HR_PAGE_COMPONENTS,
  [ROLES.DEPT_ADMIN]: DEPT_ADMIN_PAGE_COMPONENTS,
  [ROLES.SUPER_ADMIN]: SUPER_ADMIN_PAGE_COMPONENTS,
};

export const resolvePortalPageComponent = (role, pageId) => {
  const normalized = normalizeRole(role);
  const map = ROLE_PAGE_MAP[normalized] || STANDARD_PAGE_COMPONENTS;
  return map[pageId] || null;
};

export const isOperationsPage = (pageId) => Boolean(OPERATIONS_PAGE_COMPONENTS[pageId]);

export const STANDALONE_STANDARD_PAGE_IDS = new Set(['employees', 'leaves', 'payroll', 'attendance']);

export const isStandaloneStandardPage = (pageId) => STANDALONE_STANDARD_PAGE_IDS.has(pageId);
