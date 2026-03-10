/**
 * HRDashboard Component (Main Page)
 * Comprehensive HR dashboard layout for managing all HR operations
 * Features: Responsive grid layout, modular sidebar, dynamic page switching, user authentication
 * 
 * @component
 * @author HR Team
 * @version 2.0.0
 * @example
 * <HRDashboard />
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import HRSidebar from '../HRSidebar/HRSidebar';
import HRHeader from '../HRHeader/HRHeader';
import ManpowerPlanning from '../Pages/HR/ManpowerPlanning';
import HRUserManagement from '../Pages/HR/UserManagement';
import LeavesAttendance from '../Pages/HR/LeavesAttendance';
import Masters from '../Pages/HR/Masters';
import HRPayroll from '../Pages/HR/Payroll';
import ExitClearance from '../Pages/HR/ExitClearance';
import LetterTemplates from '../Pages/HR/LetterTemplates';
import AdminPanelConfig from '../Pages/HR/AdminPanelConfig';
import Workflows from '../Pages/HR/Workflows';
import MeetingRoom from '../Pages/HR/MeetingRoom';
import bgImage from '../../assets/Background.png';

/**
 * Validation constants for user data
 * @type {Object}
 */
const VALIDATION_RULES = {
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 50,
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  ROLES: ['admin', 'hr', 'manager', 'employee'],
};

/**
 * Page configuration with metadata
 * @type {Array<{id: string, label: string, component: React.Component, icon: string, category: string, description: string}>}
 */
const PAGE_CONFIGS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    component: ManpowerPlanning,
    icon: '📊',
    category: 'overview',
    description: 'HR dashboard overview',
  },
  {
    id: 'manpower',
    label: 'Manpower Planning',
    component: ManpowerPlanning,
    icon: '👥',
    category: 'planning',
    description: 'Manage workforce planning and forecasting',
  },
  {
    id: 'users',
    label: 'User Management',
    component: HRUserManagement,
    icon: '👤',
    category: 'admin',
    description: 'Create and manage user accounts',
  },
  {
    id: 'leaves',
    label: 'Leaves & Attendance',
    component: LeavesAttendance,
    icon: '📅',
    category: 'attendance',
    description: 'Manage leaves and attendance records',
  },
  {
    id: 'masters',
    label: 'Masters',
    component: Masters,
    icon: '⚙️',
    category: 'config',
    description: 'Configure master data',
  },
  {
    id: 'payroll',
    label: 'Payroll',
    component: HRPayroll,
    icon: '💰',
    category: 'payroll',
    description: 'Manage payroll and salary structures',
  },
  {
    id: 'exit',
    label: 'Exit Clearance Dept',
    component: ExitClearance,
    icon: '🚪',
    category: 'exit',
    description: 'Handle employee exit clearance',
  },
  {
    id: 'templates',
    label: 'Letter Templates',
    component: LetterTemplates,
    icon: '📄',
    category: 'templates',
    description: 'Manage letter templates',
  },
  {
    id: 'admin',
    label: 'Admin Panel Configuration',
    component: AdminPanelConfig,
    icon: '🔧',
    category: 'admin',
    description: 'Configure admin panel settings',
  },
  {
    id: 'workflows',
    label: 'Workflows',
    component: Workflows,
    icon: '🔄',
    category: 'workflow',
    description: 'Manage HR workflows and approvals',
  },
  {
    id: 'meeting',
    label: 'Meeting Room',
    component: MeetingRoom,
    icon: '📞',
    category: 'meeting',
    description: 'Book and manage meeting rooms',
  },
];

/**
 * HRDashboard Component
 * Main dashboard layout for HR management with comprehensive functionality
 * 
 * @returns {JSX.Element} Complete HR dashboard with sidebar, header, and current page content
 */
