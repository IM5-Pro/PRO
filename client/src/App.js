/**
 * Main Application Component
 * HRMS Dashboard - Complete routing with authentication and sidebar navigation
 * Routes between Login, Employee Dashboard, and various dashboard pages
 */

import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Login from './components/Login/Login';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout/DashboardLayout';

// Page Components
import Dashboard from './components/Pages/Dashboard';
import Announcements from './components/Pages/Announcements';
import Attendance from './components/Pages/Attendance';
import LeaveManagement from './components/Pages/LeaveManagement';
import Performance from './components/Pages/Performance';
import EmployeeProfile from './components/Pages/EmployeeProfile';
import Reports from './components/Pages/Reports';
import TeamCollaboration from './components/Pages/TeamCollaboration';
import Settings from './components/Pages/Settings';
import Payroll from './components/Pages/Payroll';
import Employees from './components/Pages/Employees';
import Leaves from './components/Pages/Leaves';
import Analytics from './components/Pages/Analytics';

import ManagerDashboard from './components/ManagerDashboard/ManagerDashboard';

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

  // Default to employee dashboard with sidebar layout
  return (
    <ProtectedRoute requiredRole="employee">
      <DashboardLayout>
        <Routes>
          {/* Main Dashboard Pages */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/leave-management" element={<LeaveManagement />} />
          <Route path="/performance" element={<Performance />} />
          <Route path="/profile" element={<EmployeeProfile />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/team" element={<TeamCollaboration />} />
          <Route path="/payroll" element={<Payroll />} />

          {/* Sidebar Navigation Pages */}
          <Route path="/employees" element={<Employees />} />
          <Route path="/leaves" element={<Leaves />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </DashboardLayout>
    </ProtectedRoute>
  );
};

/**
 * App Component - Main application wrapper
 * Wraps everything with Router, ThemeProvider, and AuthProvider for global state
 * 
 * @returns {JSX.Element} - Application component
 */
function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
