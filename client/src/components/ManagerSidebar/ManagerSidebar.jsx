import React, { useState, useCallback, useMemo } from 'react';
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

const PAGE_CONFIGS = [
  { id: 'dashboard', label: 'Dashboard', icon: FiLayout, category: 'overview', description: 'View dashboard' },
  { id: 'users', label: 'Users', icon: FiUsers, category: 'team', description: 'Manage team members' },
  { id: 'checklist', label: 'Checklist', icon: FiCheckSquare, category: 'team', description: 'Task management' },
  { id: 'leaves', label: 'Leaves', icon: FiCalendar, category: 'operations', description: 'Leave management' },
  { id: 'payroll', label: 'Payroll', icon: FiDollarSign, category: 'operations', description: 'Payroll information' },
  { id: 'recruit', label: 'Recruit', icon: FiBriefcase, category: 'operations', description: 'Recruitment' },
  { id: 'messages', label: 'Messages', icon: FiMessageSquare, category: 'support', description: 'Team messages' },
  { id: 'help', label: 'Help', icon: FiHelpCircle, category: 'support', description: 'Get help' },
  { id: 'settings', label: 'Settings', icon: FiSettings, category: 'support', description: 'Settings' },
];

const ManagerSidebar = ({ currentPage = 'dashboard', onNavigate = () => {} }) => {
  const [isOpen, setIsOpen] = useState(false);

  const groupedPages = useMemo(() => {
    const groups = {};

    PAGE_CONFIGS.forEach((page) => {
      if (!groups[page.category]) {
        groups[page.category] = [];
      }
      groups[page.category].push(page);
    });

    return groups;
  }, []);

  const handleMenuClick = useCallback(
    (itemId) => {
      if (!itemId || typeof itemId !== 'string') {
        return;
      }

      setIsOpen(false);
      onNavigate(itemId);
    },
    [onNavigate]
  );

  const renderMenuItem = useCallback(
    (item) => {
      const Icon = item.icon;
      const isActive = currentPage === item.id;

      return (
        <button
          key={item.id}
          onClick={() => handleMenuClick(item.id)}
          className={`
            w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left
            transition-colors duration-200
            ${
              isActive
                ? 'bg-white/30 text-slate-900'
                : 'text-slate-700 hover:bg-white/25 hover:text-slate-900'
            }
          `}
          title={item.description}
          aria-label={item.label}
          aria-current={isActive ? 'page' : undefined}
        >
          <span className="text-lg w-5 flex justify-center">
            <Icon size={18} />
          </span>
          <span className="font-medium text-sm md:text-base">{item.label}</span>
        </button>
      );
    },
    [currentPage, handleMenuClick]
  );

  const renderCategoryGroup = useCallback(
    (category, items) => {
      if (items.length === 1 && items[0].id === 'dashboard') {
        return renderMenuItem(items[0]);
      }

      return (
        <div key={category} className="space-y-2">
          {items.map((item) => renderMenuItem(item))}
        </div>
      );
    },
    [renderMenuItem]
  );

  return (
    <>
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all duration-300"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? 'Close navigation' : 'Open navigation'}
        aria-expanded={isOpen}
      >
        {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
      </button>

      <aside
        className={`
          fixed md:static left-0 top-0 h-screen w-64
          bg-transparent backdrop-blur-xl text-slate-800 shadow-lg border-r border-white/40
          transform transition-transform duration-300 md:translate-x-0 z-40
          flex flex-col overflow-hidden
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="p-6 border-b border-white/40">
          <h1 className="text-2xl font-bold">HRMS</h1>
          <p className="text-slate-600 text-sm">Manager Portal</p>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {Object.entries(groupedPages).map(([category, items]) =>
            renderCategoryGroup(category, items)
          )}
        </nav>
      </aside>

      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
};

export default ManagerSidebar;
