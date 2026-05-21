import API from '../api/client';
import { EMPLOYEE_ENDPOINTS } from '../api/endpoints';
import { ROLES, normalizeRole } from '../utils/roles';
import { getPageIdForNotificationType } from '../utils/notificationNavigation';

const SEARCH_MIN_LENGTH = 2;
const MAX_RESULTS_PER_GROUP = 5;

const toPayload = (response) => response?.data || {};

const extractRows = (payload, keys = ['data', 'employees']) => {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (!payload || typeof payload !== 'object') {
    return [];
  }
  for (const key of keys) {
    if (Array.isArray(payload[key])) {
      return payload[key];
    }
  }
  const nested = payload.data;
  if (Array.isArray(nested)) {
    return nested;
  }
  if (nested && typeof nested === 'object') {
    for (const key of keys) {
      if (Array.isArray(nested[key])) {
        return nested[key];
      }
    }
  }
  return [];
};

const normalizeQuery = (value) => String(value || '').trim().toLowerCase();

const matchesQuery = (haystack, query) => normalizeQuery(haystack).includes(query);

export const searchPortalPages = (query, pages = []) => {
  const q = normalizeQuery(query);
  if (q.length < SEARCH_MIN_LENGTH) {
    return [];
  }

  return pages
    .filter(
      (page) =>
        matchesQuery(page.label, q) ||
        matchesQuery(page.id, q) ||
        matchesQuery(page.description, q) ||
        matchesQuery(page.category, q),
    )
    .slice(0, MAX_RESULTS_PER_GROUP)
    .map((page) => ({
      id: `page-${page.id}`,
      kind: 'page',
      title: page.label,
      subtitle: page.description || 'Open module',
      pageId: page.id,
      icon: '📄',
    }));
};

export const searchStoredNotifications = (query, notifications = []) => {
  const q = normalizeQuery(query);
  if (q.length < SEARCH_MIN_LENGTH) {
    return [];
  }

  return notifications
    .filter(
      (item) =>
        matchesQuery(item.title, q) ||
        matchesQuery(item.message, q) ||
        matchesQuery(item.type, q),
    )
    .slice(0, MAX_RESULTS_PER_GROUP)
    .map((item) => ({
      id: `notification-${item.id}`,
      kind: 'notification',
      title: item.title || 'Notification',
      subtitle: item.message || item.type || '',
      pageId: getPageIdForNotificationType(item.type),
      icon: item.icon || '🔔',
    }));
};

const employeeDisplayName = (employee) => {
  const parts = [employee?.firstName, employee?.lastName].filter(Boolean);
  const name = parts.join(' ').trim();
  return name || employee?.name || employee?.email || 'Employee';
};

const mapEmployeeResult = (employee, pageId) => {
  const id = String(employee?._id || employee?.id || '').trim();
  return {
    id: `employee-${id}`,
    kind: 'employee',
    title: employeeDisplayName(employee),
    subtitle: [employee?.department || 'Unassigned', employee?.email || ''].filter(Boolean).join(' · '),
    pageId,
    employeeId: id,
    icon: '👤',
  };
};

export const searchEmployees = async (query, userRole) => {
  const q = normalizeQuery(query);
  if (q.length < SEARCH_MIN_LENGTH) {
    return [];
  }

  const role = normalizeRole(userRole) || ROLES.EMPLOYEE;
  let rows = [];
  let targetPageId = 'employees';

  try {
    if (role === ROLES.MANAGER) {
      const response = await API.get(EMPLOYEE_ENDPOINTS.myTeam(120));
      rows = extractRows(toPayload(response), ['data']);
      targetPageId = 'team';
    } else if (
      role === ROLES.HR_ADMIN ||
      role === ROLES.SUPER_ADMIN ||
      role === ROLES.DEPT_ADMIN
    ) {
      const response = await API.get(EMPLOYEE_ENDPOINTS.list(120));
      rows = extractRows(toPayload(response), ['data']);
      targetPageId = 'user-management';
    } else {
      return [];
    }
  } catch {
    return [];
  }

  return rows
    .filter((employee) => {
      const name = employeeDisplayName(employee);
      return (
        matchesQuery(name, q) ||
        matchesQuery(employee?.email, q) ||
        matchesQuery(employee?.employeeCode, q) ||
        matchesQuery(employee?.department, q) ||
        matchesQuery(employee?.designation, q)
      );
    })
    .slice(0, MAX_RESULTS_PER_GROUP)
    .map((employee) => mapEmployeeResult(employee, targetPageId));
};

export const runHeaderSearchLocal = ({ query, portalPages = [], notifications = [] }) => {
  const trimmed = String(query || '').trim();
  if (trimmed.length < SEARCH_MIN_LENGTH) {
    return { pages: [], notifications: [], employees: [], all: [] };
  }

  const pages = searchPortalPages(trimmed, portalPages);
  const notificationResults = searchStoredNotifications(trimmed, notifications);
  const all = [...pages, ...notificationResults];

  return {
    pages,
    notifications: notificationResults,
    employees: [],
    all,
  };
};

export const runHeaderSearch = async ({ query, portalPages = [], notifications = [], userRole }) => {
  const trimmed = String(query || '').trim();
  if (trimmed.length < SEARCH_MIN_LENGTH) {
    return { pages: [], notifications: [], employees: [], all: [] };
  }

  const pages = searchPortalPages(trimmed, portalPages);
  const notificationResults = searchStoredNotifications(trimmed, notifications);
  const employees = await searchEmployees(trimmed, userRole);
  const all = [...pages, ...employees, ...notificationResults];

  return {
    pages,
    notifications: notificationResults,
    employees,
    all,
  };
};

export { SEARCH_MIN_LENGTH };
