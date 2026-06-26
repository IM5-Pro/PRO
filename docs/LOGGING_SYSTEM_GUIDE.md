# Comprehensive Logging System Guide - HRMS

## Overview
This document explains the implementation and usage of the comprehensive logging system for the HRMS application. The system uses **Winston** as the logging framework and captures:
- **Who**: User ID, Name, and Role
- **When**: Precise timestamp (YYYY-MM-DD HH:mm:ss.SSS)
- **Where**: File name, Function name, and Line number
- **What**: Log level (INFO, ERROR, WARN, DEBUG)

---

## 1. Setup & Installation

### 1.1 Dependencies Added
The logging system requires **Winston 3.11.0**:
```json
{
  "dependencies": {
    "winston": "^3.11.0"
  }
}
```

### 1.2 Installation
```bash
npm install
```

### 1.3 Log Directory
Logs are automatically stored in: `server/logs/`

Log files created:
- `error.log` - Only errors (max 5MB, keeps 5 files)
- `warn.log` - Warnings and errors (max 5MB, keeps 5 files)
- `debug.log` - All debug level logs (max 5MB, keeps 5 files)
- `combined.log` - All logs (max 5MB, keeps 5 files)
- Console output - Colorized for development

---

## 2. Core Logger Methods

### 2.1 Basic Logging Methods

#### `appLogger.info(message, metadata = {})`
Log information-level messages
```javascript
import { appLogger } from '../utils/logger.js';

appLogger.info('User logged in successfully', {
  userId: user.id,
  userName: user.email,
  userRole: 'employee',
});
```

#### `appLogger.error(message, error = null, metadata = {})`
Log error-level messages with optional error object
```javascript
try {
  await someOperation();
} catch (error) {
  appLogger.error('Operation failed', error, {
    userId: user.id,
    userName: user.email,
    userRole: 'admin',
  });
}
```

#### `appLogger.warn(message, metadata = {})`
Log warning-level messages
```javascript
appLogger.warn('Deprecated API endpoint used', {
  userId: user.id,
  endpoint: '/api/old-endpoint',
});
```

#### `appLogger.debug(message, metadata = {})`
Log debug-level messages (useful for development)
```javascript
appLogger.debug('Processing user data', {
  userId: user.id,
  dataSize: records.length,
});
```

### 2.2 Advanced Context-Aware Methods

#### `appLogger.logWithUser(level, message, user = {}, error = null, additionalData = {})`
Log with complete user context
```javascript
appLogger.logWithUser(
  'info',
  'Leave request submitted',
  req.user,
  null,
  {
    leaveType: 'annual',
    duration: 5,
  }
);
```

#### `appLogger.logRequest(req, message, additionalData = {})`
Log incoming API requests (automatically extracts user context)
```javascript
appLogger.logRequest(req, 'getUserProfile called', {
  userId: req.query.id,
});
```

#### `appLogger.logResponse(req, statusCode, message, responseData = {})`
Log outgoing API responses
```javascript
appLogger.logResponse(req, 200, 'User retrieved successfully', {
  userId: user.id,
  role: user.role,
});
```

#### `appLogger.logDatabaseOperation(operation, model, user = {}, details = {})`
Log database operations (CREATE, READ, UPDATE, DELETE)
```javascript
appLogger.logDatabaseOperation('CREATE', 'Leave', req.user, {
  leaveId: newLeave._id,
  leaveType: 'annual',
  days: 5,
});
```

#### `appLogger.logAuthEvent(event, user = {}, details = '')`
Log authentication events
```javascript
appLogger.logAuthEvent('login', user, 'Successful login from 192.168.1.1');
appLogger.logAuthEvent('failed_login', { email: 'user@example.com' }, 'Invalid password');
appLogger.logAuthEvent('logout', user, 'User session ended');
```

---

## 3. Logger Middleware Integration

### 3.1 Setup in Express
Add the logger middleware to your `index.js` or main app file:

```javascript
import express from 'express';
import loggerMiddleware, { errorLoggerMiddleware } from './src/middleware/loggerMiddleware.js';

const app = express();

// Add logger middleware EARLY in the middleware stack
app.use(loggerMiddleware);

// ... other middlewares

// All your routes here

// Add error logger middleware LAST
app.use(errorLoggerMiddleware);
```

