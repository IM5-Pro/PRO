/**
 * ManpowerPlanning Component
 * Dashboard page for workforce planning and forecasting with API integration
 * 
 * Features:
 * - Real-time workforce metrics from API
 * - Interactive cards with navigation
 * - Department-wise workforce summary
 * - Trend analysis visualization-ready data
 * - Responsive layout with comprehensive error handling
 * - Loading states and data validation
 * 
 * @component
 * @author HR Team
 * @version 2.0.0
 * @example
 * <ManpowerPlanning user={currentUser} pageConfig={pageConfig} />
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FiBarChart2, FiBriefcase, FiClock, FiEdit2, FiTrendingUp, FiUserPlus, FiUsers, FiAlertCircle } from 'react-icons/fi';
import RupeeIcon from '../../icons/RupeeIcon';
import { useTheme } from '../../../context/ThemeContext';
import manpowerPlanningApi from '../../../services/manpowerPlanningApi';


// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

/**
 * Validation rules for planning data
 */
const VALIDATION_RULES = {
  MIN_HEADCOUNT: 0,
  MAX_HEADCOUNT: 10000,
  VALID_DEPARTMENTS: ['IT', 'HR', 'Finance', 'Operations', 'Sales', 'Marketing'],
  METRICS_REFETCH_INTERVAL: 30000, // 30 seconds
};

/**
 * Loading states enum
 */
const LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
};

/**
 * Card navigation configuration
 * Maps card IDs to their available dashboard pages
 */
