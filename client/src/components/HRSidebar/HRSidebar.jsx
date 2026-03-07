/**
 * HRSidebar Component
 * Left sidebar navigation for HR dashboard with responsive mobile support
 * Features: Icon-based navigation, active states, accessibility attributes, smooth transitions
 * 
 * @component
 * @author HR Team
 * @version 2.0.0
 * @example
 * <HRSidebar 
 *   currentPage="manpower" 
 *   onNavigate={handleNavigation}
 *   pageConfigs={PAGE_CONFIGS}
 * />
 */

import React, { useState, useCallback, useMemo } from 'react';
import { FiMenu, FiX } from 'react-icons/fi';

/**
 * HRSidebar Component
 * Provides primary navigation menu for HR management operations
 * Supports both desktop and mobile responsive layouts
 * 
 * @param {Object} props - Component props
 * @param {string} props.currentPage - Currently active page ID
 * @param {Function} props.onNavigate - Callback function when menu item is clicked (pageId: string) => void
 * @param {Array<Object>} props.pageConfigs - Array of page configuration objects
 * @returns {JSX.Element} Sidebar component with navigation items and responsive mobile toggle
 */
const HRSidebar = ({ currentPage = 'dashboard', onNavigate = () => {}, pageConfigs = [] }) => {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  const [isOpen, setIsOpen] = useState(false);

  // ============================================================================
  // MEMOIZED COMPUTATIONS
  // ============================================================================

  /**
   * Organize page configs by category for better UI organization
   * Memoized to prevent unnecessary recalculations
   */
  const groupedPages = useMemo(() => {
    const groups = {};

    pageConfigs.forEach((page) => {
      if (!groups[page.category]) {
        groups[page.category] = [];
      }
      groups[page.category].push(page);
    });

    return groups;
  }, [pageConfigs]);

  /**
   * Get category label for display
   * Maps technical category names to user-friendly labels
   */
  const getCategoryLabel = useCallback((category) => {
    const labelMap = {
      overview: 'Overview',
      planning: 'Planning & Recruitment',
      admin: 'Administration',
      attendance: 'Attendance & Leaves',
      config: 'Configuration',
      payroll: 'Payroll & Compensation',
      exit: 'Exit Management',
      templates: 'Templates',
      workflow: 'Workflows & Approvals',
      meeting: 'Facilities',
    };

    return labelMap[category] || category;
  }, []);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Handle menu item click with validation
   * Closes mobile sidebar and triggers navigation
   * 
   * @param {string} itemId - The ID of the clicked menu item
   * @throws {Error} If pageId is invalid or callback fails
   */
  const handleMenuClick = useCallback(
    (itemId) => {
      // Validate input
      if (!itemId || typeof itemId !== 'string') {
        console.error('Invalid menu item ID:', itemId);
        return;
      }

      // Close mobile sidebar
      setIsOpen(false);

      // Call navigation callback
      try {
        onNavigate(itemId);
      } catch (error) {
        console.error('Navigation error:', error);
      }
    },
    [onNavigate]
  );

  /**
   * Toggle mobile sidebar visibility
   */
  const toggleSidebar = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  /**
   * Close sidebar when overlay is clicked
   */
  const handleOverlayClick = useCallback(() => {
    setIsOpen(false);
  }, []);

  // ============================================================================
  // SUB-COMPONENTS
  // ============================================================================

  /**
   * Render a single menu item with icon, label, and active state
   * Includes accessibility attributes and smooth transitions
   * 
   * @param {Object} item - Menu item object
   * @param {string} item.id - Unique identifier
   * @param {string} item.label - Display label
   * @param {string} item.icon - Icon emoji string
   * @param {string} item.description - Accessibility description
   * @returns {JSX.Element} Menu item button
   */
  const renderMenuItem = useCallback(
    (item) => {
      const isActive = currentPage === item.id;

      return (
        <button
          key={item.id}
          onClick={() => handleMenuClick(item.id)}
          className={`
            w-full flex flex-col items-center justify-center py-4 px-3
            transition-all duration-300 ease-in-out relative group
            border-r-4 overflow-hidden
            ${
              isActive
                ? 'text-blue-400 border-r-blue-500 bg-blue-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 border-r-transparent'
            }
          `}
          title={item.description}
          aria-label={item.label}
          aria-current={isActive ? 'page' : undefined}
        >
          {/* Icon */}
          <span
            className={`text-3xl mb-2 transition-transform duration-300 ${
              isActive ? 'scale-110' : 'group-hover:scale-105'
            }`}
          >
            {item.icon}
          </span>

          {/* Label for desktop, hidden on mobile */}
          <span className={`text-xs font-semibold text-center hidden sm:inline line-clamp-2 px-1 ${
            isActive ? 'text-blue-300' : 'text-slate-400'
          }`}>
            {item.label}
          </span>

          {/* Hover tooltip for mobile/compact view */}
          <div
            className={`
              absolute left-full ml-2 bg-slate-800 text-white px-3 py-2 rounded-lg
              text-sm whitespace-nowrap opacity-0 group-hover:opacity-100
              transition-opacity pointer-events-none z-50 font-medium
              ${isActive ? 'hidden' : ''}
            `}
          >
            {item.label}
          </div>
        </button>
      );
    },
    [currentPage, handleMenuClick]
  );

  /**
   * Render category section with grouped menu items
   * 
   * @param {string} category - Category key
   * @param {Array<Object>} items - Items in this category
   * @returns {JSX.Element} Category section
   */
  const renderCategoryGroup = useCallback(
    (category, items) => {
      // Skip rendering if only one item and it's dashboard
      if (items.length === 1 && items[0].id === 'dashboard') {
        return renderMenuItem(items[0]);
      }

      return (
        <div key={category} className="border-b border-slate-700/50">
          {/* Category items */}
          {items.map((item) => renderMenuItem(item))}
        </div>
      );
    },
    [renderMenuItem]
  );

  // ============================================================================
  // COMPONENT RENDER
  // ============================================================================

  return (
    <>
      {/* ========================================
          MOBILE MENU TOGGLE BUTTON
          ======================================== */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all duration-300"
        onClick={toggleSidebar}
        aria-label={isOpen ? 'Close navigation' : 'Open navigation'}
        aria-expanded={isOpen}
      >
        {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
      </button>

      {/* ========================================
          SIDEBAR CONTAINER
          ======================================== */}
      <aside
        className={`
          fixed md:static left-0 top-0 h-screen w-20 md:w-24
          bg-slate-800 border-r border-slate-700 shadow-xl
          transform transition-transform duration-300 md:translate-x-0 z-40
          flex flex-col overflow-hidden
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* ========================================
            LOGO SECTION
            ======================================== */}
        <div className="flex items-center justify-center py-6 border-b border-slate-700">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-lg hover:shadow-blue-500/50 transition-shadow duration-300">
            <span className="text-white font-bold text-xl">HR</span>
          </div>
        </div>

        {/* ========================================
            MAIN NAVIGATION MENU
            ======================================== */}
        <nav className="flex-1 overflow-y-auto scrollbar-hide py-4">
          {Object.entries(groupedPages).map(([category, items]) =>
            renderCategoryGroup(category, items)
          )}
        </nav>

        {/* ========================================
            FOOTER SECTION
            ======================================== */}
        <div
          className="border-t border-slate-700 p-3 text-center text-xs text-slate-500"
          title="HR Management System v2.0"
        >
          HRMS v2
        </div>
      </aside>

      {/* ========================================
          MOBILE OVERLAY
          ======================================== */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30 transition-opacity duration-300"
          onClick={handleOverlayClick}
          aria-hidden="true"
        />
      )}
    </>
  );
};

// ============================================================================
// PROP VALIDATION
// ============================================================================
HRSidebar.propTypes = {};

// ============================================================================
// EXPORTS
// ============================================================================
export default HRSidebar;
