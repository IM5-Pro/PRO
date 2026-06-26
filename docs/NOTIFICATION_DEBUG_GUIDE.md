# Notification System Debugging Guide

## Current Issue
Manager sees leaves in the Leave UI but doesn't see new notifications in the header bell.

## Root Cause
We identified that `LeaveController.applyLeave()` wasn't creating notification documents. We've now fixed this, but need to verify it's working.

## Step-by-Step Testing & Debugging

### Step 1: Apply a Leave Request (with server console monitoring)

1. **Start your server** (ensure you can see the terminal output)
   ```bash
   npm start  # or nodemon, from /server directory
   ```

2. **Log in as an Employee account** in your HRMS

3. **Navigate to Leave Management** and click "Apply for Leave"

4. **Fill in the form**:
   - Leave Type: Any (e.g., Casual Leave)
   - Start Date: Today + 1 day
   - End Date: Today + 2 days
   - Reason: "Testing notification system"

5. **Submit the form**

6. **IMMEDIATELY check your server console output** for these debug logs:
   ```
   Employee found: [ObjectId] managerId: [ObjectId]
   Manager User ID: [ObjectId]
   Creating leave notification for managerId: [ObjectId] hrAdminIds: [...]
   Leave notification created successfully
   ```

### Step 2: Verify Database - Check if Notification was Created

If you don't see the debug logs, or want to verify the database directly:

1. **Connect to MongoDB Compass** or use `mongosh`

2. **Query the notifications collection**:
   ```javascript
   db.notifications.find({
     type: "leave_request"
   }).sort({ createdAt: -1 }).limit(5)
   ```

3. **Expected output** should show a document like:
   ```json
   {
     "_id": ObjectId(...),
     "userId": ObjectId(...),  // Manager's User ID
     "type": "leave_request",
     "title": "New Leave Request",
     "message": "Employee Name requested Leave for 2024-01-15 to 2024-01-16",
     "priority": "high",
     "read": false,
     "referenceId": ObjectId(...),  // Leave Request ID
     "triggeredBy": ObjectId(...),  // Employee's User ID
     "createdAt": ISODate(...)
   }
   ```

4. **If this document exists**: ✅ Notification is being created correctly
5. **If this document doesn't exist**: ❌ There's an issue with the creation logic

### Step 3: Verify Manager Can Fetch Notifications

1. **Still in MongoDB, find the Manager's User ID**:
   ```javascript
   db.users.findOne({ email: "manager@company.com" })
   // Copy the _id value
   ```

2. **Query notifications for that manager**:
   ```javascript
   db.notifications.find({ 
     userId: ObjectId("PASTE_MANAGER_USER_ID_HERE")
   })
   ```

3. **Expected**: Should show the leave_request notification created above

### Step 4: Check Manager's Frontend

1. **Log out and log in as the Manager**

2. **Look at the header notification bell** (top right)

3. **Expected**:
   - Badge showing a number (e.g., "1", "2")
   - Animated pulse effect
   - Click bell → Dropdown shows "New Leave Request" notification

4. **Actual Issue** (what user reported):
   - Badge shows "0" or no badge
   - Notification dropdown is empty

### Step 5: Debug Manager's Notification Fetch

If Step 3 shows notifications in DB but Step 4 shows none on frontend:

1. **Open Browser DevTools** (F12)

2. **Go to Network tab** and filter by XHR/Fetch

3. **Look for requests** to `/api/notifications/unread-count` (happens every 30 seconds)

4. **Check the response**:
   ```json
   {
     "success": true,
     "unreadCount": 1
   }
   ```

5. **If unreadCount is 0**: The API isn't finding manager's notifications
   - This means manager's User ID in DB doesn't match what API is using
   - Check: Is manager logged in with correct user?

6. **If unreadCount > 0 but badge doesn't update**: Frontend polling issue
   - Check Console tab for errors
   - Verify NotificationContext is working

### Step 6: Review Console Logs for Errors

**Server Console** - Look for these error patterns:

