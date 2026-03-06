/**
 * SubmitButton Component
 * Reusable submit button with loading states and variants
 * Features: Loading spinner, disabled states, customizable styling
 * 
 * @component
 * @example
 * <SubmitButton 
 *   label="Sign In"
 *   isLoading={loading}
 *   loadingLabel="Signing in..."
 *   onClick={handleSubmit}
 * />
 */

import React from 'react';

/**
 * SubmitButton - Reusable form submit button
 * 
 * @param {Object} props - Component props
 * @param {string} props.label - Button label
 * @param {boolean} [props.isLoading] - Loading state
 * @param {string} [props.loadingLabel] - Label while loading
 * @param {Function} [props.onClick] - Click handler
 * @param {boolean} [props.disabled] - Disabled state
 * @param {string} [props.type] - Button type
 * @param {string} [props.variant] - Button variant: 'primary', 'secondary', 'danger'
 * @param {string} [props.size] - Button size: 'sm', 'md', 'lg'
 * @param {string} [props.className] - Additional CSS classes
 * @returns {JSX.Element} - Submit button
 */
const SubmitButton = ({
  label,
  isLoading = false,
  loadingLabel = 'Loading...',
  onClick,
  disabled = false,
  type = 'submit',
  variant = 'primary',
  size = 'md',
  className = '',
}) => {
  // Variant styles
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 disabled:bg-gray-300 text-white',
    danger: 'bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white',
  };

  // Size styles
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isLoading || disabled}
      className={`
        w-full font-semibold rounded-lg transition-all duration-200
        flex items-center justify-center space-x-2
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${isLoading || disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      aria-busy={isLoading}
    >
      {isLoading && (
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
      )}
      <span>{isLoading ? loadingLabel : label}</span>
    </button>
  );
};

export default SubmitButton;
