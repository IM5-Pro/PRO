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
import UnifiedDashboard from './components/UnifiedDashboard/UnifiedDashboard';
import PunchInOut from './components/PunchInOut/PunchInOut';
import { ROLES } from './utils/roles';

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
 * - One common dashboard layout for all roles
 * - Widgets and pages are rendered based on role
 * 
 * @returns {JSX.Element} - Login or Dashboard based on authentication
 */
const AppContent = () => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();
  const userRole = user?.role;

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
      <div className="app-loading-bg flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="inline-block">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-slate-700 text-lg font-semibold">Loading...</p>
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
  
  // For employee role, check punch status
  if (!isPunchedIn && !hasPunchedInToday && userRole === ROLES.EMPLOYEE && location.pathname !== '/punch') {
    return <Navigate to="/punch" replace />;
  }

  // Non-employee roles should never stay on /punch route.
  if (location.pathname === '/punch' && userRole !== ROLES.EMPLOYEE) {
    return <Navigate to="/" replace />;
  }

  return (
    <ProtectedRoute requiredRole={[ROLES.EMPLOYEE, ROLES.MANAGER, ROLES.HR_ADMIN, ROLES.SUPER_ADMIN]}>
      <Routes>
        {/* ============================================================
            PUNCH IN/OUT ROUTE - employee only
            ============================================================ */}
        <Route
          path="/punch"
          element={userRole === ROLES.EMPLOYEE ? <PunchInOut /> : <Navigate to="/" replace />}
        />

        {/* ============================================================
            COMMON DASHBOARD FOR ALL ROLES
            ============================================================ */}
        <Route path="/*" element={<UnifiedDashboard />} />
      </Routes>
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
