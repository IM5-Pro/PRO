# Logging System Quick Reference

## Import Logger
```javascript
import { appLogger } from '../utils/logger.js';
```

## Common Usage Patterns

### API Endpoint Logging
```javascript
export const getUser = async (req, res) => {
  try {
    appLogger.logRequest(req, 'getUser called', { id: req.params.id });
    
    const user = await User.findById(req.params.id);
    appLogger.logResponse(req, 200, 'User retrieved', { userId: user.id });
    res.json(user);
  } catch (error) {
    appLogger.error('getUser failed', error, { userId: req.user?.id });
    res.status(500).json({ error: error.message });
  }
};
```

### Database Operation Logging
```javascript
appLogger.logDatabaseOperation('CREATE', 'Leave', req.user, {
  leaveId: leave._id,
  type: leave.type,
});
```

### Service Function Logging
```javascript
export const sendNotification = async (user, message) => {
  try {
    appLogger.logWithUser('info', 'Sending notification', user);
    // ... send logic
    appLogger.logDatabaseOperation('CREATE', 'Notification', user);
  } catch (error) {
    appLogger.error('Notification send failed', error, { userId: user.id });
  }
};
```

### Error Logging
```javascript
try {
  // code
} catch (error) {
  appLogger.error('Operation failed', error, {
    userId: req.user?.id,
    userName: req.user?.email,
  });
}
```

### Warning Logging
```javascript
if (deprecated) {
  appLogger.warn('Deprecated API used', {
    userId: req.user.id,
    endpoint: req.path,
  });
}
```

### Debug Logging
```javascript
appLogger.debug('Processing data', {
  userId: req.user.id,
  recordCount: data.length,
  timeMs: Date.now() - startTime,
});
```

## Log Files Location
```
server/logs/
  ├── error.log      # Errors only
  ├── warn.log       # Warnings
  ├── debug.log      # Debug level
  └── combined.log   # All logs
```

## View Logs
```bash
# Real-time monitoring
tail -f server/logs/combined.log

# View last 50 lines
tail -50 server/logs/combined.log

# Search for user activity
grep "USER: userId" server/logs/combined.log

# Search errors
grep "ERROR" server/logs/error.log
```

## Middleware Setup
Add to `index.js`:
```javascript
import loggerMiddleware, { errorLoggerMiddleware } from './src/middleware/loggerMiddleware.js';

app.use(loggerMiddleware);

// ... routes ...

app.use(errorLoggerMiddleware);
```

## Log Output Format
```
[TIMESTAMP] [LEVEL] [USER: id] [NAME: name] [ROLE: role] - MESSAGE [FILE: file.js] [FUNC: function] [LINE: number]
METADATA: {...}
```

## Key Methods

| Method | Use Case |
|--------|----------|
| `logRequest()` | Log API requests |
| `logResponse()` | Log API responses |
| `logDatabaseOperation()` | Log CRUD operations |
| `logWithUser()` | Log with user context |
| `logAuthEvent()` | Log auth events |
| `info()` | General info |
| `error()` | Error with stack |
| `warn()` | Warnings |
| `debug()` | Debug info |

## User Object Properties
```javascript
{
  id: "507f1f77bcf86cd799439011",
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@example.com",
  role: "manager"
}
```

## Info: Changes Made
1. ✅ Created logger utility with Winston (src/utils/logger.js)
2. ✅ Updated package.json with winston dependency
3. ✅ Integrated comprehensive logging in NotificationController
4. ✅ Created logger middleware (src/middleware/loggerMiddleware.js)
5. ✅ Created detailed documentation (LOGGING_SYSTEM_GUIDE.md)