### 3.2 Automatic Request/Response Logging
The middleware automatically logs:
- All incoming requests with method, path, query, and body (passwords redacted)
- All outgoing responses with status code and message
- All errors with full stack trace

---

## 4. Log Output Format

### 4.1 Console Output Example
```
[2026-04-14 10:30:45.123] [INFO] [USER: 507f1f77bcf86cd799439011] [NAME: John Doe] [ROLE: manager] - API Request: getNotifications called [FILE: NotificationController.js] [FUNC: getNotifications] [LINE: 25]
  METADATA: {
    "method": "GET",
    "path": "/api/notifications",
    "ip": "192.168.1.1",
    "queryParams": {
      "limit": 10,
      "skip": 0
    }
  }
```

### 4.2 File Output Example
Each log entry in files includes:
- Timestamp (precise to milliseconds)
- Log Level (INFO, ERROR, WARN, DEBUG)
- User Context (ID, Name, Role)
- Location (File, Function, Line)
- Message
- Additional Metadata
- Stack trace (for errors)

---

## 5. Integration Examples

### 5.1 Controller Function with Logging
```javascript
import { appLogger } from '../utils/logger.js';

export const submitLeaveRequest = async (req, res) => {
  try {
    appLogger.logRequest(req, 'submitLeaveRequest called', {
      leaveType: req.body.type,
    });

    // Validate input
    if (!req.body.type || !req.body.startDate) {
      appLogger.warn('Invalid leave request data', {
        userId: req.user.id,
        userName: `${req.user.firstName} ${req.user.lastName}`,
        userRole: req.user.role,
        missingFields: ['type', 'startDate'],
      });
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Create leave
    const leave = new Leave(req.body);
    await leave.save();

    appLogger.logDatabaseOperation('CREATE', 'Leave', req.user, {
      leaveId: leave._id,
      type: leave.type,
      startDate: leave.startDate,
    });

    appLogger.logResponse(req, 201, 'Leave request created', {
      leaveId: leave._id,
    });

    res.status(201).json({ success: true, leave });
  } catch (error) {
    appLogger.error('Error in submitLeaveRequest', error, {
      userId: req.user?.id,
      userName: req.user ? `${req.user.firstName} ${req.user.lastName}` : 'unknown',
      userRole: req.user?.role,
      requestBody: { ...req.body, password: '[REDACTED]' },
    });
    res.status(500).json({ success: false, message: 'Error submitting leave request' });
  }
};
```

### 5.2 Service Function with Logging
```javascript
import { appLogger } from '../utils/logger.js';

export const calculateSalary = async (employeeId, user) => {
  try {
    appLogger.logWithUser('info', 'Calculating salary', user, null, {
      employeeId,
    });

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      appLogger.warn('Employee not found for salary calculation', {
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        userRole: user.role,
        employeeId,
      });
      throw new Error('Employee not found');
    }

    // Complex calculation logic
    const salary = await performSalaryCalculation(employee);

    appLogger.logDatabaseOperation('READ', 'Employee', user, {
      employeeId,
      salary: salary.total,
    });

    return salary;
  } catch (error) {
    appLogger.error('Error calculating salary', error, {
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      userRole: user.role,
      employeeId,
    });
    throw error;
  }
};
```

### 5.3 Middleware Function with Logging
```javascript
import { appLogger } from '../utils/logger.js';

export const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      appLogger.warn('Missing authentication token', {
        path: req.path,
        ip: req.ip,
      });
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    appLogger.logAuthEvent('token_verified', decoded);
    next();
  } catch (error) {
    appLogger.error('Authentication failed', error, {
      path: req.path,
      ip: req.ip,
    });
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};
```

---

## 6. Log Levels and When to Use

| Level | When to Use | Example |
|-------|------------|---------|
| **INFO** | Normal operations, successful transactions | User login, leave approved, file uploaded |
| **ERROR** | Unexpected failures, exceptions | Database error, API timeout, validation failed |
| **WARN** | Potentially problematic situations | Deprecated API used, unusual pattern detected |
| **DEBUG** | Development info, detailed operational data | Variable values, loop iterations, cache hits |

