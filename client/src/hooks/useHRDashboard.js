/**
 * HR Dashboard Custom Hooks
 * High-level hooks for managing dashboard metrics state
 * Handles loading, caching, error handling, and auto-refresh
 * 
 * @module useHRDashboard
 * @author HR Team
 * @version 1.0.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import * as HRDashboardApi from '../services/hrDashboardApi';

// ============================================================================
// CONSTANTS
// ============================================================================

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const AUTO_REFRESH_INTERVAL = 30 * 1000; // 30 seconds

// ============================================================================
// MAIN DASHBOARD HOOK
// ============================================================================

/**
 * Primary hook for fetching all HR dashboard metrics
 * Combines employee count, pending leaves, new joiners, and payroll completion
 * Includes automatic caching and error handling
 * 
 * @param {Object} options - Configuration options
 * @param {boolean} options.autoRefresh - Enable auto-refresh every 30 seconds
 * @param {boolean} options.cacheEnabled - Enable response caching (default: true)
 * @returns {Object} Dashboard state and methods
 * 
 * @example
 * const metrics = useHRDashboard({ autoRefresh: true });
 * if (metrics.loading) return <Spinner />;
 * 
 * return (
 *   <>
 *     <div>Total Employees: {metrics.totalEmployees}</div>
 *     <div>Pending Leaves: {metrics.pendingLeaveRequests}</div>
 *     <button onClick={metrics.refetch}>Refresh</button>
 *   </>
 * );
 */
