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
import loginBg from '../../assets/ispace-bg.png';

const AuthLayout = ({
  children,
  title = 'HRMS',
  subtitle = 'Human Resource Management System',
  emoji = '👔',
  footerText = '© 2024-2026 HRMS System. All rights reserved.',
}) => {
  return (
    // full-screen background image with form overlay on the right
    <div
      className="min-h-screen bg-cover bg-center bg-fixed flex items-center justify-end p-4 md:p-8"
      style={{ backgroundImage: `url(${loginBg})` }}
    >
      <div className="w-full max-w-md mr-4 md:mr-12 lg:mr-20 xl:mr-32">
        {/* Header */}
       

        {/* Content */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/20">
          {children}
        </div>

        {/* Footer */}
        <p className="text-center text-white/90 text-sm mt-8 drop-shadow-md">
          {footerText}
        </p>
      </div>
    </div>
  );
};

export default AuthLayout;
