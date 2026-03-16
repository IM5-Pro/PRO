/**
 * AuthContext - Global authentication context
 * Manages user authentication state, roles, and access control
 * 
 * @module AuthContext
 */

import React, { createContext, useState, useCallback, useEffect } from 'react';
import API from '../api/client';
import { AUTH_ENDPOINTS } from '../api/endpoints';
import { getCookie, getJsonCookie, removeCookie, setCookie, setJsonCookie } from '../utils/cookies';
import { normalizeRole } from '../utils/roles';

const ACCESS_TOKEN_COOKIE = 'authToken';
const REFRESH_TOKEN_COOKIE = 'refreshToken';
const USER_COOKIE = 'user';
const PUNCH_IN_COOKIE = 'isPunchedIn';
const PUNCH_IN_TIME_COOKIE = 'punchInTime';
const PUNCHED_TODAY_COOKIE = 'hasPunchedInToday';
const PUNCH_DAY_COOKIE = 'punchDayKey';
const DAILY_WORKING_HOURS_COOKIE = 'dailyWorkingHours';
const ACCESS_TOKEN_MAX_AGE = 8 * 60 * 60;
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60;

const clearPunchFlags = () => {
  removeCookie(PUNCH_IN_COOKIE);
  removeCookie(PUNCH_IN_TIME_COOKIE);
  removeCookie(PUNCHED_TODAY_COOKIE);
  removeCookie(PUNCH_DAY_COOKIE);
  removeCookie(DAILY_WORKING_HOURS_COOKIE);
};

const clearAuthStorage = () => {
  removeCookie(USER_COOKIE);
  removeCookie(ACCESS_TOKEN_COOKIE);
  removeCookie(REFRESH_TOKEN_COOKIE);
};

const toDisplayName = (user) => {
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim();
  if (fullName) return fullName;
  if (user?.name) return user.name;
  if (user?.email) return user.email.split('@')[0];
  return 'User';
};

const toDepartment = (role) => {
  if (role === 'manager') return 'Management';
  if (role === 'employee') return 'Engineering';
  if (role === 'dept_admin') return 'Department Management';
  return 'Human Resources';
};

const normalizeUser = (user = {}) => {
  const normalizedRole = normalizeRole(user.role);

  return {
    ...user,
    name: toDisplayName(user),
    role: normalizedRole,
    department: user.department || toDepartment(normalizedRole),
    avatar: user.avatar || '👨‍💼',
    mustChangePassword: Boolean(user.mustChangePassword),
  };
};

/**
 * Authentication Context
 * Provides authentication state and methods globally
 */
export const AuthContext = createContext(null);

