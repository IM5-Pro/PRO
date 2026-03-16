/**
 * Leaves & Attendance Custom Hooks
 * High-level hooks for managing leaves and attendance data
 * Handles loading states, caching, error handling, and data refresh
 * 
 * @module useLeavesAttendance
 * @author HR Team
 * @version 1.0.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import * as LeavesAttendanceApi from '../services/leavesAttendanceApi';

// ============================================================================
// CONSTANTS
// ============================================================================

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const AUTO_REFRESH_INTERVAL = 30 * 1000; // 30 seconds

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

/**
 * Hook for fetching and managing leave requests
 * @param {string} type - 'own', 'team', or 'all'
 * @param {Object} options - Configuration options
 * @returns {Object} Leave requests state and methods
 */
export const useLeaveRequests = (type = 'own', options = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const cacheRef = useRef({ timestamp: null, data: [] });

  const { autoRefresh = false, cacheEnabled = true } = options;

  const fetchData = useCallback(async (skipCache = false) => {
    // Check cache
    if (
      cacheEnabled &&
      !skipCache &&
      cacheRef.current.timestamp &&
      Date.now() - cacheRef.current.timestamp < CACHE_DURATION
    ) {
      setData(cacheRef.current.data);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let result;
      if (type === 'all') {
        result = await LeavesAttendanceApi.fetchAllLeaveRequests();
      } else if (type === 'team') {
        result = await LeavesAttendanceApi.fetchTeamLeaveRequests();
      } else {
        result = await LeavesAttendanceApi.fetchOwnLeaveRequests();
      }

      if (result.error) {
        setError(result.error);
        setData([]);
      } else {
        setData(result.data || []);
        cacheRef.current = { timestamp: Date.now(), data: result.data || [] };
      }
    } catch (err) {
      setError('Failed to load leave requests');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [type, cacheEnabled]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchData(true); // Skip cache for auto-refresh
    }, AUTO_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  return {
    data,
    loading,
    error,
    refetch: () => fetchData(true),
  };
};

/**
 * Hook for fetching and managing leave balance
 * @param {Object} options - Configuration options
 * @returns {Object} Leave balance state and methods
 */
export const useLeaveBalance = (options = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const cacheRef = useRef({ timestamp: null, data: [] });

  const { cacheEnabled = true } = options;

  const fetchData = useCallback(async (skipCache = false) => {
    // Check cache
    if (
      cacheEnabled &&
      !skipCache &&
      cacheRef.current.timestamp &&
      Date.now() - cacheRef.current.timestamp < CACHE_DURATION
    ) {
      setData(cacheRef.current.data);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await LeavesAttendanceApi.fetchLeaveBalance();

      if (result.error) {
        setError(result.error);
        setData([]);
      } else {
        setData(result.data || []);
        cacheRef.current = { timestamp: Date.now(), data: result.data || [] };
      }
    } catch (err) {
      setError('Failed to load leave balance');
      setData([]);
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
 * Hook for fetching and managing leave policies
 * @param {Object} options - Configuration options
 * @returns {Object} Leave policies state and methods
 */
export const useLeavePolicies = (options = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const cacheRef = useRef({ timestamp: null, data: [] });

  const { cacheEnabled = true } = options;

  const fetchData = useCallback(async (skipCache = false) => {
    if (
      cacheEnabled &&
      !skipCache &&
      cacheRef.current.timestamp &&
      Date.now() - cacheRef.current.timestamp < CACHE_DURATION * 2 // Longer cache for policies
    ) {
      setData(cacheRef.current.data);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await LeavesAttendanceApi.fetchLeavePolicies();

      if (result.error) {
        setError(result.error);
        setData([]);
      } else {
        setData(result.data || []);
        cacheRef.current = { timestamp: Date.now(), data: result.data || [] };
      }
    } catch (err) {
      setError('Failed to load leave policies');
      setData([]);
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
 * Hook for fetching and managing attendance records
 * @param {string} type - 'own', 'team', or 'all'
 * @param {Object} options - Configuration options
 * @returns {Object} Attendance state and methods
 */
export const useAttendance = (type = 'own', options = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const cacheRef = useRef({ timestamp: null, data: [] });

  const { autoRefresh = false, cacheEnabled = true } = options;

  const fetchData = useCallback(async (skipCache = false) => {
    if (
      cacheEnabled &&
      !skipCache &&
      cacheRef.current.timestamp &&
      Date.now() - cacheRef.current.timestamp < CACHE_DURATION
    ) {
      setData(cacheRef.current.data);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let result;
      if (type === 'all') {
        result = await LeavesAttendanceApi.fetchAllAttendance();
      } else if (type === 'team') {
        result = await LeavesAttendanceApi.fetchTeamAttendance();
      } else {
        result = await LeavesAttendanceApi.fetchOwnAttendance();
      }

      if (result.error) {
        setError(result.error);
        setData([]);
      } else {
        setData(result.data || []);
        cacheRef.current = { timestamp: Date.now(), data: result.data || [] };
      }
    } catch (err) {
      setError('Failed to load attendance records');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [type, cacheEnabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchData(true);
    }, AUTO_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  return {
    data,
    loading,
    error,
    refetch: () => fetchData(true),
  };
};

/**
 * Hook for fetching monthly attendance summary
 * @param {Object} options - Configuration options
 * @returns {Object} Monthly summary state and methods
 */
export const useMonthlySummary = (options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const cacheRef = useRef({ timestamp: null, data: null });

  const { cacheEnabled = true } = options;

  const fetchData = useCallback(async (skipCache = false) => {
    if (
      cacheEnabled &&
      !skipCache &&
      cacheRef.current.timestamp &&
      Date.now() - cacheRef.current.timestamp < CACHE_DURATION
    ) {
      setData(cacheRef.current.data);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await LeavesAttendanceApi.fetchMonthlySummary();

      if (result.error) {
        setError(result.error);
        setData(null);
      } else {
        setData(result.data || null);
        cacheRef.current = { timestamp: Date.now(), data: result.data || null };
      }
    } catch (err) {
      setError('Failed to load monthly summary');
      setData(null);
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
 * Hook for creating a leave request
 * @returns {Object} Handler and submission state
 */
export const useCreateLeaveRequest = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const submit = useCallback(async (leaveData) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    const result = await LeavesAttendanceApi.createLeaveRequest(leaveData);

    if (result.error) {
      setError(result.error);
      setSuccess(false);
    } else {
      setSuccess(true);
      setError(null);
    }

    setLoading(false);
    return result;
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setSuccess(false);
    setLoading(false);
  }, []);

  return {
    submit,
    loading,
    error,
    success,
    reset,
  };
};

/**
 * Hook for approving/rejecting leave requests
 * @returns {Object} Action handlers and state
 */
export const useLeaveActions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const approve = useCallback(async (requestId) => {
    setLoading(true);
    setError(null);

    const result = await LeavesAttendanceApi.approveLeaveRequest(requestId);

    if (result.error) {
      setError(result.error);
    }

    setLoading(false);
    return result;
  }, []);

  const reject = useCallback(async (requestId) => {
    setLoading(true);
    setError(null);

    const result = await LeavesAttendanceApi.rejectLeaveRequest(requestId);

    if (result.error) {
      setError(result.error);
    }

    setLoading(false);
    return result;
  }, []);

  const cancel = useCallback(async (requestId) => {
    setLoading(true);
    setError(null);

    const result = await LeavesAttendanceApi.cancelLeaveRequest(requestId);

    if (result.error) {
      setError(result.error);
    }

    setLoading(false);
    return result;
  }, []);

  return {
    approve,
    reject,
    cancel,
    loading,
    error,
  };
};

/**
 * Hook for fetching complete dashboard data
 * @param {string} userRole - Current user role
 * @param {Object} options - Configuration options
 * @returns {Object} Complete dashboard state
 */
export const useLeavesAttendanceDashboard = (userRole, options = {}) => {
  const [state, setState] = useState({
    leaveRequests: [],
    leaveBalance: [],
    leavePolicies: [],
    attendanceData: [],
    monthlySummary: null,
  });
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const cacheRef = useRef({ timestamp: null });

  const { cacheEnabled = true } = options;

  const fetchAllData = useCallback(async (skipCache = false) => {
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
    setErrors({});

    try {
      const result = await LeavesAttendanceApi.fetchLeavesAttendanceDashboardData(userRole);

      setState({
        leaveRequests: result.leaveRequests || [],
        leaveBalance: result.leaveBalance || [],
        leavePolicies: result.leavePolicies || [],
        attendanceData: result.attendanceData || [],
        monthlySummary: result.monthlySummary || null,
      });

      if (Object.keys(result.errors).length > 0) {
        setErrors(result.errors);
      }

      cacheRef.current.timestamp = Date.now();
    } catch (err) {
      setErrors({ general: 'Failed to load dashboard data' });
    } finally {
      setLoading(false);
    }
  }, [userRole, cacheEnabled]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  return {
    ...state,
    loading,
    errors,
    refetch: () => fetchAllData(true),
  };
};

export default {
  useLeaveRequests,
  useLeaveBalance,
  useLeavePolicies,
  useAttendance,
  useMonthlySummary,
  useCreateLeaveRequest,
  useLeaveActions,
  useLeavesAttendanceDashboard,
};
