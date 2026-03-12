/**
 * Sidebar Component
 * Displays navigation menu for the HRMS application
 */

import React, { useState } from 'react';
import {
  FiHome,
  FiUsers,
  FiCalendar,
  FiBarChart2,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiX,
} from 'react-icons/fi';

/**
 * Sidebar Component - Main navigation sidebar
 * @param {object} props - Component props
 * @param {function} props.onNavigate - Callback when navigation item is clicked
 * @returns {JSX.Element} - Sidebar component
 */
const Sidebar = ({ onNavigate }) => {
  // State to manage mobile sidebar visibility
  const [isOpen, setIsOpen] = useState(false);

  // Menu items configuration
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: FiHome },
    { id: 'employees', label: 'Employees', icon: FiUsers },
    { id: 'leaves', label: 'Leaves', icon: FiCalendar },
    { id: 'analytics', label: 'Analytics', icon: FiBarChart2 },
    { id: 'settings', label: 'Settings', icon: FiSettings },
  ];

  /**
   * Handle menu item click
   * @param {string} itemId - The ID of the clicked menu item
   */
  const handleMenuClick = (itemId) => {
    onNavigate(itemId);
    setIsOpen(false); // Close sidebar on mobile after click
  };

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-blue-500 text-white"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle sidebar"
      >
        {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
      </button>

      {/* Sidebar Container */}
      <div
        className={`fixed md:static left-0 top-0 h-screen w-64 bg-slate-900 text-white shadow-lg transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } z-40`}
      >
        {/* Logo Section */}
        <div className="p-6 border-b border-blue-500">
          <h1 className="text-2xl font-bold">HRMS</h1>
          <p className="text-blue-200 text-sm">Employee Dashboard</p>
        </div>

        {/* Navigation Menu */}
        <nav className="p-4 space-y-2">
          {menuItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => handleMenuClick(id)}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 text-left"
              aria-label={label}
            >
              <Icon size={20} />
              <span className="font-medium">{label}</span>
            </button>
          ))}
        </nav>

        {/* Bottom Section - Logout */}
        <div className="absolute bottom-6 left-4 right-4 border-t border-blue-500 pt-4">
          <button
            onClick={() => handleMenuClick('logout')}
            className="w-full flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-red-600 transition-colors duration-200 text-left"
            aria-label="Logout"
          >
            <FiLogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

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

export default Sidebar;
