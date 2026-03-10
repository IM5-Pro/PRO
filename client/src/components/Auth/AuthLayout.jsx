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
  footerText = '© 2025-2026 HRMS System. All rights reserved.',
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
        <div className="bg-white/20 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/20">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-600 bg-clip-text text-transparent text-center drop-shadow-lg mb-2">
            {title}
          </h1>
          <h2 className="text-lg text-black text-center mb-8 drop-shadow-md">
            Sign In
          </h2>
          {children}
          <p className="text-center text-black/90 text-sm mt-8 drop-shadow-md">
            {footerText}
          </p>
        </div>

        {/* Footer */}

      </div>
    </div>
  );
};

export default AuthLayout;
