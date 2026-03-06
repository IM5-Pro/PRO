/**
 * ManagerSidebar Component
 * Left sidebar navigation for manager dashboard with responsive mobile support
 * Features: Icon-based navigation, active states, accessibility support
 * 
 * @component
 * @example
 * <ManagerSidebar currentPage="dashboard" onNavigate={handleNavigation} />
 */

import React, { useState } from 'react';
import {
  FiLayout,
  FiUsers,
  FiCheckSquare,
  FiCalendar,
  FiDollarSign,
  FiBriefcase,
  FiMessageSquare,
  FiHelpCircle,
  FiSettings,
  FiMenu,
  FiX,
} from 'react-icons/fi';

/**
 * Navigation menu items configuration
 * @type {Array<{id: string, label: string, icon: React.Component, description: string}>}
 */
const MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: FiLayout, description: 'View dashboard' },
  { id: 'users', label: 'Users', icon: FiUsers, description: 'Manage team members' },
  { id: 'checklist', label: 'Checklist', icon: FiCheckSquare, description: 'Task management' },
  { id: 'leaves', label: 'Leaves', icon: FiCalendar, description: 'Leave management' },
  { id: 'payroll', label: 'Payroll', icon: FiDollarSign, description: 'Payroll information' },
  { id: 'recruit', label: 'Recruit', icon: FiBriefcase, description: 'Recruitment' },
  { id: 'messages', label: 'Messages', icon: FiMessageSquare, description: 'Team messages' },
];

const FOOTER_ITEMS = [
  { id: 'help', label: 'Help', icon: FiHelpCircle, description: 'Get help' },
  { id: 'settings', label: 'Settings', icon: FiSettings, description: 'Settings' },
];

/**
 * ManagerSidebar Component
 * Provides navigation menu for manager dashboard
 * 
 * @param {Object} props - Component props
 * @param {string} props.currentPage - Currently active page ID
 * @param {Function} props.onNavigate - Callback function when menu item is clicked
 * @returns {JSX.Element} Sidebar component with navigation items
 */
const ManagerSidebar = ({ currentPage = 'dashboard', onNavigate = () => {} }) => {
  // State for mobile sidebar toggle
  const [isOpen, setIsOpen] = useState(false);

  /**
   * Handle menu item click
   * Calls the onNavigate callback and closes mobile sidebar
   * 
   * @param {string} itemId - The ID of the clicked menu item
   */
  const handleMenuClick = (itemId) => {
    onNavigate(itemId);
    setIsOpen(false); // Close sidebar on mobile after selection
  };

  /**
   * Render a single menu item with icon and label
   * Includes active state styling and accessibility attributes
   * 
   * @param {Object} item - Menu item object
   * @param {string} item.id - Unique identifier
   * @param {string} item.label - Display label
   * @param {React.Component} item.icon - Icon component
   * @param {string} item.description - Accessibility description
   * @returns {JSX.Element} Menu item button
   */
  const renderMenuItem = (item) => {
    const Icon = item.icon;
    const isActive = currentPage === item.id;

    return (
      <button
        key={item.id}
        onClick={() => handleMenuClick(item.id)}
        className={`
          w-full flex flex-col items-center justify-center py-4 px-2 
          transition-all duration-300 ease-in-out
          relative group
          ${
            isActive
              ? 'text-blue-600 border-r-4 border-blue-600 bg-blue-50'
              : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'
          }
        `}
        title={item.description}
        aria-label={item.label}
        aria-current={isActive ? 'page' : undefined}
      >
        {/* Icon */}
        <Icon
          className={`text-2xl mb-1 transition-transform duration-300 ${
            isActive ? 'scale-110' : 'group-hover:scale-105'
          }`}
          size={24}
        />

        {/* Label for desktop, tooltip for mobile */}
        <span className="text-xs font-semibold text-center hidden sm:inline">
          {item.label}
        </span>

        {/* Hover tooltip */}
        <div
          className={`
            absolute left-full ml-2 bg-gray-800 text-white px-3 py-1 rounded 
            text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 
            transition-opacity pointer-events-none z-50
            ${isActive ? 'hidden' : ''}
          `}
        >
          {item.label}
        </div>
      </button>
    );
  };

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-blue-600 text-white shadow-lg"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
      >
        {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
      </button>

      {/* Sidebar Container */}
      <aside
        className={`
          fixed md:static left-0 top-0 h-screen
          w-20 md:w-24 bg-white border-r border-gray-200 shadow-sm
          transform transition-transform duration-300 md:translate-x-0 z-40
          flex flex-col
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Logo Section */}
        <div className="flex items-center justify-center py-6 border-b border-gray-100">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">LT</span>
          </div>
        </div>

        {/* Main Navigation Menu */}
        <nav className="flex-1 overflow-y-auto scrollbar-hide">
          {MENU_ITEMS.map((item) => renderMenuItem(item))}
        </nav>

        {/* Divider */}
        <div className="border-b border-gray-100" />

        {/* Footer Navigation Menu */}
        <nav className="py-2">
          {FOOTER_ITEMS.map((item) => renderMenuItem(item))}
        </nav>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default ManagerSidebar;