1. **Manager not found**:
   ```
   Manager User ID: null
   ```
   **Cause**: Employee's `managerId` field is not set, or manager Employee doesn't have a `userId`
   **Fix needed**: Edit employee record to add manager relationship

2. **No HR admins found**:
   ```
   hrAdminIds: []
   ```
   **Cause**: No users have role='HR_ADMIN'
   **Fix needed**: Ensure at least one user has HR_ADMIN role

3. **Notification creation error**:
   ```
   Leave notification created error: [error message]
   ```
   **Cause**: Database or service error
   **Action**: Check error message for details

## Expected vs Actual - Quick Checklist

| Item | Expected | How to Check |
|------|----------|--------------|
| **Console logs** | 4 debug logs when applying leave | Check server terminal when form submitted |
| **DB notification** | Document exists in notifications collection | MongoDB query (Step 2) |
| **Manager fetch** | Query shows manager notifications | MongoDB query with manager userId |
| **Badge display** | Shows unread count > 0 | Look at header bell in frontend |
| **Dropdown** | Shows "New Leave Request" | Click bell icon |
| **Polling** | API calls every 30 seconds | Network tab in DevTools |

## Quick Troubleshooting

**Problem**: "No debug logs in console"
- **Check**: Is server actually running?
- **Check**: Did you see "Leave request created" message?
- **Check**: Did transaction commit? Look for "Leave request saved successfully"

**Problem**: "Debug logs show null for Manager User ID"
- **Check**: Employee record - does it have a `managerId` set?
- **Check**: Manager Employee record - does it have a `userId` field?
- **Action**: Populate these relationship fields in your test data

**Problem**: "Notification in DB but manager doesn't see badge"
- **Check**: Is manager logged in with correct account?
- **Check**: Manager's User ID = `userId` field in notification document?
- **Check**: Browser console for fetch/polling errors

**Problem**: "Everything looks correct but notification not showing"
- **Check**: Refresh the page (may need to clear cache)
- **Check**: Notification polling may be waiting for next 30-second cycle
- **Action**: Wait 30 seconds or manually call `/api/notifications/unread-count` in browser console:
  ```javascript
  fetch('/api/notifications/unread-count')
    .then(r => r.json())
    .then(console.log)
  ```

## Database Queries Cheat Sheet

```javascript
// 1. Check if leave notification was created
db.notifications.findOne({ type: "leave_request" }, { sort: { createdAt: -1 } })

// 2. Count all notifications for a manager (replace with actual User ID)
db.notifications.countDocuments({ userId: ObjectId("MANAGER_USER_ID") })

// 3. Find all notifications created in last hour
db.notifications.find({
  createdAt: { $gte: new Date(Date.now() - 3600000) }
})

// 4. Check manager's user data
db.users.findOne({ role: "MANAGER" })

// 5. Check employee's manager relationship
db.employees.findOne({ _id: ObjectId("EMPLOYEE_ID") }, { managerId: 1, userId: 1 })

// 6. Check manager employee's userId
db.employees.findOne({ _id: ObjectId("MANAGER_EMPLOYEE_ID") })
```

## Next Steps After Debugging

1. **If notifications are working** ✅
   - Manager sees badge and notification → System is working!
   - Move on to testing approval/rejection notifications
   - Then extend pattern to other HR modules (Attendance, Payroll, etc.)

2. **If notifications are NOT working** ❌
   - Collect the debug logs and database query results
   - Share with debugging to identify exact point of failure
   - We can then fix the specific issue

## Files Modified in This Fix

- `/server/src/controllers/LeaveController.js` - Added notification calls with debug logging
- `/server/src/services/notificationService.js` - (existing, provides notification functions)
- `/server/src/models/Notification.js` - (existing, stores notifications)

## Important Notes

- **Polling interval**: Frontend checks every 30 seconds, so there may be a 30-second delay for new notifications to appear
- **Test data**: Make sure manager → employee relationship is set up in your test accounts
- **Role configuration**: Ensure users have correct roles (Manager, HR_ADMIN, Employee)
