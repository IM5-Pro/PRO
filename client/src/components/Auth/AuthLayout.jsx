/**
 * AuthLayout Component
 * Reusable layout wrapper for authentication pages
 * Provides consistent styling and structure
 * 
 * @component
 * @example
 * <AuthLayout title="Sign In" subtitle="HRMS">
 *   <LoginForm />
 * </AuthLayout>
 */

import React from 'react';

/**
 * AuthLayout - Consistent wrapper for auth pages
 * 
 * @param {Object} props - Component props
 * @param {JSX.Element} props.children - Page content
 * @param {string} [props.title] - Page title
 * @param {string} [props.subtitle] - Page subtitle
 * @param {string} [props.emoji] - Header emoji
 * @param {string} [props.footerText] - Footer text
 * @returns {JSX.Element} - Auth layout wrapper
 */
const AuthLayout = ({
  children,
  title = 'HRMS',
  subtitle = 'Human Resource Management System',
  emoji = '👔',
  footerText = '© 2024-2026 HRMS System. All rights reserved.',
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">{emoji}</div>
          <h1 className="text-4xl font-bold text-white mb-2">{title}</h1>
          <p className="text-blue-100">{subtitle}</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-2xl p-8">
          {children}
        </div>

        {/* Footer */}
        <p className="text-center text-blue-100 text-sm mt-8">
          {footerText}
        </p>
      </div>
    </div>
  );
};

export default AuthLayout;
