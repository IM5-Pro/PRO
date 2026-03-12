/**
 * SidebarNav Component
 * Sidebar navigation for employee dashboard with collapsible menu
 */

import React, { useState } from 'react';
import { FiMenu, FiX, FiHome, FiUsers, FiCalendar, FiBarChart2, FiSettings, FiBell, FiLogOut } from 'react-icons/fi';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

const SidebarNav = () => {
  const [isOpen, setIsOpen] = useState(true);
  const location = useLocation();
  const { colors } = useTheme();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { icon: FiHome, label: 'Dashboard', path: '/dashboard' },
    { icon: FiBell, label: 'Announcements', path: '/announcements' },
    { icon: FiCalendar, label: 'Attendance', path: '/attendance' },
    { icon: FiUsers, label: 'Employees', path: '/employees' },
    { icon: FiCalendar, label: 'Leaves', path: '/leaves' },
    { icon: FiBarChart2, label: 'Performance', path: '/performance' },
    { icon: FiBarChart2, label: 'Analytics', path: '/analytics' },
    { icon: FiSettings, label: 'Settings', path: '/settings' }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg"
      >
        {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className={`fixed inset-0 z-30 md:hidden transition-colors duration-300 ${colors.bg.overlay} backdrop-blur-sm`}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen border-r-2 z-30 transition-all duration-300 glass ${
          isOpen ? 'w-64' : 'w-0 md:w-64'
        } overflow-hidden md:translate-x-0 ${!isOpen && 'md:w-64'}`}
      >
        {/* Header */}
        <div className={`p-6 border-b-2 transition-colors duration-300 ${colors.border.primary}`}>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            HRMS
          </h1>
          <p className={`text-xs mt-1 transition-colors duration-300 ${colors.text.tertiary}`}>Employee Portal</p>
        </div>

        {/* Navigation Menu */}
        <nav className="p-4 space-y-2 flex-1">
          {menuItems.map((item, idx) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <Link
                key={idx}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                  active
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/20'
                    : `${colors.text.tertiary} hover:${colors.text.primary} hover:${colors.bg.tertiary}/50`
                }`}
              >
                <Icon size={20} />
                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className={`p-4 border-t-2 transition-colors duration-300 ${colors.border.primary}`}>
          <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium ${colors.text.tertiary} hover:${colors.text.primary}`} onClick={() => {
            logout();
            navigate('/login');
          }}>
            <FiLogOut size={20} />
            <span className="text-sm">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Offset */}
      <div className="hidden md:block min-h-screen">
        {/* Spacer for sidebar */}
      </div>
    </>
  );
};

export default SidebarNav;
