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
      className="relative flex min-h-[100dvh] flex-col items-center justify-center bg-cover bg-center bg-no-repeat p-3 sm:p-4 md:items-end md:p-8 lg:p-10 xl:p-12 md:bg-fixed"
      style={{ backgroundImage: `url(${loginBg})` }}
    >
      {/* Login Card */}
      <div className="mx-auto w-full max-w-sm sm:max-w-md md:mr-8 lg:mr-16 xl:mr-24 2xl:mr-32">
        {/* Content Card */}
        <div className="rounded-2xl border border-im5-border-soft bg-im5-surface/90 p-4 shadow-2xl backdrop-blur-md sm:rounded-3xl sm:p-6 md:p-10">
          {/* Logo Header Inside Card */}
          <div className="mb-5 text-center sm:mb-6 md:mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-blue-600 sm:text-3xl md:text-4xl">
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
