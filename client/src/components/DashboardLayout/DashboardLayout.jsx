/**
 * DashboardLayout Component
 * Layout wrapper that combines header, sidebar navigation with page content
 * Features a static/sticky header with search and punch in/out functionality
 */

import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import SidebarNav from '../SidebarNav/SidebarNav';
import Header from '../Header/Header';

const DashboardLayout = ({ children, user = { name: 'John Doe', email: 'john@example.com', avatar: '🧑' } }) => {
  /**
   * Handle search functionality
   */
  const handleSearch = (query) => {
    // TODO: Implement search across employees, leaves, attendance, etc.
    console.log('Searching for:', query);
  };

  return (
    <div
      className="app-shell flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100"
    >
      {/* Sidebar */}
      <SidebarNav />

      {/* Main Layout - Header + Content */}
      <div className="flex flex-col flex-1 ml-0 md:ml-64">
        {/* Static Header */}
        <Header user={user} onSearch={handleSearch} />

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
