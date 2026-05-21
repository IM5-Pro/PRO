/**
 * Sidebar navigation ordering and section labels (enterprise-style grouping).
 */

import { getSectionOrderForRole } from './sidebarUsageOrder';

export const SIDEBAR_SECTIONS = {
  overview: { label: 'Overview', order: 0 },
  communications: { label: 'Communications', order: 10 },
  workplace: { label: 'My Workplace', order: 20 },
  team: { label: 'Team', order: 30 },
  approvals: { label: 'Approvals', order: 40 },
  workforce: { label: 'Workforce', order: 50 },
  'time-attendance': { label: 'Time & Attendance', order: 60 },
  compensation: { label: 'Compensation', order: 70 },
  talent: { label: 'Talent & Performance', order: 80 },
  organization: { label: 'Organization', order: 90 },
  separation: { label: 'Separation & Exit', order: 100 },
  services: { label: 'Workplace Services', order: 110 },
  administration: { label: 'Administration', order: 120 },
  governance: { label: 'Governance', order: 130 },
  system: { label: 'System', order: 140 },
  account: { label: 'Account', order: 999 },
};

const DEFAULT_SECTION = { label: 'More', order: 500 };

const getSectionMeta = (category, role) => {
  const base = SIDEBAR_SECTIONS[category] || DEFAULT_SECTION;
  const roleOrder = role ? getSectionOrderForRole(category, role) : null;
  return {
    label: base.label,
    order: roleOrder !== null ? roleOrder : base.order,
  };
};

/**
 * Sort pages for sidebar: section order, then item order, then label.
 * @param {Array<{ id: string, label: string, category?: string, order?: number }>} pages
 * @param {{ role?: string }} [options]
 */
export const sortPagesForSidebar = (pages = [], options = {}) => {
  const { role } = options;
  const withMeta = pages.map((page, index) => ({
    ...page,
    category: page.category || 'overview',
    order: typeof page.order === 'number' ? page.order : index * 10 + 100,
  }));

  return [...withMeta].sort((a, b) => {
    const secA = getSectionMeta(a.category, role);
    const secB = getSectionMeta(b.category, role);
    if (secA.order !== secB.order) return secA.order - secB.order;
    if (a.order !== b.order) return a.order - b.order;
    return String(a.label || '').localeCompare(String(b.label || ''));
  });
};

/**
 * Group sorted pages by category for sidebar rendering.
 * @param {Array} pages
 * @param {{ role?: string }} [options]
 */
export const groupSidebarPages = (pages = [], options = {}) => {
  const { role } = options;
  const sorted = sortPagesForSidebar(pages, { role });
  const groups = [];

  sorted.forEach((page) => {
    const cat = page.category || 'overview';
    let group = groups.find((g) => g.category === cat);
    if (!group) {
      const meta = getSectionMeta(cat, role);
      group = { category: cat, label: meta.label, order: meta.order, items: [] };
      groups.push(group);
    }
    group.items.push(page);
  });

  return groups.sort((a, b) => a.order - b.order);
};

export const getSidebarSectionLabel = (category) =>
  (SIDEBAR_SECTIONS[category] || DEFAULT_SECTION).label;