---

## 7. Accessing Logs

### 7.1 Real-time Console Logs
```bash
npm start
# Logs appear in terminal with color coding
```

### 7.2 Log Files
```bash
# View error logs
cat server/logs/error.log

# View last 100 lines of combined logs
tail -100 server/logs/combined.log

# Search for specific user
grep "USER: 507f1f77bcf86cd799439011" server/logs/combined.log

# Search for specific error
grep "ERROR" server/logs/error.log

# Search for specific function
grep "getNotifications" server/logs/combined.log

# Live monitoring
tail -f server/logs/combined.log
```

---

## 8. Best Practices

### 8.1 Always Log User Context
```javascript
// ✅ GOOD
appLogger.error('Failed to create leave', error, {
  userId: req.user.id,
  userName: `${req.user.firstName} ${req.user.lastName}`,
  userRole: req.user.role,
});

// ❌ BAD
appLogger.error('Failed to create leave', error);
```

### 8.2 Use Appropriate Log Levels
```javascript
// ✅ GOOD
appLogger.info('Notification sent'); // Successful operation
appLogger.warn('Retry attempt 3/5'); // Potentially problematic
appLogger.error('Email service down', error); // Failure with error

// ❌ BAD
appLogger.error('Notification sent'); // Success shouldn't be error
```

### 8.3 Redact Sensitive Information
```javascript
// ✅ GOOD
appLogger.info('User authenticated', {
  password: '[REDACTED]',
  creditCard: '[REDACTED]',
});

// ❌ BAD
appLogger.info('User authenticated', {
  password: 'user123password',
  creditCard: '1234-5678-9012-3456',
});
```

### 8.4 Use Request/Response Loggers
```javascript
// ✅ GOOD
export const createLeave = async (req, res) => {
  try {
    appLogger.logRequest(req, 'createLeave called');
    // ... logic
    appLogger.logResponse(req, 201, 'Leave created', { leaveId });
  } catch (error) {
    appLogger.error('createLeave failed', error, {
      userId: req.user?.id,
    });
  }
};

// ❌ BAD - Manual logging for each step
appLogger.info('User called createLeave endpoint');
appLogger.info('Request received');
appLogger.info('Processing data');
// ... etc
```

### 8.5 Include Relevant Context
```javascript
// ✅ GOOD
appLogger.logDatabaseOperation('UPDATE', 'Leave', user, {
  leaveId: leave._id,
  oldStatus: 'pending',
  newStatus: 'approved',
  approvedBy: manager.id,
});

// ❌ BAD - No context
appLogger.info('Updated leave');
```

---

## 9. Environment Configuration

### 9.1 Set Log Level in .env
```env
# Options: error, warn, info, debug
LOG_LEVEL=debug

# Node environment
NODE_ENV=development
```

### 9.2 Adjust Log Level by Environment
```javascript
// In logger.js, adjust:
level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'warn' : 'debug'),
```

---

## 10. Troubleshooting

### 10.1 Logs Not Appearing
- Check if `LOG_LEVEL` environment variable is set
- Verify Winston is installed: `npm list winston`
- Check if `server/logs/` directory exists and has write permissions

### 10.2 Too Many Logs
- Lower the `LOG_LEVEL` in .env
- Set to `error` or `warn` for production
- Check maxsize and maxFiles in logger.js

### 10.3 Missing User Information
- Ensure `req.user` is populated by authentication middleware
- The user object should have: `id`, `firstName`, `lastName`, `role`, `email`

---

## 11. Summary

The comprehensive logging system provides:
✅ **Complete user context** (who is using the system)
✅ **Precise timestamps** (when operations occur)
✅ **File/function/line information** (where in code)
✅ **Multiple log levels** (error, warn, info, debug)
✅ **Automatic request/response logging** (middleware)
✅ **Structured log output** (easy to parse and analyze)
✅ **Role-based audit trails** (compliance ready)
✅ **Easy log file rotation** (5MB files, keeps 5 of each type)

All functions in your controllers now have comprehensive logging integrated!
