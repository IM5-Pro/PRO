/**
 * LoadingSpinner Component
 * Reusable loading indicator with multiple variants
 * Features: Skeleton loaders, full-page spinner, inline loaders
 * 
 * @component
 * @example
 * <LoadingSpinner />
 * <LoadingSpinner variant="fullpage" message="Loading dashboard..." />
 */

import React from 'react';

/**
 * LoadingSpinner - Reusable loading indicator
 * 
 * @param {Object} props - Component props
 * @param {string} [props.variant] - Spinner variant: 'inline', 'fullpage', 'card'
 * @param {string} [props.message] - Loading message
 * @param {string} [props.size] - Spinner size: 'sm', 'md', 'lg'
 * @param {string} [props.className] - Additional CSS classes
 * @returns {JSX.Element} - Loading spinner component
 */
const LoadingSpinner = ({
  variant = 'inline',
  message = 'Loading...',
  size = 'md',
  className = '',
}) => {
  // Size configurations
  const sizeConfig = {
    sm: {
      spinner: 'h-6 w-6',
      text: 'text-sm',
    },
    md: {
      spinner: 'h-12 w-12',
      text: 'text-base',
    },
    lg: {
      spinner: 'h-16 w-16',
      text: 'text-lg',
    },
  };

  const config = sizeConfig[size];

  // Inline variant
  if (variant === 'inline') {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div
          className={`
            animate-spin rounded-full border-2 border-blue-200 
            border-t-blue-600 ${config.spinner}
          `}
        ></div>
        {message && <span className={`text-gray-600 ${config.text}`}>{message}</span>}
      </div>
    );
  }

  // Full page variant
  if (variant === 'fullpage') {
    return (
      <div className="app-loading-bg flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="inline-block">
            <div
              className={`
                animate-spin rounded-full border-4 border-blue-200 
                border-t-blue-600 ${config.spinner}
              `}
            ></div>
          </div>
          {message && (
            <p className={`mt-4 text-gray-600 font-medium ${config.text}`}>
              {message}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Card variant (smaller, for cards/sections)
  if (variant === 'card') {
    return (
      <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
        <div
          className={`
            animate-spin rounded-full border-3 border-blue-200 
            border-t-blue-500 ${config.spinner}
          `}
        ></div>
        {message && (
          <p className={`mt-4 text-gray-600 ${config.text}`}>
            {message}
          </p>
        )}
      </div>
    );
  }

  return null;
};

export default LoadingSpinner;
