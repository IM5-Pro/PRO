/**
 * HR Dashboard Overview Component
 * Displays key HR metrics with real-time data from API
 * Metrics: Total Employees, Pending Leaves, New Joiners, Payroll Completion
 * 
 * @component
 * @author HR Team
 * @version 2.0.0 (API Integrated)
 * @example
 * <DashboardOverview user={currentUser} onNavigate={handleNavigate} />
 */

import React, { useMemo, useState, useEffect } from 'react';
import { FiRefreshCw } from 'react-icons/fi';
import { useTheme } from '../../../context/ThemeContext';
import { useHRDashboard, useActivityFeed } from '../../../hooks/useHRDashboard';

/**
 * DashboardOverview Component
 * Fetches and displays 4 key HR metrics with loading and error handling
 */
const DashboardOverview = ({ user = {}, onNavigate = () => {} }) => {
  const { colors } = useTheme();
  const [currentTime, setCurrentTime] = useState(new Date());
  const dashboardMetrics = useHRDashboard({ autoRefresh: false, cacheEnabled: true });
  const activityFeedData = useActivityFeed({ autoRefresh: false, cacheEnabled: true });

  // Update time every minute for greeting
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  /**
   * Get time-based greeting
   */
  const greeting = useMemo(() => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, [currentTime]);

  /**
   * Extract user's display name with proper formatting
   */
  const userDisplayName = useMemo(() => {
    // Capitalize first letter of a word
    const capitalize = (str) => {
      if (!str) return '';
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    };

    // Prefer firstName + lastName
    if (user?.firstName) {
      const first = capitalize(user.firstName);
      const last = user?.lastName ? capitalize(user.lastName) : '';
      return last ? `${first} ${last}` : first;
    }

    // If name exists, try to extract proper format
    if (user?.name) {
      const name = String(user.name).trim();
      
      // If name contains dots (email-like: satish.yalla), convert to readable name
      if (name.includes('.') && !name.includes('@')) {
        const parts = name.split('.');
        return parts.map(capitalize).join(' ');
      }

      // If name has spaces, capitalize each word
      if (name.includes(' ')) {
        return name.split(' ').map(capitalize).join(' ');
      }

      // Single word name
      return capitalize(name);
    }

    return 'HR Administrator';
  }, [user?.firstName, user?.lastName, user?.name]);

  /**
   * Build dashboard cards with real data
   */
  const overviewCards = useMemo(() => {
    return [
      {
        id: 'employees',
        title: 'Total Employees',
        value: dashboardMetrics.totalEmployees.toLocaleString(),
        subtitle: 'Across all departments',
        accent: 'from-blue-500 to-cyan-500',
        loading: dashboardMetrics.loading,
        error: dashboardMetrics.errors?.employees,
      },
      {
        id: 'leave-requests',
        title: 'Pending Leave Requests',
        value: dashboardMetrics.pendingLeaveRequests.toString(),
        subtitle: 'Need HR review',
        accent: 'from-amber-500 to-orange-500',
        loading: dashboardMetrics.loading,
        error: dashboardMetrics.errors?.leaves,
      },
      {
        id: 'new-joiners',
        title: 'New Joiners This Month',
        value: dashboardMetrics.newJoiners.toString(),
        subtitle: 'Onboarding in progress',
        accent: 'from-emerald-500 to-teal-500',
        loading: dashboardMetrics.loading,
        error: dashboardMetrics.errors?.employees,
      },
      {
        id: 'payroll-status',
        title: 'Payroll Cycle',
        value: `${dashboardMetrics.payrollCompletion}%`,
        subtitle: 'Current month completion',
        accent: 'from-fuchsia-500 to-pink-500',
        loading: dashboardMetrics.loading,
        error: dashboardMetrics.errors?.payroll,
      },
    ];
  }, [dashboardMetrics]);

  const activityFeed = useMemo(
    () => {
      // If we have real activity data from API, use it
      if (activityFeedData.activities && activityFeedData.activities.length > 0) {
        return activityFeedData.activities.map((activity) => {
          if (activity.type === 'leaves') {
            return `${dashboardMetrics.pendingLeaveRequests} leave approvals pending final verification`;
          }
          return activity.message || activity;
        });
      }

      // Fallback to dynamic data with leave count
      return [
        `${dashboardMetrics.pendingLeaveRequests} leave approvals pending final verification`,
        '2 new departments requested for setup',
        'Quarterly appraisal cycle starts next week',
        'Payroll lock date is scheduled for Friday',
      ];
    },
    [dashboardMetrics.pendingLeaveRequests, activityFeedData.activities]
  );

  /**
   * Build quick access items
   */
  const quickAccessItems = useMemo(
    () => [
      { id: 'user-management', label: 'User Management' },
      { id: 'leaves-attendance', label: 'Leaves and Attendance' },
      { id: 'hr-payroll', label: 'Payroll' },
    ],
    []
  );

  return (
    <div className="min-h-screen bg-transparent p-6 md:p-8">
      {/* Loading state */}
      {dashboardMetrics.loading && (
        <div className="mb-8 rounded-2xl p-6 bg-blue-50 border border-blue-200 flex items-center gap-3">
          <FiRefreshCw className="animate-spin text-blue-600" size={20} />
          <p className="text-blue-700 font-medium">Loading dashboard metrics...</p>
        </div>
      )}

      {/* Error state */}
      {dashboardMetrics.error && !dashboardMetrics.totalEmployees && (
        <div className="mb-8 rounded-2xl p-6 bg-red-50 border border-red-200">
          <p className="text-red-700 font-medium mb-3">{dashboardMetrics.error}</p>
          <button
            onClick={() => {
              dashboardMetrics.refetch();
              activityFeedData.refetch();
            }}
            disabled={dashboardMetrics.loading}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg disabled:opacity-50 transition-all"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Header */}
      <div
        className="mb-8 rounded-2xl p-6 bg-white/10 backdrop-blur-3xl border border-white/30 ring-1 ring-white/20"
        style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}
      >
        <h1 className={`text-4xl font-bold ${colors.text.primary} mb-2`}>
          HR Dashboard
        </h1>
        <p className={colors.text.tertiary}>
          {greeting}, {userDisplayName}! Here is the high-level HR snapshot for today.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {overviewCards.map((card) => (
          <div
            key={card.id}
            onClick={() => {
              // Navigate to related page based on card type (HR Admin pages)
              if (card.id === 'employees') onNavigate('user-management');
              else if (card.id === 'leave-requests') onNavigate('leaves-attendance');
              else if (card.id === 'new-joiners') onNavigate('user-management');
              else if (card.id === 'payroll-status') onNavigate('hr-payroll');
            }}
            className={`bg-gradient-to-br ${colors.gradient.card} rounded-2xl border-2 ${colors.border.primary} p-6 hover:border-slate-300 hover:shadow-lg cursor-pointer transition-all duration-300 ${
              card.error ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                if (card.id === 'employees') onNavigate('user-management');
                else if (card.id === 'leave-requests') onNavigate('leaves-attendance');
                else if (card.id === 'new-joiners') onNavigate('user-management');
                else if (card.id === 'payroll-status') onNavigate('hr-payroll');
              }
            }}
          >
            <div className={`w-12 h-1 rounded-full bg-gradient-to-r ${card.accent} mb-5`} />
            <p className={`${colors.text.tertiary} text-sm font-medium mb-2`}>{card.title}</p>
            
            {/* Loading skeleton */}
            {card.loading ? (
              <div className="h-10 bg-slate-300 rounded animate-pulse mb-3" />
            ) : (
              <p className={`text-3xl font-bold ${colors.text.primary} mb-1`}>{card.value}</p>
            )}
            
            <p className={`text-sm ${colors.text.secondary}`}>{card.subtitle}</p>
            
            {/* Error indicator */}
            {card.error && (
              <p className="text-xs text-red-500 mt-2">⚠️ {card.error}</p>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white/10 backdrop-blur-2xl border border-white/30 rounded-2xl p-6">
          <h2 className={`text-2xl font-bold ${colors.text.primary} mb-4`}>Today Highlights</h2>
          <div className="space-y-3">
            {activityFeed.map((item) => (
              <div
                key={item}
                className="px-4 py-3 rounded-xl bg-white/20 border border-white/30 text-slate-800"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-2xl border border-white/30 rounded-2xl p-6">
          <h2 className={`text-2xl font-bold ${colors.text.primary} mb-4`}>Quick Access</h2>
          <div className="space-y-3">
            {quickAccessItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className="w-full text-left px-4 py-3 rounded-xl bg-slate-100/30 border border-slate-300/60 text-slate-800 font-medium hover:bg-slate-200/60 hover:border-slate-400 transition-all duration-200"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
