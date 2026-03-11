/**
 * AuthContext - Global authentication context
 * Manages user authentication state, roles, and access control
 * 
 * @module AuthContext
 */

import React, { createContext, useState, useCallback, useEffect } from 'react';

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
   * Initialize authentication from localStorage
   * Checks for existing session on app load
   */
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('authToken');

        if (storedUser && token) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        localStorage.removeItem('user');
        localStorage.removeItem('authToken');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

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
      // Simulate API call - Replace with actual backend API
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Invalid email format');
      }

      // Simulate API response
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Mock user data - Replace with actual backend response
      // ROLE DETECTION:
      // - 'hr@...' or 'admin@...' → HR role (access to HR Dashboard)
      // - 'manager@...' → Manager role (access to Manager Dashboard)
      // - default → Employee role (access to Employee Dashboard)
      let userRole = 'employee';
      let userName = 'Employee';
      let department = 'Engineering';
      let avatar = '👨‍💼';

      if (email.includes('admin') || email.includes('hr')) {
        userRole = 'hr';
        userName = 'HR Admin';
        department = 'Human Resources';
        avatar = '👩‍💼';
      } else if (email.includes('manager')) {
        userRole = 'manager';
        userName = 'Sourav';
        department = 'Management';
      } else {
        userName = email.split('@')[0];
      }

      const mockUser = {
        id: '1',
        name: userName,
        email,
        role: userRole,
        department,
        avatar,
      };

      // Generate mock token
      const mockToken = `token_${Date.now()}`;

      // Store auth data
      localStorage.setItem('user', JSON.stringify(mockUser));
      localStorage.setItem('authToken', mockToken);

      // Clear punch-related flags on fresh login
      localStorage.removeItem('isPunchedIn');
      localStorage.removeItem('punchInTime');
      localStorage.removeItem('hasPunchedInToday');
      localStorage.removeItem('dailyWorkingHours');

      setUser(mockUser);
      setIsAuthenticated(true);

      return mockUser;
    } catch (err) {
      const errorMessage = err.message || 'Login failed';
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
  const logout = useCallback(() => {
    try {
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
      
      // Clear punch-related data on logout
      localStorage.removeItem('isPunchedIn');
      localStorage.removeItem('punchInTime');
      localStorage.removeItem('hasPunchedInToday');
      localStorage.removeItem('dailyWorkingHours');
      
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  }, []);

  /**
   * Check if user has specific role
   * @param {string|string[]} role - Role(s) to check
   * @returns {boolean} - True if user has role
   * 
   * @example
   * hasRole('manager') // true or false
   * hasRole(['manager', 'admin']) // true if user has either role
   */
  const hasRole = useCallback(
    (role) => {
      if (!user) return false;
      if (typeof role === 'string') {
        return user.role === role;
      }
      if (Array.isArray(role)) {
        return role.includes(user.role);
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
    return isAuthenticated && !!localStorage.getItem('authToken');
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
    logout,
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
