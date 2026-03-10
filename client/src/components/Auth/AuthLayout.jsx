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
    // full-screen background image with form card on the right side
    <div
      className="min-h-screen bg-cover bg-center bg-fixed flex flex-col items-end justify-center p-4 md:p-8 relative"
      style={{ backgroundImage: `url(${loginBg})` }}
    >
      {/* Login Card */}
      <div className="w-full max-w-md mr-8 md:mr-16 lg:mr-24">
        {/* Content Card */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl p-10 border border-white/20">
          {/* Logo Header Inside Card */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-blue-600 tracking-tight">
              HRMS
            </h1>
          </div>

          {children}
          <p className="text-center text-black/90 text-sm mt-8 drop-shadow-md">
            {footerText}
          </p>
        </div>
      </div>

      {/* Footer at Bottom Center - Centered Horizontally */}
      <p className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center text-blue-900 text-sm drop-shadow-md font-medium whitespace-nowrap">
        © 2025-2026 HRMS System. All rights reserved.
      </p>
    </div>
  );
};

export default AuthLayout;
