/**
 * FormInput Component
 * Reusable form input field with icon support
 * Features: validation, error display, accessibility
 * 
 * @component
 * @example
 * <FormInput
 *   label="Email"
 *   type="email"
 *   icon={FiMail}
 *   value={email}
 *   onChange={handleChange}
 *   error={emailError}
 * />
 */

import React from 'react';

/**
 * FormInput - Reusable input field
 * 
 * @param {Object} props - Component props
 * @param {string} props.label - Input label
 * @param {string} props.type - Input type (text, email, password, etc.)
 * @param {string} props.id - Input ID
 * @param {string} props.value - Current value
 * @param {Function} props.onChange - Change handler
 * @param {React.ComponentType} [props.icon] - Icon component
 * @param {string} [props.placeholder] - Placeholder text
 * @param {string} [props.error] - Error message
 * @param {string} [props.helperText] - Helper text below input
 * @param {boolean} [props.disabled] - Disabled state
 * @param {string} [props.className] - Additional CSS classes
 * @returns {JSX.Element} - Form input field
 */
const FormInput = ({
  label,
  type = 'text',
  id,
  value,
  onChange,
  icon: Icon,
  placeholder,
  error,
  helperText,
  disabled = false,
  className = '',
}) => {
  return (
    <div className={className}>
      {/* Label */}
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          {label}
        </label>
      )}

      {/* Input Container */}
      <div className="relative">
        {/* Icon */}
        {Icon && (
          <Icon className="absolute left-3 top-3.5 text-gray-400 pointer-events-none" />
        )}

        {/* Input */}
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full py-2.5 border rounded-lg transition-all
            ${Icon ? 'pl-10' : 'pl-4'} pr-4
            ${error 
              ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
              : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
            }
            focus:outline-none focus:ring-2
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${error ? 'bg-red-50' : ''}
          `}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : helperText ? `${id}-helper` : undefined}
        />
      </div>

      {/* Error Message */}
      {error && (
        <p id={`${id}-error`} className="text-sm text-red-600 mt-1 font-medium">
          {error}
        </p>
      )}

      {/* Helper Text */}
      {helperText && !error && (
        <p id={`${id}-helper`} className="text-xs text-gray-500 mt-1">
          {helperText}
        </p>
      )}
    </div>
  );
};

export default FormInput;
