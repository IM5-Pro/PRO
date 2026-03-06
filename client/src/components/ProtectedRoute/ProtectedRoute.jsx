/**
 * ProtectedRoute Component
 * Wraps routes that require authentication and/or specific roles
 * Redirects unauthenticated users to login page
 * 
 * @component
 * @example
 * <ProtectedRoute 
 *   requiredRole="manager"
 * >
 *   <ManagerDashboard />
 * </ProtectedRoute>
 */

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../Auth/LoadingSpinner';

/**
 * ProtectedRoute - Renders component only if authenticated and authorized
 * 
 * @param {Object} props - Component props
 * @param {JSX.Element} props.children - Component to render if authorized
 * @param {string|string[]} [props.requiredRole] - Required role(s) for access
 * @param {Function} [props.onUnauthorized] - Callback when access denied
 * @returns {JSX.Element} - Protected component or redirect message
 */
const ProtectedRoute = ({ 
  children, 
  requiredRole = null, 
  onUnauthorized = null 
}) => {
  const { isAuthenticated, loading, hasRole, user } = useAuth();

  // Show loading state
  if (loading) {
    return <LoadingSpinner variant="fullpage" message="Loading..." />;
  }

  // Check authentication
  if (!isAuthenticated) {
    if (onUnauthorized) {
      onUnauthorized();
    }
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            You must be logged in to access this page.
          </p>
          <div className="text-gray-500 text-sm">
            Please log in to continue.
          </div>
        </div>
      </div>
    );
  }

  // Check role authorization
  if (requiredRole && !hasRole(requiredRole)) {
    if (onUnauthorized) {
      onUnauthorized();
    }
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Unauthorized</h2>
          <p className="text-gray-600 mb-4">
            You don't have permission to access this resource.
          </p>
          <div className="bg-gray-50 p-4 rounded mb-6">
            <p className="text-xs text-gray-500">
              <strong>Your Role:</strong> {user?.role || 'Unknown'}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              <strong>Required:</strong> {Array.isArray(requiredRole) ? requiredRole.join(' or ') : requiredRole}
            </p>
          </div>
          <p className="text-gray-500 text-sm">
            Contact your administrator if you believe this is an error.
          </p>
        </div>
      </div>
    );
  }

  // User is authenticated and authorized
  return children;
};

export default ProtectedRoute;
