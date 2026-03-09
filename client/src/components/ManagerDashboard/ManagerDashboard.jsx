/**
 * ManagerDashboard Component (Main Page)
 * Complete manager dashboard layout combining all manager components
 * Features: Responsive grid layout, responsive sidebar, dynamic page switching
 * 
 * @component
 * @example
 * <ManagerDashboard />
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ManagerSidebar from '../ManagerSidebar/ManagerSidebar';
import ManagerHeader from '../ManagerHeader/ManagerHeader';
import TeamStatsCard from '../TeamStatsCard/TeamStatsCard';
import TimingsChart from '../TimingsChart/TimingsChart';
import TeamScheduleCalendar from '../TeamScheduleCalendar/TeamScheduleCalendar';
import BookMeeting from '../BookMeeting/BookMeeting';

/**
 * ManagerDashboard Component
 * Main dashboard layout for managers with comprehensive team management tools
 * 
 * @returns {JSX.Element} Complete manager dashboard
 */
const ManagerDashboard = () => {
  // Get user and logout from auth context
  const { user = {}, logout } = useAuth();
  const navigate = useNavigate();

  // Use user from context or fallback to defaults
  const CURRENT_MANAGER = {
    name: user.name || 'Sourav',
    email: user.email || 'sourav@company.com',
    avatar: user.avatar || '👨‍💼',
  };
  // Default team members (from TimingsChart)
  const DEFAULT_TEAM_MEMBERS = [
    {
      id: 1,
      name: 'Miracle Vetrovs',
      role: 'UX Designer - UX03',
      avatar: '👩‍💼',
      lastWeekHours: 34.2,
      thisWeekHours: 32,
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      role: 'Product Manager - PM01',
      avatar: '👩‍💼',
      lastWeekHours: 36,
      thisWeekHours: 34.5,
    },
  ];

  // State management
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedTeamMember, setSelectedTeamMember] = useState(DEFAULT_TEAM_MEMBERS[0]);
  const [selectedScheduleMember, setSelectedScheduleMember] = useState(DEFAULT_TEAM_MEMBERS[0]);

  /**
   * Handle navigation between different pages
   * @param {string} pageId - ID of the page to navigate to
   */
  const handleNavigation = (pageId) => {
    console.log(`Navigating to: ${pageId}`);
    setCurrentPage(pageId);
  };

  /**
   * Handle profile actions (profile click, logout, etc.)
   * @param {string} action - Action type
   */
  const handleProfileAction = (action) => {
    if (action === 'logout') {
      console.log('User logging out...');
      logout(); // Call logout from auth context
      navigate('/login');
    } else if (action === 'profile') {
      console.log('Opening user profile...');
      alert('Profile page would open here');
    }
  };

  /**
   * Handle meeting booking
   * @param {Object} bookingData - Booking information
   */
  const handleMeetingBooked = (bookingData) => {
    console.log('Meeting booked:', bookingData);
    // Here you would typically send the booking data to your backend API
    return Promise.resolve();
  };

  /**
   * Render dashboard content based on current page
   * @returns {JSX.Element} Page content
   */
  const renderPageContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <div className="space-y-8">
            {/* Welcome Section */}
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Good afternoon, {CURRENT_MANAGER.name}! 👋
              </h1>
              <p className="text-gray-600 mt-2">
                You have 2 leave request pending.
              </p>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Team Stats and Timings */}
              <div className="lg:col-span-2 space-y-8">
                {/* Team Stats Card */}
                <TeamStatsCard
                  teamName="My Teams"
                  periodLabel="From 4-10 Sep, 2023"
                  onFilter={() => console.log('Filter clicked')}
                />

                {/* Timings Chart */}
                <TimingsChart
                  selectedMember={selectedTeamMember}
                  onMemberSelect={setSelectedTeamMember}
                  period="This Week"
                  onFilter={() => console.log('Timings filter clicked')}
                />
              </div>

              {/* Right Column - Book Meeting */}
              <div className="lg:col-span-1">
                <BookMeeting
                  onBooking={handleMeetingBooked}
                />
              </div>
            </div>

            {/* Full Width - Team Schedule Calendar */}
            <div>
              <TeamScheduleCalendar
                selectedMember={selectedScheduleMember}
                onMemberSelect={setSelectedScheduleMember}
              />
            </div>
          </div>
        );

      case 'users':
        return (
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Users Management</h2>
            <p className="text-gray-600">User management page coming soon...</p>
          </div>
        );

      case 'checklist':
        return (
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Team Checklist</h2>
            <p className="text-gray-600">Task checklist page coming soon...</p>
          </div>
        );

      case 'leaves':
        return (
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Leave Management</h2>
            <p className="text-gray-600">Leave management page coming soon...</p>
          </div>
        );

      case 'payroll':
        return (
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Payroll</h2>
            <p className="text-gray-600">Payroll page coming soon...</p>
          </div>
        );

      case 'recruit':
        return (
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Recruitment</h2>
            <p className="text-gray-600">Recruitment page coming soon...</p>
          </div>
        );

      case 'messages':
        return (
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Messages</h2>
            <p className="text-gray-600">Messages page coming soon...</p>
          </div>
        );

      case 'help':
        return (
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Help & Support</h2>
            <p className="text-gray-600">Help page coming soon...</p>
          </div>
        );

      case 'settings':
        return (
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Settings</h2>
            <p className="text-gray-600">Settings page coming soon...</p>
          </div>
        );

      default:
        return (
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Page Not Found</h2>
            <p className="text-gray-600">The requested page does not exist.</p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <ManagerSidebar
        currentPage={currentPage}
        onNavigate={handleNavigation}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden md:ml-0">
        {/* Header */}
        <ManagerHeader
          user={CURRENT_MANAGER}
          onProfileClick={handleProfileAction}
        />

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-8">
            {renderPageContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ManagerDashboard;
