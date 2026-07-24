/**
 * Main Application Component
 * HRMS Dashboard - Complete routing with authentication and sidebar navigation
 * Routes between Login, Employee Dashboard, and various dashboard pages
 */

import React, { Suspense, lazy } from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { PunchProvider } from './context/PunchContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import LoadingSpinner from './components/Auth/LoadingSpinner';
import { getCookie } from './utils/cookies';
import { ROLES } from './utils/roles';

const Login = lazy(() => import('./components/Login/Login'));
const Register = lazy(() => import('./components/Register/Register'));
const UnifiedDashboard = lazy(() => import('./components/UnifiedDashboard/UnifiedDashboard'));
const PunchInOut = lazy(() => import('./components/PunchInOut/PunchInOut'));

const getPunchDayKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
};

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
    return <LoadingSpinner variant="fullpage" message="Loading..." size="lg" />;
  }

  // ============================================================================
  // NOT AUTHENTICATED - REDIRECT TO LOGIN PAGE
  // ============================================================================
  if (!isAuthenticated) {
    const redirectPath = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to={`/login?redirect=${encodeURIComponent(redirectPath)}`} replace />;
  }

  // ============================================================================
  // AUTHENTICATED - ROLE-BASED DASHBOARD ROUTING
  // ============================================================================

  // Check if user needs to punch in/out first (on dashboard root entry).
  // Ignore ?page= so a restored deep link (e.g. /?page=leaves) cannot skip attendance.
  // hasPunchedInToday allows punch out without forced return to punch screen.
  const isPunchCookieCurrent = getCookie('punchDayKey') === getPunchDayKey();
  const isPunchedIn = getCookie('isPunchedIn') === 'true' && isPunchCookieCurrent;
  const hasPunchedInToday = getCookie('hasPunchedInToday') === 'true' && isPunchCookieCurrent;
  const punchRoles = [ROLES.EMPLOYEE, ROLES.MANAGER, ROLES.HR_ADMIN];
  if (
    !isPunchedIn &&
    !hasPunchedInToday &&
    punchRoles.includes(userRole) &&
    location.pathname === '/'
  ) {
    return <Navigate to="/punch" replace />;
  }

  // Only super admin should never stay on /punch route.
  if (location.pathname === '/punch' && !punchRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  return (
    <ProtectedRoute requiredRole={[ROLES.EMPLOYEE, ROLES.MANAGER, ROLES.HR_ADMIN, ROLES.SUPER_ADMIN]}>
      <NotificationProvider userRole={userRole}>
        <Suspense fallback={<LoadingSpinner variant="fullpage" message="Loading..." size="lg" />}>
          <Routes>
            {/* ============================================================
                PUNCH IN/OUT ROUTE - employee only
                ============================================================ */}
            <Route
              path="/punch"
              element={[ROLES.EMPLOYEE, ROLES.MANAGER, ROLES.HR_ADMIN].includes(userRole) ? <PunchInOut /> : <Navigate to="/" replace />}
            />

            {/* ============================================================
                COMMON DASHBOARD FOR ALL ROLES
                ============================================================ */}
            <Route path="/*" element={<UnifiedDashboard />} />
          </Routes>
        </Suspense>
      </NotificationProvider>
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
          <PunchProvider>
            <Routes>
              {/* LOGIN ROUTE - Always accessible */}
              <Route
                path="/login"
                element={(
                  <Suspense fallback={<LoadingSpinner variant="fullpage" message="Loading..." size="lg" />}>
                    <Login />
                  </Suspense>
                )}
              />
              <Route
                path="/register"
                element={(
                  <Suspense fallback={<LoadingSpinner variant="fullpage" message="Loading..." size="lg" />}>
                    <Register />
                  </Suspense>
                )}
              />
              
              {/* MAIN APP ROUTES - Protected by AppContent */}
              <Route path="/*" element={<AppContent />} />
            </Routes>
          </PunchProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