const HRDashboard = () => {
  // ============================================================================
  // CONTEXT HOOKS
  // ============================================================================
  const { user = {}, logout } = useAuth();
  const { colors } = useTheme();
  const navigate = useNavigate();

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [notificationCount, setNotificationCount] = useState(3);
  const [isLoading, setIsLoading] = useState(false);

  // ============================================================================
  // USER DATA WITH FALLBACKS
  // ============================================================================
  const CURRENT_HR_USER = useMemo(
    () => ({
      name: user?.name || 'HR Administrator',
      email: user?.email || 'hr@company.com',
      role: user?.role || 'hr',
      avatar: user?.avatar || '👨‍💼',
      department: user?.department || 'Human Resources',
    }),
    [user]
  );

  // ============================================================================
  // VALIDATION FUNCTIONS
  // ============================================================================

  /**
   * Validate user data against defined rules
   * @param {Object} userData - User data to validate
   * @returns {Object} Validation result with isValid and errors array
   */
  const validateUserData = useCallback((userData) => {
    const errors = [];

    if (!userData.name || userData.name.length < VALIDATION_RULES.MIN_NAME_LENGTH) {
      errors.push('Name must be at least 2 characters long');
    }

    if (userData.name && userData.name.length > VALIDATION_RULES.MAX_NAME_LENGTH) {
      errors.push('Name must not exceed 50 characters');
    }

    if (!VALIDATION_RULES.EMAIL_PATTERN.test(userData.email)) {
      errors.push('Please enter a valid email address');
    }

    if (userData.role && !VALIDATION_RULES.ROLES.includes(userData.role)) {
      errors.push('Invalid role selected');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, []);

  /**
   * Validate page navigation
   * @param {string} pageId - Page ID to navigate to
   * @returns {boolean} True if page exists
   */
  const isValidPage = useCallback((pageId) => {
    return PAGE_CONFIGS.some((page) => page.id === pageId);
  }, []);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Handle navigation between different HR pages
   * Validates page ID before navigation and handles errors gracefully
   * 
   * @param {string} pageId - ID of the page to navigate to
   */
  const handleNavigation = useCallback((pageId) => {
    if (!isValidPage(pageId)) {
      console.error(`Invalid page ID: ${pageId}`);
      return;
    }

    console.log(`Navigating to: ${pageId}`);
    setCurrentPage(pageId);
    setIsLoading(false);
  }, [isValidPage]);

  /**
   * Handle profile-related actions (logout, profile view, etc.)
   * Performs validation and appropriate action routing
   * 
   * @param {string} action - Action type ('logout', 'profile', etc.)
   */
  const handleProfileAction = useCallback((action) => {
    if (typeof action !== 'string') {
      console.error('Invalid action type');
      return;
    }

    switch (action) {
      case 'logout':
        console.log('User logging out...');
        logout();
        navigate('/login');
        break;
      case 'profile':
        console.log('Opening user profile...');
        // Navigate to profile page
        break;
      case 'settings':
        console.log('Opening settings...');
        // Navigate to settings page
        break;
      default:
        console.warn(`Unknown action: ${action}`);
    }
  }, [logout]);

  /**
   * Handle notification clearing
   * Updates notification count and logs action
   */
  const handleClearNotifications = useCallback(() => {
    setNotificationCount(0);
    console.log('Notifications cleared');
  }, []);

  /**
   * Handle user data update with validation
   * @param {Object} updatedData - Updated user data
   */
  const handleUserDataUpdate = useCallback((updatedData) => {
    const validation = validateUserData(updatedData);
    if (!validation.isValid) {
      console.error('Validation failed:', validation.errors);
      return false;
    }

    console.log('User data updated:', updatedData);
    return true;
  }, [validateUserData]);

  // ============================================================================
  // RENDER PAGE CONTENT
  // ============================================================================

  /**
   * Render the current page component based on currentPage state
   * Includes error boundary and loading state handling
   * 
   * @returns {JSX.Element} Current page component or fallback UI
   */
  const renderPageContent = useCallback(() => {
    const pageConfig = PAGE_CONFIGS.find((page) => page.id === currentPage);

    if (!pageConfig) {
      return (
        <div
          className={`flex items-center justify-center min-h-screen bg-gradient-to-br ${colors.gradient.primary}`}
        >
          <div className={`text-center p-8 rounded-2xl ${colors.bg.secondary} border-2 ${colors.border.primary}`}>
            <p className={`text-2xl font-bold ${colors.text.primary} mb-2`}>Page Not Found</p>
            <p className={colors.text.tertiary}>The requested page does not exist.</p>
            <button
              onClick={() => handleNavigation('dashboard')}
              className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-300"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      );
    }

    const CurrentPageComponent = pageConfig.component;

    return (
      <CurrentPageComponent
        user={CURRENT_HR_USER}
        onUserUpdate={handleUserDataUpdate}
        pageConfig={pageConfig}
      />
    );
  }, [currentPage, colors, handleNavigation, CURRENT_HR_USER, handleUserDataUpdate]);

  // ============================================================================
  // COMPONENT RENDER
  // ============================================================================

  return (
    <div
      className="flex h-screen bg-cover bg-center bg-fixed overflow-hidden"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      {/* ========================================
          SIDEBAR NAVIGATION
          ======================================== */}
      <HRSidebar
        currentPage={currentPage}
        onNavigate={handleNavigation}
        pageConfigs={PAGE_CONFIGS}
      />

      {/* ========================================
          MAIN CONTENT AREA
          ======================================== */}
      <div className="flex-1 flex flex-col overflow-hidden md:ml-0">
        {/* Header */}
        <HRHeader
          user={CURRENT_HR_USER}
          onProfileClick={handleProfileAction}
          notificationCount={notificationCount}
          onClearNotifications={handleClearNotifications}
        />

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-8">
            {isLoading ? (
              <div className="flex items-center justify-center h-96">
                <div className="text-white text-lg">Loading...</div>
              </div>
            ) : (
              renderPageContent()
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

// ============================================================================
// PROP VALIDATION (Development only)
// ============================================================================
HRDashboard.propTypes = {};

// ============================================================================
// EXPORTS
// ============================================================================
export default HRDashboard;
export { PAGE_CONFIGS, VALIDATION_RULES };
