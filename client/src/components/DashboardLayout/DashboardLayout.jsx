/**
 * DashboardLayout Component
 * Layout wrapper that combines header, sidebar navigation with page content
 * Features a static/sticky header with search and punch in/out functionality
 */

import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import SidebarNav from '../SidebarNav/SidebarNav';
import Header from '../Header/Header';
import bgImage from '../../assets/Background.png';

const DashboardLayout = ({ children, user = { name: 'John Doe', email: 'john@example.com', avatar: '🧑' } }) => {
  /**
   * Handle search functionality
   */
  const handleSearch = (query) => {
    // TODO: Implement search across employees, leaves, attendance, etc.
    console.log('Searching for:', query);
  };

  return (
<<<<<<< HEAD
    <div
      className="flex min-h-screen bg-cover bg-center bg-fixed"
      style={{ backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.94), rgba(255, 255, 255, 0.94)), url(${bgImage})` }}
    >
=======
    <div className="flex min-h-screen bg-cover bg-center bg-fixed" style={{ backgroundImage: `url(${bgImage})` }}>
>>>>>>> 1fbe9a26be50371c81b6e5c2ab5015f6b737867a
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
