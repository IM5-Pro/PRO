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
          className="block text-sm font-medium text-gray-900 mb-2"
        >
          {label}
        </label>
      )}

      {/* Input Container */}
      <div className="relative">
        {/* Input */}
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full py-3 px-4 border rounded-lg transition-all text-base
            ${error 
              ? 'border-red-500 focus:ring-2 focus:ring-red-500 focus:border-transparent' 
              : 'border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            }
            focus:outline-none
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${error ? 'bg-red-50' : ''}
            placeholder:text-gray-500
          `}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : helperText ? `${id}-helper` : undefined}
        />
      </div>

      {/* Error Message */}
      {error && (
        <p id={`${id}-error`} className="text-sm text-red-600 mt-2 font-medium">
          {error}
        </p>
      )}

      {/* Helper Text */}
      {helperText && !error && (
        <p id={`${id}-helper`} className="text-xs text-gray-500 mt-2">
          {helperText}
        </p>
      )}
    </div>
  );
};

export default FormInput;
