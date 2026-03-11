/**
 * Main Application Component
 * HRMS Dashboard - Complete routing with authentication and sidebar navigation
 * Routes between Login, Employee Dashboard, and various dashboard pages
 */

import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import HRDashboard from './components/HRDashboard/HRDashboard';
import PunchInOut from './components/PunchInOut/PunchInOut';

/**
 * AppContent Component
 * Main routing logic with authentication and role-based dashboard routing
 * 
 * AUTHENTICATION FLOW:
 * 1. User visits app (not authenticated) → Login Page
 * 2. User logs in → Redirects to role-based dashboard
 * 3. User tries to access without login → Redirect to login
 * 
 * ROLE-BASED ROUTING:
 * - 'hr' or 'admin' → HR Dashboard (10 modules)
 * - 'manager' → Manager Dashboard (Team management)
 * - 'employee' → Employee Dashboard (Personal features)
 * 
 * @returns {JSX.Element} - Login or Dashboard based on authentication
 */
const AppContent = () => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  // if someone is already signed in and manually visits /login, bounce
  // them to the appropriate dashboard instead of showing the login form.
  if (isAuthenticated && location.pathname === '/login') {
    return <Navigate to="/" replace />;
  }

  // ============================================================================
  // LOADING STATE
  // ============================================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="inline-block">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-white text-lg font-semibold">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // NOT AUTHENTICATED - REDIRECT TO LOGIN PAGE
  // ============================================================================
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // ============================================================================
  // AUTHENTICATED - ROLE-BASED DASHBOARD ROUTING
  // ============================================================================

  // Check if user needs to punch in/out first (only on initial login)
  // hasPunchedInToday allows punch out without forced return to punch screen
  const isPunchedIn = localStorage.getItem('isPunchedIn') === 'true';
  const hasPunchedInToday = localStorage.getItem('hasPunchedInToday') === 'true';
  const shouldRedirectToPunch = location.pathname !== '/punch' && !isPunchedIn && !hasPunchedInToday && location.pathname !== '/login';

  if (shouldRedirectToPunch) {
    return <Navigate to="/punch" replace />;
  }

  /**
   * HR/ADMIN DASHBOARD
   * Full HR management system with 10 modules
   */
  if (user?.role === 'hr' || user?.role === 'admin') {
    return (
      <ProtectedRoute requiredRole={user?.role}>
        <HRDashboard />
      </ProtectedRoute>
    );
  }

  /**
   * MANAGER DASHBOARD
   * Team management and employee oversight
   */
  if (user?.role === 'manager') {
    return (
      <ProtectedRoute requiredRole="manager">
        <ManagerDashboard />
      </ProtectedRoute>
    );
  }

  /**
   * EMPLOYEE DASHBOARD
   * Personal dashboard with employee features
   * Default for all other authenticated users
   */
  return (
    <ProtectedRoute requiredRole="employee">
      <DashboardLayout>
        <Routes>
          {/* ============================================================
              PUNCH IN/OUT ROUTE
              ============================================================ */}
          <Route path="/punch" element={<PunchInOut />} />

          {/* ============================================================
              MAIN DASHBOARD PAGES - EMPLOYEE
              ============================================================ */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/leave-management" element={<LeaveManagement />} />
          <Route path="/performance" element={<Performance />} />
          <Route path="/profile" element={<EmployeeProfile />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/team" element={<TeamCollaboration />} />
          <Route path="/payroll" element={<Payroll />} />

          {/* ============================================================
              SIDEBAR NAVIGATION PAGES - EMPLOYEE
              ============================================================ */}
          <Route path="/employees" element={<Employees />} />
          <Route path="/leaves" element={<Leaves />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />

          {/* ============================================================
              DEFAULT & FALLBACK ROUTES
              ============================================================ */}
          {/* when an employee hits the root we send them to their dashboard
              (previously the code redirected to /hrDashboard which was wrong) */}
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
 * Uses top-level Routes to handle Login page routing
 * 
 * @returns {JSX.Element} - Application component
 */
function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            {/* LOGIN ROUTE - Always accessible */}
            <Route path="/login" element={<Login />} />
            
            {/* MAIN APP ROUTES - Protected by AppContent */}
            <Route path="/*" element={<AppContent />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