const CARD_NAVIGATION_CONFIG = {
  'total-strength': {
    page: 'user-management',
    label: 'User Management',
    description: 'View and manage employee users',
  },
  'open-positions': {
    page: 'announcements',
    label: 'Announcements',
    description: 'View job openings and announcements',
  },
  'pending-approvals': {
    page: 'leaves-attendance',
    label: 'Leaves & Attendance',
    description: 'Review pending leave requests',
  },
  'dept-efficiency': {
    page: 'masters',
    label: 'Masters',
    description: 'View department-wise metrics and efficiency',
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * ManpowerPlanning Component
 * Main dashboard for HR workforce planning with API integration
 * 
 * @param {Object} props - Component props
 * @param {Object} props.user - Current user object
 * @param {Object} props.pageConfig - Page configuration
 * @param {Function} props.onUserUpdate - Callback for user updates
 * @param {Function} props.onNavigate - Callback to navigate to other pages
 * @returns {JSX.Element} Manpower planning dashboard
 */
const ManpowerPlanning = ({ user = {}, pageConfig = {}, onUserUpdate = () => {}, onNavigate = () => {} }) => {
  const { colors } = useTheme();

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  // Metrics state
  const [metricsState, setMetricsState] = useState({
    loading: LOADING_STATES.IDLE,
    data: null,
    error: null,
  });

  // Department data state
  const [departmentsState, setDepartmentsState] = useState({
    loading: LOADING_STATES.IDLE,
    data: [],
    error: null,
  });

  // Active card for highlighting/selection
  const [activeCardId, setActiveCardId] = useState(null);

  // ============================================================================
  // API INTEGRATION & DATA FETCHING
  // ============================================================================

  /**
   * Fetch workforce metrics from API
   * Handles data transformation, error handling, and fallback values
   * @async
   */
  const fetchMetrics = useCallback(async () => {
    try {
      setMetricsState((prev) => ({ ...prev, loading: LOADING_STATES.LOADING }));

      const result = await manpowerPlanningApi.getMetrics();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch metrics');
      }

      // Transform API response to card format
      const metrics = result.metrics;
      const transformedCards = [
        {
          id: 'total-strength',
          title: 'Total Strength',
          value: metrics.totalStrength?.value || 0,
          unit: 'employees',
          icon: FiUsers,
          color: 'from-blue-500 to-cyan-500',
          change: metrics.totalStrength?.trend?.change || 0,
          trend: metrics.totalStrength?.trend?.isPositive ? 'up' : 'down',
        },
        {
          id: 'open-positions',
          title: 'Open Positions',
          value: metrics.openPositions?.value || 0,
          unit: 'roles',
          icon: FiBriefcase,
          color: 'from-purple-500 to-pink-500',
          change: metrics.openPositions?.trend?.change || 0,
          trend: metrics.openPositions?.trend?.isPositive ? 'up' : 'down',
        },
        {
          id: 'pending-approvals',
          title: 'Pending Approvals',
          value: metrics.pendingApprovals?.value || 0,
          unit: 'requests',
          icon: FiClock,
          color: 'from-yellow-500 to-orange-500',
          change: Math.abs(metrics.pendingApprovals?.trend?.change || 0),
          trend: metrics.pendingApprovals?.trend?.isPositive ? 'up' : 'down',
        },
        {
          id: 'dept-efficiency',
          title: 'Department Efficiency',
          value: metrics.departmentEfficiency?.value || 0,
          unit: '%',
          icon: FiBarChart2,
          color: 'from-green-500 to-emerald-500',
          change: metrics.departmentEfficiency?.trend?.change || 0,
          trend: metrics.departmentEfficiency?.trend?.isPositive ? 'up' : 'down',
        },
      ];

      setMetricsState({
        loading: LOADING_STATES.SUCCESS,
        data: transformedCards,
        error: null,
      });
    } catch (err) {
      console.error('Error fetching metrics:', err);
      setMetricsState({
        loading: LOADING_STATES.ERROR,
        data: null,
        error: err.message || 'Failed to load workforce metrics. Please try again.',
      });
    }
  }, []);

  /**
   * Fetch department summary data from API
   * @async
   */
  const fetchDepartments = useCallback(async () => {
    try {
      setDepartmentsState((prev) => ({ ...prev, loading: LOADING_STATES.LOADING }));

      const result = await manpowerPlanningApi.getDepartmentsSummary();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch department data');
      }

      setDepartmentsState({
        loading: LOADING_STATES.SUCCESS,
        data: result.departments || [],
        error: null,
      });
    } catch (err) {
      console.error('Error fetching departments:', err);
      setDepartmentsState({
        loading: LOADING_STATES.ERROR,
        data: [],
        error: err.message || 'Failed to load department data.',
      });
    }
  }, []);

  /**
   * Initialize data fetching on component mount
   * Sets up periodic refresh interval for metrics
   */
  useEffect(() => {
    // Fetch data immediately on mount
    fetchMetrics();
    fetchDepartments();

    // Set up periodic refresh for metrics (every 30 seconds)
    const metricsInterval = setInterval(fetchMetrics, VALIDATION_RULES.METRICS_REFETCH_INTERVAL);

    // Cleanup interval on unmount
    return () => {
      if (metricsInterval) {
        clearInterval(metricsInterval);
      }
    };
  }, [fetchMetrics, fetchDepartments]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Handle card click - Navigate to relevant dashboard page
   * @param {string} cardId - ID of clicked card
   */
  const handleCardClick = useCallback(
    (cardId) => {
      const config = CARD_NAVIGATION_CONFIG[cardId];
      console.log('Card clicked:', cardId, 'Config:', config);
      if (config) {
        setActiveCardId(cardId);
        console.log('Navigating via onNavigate to page:', config.page);
        // Use the onNavigate callback to properly update dashboard state
        onNavigate(config.page);
      } else {
        console.warn('No config found for card:', cardId);
      }
    },
    [onNavigate]
  );

  /**
   * Handle planning form submission
   * @param {Object} formData - Form data object
   */
  const handlePlanningSubmit = useCallback((formData) => {
    console.log('Planning form submitted:', formData);
    // TODO: Implement actual API call for creating workforce plan
  }, []);

  /**
   * Handle error retry
   */
  const handleRetry = useCallback(() => {
    fetchMetrics();
    fetchDepartments();
  }, [fetchMetrics, fetchDepartments]);

  // ============================================================================
  // MEMOIZED UI COMPONENTS
  // ============================================================================

  /**
   * Render stats cards grid
   * Each card is clickable and navigates to relevant page
   */
  const StatsCardsGrid = useMemo(
    () => (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6 mb-8">
        {metricsState.data && metricsState.data.map((card) => {
          const CardIcon = card.icon;
          const config = CARD_NAVIGATION_CONFIG[card.id];
          const isActive = activeCardId === card.id;

          return (
            <div
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleCardClick(card.id);
                }
              }}
              className={`group cursor-pointer bg-gradient-to-br ${colors.gradient.card} rounded-2xl border-2 ${colors.border.primary} p-4 md:p-6 hover:border-slate-400 transition-all duration-300 hover:shadow-2xl ${colors.shadow} transform hover:-translate-y-1 ${
                isActive ? 'ring-2 ring-blue-500' : ''
              }`}
              title={config ? `Click to view ${config.description}` : 'Card'}
            >
              {/* Icon & Trend Badge */}
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 md:p-3 rounded-xl bg-gradient-to-br ${card.color} text-white`}>
                  <CardIcon size={20} className="md:w-6 md:h-6" />
                </div>
                <span
                  className={`text-xs font-semibold ${
                    card.trend === 'up' ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {card.trend === 'up' ? '+' : ''}{card.change.toFixed(1)}
                </span>
              </div>

              {/* Card Title */}
              <p className={`${colors.text.tertiary} text-xs md:text-sm font-medium mb-1`}>{card.title}</p>

              {/* Card Value */}
              <div className="flex items-baseline gap-2">
                <p className={`text-2xl md:text-3xl font-bold ${colors.text.primary}`}>{card.value}</p>
                <p className={`${colors.text.tertiary} text-xs md:text-sm`}>{card.unit}</p>
              </div>

              {/* Navigation hint */}
              {config && (
                <p className={`text-xs ${colors.text.tertiary} mt-3 opacity-0 group-hover:opacity-100 transition-opacity`}>
                  Click to view {config.label}
                </p>
              )}
            </div>
          );
        })}
      </div>
    ),
    [metricsState.data, activeCardId, colors, handleCardClick]
  );

  /**
   * Render error state
   */
  const ErrorAlert = useMemo(
    () =>
      metricsState.error ? (
        <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
          <FiAlertCircle className="text-red-500 mt-1 flex-shrink-0" size={20} />
          <div className="flex-1">
            <p className={`font-semibold ${colors.text.primary}`}>Unable to Load Metrics</p>
            <p className={`text-sm ${colors.text.tertiary} mt-1`}>{metricsState.error}</p>
            <button
              onClick={handleRetry}
              className="mt-2 px-3 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      ) : null,
    [metricsState.error, colors, handleRetry]
  );

  /**
   * Render loading skeleton
   */
  const LoadingSkeletons = useMemo(
    () => (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`bg-gradient-to-br ${colors.gradient.card} rounded-2xl border-2 ${colors.border.primary} p-4 md:p-6 animate-pulse`}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-slate-700 rounded-xl" />
              <div className="w-12 h-6 bg-slate-700 rounded" />
            </div>
            <div className="w-20 h-4 bg-slate-700 rounded mb-2" />
            <div className="w-16 h-8 bg-slate-700 rounded" />
          </div>
        ))}
      </div>
    ),
    [colors]
  );

  // ============================================================================
  // COMPONENT RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-transparent p-4 md:p-6 lg:p-8 w-full overflow-x-hidden">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 rounded-2xl p-4 md:p-6 bg-white/10 backdrop-blur-3xl border border-white/30 ring-1 ring-white/20 shadow-xl shadow-slate-900/10 gap-4">
        <div className="w-full md:w-auto">
          <h1 className={`text-2xl md:text-4xl font-bold ${colors.text.primary} mb-2 flex items-center gap-3 flex-wrap`}>
            <FiBarChart2 size={28} className="md:w-9 md:h-9" /> Manpower Planning
          </h1>
          <p className={`${colors.text.tertiary} text-sm md:text-base`}>
            Workforce forecasting and strategic planning dashboard
          </p>
        </div>

        {/* Create Workforce Plan Button */}
        <button
          onClick={() => handlePlanningSubmit({ source: 'quick-action' })}
          className="hidden md:inline-flex items-center px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-semibold transition-all duration-300 flex-shrink-0"
        >
          Create Workforce Plan
        </button>
      </div>

      {/* Error Alert */}
      {ErrorAlert}

      {/* Stats Cards Grid - Show loading skeleton or actual cards */}
      {metricsState.loading === LOADING_STATES.LOADING ? LoadingSkeletons : StatsCardsGrid}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 w-full">
        {/* Department Statistics */}
        <div className="lg:col-span-2 w-full min-w-0">
          <div
            className={`bg-gradient-to-br ${colors.gradient.card} rounded-2xl border-2 ${colors.border.primary} p-4 md:p-6 hover:border-slate-400 transition-all duration-300 w-full h-full`}
          >
            <h2 className={`text-xl md:text-2xl font-bold ${colors.text.primary} mb-6`}>
              Department Overview
            </h2>

            {/* Loading State */}
            {departmentsState.loading === LOADING_STATES.LOADING ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-12 bg-slate-700/50 rounded animate-pulse" />
                ))}
              </div>
            ) : departmentsState.error ? (
              <p className={`text-center py-4 ${colors.text.tertiary}`}>
                Failed to load department data
              </p>
            ) : (
              <div className="overflow-x-auto -mx-4 md:-mx-6 px-4 md:px-6">
                <table className="w-full">
                  <thead>
                    <tr className={`border-b ${colors.border.secondary}`}>
                      <th className={`text-left py-3 px-4 ${colors.text.tertiary} font-semibold text-sm`}>
                        Department
                      </th>
                      <th className={`text-left py-3 px-4 ${colors.text.tertiary} font-semibold text-sm`}>
                        Strength
                      </th>
                      <th className={`text-left py-3 px-4 ${colors.text.tertiary} font-semibold text-sm`}>
                        Budget
                      </th>
                      <th className={`text-left py-3 px-4 ${colors.text.tertiary} font-semibold text-sm`}>
                        Efficiency
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {departmentsState.data && departmentsState.data.length > 0 ? (
                      departmentsState.data.map((dept) => (
                        <tr
                          key={dept.name}
                          className={`border-b ${colors.border.secondary} hover:bg-slate-700/50 transition-colors cursor-pointer`}
                        >
                          <td className={`py-3 px-4 ${colors.text.primary} font-medium`}>
                            {dept.name}
                          </td>
                          <td className={`py-3 px-4 ${colors.text.secondary}`}>{dept.strength}</td>
                          <td className={`py-3 px-4 ${colors.text.secondary}`}>
                            ₹{(dept.budget / 100000).toFixed(1)}L
                          </td>
                          <td className={`py-3 px-4`}>
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                                  style={{ width: `${Math.min(dept.efficiency, 100)}%` }}
                                />
                              </div>
                              <span className={`text-sm ${colors.text.secondary}`}>
                                {dept.efficiency}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className={`text-center py-4 ${colors.text.tertiary}`}>
                          No departments available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="w-full min-w-0">
          <div
            className={`bg-gradient-to-br ${colors.gradient.card} rounded-2xl border-2 ${colors.border.primary} p-4 md:p-6 h-full w-full`}
          >
            <h2 className={`text-xl md:text-2xl font-bold ${colors.text.primary} mb-6`}>Quick Actions</h2>

            <div className="space-y-3">
              {[
                { label: 'Create Plan', icon: FiEdit2, onClick: () => handlePlanningSubmit({ source: 'quick-action' }) },
                { label: 'View Reports', icon: FiTrendingUp, page: 'announcements' },
                { label: 'Department Stats', icon: FiBarChart2, page: 'masters' },
                { label: 'Budget Review', icon: RupeeIcon, page: 'hr-payroll' },
                { label: 'Recruitment', icon: FiUserPlus, page: 'user-management' },
              ].map((action, idx) => {
                const ActionIcon = action.icon;
                const handleActionClick = () => {
                  if (action.onClick) {
                    action.onClick();
                  } else if (action.page) {
                    console.log('Quick action navigating to:', action.page);
                    onNavigate(action.page);
                  }
                };

                return (
                  <button
                    key={idx}
                    onClick={handleActionClick}
                    className={`w-full flex items-center gap-3 px-4 py-3 bg-slate-100/30 border ${colors.border.secondary} rounded-xl ${colors.text.tertiary} hover:text-slate-900 hover:bg-slate-200/50 hover:border-slate-400 transition-all duration-300 font-medium`}
                  >
                    <ActionIcon size={18} />
                    <span>{action.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManpowerPlanning;
