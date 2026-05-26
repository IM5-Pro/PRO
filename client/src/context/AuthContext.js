/**
 * AuthContext - Global authentication context (HttpOnly cookie sessions)
 */

import React, { createContext, useState, useCallback, useEffect } from 'react';
import API from '../api/client';
import { AUTH_ENDPOINTS } from '../api/endpoints';
import IdleSessionGuard from '../components/Auth/IdleSessionGuard';
import { removeCookie } from '../utils/cookies';
import { normalizeRole } from '../utils/roles';

const USER_STORAGE_KEY = 'hrms_user';
const PUNCH_IN_COOKIE = 'isPunchedIn';
const PUNCH_IN_TIME_COOKIE = 'punchInTime';
const PUNCHED_TODAY_COOKIE = 'hasPunchedInToday';
const PUNCH_DAY_COOKIE = 'punchDayKey';
const DAILY_WORKING_HOURS_COOKIE = 'dailyWorkingHours';

const clearPunchFlags = () => {
  removeCookie(PUNCH_IN_COOKIE);
  removeCookie(PUNCH_IN_TIME_COOKIE);
  removeCookie(PUNCHED_TODAY_COOKIE);
  removeCookie(PUNCH_DAY_COOKIE);
  removeCookie(DAILY_WORKING_HOURS_COOKIE);
};

const clearUserStorage = () => {
  try {
    sessionStorage.removeItem(USER_STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
  removeCookie('user');
  removeCookie('authToken');
  removeCookie('refreshToken');
};

const readStoredUser = () => {
  try {
    const raw = sessionStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const persistUser = (user) => {
  try {
    sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } catch {
    // ignore storage errors
  }
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
    designation: user.designation || '',
    department:
      user.department != null && String(user.department).trim()
        ? user.department
        : toDepartment(normalizedRole),
    avatar: user.avatar || '👨‍💼',
    mustChangePassword: Boolean(user.mustChangePassword),
  };
};

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const initializeAuth = async () => {
      const cachedUser = readStoredUser();
      if (cachedUser) {
        setUser(normalizeUser(cachedUser));
        setIsAuthenticated(true);
      }

      try {
        const response = await API.get(AUTH_ENDPOINTS.me);
        const payload = response?.data;
        const sessionUser = payload?.data?.user;

        if (!payload?.success || !sessionUser) {
          throw new Error('Session invalid');
        }

        if (!cancelled) {
          const normalized = normalizeUser(sessionUser);
          persistUser(normalized);
          setUser(normalized);
          setIsAuthenticated(true);
        }
      } catch {
        if (!cancelled) {
          clearUserStorage();
          clearPunchFlags();
          setUser(null);
          setIsAuthenticated(false);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email, password) => {
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

      const response = await API.post(AUTH_ENDPOINTS.login, {
        email: email.trim().toLowerCase(),
        password,
      });

      const responsePayload = response?.data;
      const authData = responsePayload?.data || {};

      if (!responsePayload?.success) {
        throw new Error(responsePayload?.message || 'Login failed');
      }

      if (!authData?.user) {
        throw new Error('Invalid login response from server');
      }

      const normalizedUser = normalizeUser(authData.user);
      persistUser(normalizedUser);
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

  const logout = useCallback(async () => {
    try {
      await API.post(AUTH_ENDPOINTS.logout);
    } catch (err) {
      console.warn('Logout API failed, clearing local session anyway');
    } finally {
      clearUserStorage();
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

      persistUser(nextUser);
      return nextUser;
    });
  }, []);

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
    [user],
  );

  const getAuthStatus = useCallback(() => isAuthenticated, [isAuthenticated]);

  const getUser = useCallback(() => user, [user]);

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

  return (
    <AuthContext.Provider value={value}>
      <IdleSessionGuard />
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

