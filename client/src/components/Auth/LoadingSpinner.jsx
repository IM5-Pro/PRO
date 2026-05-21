/**
 * LoadingSpinner — reusable loading indicator (inline, full-page, card).
 */

import React from 'react';

const sizeConfig = {
  sm: { spinner: 'h-5 w-5', text: 'text-sm' },
  md: { spinner: 'h-10 w-10', text: 'text-base' },
  lg: { spinner: 'h-12 w-12', text: 'text-lg' },
};

const spinnerClass = (sizeClass) =>
  `shrink-0 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600 ${sizeClass}`;

const LoadingSpinner = ({
  variant = 'inline',
  message = 'Loading...',
  size = 'md',
  className = '',
}) => {
  const config = sizeConfig[size] || sizeConfig.md;

  if (variant === 'inline') {
    return (
      <div
        className={`inline-flex items-center justify-center gap-3 ${className}`}
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div className={spinnerClass(config.spinner)} aria-hidden="true" />
        {message ? (
          <span className={`leading-none text-gray-600 ${config.text}`}>{message}</span>
        ) : null}
      </div>
    );
  }

  if (variant === 'fullpage') {
    return (
      <div
        className={`app-loading-bg flex h-screen items-center justify-center ${className}`}
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div className="flex flex-col items-center justify-center gap-4 px-4 text-center">
          <div className={spinnerClass(config.spinner)} aria-hidden />
          {message ? (
            <p className={`m-0 font-medium leading-snug text-gray-600 ${config.text}`}>
              {message}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-4 p-8 ${className}`}
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div className={spinnerClass(config.spinner)} aria-hidden />
        {message ? (
          <p className={`m-0 text-center text-gray-600 ${config.text}`}>{message}</p>
        ) : null}
      </div>
    );
  }

  return null;
};

export default LoadingSpinner;
