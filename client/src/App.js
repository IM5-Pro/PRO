/**
 * Main Application Component
 * HRMS Dashboard - Secure routing with authentication
 * Routes between Login, Employee Dashboard, and Manager Dashboard
 */

import React from 'react';
import './App.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login/Login';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';

// Dashboard Components
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
import ManagerDashboard from './components/ManagerDashboard/ManagerDashboard';

/**
 * EmployeeDashboard Component
 * Dashboard for employee users with various widgets
 * 
 * @param {Object} props - Component props
 * @param {string} [props.className] - Additional CSS classes
 * @returns {JSX.Element} - Employee dashboard content
 */
const EmployeeDashboard = ({ className = '' }) => {
  const { user, logout } = useAuth();

  // Current employee user data from context
  const currentUser = user || {
    name: 'John Doe',
    email: 'john.doe@company.com',
    avatar: '👨‍💼',
    role: 'Senior Developer',
    department: 'Engineering',
    phone: '+1-234-567-8900',
    location: 'New York, USA',
  };

  const [currentPage, setCurrentPage] = React.useState('dashboard');

  /**
   * Handle navigation between pages
   * @param {string} page - Page name
   */
  const handleNavigation = (page) => {
    console.log(`Navigating to: ${page}`);
    setCurrentPage(page);
  };

  /**
   * Handle logout
   */
  const handleLogout = () => {
    logout();
  };

  return (
    <div className={`flex h-screen bg-gray-100 ${className}`}>
      {/* Sidebar Navigation */}
      <Sidebar onNavigate={handleNavigation} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header with Logout */}
        <div className="flex items-center justify-between">
          <Header user={currentUser} />
          <button
            onClick={handleLogout}
            className="mr-6 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
            title="Logout"
          >
            Logout
          </button>
        </div>

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
                className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * AppContent Component
 * Routes between Login and Dashboards based on authentication
 * Wrapped inside AuthProvider for access to useAuth hook
 * 
 * @returns {JSX.Element} - Application content with routing
 */
const AppContent = () => {
  const { isAuthenticated, user } = useAuth();

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <Login />;
  }

  // Route to appropriate dashboard based on user role
  if (user?.role === 'manager') {
    return (
      <ProtectedRoute requiredRole="manager">
        <ManagerDashboard />
      </ProtectedRoute>
    );
  }

  // Default to employee dashboard
  return (
    <ProtectedRoute requiredRole="employee">
      <EmployeeDashboard />
    </ProtectedRoute>
  );
};

/**
 * App Component - Main application wrapper
 * Wraps everything with AuthProvider for global auth state
 * 
 * @returns {JSX.Element} - Application component
 */
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
