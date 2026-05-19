/**
 * Org-scoped dashboard visibility (designation + department).
 *
 * Optional `visibility` on a page or widget in UnifiedDashboardConfig:
 * {
 *   departments?: string[];   // fuzzy match against user's department (omit = no dept rule)
 *   designations?: string[];  // fuzzy match against user's job title / designation
 *   match?: 'all' | 'any';    // when both rules exist: 'all' = AND, 'any' = OR (default 'any')
 * }
 *
 * If the user has no designation (or no department) on record, that dimension is not used to
 * hide items — only positive matches apply when the field is populated.
 *
 * Wildcard: include '*' in a list to match any value for that dimension.
 */

import { ROLES, normalizeRole } from './roles';

const norm = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const listHasWildcard = (list) =>
  Array.isArray(list) && list.some((entry) => String(entry || '').trim() === '*');

const fuzzyListMatch = (patterns, userValue) => {
  const userNorm = norm(userValue);
  if (!userNorm) return false;
  if (listHasWildcard(patterns)) return true;

  return patterns.some((raw) => {
    const p = norm(raw);
    if (!p) return false;
    return userNorm.includes(p) || p.includes(userNorm);
  });
};

/**
 * @param {{ visibility?: { departments?: string[], designations?: string[], match?: 'all'|'any' } }} item
 * @param {{ designation?: string, department?: string }} ctx
 */
export const isItemVisibleForOrg = (item, ctx) => {
  if (!item || item.id === 'dashboard') return true;

  const vis = item.visibility;
  if (!vis || typeof vis !== 'object') return true;

  const departments = Array.isArray(vis.departments) ? vis.departments : [];
  const designations = Array.isArray(vis.designations) ? vis.designations : [];
  const matchMode = vis.match === 'all' ? 'all' : 'any';

  const hasDept = departments.length > 0;
  const hasDes = designations.length > 0;
  if (!hasDept && !hasDes) return true;

  const deptValue = ctx.department;
  const desValue = ctx.designation;

  const deptOk =
    !hasDept ||
    listHasWildcard(departments) ||
    (!norm(deptValue) ? true : fuzzyListMatch(departments, deptValue));

  const desOk =
    !hasDes ||
    listHasWildcard(designations) ||
    (!norm(desValue) ? true : fuzzyListMatch(designations, desValue));

  if (hasDept && hasDes) {
    return matchMode === 'all' ? deptOk && desOk : deptOk || desOk;
  }
  if (hasDept) return deptOk;
  return desOk;
};

const rolesWithOrgScopedNav = new Set([
  ROLES.EMPLOYEE,
  ROLES.MANAGER,
  ROLES.DEPT_ADMIN,
]);

/**
 * Filters sidebar / dashboard widgets for portal roles using designation & department.
 * HR admin and super admin keep the full module list for their portals.
 */
export const applyOrgScopedDashboard = (config, { designation, department, role }) => {
  if (!config) return config;
  const normalizedRole = normalizeRole(role);
  if (!rolesWithOrgScopedNav.has(normalizedRole)) {
    return config;
  }

  const ctx = { designation, department };
  const pages = (config.pages || []).filter((p) => isItemVisibleForOrg(p, ctx));
  const widgets = (config.widgets || []).filter((w) => isItemVisibleForOrg(w, ctx));

  const hasDashboard = pages.some((p) => p.id === 'dashboard');
  const safePages = hasDashboard
    ? pages
    : [...(config.pages || []).filter((p) => p.id === 'dashboard'), ...pages];

  return {
    ...config,
    pages: safePages,
    widgets,
  };
};

export const formatWorkContextLine = (designation, department) => {
  const d1 = norm(designation);
  const d2 = norm(department);
  if (!d1 && !d2) return '';
  if (d1 && d2) return `${designation.trim()} · ${department.trim()}`;
  return designation?.trim() || department?.trim() || '';
};
