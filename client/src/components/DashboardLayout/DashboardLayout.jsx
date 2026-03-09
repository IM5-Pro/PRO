/**
 * DashboardLayout Component
 * Layout wrapper that combines sidebar navigation with page content
 */

import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import SidebarNav from '../SidebarNav/SidebarNav';
import bgImage from '../../assets/ispace-bg.png';

const DashboardLayout = ({ children }) => {
  const { colors } = useTheme();

  return (
    <div
      className="flex min-h-screen bg-cover bg-center bg-fixed"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
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