export const useHRDashboard = (options = {}) => {
  const [metrics, setMetrics] = useState({
    totalEmployees: 0,
    pendingLeaveRequests: 0,
    newJoiners: 0,
    payrollCompletion: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});
  const cacheRef = useRef({ timestamp: null });

  const { autoRefresh = false, cacheEnabled = true } = options;

  /**
   * Fetch metrics from API or cache
   * @param {boolean} skipCache - Skip cache and force fresh fetch
   */
  const fetchMetrics = useCallback(async (skipCache = false) => {
    // Check cache validity
    if (
      cacheEnabled &&
      !skipCache &&
      cacheRef.current.timestamp &&
      Date.now() - cacheRef.current.timestamp < CACHE_DURATION
    ) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setErrors({});

    try {
      const result = await HRDashboardApi.fetchHRDashboardData();

      if (result.error && !result.totalEmployees) {
        // Only show error if we have no data at all
        setError(result.error);
      } else {
        setError(null);
      }

      setMetrics({
        totalEmployees: result.totalEmployees || 0,
        pendingLeaveRequests: result.pendingLeaveRequests || 0,
        newJoiners: result.newJoiners || 0,
        payrollCompletion: result.payrollCompletion || 0,
      });

      setErrors(result.errors || {});
      cacheRef.current.timestamp = Date.now();
    } catch (err) {
      setError('Failed to load dashboard metrics');
      setMetrics({
        totalEmployees: 0,
        pendingLeaveRequests: 0,
        newJoiners: 0,
        payrollCompletion: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [cacheEnabled]);

  // Initial fetch on mount
  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // Auto-refresh if enabled
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchMetrics(true); // Skip cache on auto-refresh
    }, AUTO_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [autoRefresh, fetchMetrics]);

  /**
   * Manually trigger refresh
   */
  const refetch = useCallback(() => {
    fetchMetrics(true);
  }, [fetchMetrics]);

  return {
    metrics,
    totalEmployees: metrics.totalEmployees,
    pendingLeaveRequests: metrics.pendingLeaveRequests,
    newJoiners: metrics.newJoiners,
    payrollCompletion: metrics.payrollCompletion,
    loading,
    error,
    errors,
    refetch,
  };
};

// ============================================================================
// INDIVIDUAL METRIC HOOKS
// ============================================================================

/**
 * Hook for fetching only total employee count
 * Lightweight option if only employee count is needed
 * 
 * @param {Object} options - Configuration options
 * @returns {Object} Employee count state and methods
 */
export const useTotalEmployees = (options = {}) => {
  const [data, setData] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const cacheRef = useRef({ timestamp: null });

  const { cacheEnabled = true } = options;

  const fetchData = useCallback(async (skipCache = false) => {
    if (
      cacheEnabled &&
      !skipCache &&
      cacheRef.current.timestamp &&
      Date.now() - cacheRef.current.timestamp < CACHE_DURATION
    ) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await HRDashboardApi.fetchTotalEmployees();

      if (result.error) {
        setError(result.error);
        setData(0);
      } else {
        setData(result.data || 0);
        setError(null);
      }

      cacheRef.current.timestamp = Date.now();
    } catch (err) {
      setError('Failed to load employee count');
      setData(0);
    } finally {
      setLoading(false);
    }
  }, [cacheEnabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: () => fetchData(true),
  };
};

/**
 * Hook for fetching only pending leave requests count
 * Lightweight option if only pending leaves count is needed
 * 
 * @param {Object} options - Configuration options
 * @returns {Object} Pending leaves count state and methods
 */
export const usePendingLeaves = (options = {}) => {
  const [data, setData] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const cacheRef = useRef({ timestamp: null });

  const { cacheEnabled = true } = options;

  const fetchData = useCallback(async (skipCache = false) => {
    if (
      cacheEnabled &&
      !skipCache &&
      cacheRef.current.timestamp &&
      Date.now() - cacheRef.current.timestamp < CACHE_DURATION
    ) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await HRDashboardApi.fetchPendingLeaves();

      if (result.error) {
        setError(result.error);
        setData(0);
      } else {
        setData(result.data || 0);
        setError(null);
      }

      cacheRef.current.timestamp = Date.now();
    } catch (err) {
      setError('Failed to load pending leaves');
      setData(0);
    } finally {
      setLoading(false);
    }
  }, [cacheEnabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: () => fetchData(true),
  };
};

/**
 * Hook for fetching only new joiners count
 * Lightweight option if only new joiners count is needed
 * 
 * @param {Object} options - Configuration options
 * @returns {Object} New joiners count state and methods
 */
export const useNewJoiners = (options = {}) => {
  const [data, setData] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const cacheRef = useRef({ timestamp: null });

  const { cacheEnabled = true } = options;

  const fetchData = useCallback(async (skipCache = false) => {
    if (
      cacheEnabled &&
      !skipCache &&
      cacheRef.current.timestamp &&
      Date.now() - cacheRef.current.timestamp < CACHE_DURATION
    ) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await HRDashboardApi.fetchNewJoiners();

      if (result.error) {
        setError(result.error);
        setData(0);
      } else {
        setData(result.data || 0);
        setError(null);
      }

      cacheRef.current.timestamp = Date.now();
    } catch (err) {
      setError('Failed to load new joiners');
      setData(0);
    } finally {
      setLoading(false);
    }
  }, [cacheEnabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: () => fetchData(true),
  };
};

/**
 * Hook for fetching payroll completion percentage
 * Lightweight option if only payroll completion is needed
 * 
 * @param {Object} options - Configuration options
 * @returns {Object} Payroll completion state and methods
 */
export const usePayrollCompletion = (options = {}) => {
  const [data, setData] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const cacheRef = useRef({ timestamp: null });

  const { cacheEnabled = true } = options;

  const fetchData = useCallback(async (skipCache = false) => {
    if (
      cacheEnabled &&
      !skipCache &&
      cacheRef.current.timestamp &&
      Date.now() - cacheRef.current.timestamp < CACHE_DURATION
    ) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await HRDashboardApi.fetchPayrollCompletion();

      if (result.error) {
        setError(result.error);
        setData(0);
      } else {
        setData(result.data || 0);
        setError(null);
      }

      cacheRef.current.timestamp = Date.now();
    } catch (err) {
      setError('Failed to load payroll completion');
      setData(0);
    } finally {
      setLoading(false);
    }
  }, [cacheEnabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: () => fetchData(true),
  };
};

// ============================================================================
// ACTIVITY FEED HOOK
// ============================================================================

/**
 * Hook for fetching activity feed data
 * Combines announcements, departments, appraisals, and payroll info
 * 
 * @param {Object} options - Configuration options
 * @param {boolean} options.autoRefresh - Enable auto-refresh
 * @param {boolean} options.cacheEnabled - Enable caching (default: true)
 * @returns {Object} Activity feed state and methods
 * 
 * @example
 * const { activities, loading, error, refetch } = useActivityFeed();
 */
export const useActivityFeed = (options = {}) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const cacheRef = useRef({ timestamp: null, data: null });

  const { autoRefresh = false, cacheEnabled = true } = options;

  /**
   * Fetch activity feed data
   */
  const fetchData = useCallback(async (skipCache = false) => {
    // Check cache
    if (
      cacheEnabled &&
      !skipCache &&
      cacheRef.current.timestamp &&
      Date.now() - cacheRef.current.timestamp < CACHE_DURATION &&
      cacheRef.current.data
    ) {
      setActivities(cacheRef.current.data);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await HRDashboardApi.fetchActivityFeed();

      if (result.data && result.data.length > 0) {
        setActivities(result.data);
        cacheRef.current.data = result.data;
        cacheRef.current.timestamp = Date.now();
        setError(null);
      } else {
        // Return default activities if no real data
        const defaultActivities = [
          {
            type: 'leaves',
            message: 'Leave approvals pending final verification',
          },
          {
            type: 'department',
            message: 'Department setup requests awaiting approval',
          },
          {
            type: 'appraisal',
            message: 'Quarterly appraisal cycle coming soon',
          },
          {
            type: 'payroll',
            message: 'Payroll processing underway',
          },
        ];
        setActivities(defaultActivities);
        cacheRef.current.data = defaultActivities;
        cacheRef.current.timestamp = Date.now();
      }
    } catch (err) {
      // Fallback activities on error
      const defaultActivities = [
        {
          type: 'leaves',
          message: 'Leave approvals pending final verification',
        },
        {
          type: 'department',
          message: 'Department setup requests awaiting approval',
        },
        {
          type: 'appraisal',
          message: 'Quarterly appraisal cycle coming soon',
        },
        {
          type: 'payroll',
          message: 'Payroll processing underway',
        },
      ];
      setActivities(defaultActivities);
      setError(null); // Silent fail for activity feed
    } finally {
      setLoading(false);
    }
  }, [cacheEnabled]);

  /**
   * Auto-refresh effect
   */
  useEffect(() => {
    fetchData();

    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchData(true);
    }, AUTO_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchData, autoRefresh]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      cacheRef.current = { timestamp: null, data: null };
    };
  }, []);

  return {
    activities,
    loading,
    error,
    refetch: () => fetchData(true),
  };
};

export default {
  useHRDashboard,
  useTotalEmployees,
  usePendingLeaves,
  useNewJoiners,
  usePayrollCompletion,
  useActivityFeed,
};
