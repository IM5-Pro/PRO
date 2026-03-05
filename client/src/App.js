/**
 * Main Application Component
 * HRMS Employee Dashboard
 */

import React, { useState } from 'react';
import './App.css';
import Sidebar from './components/Sidebar/Sidebar';
import Header from './components/Header/Header';
import ProfileCard from './components/ProfileCard/ProfileCard';
import TimeTracker from './components/TimeTracker/TimeTracker';
import AttendanceCard from './components/AttendanceCard/AttendanceCard';
import LeaveBalance from './components/LeaveBalance/LeaveBalance';
import PerformanceChart from './components/PerformanceChart/PerformanceChart';
import Announcements from './components/Announcements/Announcements';
import TodoList from './components/TodoList/TodoList';
import Birthdays from './components/Birthdays/Birthdays';

/**
 * App Component - Main application layout
 * @returns {JSX.Element} - Application component
 */
function App() {
  // Current user data
  const currentUser = {
    name: 'John Doe',
    email: 'john.doe@company.com',
    avatar: '👨‍💼',
    role: 'Senior Developer',
    department: 'Engineering',
    phone: '+1-234-567-8900',
    location: 'New York, USA',
  };

  // State for current page/section
  const [currentPage, setCurrentPage] = useState('dashboard');

  /**
   * Handle navigation between pages
   * @param {string} page - Page name
   */
  const handleNavigation = (page) => {
    console.log(`Navigating to: ${page}`);
    setCurrentPage(page);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar Navigation */}
      <Sidebar onNavigate={handleNavigation} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header user={currentUser} />

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          {currentPage === 'dashboard' ? (
            // Dashboard View
            <div className="p-4 md:p-8 space-y-8">
              {/* Page Title */}
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Welcome, {currentUser.name}! 👋</h1>
                <p className="text-gray-600 mt-1">
                  Here's your dashboard overview for today
                </p>
              </div>

              {/* Top Row - Profile, Time Tracker, Attendance */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Profile Section */}
                <div className="lg:col-span-1 md:col-span-2">
                  <ProfileCard
                    name={currentUser.name}
                    role={currentUser.role}
                    department={currentUser.department}
                    email={currentUser.email}
                    phone={currentUser.phone}
                    location={currentUser.location}
                    avatar={currentUser.avatar}
                    onEdit={() => alert('Edit profile clicked')}
                  />
                </div>

                {/* Time Tracker */}
                <div className="lg:col-span-1 md:col-span-2">
                  <TimeTracker />
                </div>

                {/* Attendance Card */}
                <div className="lg:col-span-1 md:col-span-2">
                  <AttendanceCard
                    present={18}
                    absent={2}
                    late={1}
                    percentage={90}
                  />
                </div>

                {/* Leave Balance */}
                <div className="lg:col-span-1 md:col-span-2">
                  <LeaveBalance
                    totalLeaves={20}
                    usedLeaves={5}
                    sickLeaves={5}
                    casualLeaves={15}
                  />
                </div>
              </div>

              {/* Middle Row - Performance Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <PerformanceChart />
                </div>

                {/* Birthdays - Right Column */}
                <div className="gap-6 space-y-6">
                  <Birthdays />
                </div>
              </div>

              {/* Bottom Row - Announcements and Tasks */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Announcements */}
                <div>
                  <Announcements />
                </div>

                {/* Todo List */}
                <div>
                  <TodoList />
                </div>
              </div>
            </div>
          ) : (
            // Other Pages Placeholder
            <div className="p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                {currentPage.charAt(0).toUpperCase() + currentPage.slice(1)} Page
              </h2>
              <p className="text-gray-600">
                This page is coming soon. Currently showing dashboard.
              </p>
              <button
                onClick={() => handleNavigation('dashboard')}
                className="mt-4 btn-primary"
              >
                Back to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
