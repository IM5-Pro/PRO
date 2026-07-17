import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isLambda = Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);

// Lambda /var/task is read-only — use /tmp there, otherwise repo logs/
const logsDir = isLambda
  ? path.join('/tmp', 'hrms-logs')
  : path.join(__dirname, '../../logs');

let canWriteFiles = false;
try {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  canWriteFiles = true;
} catch (error) {
  // Never crash app startup if filesystem is read-only
  console.warn(`File logging disabled: ${error.message}`);
  canWriteFiles = false;
}

/**
 * Custom format function to add file, function, and line info
 */
const customFormat = winston.format.printf(({ level, message, timestamp, userId, userName, userRole, metadata = {}, error, ...rest }) => {
  let logMessage = `[${timestamp}] [${level.toUpperCase()}]`;
  
  if (userId) logMessage += ` [USER: ${userId}]`;
  if (userName) logMessage += ` [NAME: ${userName}]`;
  if (userRole) logMessage += ` [ROLE: ${userRole}]`;
  
  logMessage += ` - ${message}`;
  
  if (metadata.file) logMessage += ` [FILE: ${metadata.file}]`;
  if (metadata.function) logMessage += ` [FUNC: ${metadata.function}]`;
  if (metadata.line) logMessage += ` [LINE: ${metadata.line}]`;
  
  if (error) {
    logMessage += `\n  ERROR: ${error.message}`;
    if (error.stack) logMessage += `\n  STACK: ${error.stack}`;
  }
  
  if (Object.keys(rest).length > 0) {
    logMessage += `\n  METADATA: ${JSON.stringify(rest, null, 2)}`;
  }
  
  return logMessage;
});

/**
 * Create a Winston logger instance
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.errors({ stack: true }),
    customFormat
  ),
  defaultMeta: { service: 'hrms-server' },
});

// Console transport (CloudWatch captures this in Lambda)
logger.add(
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize({ all: !isLambda }),
      winston.format.simple(),
      customFormat
    ),
  })
);

// File transports only when the filesystem allows it
if (canWriteFiles) {
  logger.add(
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5,
    })
  );

  logger.add(
    new winston.transports.File({
      filename: path.join(logsDir, 'warn.log'),
      level: 'warn',
      maxsize: 5242880,
      maxFiles: 5,
    })
  );

  logger.add(
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880,
      maxFiles: 5,
    })
  );

  logger.add(
    new winston.transports.File({
      filename: path.join(logsDir, 'debug.log'),
      level: 'debug',
      maxsize: 5242880,
      maxFiles: 5,
    })
  );
}

/**
 * Get caller information (file, function, line number)
 * @returns {Object} {file, function, line}
 */
