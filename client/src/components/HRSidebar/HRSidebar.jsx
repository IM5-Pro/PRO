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
 *   currentPage="dashboard-overview"
 *   onNavigate={handleNavigation}
 *   pageConfigs={PAGE_CONFIGS}
 * />
 */

import React, { useState, useCallback, useMemo } from "react";
import { FiCircle, FiMenu, FiX } from "react-icons/fi";
import { groupSidebarPages } from "../../utils/sidebarNav";
import logo from "../../assets/icon1.png";

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
const HRSidebar = ({
  currentPage = "dashboard",
  onNavigate = () => {},
  pageConfigs = [],
  contextSubtitle = "",
  sidebarRole = "",
}) => {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  const [isOpen, setIsOpen] = useState(false);

  // ============================================================================
  // MEMOIZED COMPUTATIONS
  // ============================================================================

  /** Sections in enterprise order with labels (pages pre-sorted in config). */
  const navSections = useMemo(
    () => groupSidebarPages(pageConfigs, { role: sidebarRole || undefined }),
    [pageConfigs, sidebarRole],
  );

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
      if (!itemId || typeof itemId !== "string") {
        console.error("Invalid menu item ID:", itemId);
        return;
      }

      // Close mobile sidebar
      setIsOpen(false);

      // Call navigation callback
      try {
        onNavigate(itemId);
      } catch (error) {
        console.error("Navigation error:", error);
      }
    },
    [onNavigate],
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
   * @param {React.ComponentType} item.icon - React icon component
   * @param {string} item.description - Accessibility description
   * @returns {JSX.Element} Menu item button
   */
  const renderMenuItem = useCallback(
    (item) => {
      const isActive = currentPage === item.id;
      const Icon = typeof item.icon === "function" ? item.icon : FiCircle;

      return (
        <button
          key={item.id}
          onClick={() => handleMenuClick(item.id)}
          className={`
            w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left
            border transition-all duration-200
            ${
              isActive
                ? "bg-blue-500 text-white border-blue-500 shadow-md font-semibold"
                : "border-transparent text-slate-700 hover:bg-white/25 hover:text-slate-900"
            }
          `}
          title={item.description}
          aria-label={item.label}
          aria-current={isActive ? "page" : undefined}
        >
          <span className="text-lg w-5 flex justify-center">
            <Icon size={18} />
          </span>

          <span className="font-medium text-sm md:text-base">{item.label}</span>
        </button>
      );
    },
    [currentPage, handleMenuClick],
  );

  /**
   * Render category section with grouped menu items
   *
   * @param {string} category - Category key
   * @param {Array<Object>} items - Items in this category
   * @returns {JSX.Element} Category section
   */
  const renderNavSection = useCallback(
    (section) => {
      const { category, label, items } = section;
      const isOverviewOnly = items.length === 1 && items[0].id === "dashboard";

      if (isOverviewOnly) {
        return (
          <div key={category} className="mb-1">
            {renderMenuItem(items[0])}
          </div>
        );
      }

      return (
        <div key={category} className="mb-4 last:mb-2">
          <p
            className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400"
            aria-hidden="true"
          >
            {label}
          </p>
          <div className="space-y-0.5">
            {items.map((item) => renderMenuItem(item))}
          </div>
        </div>
      );
    },
    [renderMenuItem],
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
        aria-label={isOpen ? "Close navigation" : "Open navigation"}
        aria-expanded={isOpen}
      >
        {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
      </button>

      {/* ========================================
          SIDEBAR CONTAINER
          ======================================== */}
      <aside
        className={`
          fixed md:static left-0 top-0 h-full max-h-[100dvh] md:max-h-none w-64
          bg-im5-surface/95 text-slate-800 shadow-sm border-r border-im5-border-soft backdrop-blur-sm
          transform transition-transform duration-300 md:translate-x-0 z-40
          flex flex-col overflow-hidden
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* ========================================
            LOGO SECTION
            ======================================== */}
        <div className="p-6 border-b border-im5-border-soft">
          <div className="flex h-10 w-full items-center justify-center">
            <img
              src={logo}
              alt="iSpace"
              className="h-22 w-auto max-w-[100px] shrink-0 object-fill"
            />
            {/* <h1 className="text-2xl font-bold leading-none text-slate-900">
              HRMS
            </h1> */}
          </div>
          {contextSubtitle ? (
            <div className="mt-2 pt-2 border-t border-slate-100/80">
              <span className="inline-flex items-center px-3 py-1 text-xs font-medium text-slate-600 bg-slate-100 rounded-full">
                {contextSubtitle}
              </span>
            </div>
          ) : null}
        </div>

        {/* ========================================
            MAIN NAVIGATION MENU
            ======================================== */}
        <nav
          className="flex-1 overflow-y-auto p-3 md:p-4"
          aria-label="Main navigation"
        >
          {navSections.map((section) => renderNavSection(section))}
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
