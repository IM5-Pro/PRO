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

  const currentPageLabel = useMemo(() => {
    const currentConfig = pageConfigs.find((page) => page.id === currentPage);
    return currentConfig?.label || 'Dashboard';
  }, [currentPage, pageConfigs]);

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
            w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left
            border transition-all duration-200
            ${
              isActive
                ? 'bg-blue-500 text-white border-blue-500 shadow-md font-semibold'
                : 'border-transparent text-slate-700 hover:bg-white/25 hover:text-slate-900'
            }
          `}
          title={item.description}
          aria-label={item.label}
          aria-current={isActive ? 'page' : undefined}
        >
          <span className="text-lg w-5 flex justify-center">
            {item.icon}
          </span>

          <span className="font-medium text-sm md:text-base">
            {item.label}
          </span>
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
        <div key={category} className="space-y-2">
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
          fixed md:static left-0 top-0 h-screen w-64
          bg-transparent backdrop-blur-xl text-slate-800 shadow-lg border-r border-white/40
          transform transition-transform duration-300 md:translate-x-0 z-40
          flex flex-col overflow-hidden
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* ========================================
            LOGO SECTION
            ======================================== */}
        <div className="p-6 border-b border-white/40">
          <h1 className="text-2xl font-bold">HRMS</h1>
          <p className="text-slate-600 text-sm">HR Portal</p>
          <p className="mt-3 text-xs text-slate-700 bg-white/40 border border-white/50 rounded-md px-2 py-1 inline-block">
            Current: {currentPageLabel}
          </p>
        </div>

        {/* ========================================
            MAIN NAVIGATION MENU
            ======================================== */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {Object.entries(groupedPages).map(([category, items]) =>
            renderCategoryGroup(category, items)
          )}
        </nav>

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