function getCallerInfo() {
  const stack = new Error().stack.split('\n');
  // Skip the first 3 lines (Error, getCallerInfo, wrapLogger)
  const callerLine = stack[4];
  
  if (!callerLine) {
    return { file: 'unknown', function: 'unknown', line: 0 };
  }
  
  const match = callerLine.match(/\((.+?):(\d+):(\d+)\)/) || callerLine.match(/at (.+?):(\d+):(\d+)/);
  
  if (match) {
    const filePath = match[1];
    const fileName = path.basename(filePath);
    const lineNumber = match[2];
    
    // Extract function name if available
    const funcMatch = callerLine.match(/at (\S+) \(/);
    const functionName = funcMatch ? funcMatch[1] : 'anonymous';
    
    return {
      file: fileName,
      function: functionName,
      line: lineNumber,
    };
  }
  
  return { file: 'unknown', function: 'unknown', line: 0 };
}

/**
 * Wrap logger methods to include caller information
 * @param {winston.Logger} loggerInstance - Winston logger instance
 * @returns {Object} Wrapped logger
 */
function wrapLogger(loggerInstance) {
  return {
    /**
     * Log info level message
     * @param {string} message - Log message
     * @param {Object} metadata - Additional metadata (userId, userName, userRole, etc.)
     */
    info: (message, metadata = {}) => {
      const caller = getCallerInfo();
      loggerInstance.info(message, {
        metadata: caller,
        ...metadata,
      });
    },

    /**
     * Log error level message
     * @param {string} message - Log message
     * @param {Error|Object} error - Error object
     * @param {Object} metadata - Additional metadata
     */
    error: (message, error = null, metadata = {}) => {
      const caller = getCallerInfo();
      loggerInstance.error(message, {
        error,
        metadata: caller,
        ...metadata,
      });
    },

    /**
     * Log warning level message
     * @param {string} message - Log message
     * @param {Object} metadata - Additional metadata
     */
    warn: (message, metadata = {}) => {
      const caller = getCallerInfo();
      loggerInstance.warn(message, {
        metadata: caller,
        ...metadata,
      });
    },

    /**
     * Log debug level message
     * @param {string} message - Log message
     * @param {Object} metadata - Additional metadata
     */
    debug: (message, metadata = {}) => {
      const caller = getCallerInfo();
      loggerInstance.debug(message, {
        metadata: caller,
        ...metadata,
      });
    },

    /**
     * Log with user context
     * @param {string} level - Log level (info, warn, error, debug)
     * @param {string} message - Log message
     * @param {Object} user - User object with id, firstName, lastName, role
     * @param {Error|Object} error - Error object (optional)
     * @param {Object} additionalData - Any additional data to log
     */
    logWithUser: (level, message, user = {}, error = null, additionalData = {}) => {
      const caller = getCallerInfo();
      const logData = {
        userId: user.id || user._id || 'unknown',
        userName: user.firstName && user.lastName 
          ? `${user.firstName} ${user.lastName}` 
          : user.email || 'unknown',
        userRole: user.role || 'unknown',
        metadata: caller,
        ...additionalData,
      };

      if (error) {
        logData.error = error;
      }

      loggerInstance.log(level, message, logData);
    },

    /**
     * Log API request
     * @param {Object} req - Express request object
     * @param {string} message - Log message
     * @param {Object} additionalData - Additional data to log
     */
    logRequest: (req, message, additionalData = {}) => {
      const caller = getCallerInfo();
      const user = req.user || {};
      
      loggerInstance.info(`API Request: ${message}`, {
        userId: user.id || user._id || 'unauthenticated',
        userName: user.firstName && user.lastName 
          ? `${user.firstName} ${user.lastName}` 
          : user.email || 'unauthenticated',
        userRole: user.role || 'unknown',
        method: req.method,
        path: req.path,
        ip: req.ip,
        metadata: caller,
        ...additionalData,
      });
    },

    /**
     * Log API response
     * @param {Object} req - Express request object
     * @param {number} statusCode - HTTP status code
     * @param {string} message - Log message
     * @param {Object} responseData - Response data
     */
    logResponse: (req, statusCode, message, responseData = {}) => {
      const caller = getCallerInfo();
      const user = req.user || {};
      const level = statusCode >= 400 ? 'warn' : 'info';
      
      loggerInstance.log(level, `API Response: ${message}`, {
        userId: user.id || user._id || 'unauthenticated',
        userName: user.firstName && user.lastName 
          ? `${user.firstName} ${user.lastName}` 
          : user.email || 'unauthenticated',
        userRole: user.role || 'unknown',
        method: req.method,
        path: req.path,
        statusCode,
        metadata: caller,
        ...responseData,
      });
    },

    /**
     * Log database operation
     * @param {string} operation - Operation type (CREATE, READ, UPDATE, DELETE)
     * @param {string} model - Model name
     * @param {Object} user - User object
     * @param {Object} details - Operation details
     */
    logDatabaseOperation: (operation, model, user = {}, details = {}) => {
      const caller = getCallerInfo();
      
      loggerInstance.info(`DB Operation: ${operation} ${model}`, {
        userId: user.id || user._id || 'system',
        userName: user.firstName && user.lastName 
          ? `${user.firstName} ${user.lastName}` 
          : user.email || 'system',
        userRole: user.role || 'system',
        operation,
        model,
        metadata: caller,
        ...details,
      });
    },

    /**
     * Log authentication event
     * @param {string} event - Event type (login, logout, failed_login, etc.)
     * @param {Object} user - User object
     * @param {string} details - Event details
     */
    logAuthEvent: (event, user = {}, details = '') => {
      const caller = getCallerInfo();
      const level = event.includes('failed') ? 'warn' : 'info';
      
      loggerInstance.log(level, `Auth Event: ${event}`, {
        userId: user.id || user._id || 'unknown',
        userName: user.email || user.firstName || 'unknown',
        userRole: user.role || 'unknown',
        event,
        details,
        metadata: caller,
      });
    },
  };
}

// Export wrapped logger instance
export const appLogger = wrapLogger(logger);

export default appLogger;
