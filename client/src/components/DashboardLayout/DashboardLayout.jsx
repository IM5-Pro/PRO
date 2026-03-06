/**
 * DashboardLayout Component
 * Layout wrapper that combines sidebar navigation with page content
 */

import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import SidebarNav from '../SidebarNav/SidebarNav';

const DashboardLayout = ({ children }) => {
  const { colors } = useTheme();

  return (
    <div className={`flex min-h-screen bg-gradient-to-br ${colors.gradient.primary}`}>
      {/* Sidebar */}
      <SidebarNav />

      {/* Main Content */}
      <main className="flex-1 ml-0 md:ml-64 transition-all duration-300">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
