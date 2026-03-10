/**
 * Utility functions for sending standardized API responses
 */

/**
 * Send an error response
 * @param {Object} res - Express response object
 * @param {number} status - HTTP status code
 * @param {string} message - Error message
 * @param {Object} errors - Error details object
 * @returns {Object} Express response
 */
export const sendError = (res, status, message, errors) => {
  return res.status(status).json({
    success: false,
    message,
    errors,
  });
};

/**
 * Send a success response
 * @param {Object} res - Express response object
 * @param {number} status - HTTP status code
 * @param {string} message - Success message
 * @param {Object} data - Response data object
 * @returns {Object} Express response
 */
export const sendSuccess = (res, status, message, data = {}) => {
  return res.status(status).json({
    success: true,
    message,
    ...data,
  });
};