/**
 * AuthProvider Component
 * Wraps application with authentication context
 * 
 * @component
 * @param {Object} props - Component props
 * @param {JSX.Element} props.children - Child components
 * @returns {JSX.Element} Provider wrapper
 * 
 * @example
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 */
export const AuthProvider = ({ children }) => {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Initialize authentication from persisted user and token cookie
   */
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedUser = getJsonCookie(USER_COOKIE);
        const token = getCookie(ACCESS_TOKEN_COOKIE);

        if (storedUser && token) {
          setUser(normalizeUser(storedUser));
          setIsAuthenticated(true);
        } else {
          clearAuthStorage();
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        clearAuthStorage();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      return undefined;
    }

    const syncSessionWithToken = () => {
      const token = getCookie(ACCESS_TOKEN_COOKIE);
      if (!token) {
        clearAuthStorage();
        clearPunchFlags();
        setUser(null);
        setIsAuthenticated(false);
      }
    };

    syncSessionWithToken();

    const intervalId = window.setInterval(syncSessionWithToken, 30000);
    window.addEventListener('visibilitychange', syncSessionWithToken);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('visibilitychange', syncSessionWithToken);
    };
  }, [isAuthenticated]);

  /**
   * Login user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} - User data on success
   * 
   * @example
   * await login('user@company.com', 'password123');
   */
  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      // Validate email format
      const emailRegex = /^[A-Za-z0-9._%+-]+@ispace\.com$/i;
      if (!emailRegex.test(email)) {
        throw new Error('Email must be a valid @ispace.com address');
      }

      const response = await API.post(AUTH_ENDPOINTS.login, {
        email: email.trim().toLowerCase(),
        password,
      });

      const responsePayload = response?.data;
      const authData = responsePayload?.data || {};

      if (!responsePayload?.success) {
        throw new Error(responsePayload?.message || 'Login failed');
      }

      if (!authData?.accessToken || !authData?.user) {
        throw new Error('Invalid login response from server');
      }

      const normalizedUser = normalizeUser(authData.user);

      setJsonCookie(USER_COOKIE, normalizedUser, REFRESH_TOKEN_MAX_AGE);
      setCookie(ACCESS_TOKEN_COOKIE, authData.accessToken, ACCESS_TOKEN_MAX_AGE);
      if (authData.refreshToken) {
        setCookie(REFRESH_TOKEN_COOKIE, authData.refreshToken, REFRESH_TOKEN_MAX_AGE);
      }

      clearPunchFlags();

      setUser(normalizedUser);
      setIsAuthenticated(true);

      return normalizedUser;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Login failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Logout user
   * Clears authentication state and stored data
   * 
   * @example
   * logout();
   */
  const logout = useCallback(async () => {
    try {
      await API.post(AUTH_ENDPOINTS.logout);
    } catch (err) {
      console.warn('Logout API failed, clearing local session anyway');
    } finally {
      clearAuthStorage();
      clearPunchFlags();
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
    }
  }, []);

  const updateCurrentUser = useCallback((updates = {}) => {
    setUser((currentUser) => {
      if (!currentUser) {
        return currentUser;
      }

      const nextUser = normalizeUser({
        ...currentUser,
        ...updates,
      });

      setJsonCookie(USER_COOKIE, nextUser, REFRESH_TOKEN_MAX_AGE);
      return nextUser;
    });
  }, []);

  /**
   * Register first super admin account
   * @param {string} email - Admin email
   * @param {string} password - Admin password
   * @param {string} name - Optional display name
   * @returns {Promise<Object>} - Registration payload
   */
  const registerAdmin = useCallback(async (email, password, name = '') => {
    setLoading(true);
    setError(null);

    try {
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      const emailRegex = /^[A-Za-z0-9._%+-]+@ispace\.com$/i;
      if (!emailRegex.test(email)) {
        throw new Error('Email must be a valid @ispace.com address');
      }

      const normalizedName = String(name || '').trim();
      const nameParts = normalizedName.split(/\s+/).filter(Boolean);
      const firstName = nameParts[0] || undefined;
      const lastName = nameParts.slice(1).join(' ') || undefined;

      const response = await API.post(AUTH_ENDPOINTS.registerSuperAdmin, {
        email: email.trim().toLowerCase(),
        password,
        firstName,
        lastName,
      });

      const responsePayload = response?.data;
      if (!responsePayload?.success) {
        throw new Error(responsePayload?.message || 'Registration failed');
      }

      return responsePayload?.data || {};
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Registration failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Check if user has specific role
   * @param {string|string[]} role - Role(s) to check
   * @returns {boolean} - True if user has role
   * 
   * @example
   * hasRole('manager') // true or false
   * hasRole(['manager', 'hr_admin']) // true if user has either role
   */
  const hasRole = useCallback(
    (role) => {
      if (!user) return false;
      const userRole = normalizeRole(user.role);

      if (typeof role === 'string') {
        return userRole === normalizeRole(role);
      }

      if (Array.isArray(role)) {
        return role.map((value) => normalizeRole(value)).includes(userRole);
      }

      return false;
    },
    [user]
  );

  /**
   * Check if user is authenticated
   * @returns {boolean} - Authentication status
   */
  const getAuthStatus = useCallback(() => {
    return isAuthenticated && !!getCookie(ACCESS_TOKEN_COOKIE);
  }, [isAuthenticated]);

  /**
   * Get current user
   * @returns {Object|null} - Current user data or null
   */
  const getUser = useCallback(() => {
    return user;
  }, [user]);

  const value = {
    isAuthenticated,
    user,
    loading,
    error,
    login,
    registerAdmin,
    logout,
    updateCurrentUser,
    hasRole,
    getAuthStatus,
    getUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Custom hook to use auth context
 * @returns {Object} - Auth context value
 * 
 * @example
 * const { user, isAuthenticated, login, logout } = useAuth();
 */
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
