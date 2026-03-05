/**
 * Validation Utilities
 * Contains all validation functions for the HRMS application
 */

/**
 * Validates an email address
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates a phone number
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const validatePhone = (phone) => {
  const phoneRegex = /^\d{10}$/;
  return phoneRegex.test(phone.replace(/[^\d]/g, ''));
};

/**
 * Validates time format (HH:MM)
 * @param {string} time - Time in HH:MM format
 * @returns {boolean} - True if valid, false otherwise
 */
export const validateTime = (time) => {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

/**
 * Validates date format (YYYY-MM-DD)
 * @param {string} date - Date to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const validateDate = (date) => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;
  const dateObj = new Date(date);
  return dateObj instanceof Date && !isNaN(dateObj);
};

/**
 * Validates if required field is not empty
 * @param {string} value - Value to validate
 * @returns {boolean} - True if not empty, false otherwise
 */
export const validateRequired = (value) => {
  return value && value.trim().length > 0;
};

/**
 * Validates password strength
 * @param {string} password - Password to validate
 * @returns {object} - Object containing validation result and message
 */
export const validatePassword = (password) => {
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*]/.test(password);
  const isLengthValid = password.length >= 8;

  const isValid = hasUpperCase && hasLowerCase && hasNumbers && isLengthValid;

  return {
    isValid,
    strength: isValid ? 'strong' : 'weak',
    message: !isLengthValid
      ? 'Password must be at least 8 characters'
      : !hasUpperCase || !hasLowerCase || !hasNumbers
      ? 'Password must contain uppercase, lowercase, and numbers'
      : 'Password is strong',
  };
};

/**
 * Formats a date to readable format
 * @param {string|Date} date - Date to format
 * @returns {string} - Formatted date
 */
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Formats time to HH:MM AM/PM format
 * @param {string|Date} time - Time to format
 * @returns {string} - Formatted time
 */
export const formatTime = (time) => {
  return new Date(time).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};
