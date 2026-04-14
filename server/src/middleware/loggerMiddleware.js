import { appLogger } from '../utils/logger.js';

/**
 * Logger Middleware - Logs all incoming requests and outgoing responses
 * Automatically captures user information, timestamps, and request details
 */
export const loggerMiddleware = (req, res, next) => {
  // Store original send method
  const originalSend = res.send;

  // Log incoming request
  appLogger.logRequest(req, `${req.method} ${req.path}`, {
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
    params: Object.keys(req.params).length > 0 ? req.params : undefined,
    body: req.body && Object.keys(req.body).length > 0 ? { ...req.body, password: '[REDACTED]' } : undefined,
  });

  // Override send to log responses
  res.send = function (data) {
    try {
      let statusCode = res.statusCode;
      let responseData = {};

      if (typeof data === 'string') {
        try {
          responseData = JSON.parse(data);
        } catch {
          responseData = { message: data };
        }
      } else {
        responseData = data;
      }

      appLogger.logResponse(req, statusCode, `${req.method} ${req.path}`, {
        success: responseData.success,
        message: responseData.message,
      });
    } catch (error) {
      appLogger.debug('Error logging response', {
        error: error.message,
      });
    }

    // Call original send
    return originalSend.call(this, data);
  };

  next();
};

/**
 * Error Logging Middleware - Logs all errors with context
 * Should be placed after all other middlewares
 */
export const errorLoggerMiddleware = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const errorMessage = err.message || 'Internal Server Error';

  appLogger.error(
    `Request Error: ${req.method} ${req.path}`,
    err,
    {
      userId: req.user?.id || req.user?._id,
      userName: req.user ? `${req.user.firstName} ${req.user.lastName}` : 'unknown',
      userRole: req.user?.role || 'unknown',
      statusCode,
      errorType: err.name,
    }
  );

  res.status(statusCode).json({
    success: false,
    message: errorMessage,
    error: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};

export default loggerMiddleware;
