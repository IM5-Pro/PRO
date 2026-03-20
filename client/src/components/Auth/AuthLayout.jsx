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
 
}) => {
  return (
    // full-screen background image with form card on the right side
    <div
      className="min-h-screen bg-cover bg-center bg-fixed flex flex-col items-center md:items-end justify-center p-2 sm:p-4 md:p-8 relative"
      style={{ backgroundImage: `url(${loginBg})` }}
    >
      {/* Login Card */}
      <div className="w-full max-w-md mx-auto md:mr-8 lg:mr-16 xl:mr-24">
        {/* Content Card */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl p-4 sm:p-6 md:p-10 border border-white/20">
          {/* Logo Header Inside Card */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-blue-600 tracking-tight">
              HRMS
            </h1>
          </div>

          {children}
        </div>
      </div>

      {/* Footer at Bottom Center - Centered Horizontally */}
      <p className="absolute bottom-4 sm:bottom-8 left-1/2 transform -translate-x-1/2 text-center text-blue-900 text-xs sm:text-sm drop-shadow-md font-medium whitespace-nowrap px-2">
        © 2025-2026 HRMS System. All rights reserved.
      </p>
    </div>
  );
};

export default AuthLayout;
