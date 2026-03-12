/**
 * ManagerDashboard Component (Main Page)
 * Complete manager dashboard layout combining all manager components
 * Features: Responsive grid layout, responsive sidebar, dynamic page switching
 * 
 * @component
 * @example
 * <ManagerDashboard />
 */

import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ManagerSidebar from '../ManagerSidebar/ManagerSidebar';
import ManagerHeader from '../ManagerHeader/ManagerHeader';
import TeamStatsCard from '../TeamStatsCard/TeamStatsCard';
import TimingsChart from '../TimingsChart/TimingsChart';
import TeamScheduleCalendar from '../TeamScheduleCalendar/TeamScheduleCalendar';
import BookMeeting from '../BookMeeting/BookMeeting';
import ManagerActionCenter from './ManagerActionCenter';
import ManagerSidebarPageContent from './ManagerSidebarPages';

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
  const contentScrollRef = useRef(null);

  useEffect(() => {
    if (contentScrollRef.current) {
      contentScrollRef.current.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [currentPage]);

  /**
   * Handle navigation between different pages
   * @param {string} pageId - ID of the page to navigate to
   */
  const handleNavigation = (pageId) => {
    setCurrentPage(pageId);
  };

  const ACTION_PAGE_MAP = {
    'Invite Member': 'users',
    'Create Role Group': 'users',
    'Export Users': 'users',
    'Review Permissions': 'users',
    'Create Checklist': 'checklist',
    'Assign Task': 'checklist',
    'Mark Complete': 'checklist',
    'Download Report': 'checklist',
    'Approve Batch': 'leaves',
    'Create Leave Policy': 'leaves',
    'Export Ledger': 'leaves',
    'Set Team Calendar': 'leaves',
    'Run Validation': 'payroll',
    'Review Exceptions': 'payroll',
    'Download Paysheet': 'payroll',
    'Notify Team': 'messages',
    'Create Job Requisition': 'recruit',
    'Schedule Interviews': 'recruit',
    'Move Candidate Stage': 'recruit',
    'Generate Hiring Report': 'recruit',
    'Start Broadcast': 'messages',
    'Pin Update': 'messages',
    'Create Channel': 'messages',
    'Archive Thread': 'messages',
    'Create Support Ticket': 'help',
    'Chat with Support': 'help',
    'Open Documentation': 'help',
    'Share Feedback': 'help',
    'Update Preferences': 'settings',
    'Manage Integrations': 'settings',
    'Review Audit Log': 'settings',
    'Reset Defaults': 'settings',
  };

  const handlePageAction = (actionName) => {
    const targetPage = ACTION_PAGE_MAP[actionName];
    if (targetPage) {
      setCurrentPage(targetPage);
    }
  };

  /**
   * Handle profile actions (profile click, logout, etc.)
   * @param {string} action - Action type
   */
  const handleProfileAction = (action) => {
    if (action === 'logout') {
      logout(); // Call logout from auth context
      navigate('/login');
    } else if (action === 'profile') {
      setCurrentPage('settings');
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
          <div className="w-full bg-transparent p-6 md:p-8 space-y-6">
            {/* Welcome Section */}
            <div className="flex items-center justify-between rounded-2xl p-6 bg-white/10 backdrop-blur-3xl border border-white/30 ring-1 ring-white/20 shadow-xl shadow-slate-900/10">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-slate-800">
                  Good afternoon, {CURRENT_MANAGER.name}! 👋
                </h1>
                <p className="text-slate-600 mt-2">
                You have 2 leave request pending.
                </p>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="space-y-6">
              {/* Top Row - Team Stats + Book Meeting */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                <div className="xl:col-span-8">
                  <TeamStatsCard
                    teamName="My Teams"
                    periodLabel="From 4-10 Sep, 2023"
                    compact
                    onFilter={() => handleNavigation('users')}
                  />
                </div>

                <div className="xl:col-span-4 w-full">
                  <BookMeeting
                    onBooking={handleMeetingBooked}
                  />
                </div>
              </div>

              {/* Second Row - Action Center (between Team and Timings) */}
              <ManagerActionCenter onNavigate={handleNavigation} />

              {/* Third Row - Timings full width */}
              <TimingsChart
                selectedMember={selectedTeamMember}
                onMemberSelect={setSelectedTeamMember}
                period="This Week"
                onFilter={() => handleNavigation('checklist')}
              />

              {/* Fourth Row - Team Schedule full width */}
              <TeamScheduleCalendar
                selectedMember={selectedScheduleMember}
                onMemberSelect={setSelectedScheduleMember}
              />
            </div>
          </div>
        );

      case 'users':
      case 'checklist':
      case 'leaves':
      case 'payroll':
      case 'recruit':
      case 'messages':
      case 'help':
      case 'settings':
        return <ManagerSidebarPageContent pageId={currentPage} onAction={handlePageAction} />;

      default:
        return (
          <div className="min-h-screen bg-transparent p-6 md:p-8">
            <div className="bg-white/10 backdrop-blur-3xl border border-white/30 ring-1 ring-white/20 rounded-2xl shadow-xl shadow-slate-900/10 p-6">
              <h2 className="text-2xl font-bold text-slate-800 mb-4">Page Not Found</h2>
              <p className="text-slate-600">The requested page does not exist.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div
      className="app-shell flex h-screen bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden"
    >
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
        <main ref={contentScrollRef} className="flex-1 overflow-auto">
          <div className="p-4 md:p-8">
            <div className="rounded-2xl bg-white/10 backdrop-blur-3xl border border-white/30 ring-1 ring-white/20 shadow-xl shadow-slate-900/10 overflow-hidden">
              {renderPageContent()}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ManagerDashboard;
