/**
 * Sidebar navigation ordering and section labels (enterprise-style grouping).
 */

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

/**
 * Sort pages for sidebar: section order, then item order, then label.
 * @param {Array<{ id: string, label: string, category?: string, order?: number }>} pages
 */
export const sortPagesForSidebar = (pages = []) => {
  const withMeta = pages.map((page, index) => ({
    ...page,
    category: page.category || 'overview',
    order: typeof page.order === 'number' ? page.order : index * 10,
  }));

  return [...withMeta].sort((a, b) => {
    const secA = SIDEBAR_SECTIONS[a.category] || DEFAULT_SECTION;
    const secB = SIDEBAR_SECTIONS[b.category] || DEFAULT_SECTION;
    if (secA.order !== secB.order) return secA.order - secB.order;
    if (a.order !== b.order) return a.order - b.order;
    return String(a.label || '').localeCompare(String(b.label || ''));
  });
};

/**
 * Group sorted pages by category for sidebar rendering.
 */
export const groupSidebarPages = (pages = []) => {
  const sorted = sortPagesForSidebar(pages);
  const groups = [];

  sorted.forEach((page) => {
    const cat = page.category || 'overview';
    let group = groups.find((g) => g.category === cat);
    if (!group) {
      const meta = SIDEBAR_SECTIONS[cat] || DEFAULT_SECTION;
      group = { category: cat, label: meta.label, order: meta.order, items: [] };
      groups.push(group);
    }
    group.items.push(page);
  });

  return groups.sort((a, b) => a.order - b.order);
};

export const getSidebarSectionLabel = (category) =>
  (SIDEBAR_SECTIONS[category] || DEFAULT_SECTION).label;
