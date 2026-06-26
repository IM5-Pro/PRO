# Comprehensive Notification System - Implementation Guide

## 🎯 Overview
A complete **role-based notification system** has been implemented for the HRMS application that aggregates and filters notifications based on user role. Each user gets notifications relevant to their role and responsibilities.

### ✅ Role-Based Notification Filtering

**EMPLOYEE** 📊
- Personal leave request approvals/rejections ✅/❌
- Attendance issues & exceptions ⏰
- Payroll updates & slip generation 💰
- General company announcements 📢

**MANAGER** 👥
- Team members' leave requests awaiting approval ⏳
- Team attendance issues 📋
- Team announcements & updates 📢

**HR ADMIN** 🔐
- All pending leave approvals from employees 📝
- All attendance issues organization-wide ⏰
- Payroll processing status & issues 💰
- System alerts & critical notifications ⚠️
- Policy updates 📖

**SUPER ADMIN** 🔒
- All notifications from all sources
- Complete system access
- All critical alerts and updates

---

## 📋 Components Implemented

### 1. **Notification API Service** (`/client/src/services/notificationApi.js`)
Centralized service for managing all notification-related API calls.

#### Notification Types:
- 📝 **Leave Requests** - Pending leave applications
- ✅ **Leave Approvals/Rejections** - Leave request responses
- ⏰ **Attendance Alerts** - Attendance issues and exceptions
- 📋 **Attendance Corrections** - Attendance updates needed
- 💰 **Payroll Updates** - Payroll processing notifications
- 📢 **Announcements** - Company announcements
- ⚠️ **System Alerts** - System-level notifications
- 📄 **Document Updates** - Document-related notifications
- 👤 **Manager Assignments** - Manager change notifications
- ⭐ **Performance Reviews** - Performance review reminders
- 📅 **Meeting Reminders** - Meeting notifications
- 📖 **Policy Updates** - Policy change notifications

#### Key Functions:
```javascript
// 🎯 ROLE-BASED FETCHING (NEW!)
fetchNotificationsByRole(userRole)        // Auto-filters based on role
fetchEmployeeNotifications()              // Employee-specific notifications
fetchManagerNotifications()               // Manager-specific notifications  
fetchHRNotifications()                    // HR admin-specific notifications

// Core functions
fetchNotifications()
fetchComprehensiveNotifications()
fetchUnreadCount()
fetchNotificationSummary()

// Type-specific functions
fetchPendingApprovals()
fetchLeavePendingNotifications()
fetchAttendanceNotifications()
fetchPayrollNotifications()
fetchAnnouncementNotifications()
fetchSystemAlerts()

// Actions
markNotificationAsRead(notificationId)
markAllNotificationsAsRead()
deleteNotification(notificationId)
deleteAllNotifications()
```

---

### 2. **Notification Context** (`/client/src/context/NotificationContext.js`)
Global state management for notifications with real-time polling.

#### Features:
- **Global State Management** - Centralized notification state across the app
- **Auto-Refresh** - Polls for unread count every 30 seconds
- **Rich Actions** - Mark as read, delete, filter, sort
- **Error Handling** - Graceful error handling with fallbacks
- **Memory Cleanup** - Proper cleanup on component unmount

#### Hook Usage:
```javascript
import { useNotifications } from '../context/NotificationContext';

const {
  notifications,        // Array of all notifications
  unreadCount,         // Number of unread notifications
  summary,             // Summary with byType breakdown
  loading,             // Loading state
  error,               // Error message if any
  
  // Actions
  fetchNotifications,           // Refresh all notifications
  markAsRead,                   // Mark single notification as read
  markAllAsRead,               // Mark all as read
  removeNotification,          // Delete notification
  clearAllNotifications,       // Delete all notifications
  fetchUnreadCount,            // Get just the count
} = useNotifications();
```

#### Notification Summary Structure:
```javascript
{
  total: 15,
  unread: 3,
  byType: {
    approvals: 2,      // Pending approvals
    leaves: 1,         // Leave-related
    attendance: 0,     // Attendance issues
    payroll: 5,        // Payroll updates
    announcements: 3,  // Announcements
    system: 4,         // System alerts
  }
}
```

---

### 3. **Notifications Panel Component** (`/client/src/components/Notifications/NotificationsPanel.jsx`)
Full-featured modal panel for viewing and managing all notifications.

#### Features:
- **Full Notification Display** - Shows all notifications with icons, priorities, and timestamps
- **Filtering by Type** - Filter notifications by category (Approvals, Leaves, Attendance, etc.)
- **Sorting Options** - Sort by latest, oldest, or unread first
- **Visual Priority Indicators** - Color-coded priority badges (Urgent, High, Medium, Low)
- **Batch Actions** - Mark all as read, clear all, or delete selected
- **Interactive** - Hover actions for quick operations
- **Real-time Stats** - Shows total, unread, and pending approvals count

#### Key Components:
- `NotificationItem` - Individual notification display
- `NotificationBadge` - Badge for showing counts
- `NotificationTypeFilter` - Filter controls

---

### 4. **Enhanced HRHeader Component** (`/client/src/components/HRHeader/HRHeader.jsx`)
Updated header with integrated notification system.

#### Notification Features:
- **Notification Bell** - Click to open full panel
- **Unread Badge** - Animated badge showing unread count
- **Quick Preview** - Hover over bell shows last 3 notifications
- **Real-time Updates** - Automatically updates unread count
- **Integration with Context** - Uses NotificationContext for state

#### Usage in HRHeader:
```jsx
import { useNotifications } from '../../context/NotificationContext';
import NotificationsPanel from '../Notifications/NotificationsPanel';

// Inside component
const { notifications, unreadCount } = useNotifications();
const [showNotificationsPanel, setShowNotificationsPanel] = useState(false);

// Render notification bell with badge
<button onClick={() => setShowNotificationsPanel(true)}>
  <FiBell size={20} />
  {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
</button>

// Render panel
<NotificationsPanel 
  isOpen={showNotificationsPanel}
  onClose={() => setShowNotificationsPanel(false)}
/>
```

---

### 5. **Notification Endpoints** (`/client/src/api/endpoints.js`)
Comprehensive API endpoints for notification operations.

```javascript
export const NOTIFICATION_ENDPOINTS = {
  list: (limit) => withLimit('/notifications', limit),           // Get paginated notifications
  all: '/notifications/all',                                     // Get all notifications
  unread: '/notifications/unread',                               // Get unread count
  mark: (notificationId) => `/notifications/${notificationId}/mark-read`,    // Mark as read
  markAll: '/notifications/mark-all-read',                       // Mark all as read
  delete: (notificationId) => `/notifications/${notificationId}`, // Delete single
  deleteAll: '/notifications/delete-all',                        // Delete all
  summary: '/notifications/summary',                             // Get summary
  pendingApprovals: '/notifications/pending-approvals',          // Pending approvals
  leavePending: '/notifications/leaves/pending',                 // Pending leaves
  attendanceIssues: '/notifications/attendance/issues',          // Attendance issues
  payrollUpdates: '/notifications/payroll/updates',              // Payroll updates
  announcements: '/notifications/announcements',                 // Announcements
  systemAlerts: '/notifications/system-alerts',                  // System alerts
};
```

---

## 🔧 Integration Steps

### 1. App.js Setup with User Role
NotificationProvider now supports automatic role-based notification filtering:

```jsx
import { useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

function App() {
  const { user } = useAuth();
  
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          {/* Pass user role for role-based notifications */}
          <NotificationProvider userRole={user?.role}>
            <PunchProvider>
              <Routes>...</Routes>
            </PunchProvider>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}
```

### 3. Use in Any Component
```jsx
import { useNotifications } from '../context/NotificationContext';

function MyComponent() {
  const { notifications, unreadCount, markAsRead } = useNotifications();
  
  // Component automatically gets role-filtered notifications!
  return (
    <div>
      <h1>You have {unreadCount} notifications</h1>
      {notifications.map(notif => (
        <div key={notif.id}>
          <h3>{notif.title}</h3>
        </div>
      ))}
    </div>
  );
}
```

### 3. Get Role-Specific Notifications in Services
```javascript
import { fetchNotificationsByRole } from '../services/notificationApi';

// Get notifications for a specific role
const employeeNotifs = await fetchNotificationsByRole('employee');
const managerNotifs = await fetchNotificationsByRole('manager');
const hrNotifs = await fetchNotificationsByRole('hr_admin');
```

---

## � What Each Role Sees

### ✅ Employee Notifications - COMPLETE Example

**When you apply for leave and it gets REJECTED/APPROVED:**

```
Scenario: Employee applies 5-day leave → HR rejects → Employee gets notification

BEFORE (Without System): ❌ No notification
NOW (With System): ✅ Immediate notification!

Notification Details:
├─ Icon: ❌ or ✅  
├─ Title: "Your leave request has been rejected"
├─ Message: "Your 5-day leave (Mar 28-Apr 1) was rejected"
├─ Time: March 25, 10:30 AM
├─ Priority: HIGH
├─ Action: Click to view reason & reapply
└─ Status: UNREAD (marked as read when viewed)
```

**All Employee Notifications:**
```
✅ Leave Approvals - Immediate when approved
❌ Leave Rejections - Immediate when rejected  
⏰ Attendance Issues - When marked late/absent
💰 Payroll Updates - When salary processed
📢 Company Announcements - New announcements
```

### Manager Notifications
Managers see their team's pending leave requests:
- New leave requests from team members
- Attendance issues in team
- Team-level announcements

```
⏳ Team's Pending Leave Approvals
📋 Team's Attendance Issues  
📢 Team Announcements
```

### HR Admin Notifications
HR system administrators see everything operational:
- All pending leave approvals
- Organization-wide attendance issues
- Payroll processing status
- System alerts and critical issues
- Policy updates

```
📝 All Pending Leave Approvals
⏰ Organization Attendance Issues
💰 Payroll Updates
⚠️ System Alerts
📖 Policy Updates
```

### Super Admin Notifications
Super administrators get complete system access:
- All notifications from all sources
- Complete visibility across organization

```
ALL NOTIFICATIONS FROM ALL SOURCES
```

---

Each notification object contains:
```javascript
{
  id: "unique-id",
  type: "leave_request",              // Type from NOTIFICATION_TYPES
  title: "Your leave request",        // Main title
  message: "Applied for 5 days",      // Description/message
  icon: "📝",                         // Emoji icon
  priority: "high",                   // urgent, high, medium, low
  timestamp: "2024-03-24T10:30:00",  // ISO timestamp
  read: false,                        // Read status
  timeAgo: "5 minutes ago",          // Formatted time
  actionUrl: "/leaves/123",          // Link to action
  metadata: {                         // Additional data
    employeeId: "emp123",
    leaveId: "leave456"
  }
}
```

---

## 🎯 Notification Priority System

The system supports four priority levels:

| Priority | Color | Usage |
|----------|-------|-------|
| **Urgent** | Red | Critical system issues, immediate attention needed |
| **High** | Orange | Manager approvals, payroll processing, leave rejections |
| **Medium** | Blue | Regular notifications, announcements, updates |
| **Low** | Gray | Informational messages, gentle reminders |

---

## ⚙️ Backend Requirements

### CRITICAL: Leave Rejection/Approval Notifications

For the **leave rejection notification scenario** to work (Employee gets notified when leave is rejected):

1. **When a leave request is REJECTED or APPROVED**, create notification for employee:
```javascript
// In LeaveController.reject() or approve() method
const notification = {
  userId: leave.employeeId,
  type: leave.status === 'approved' ? 'leave_approval' : 'leave_rejection',
  title: leave.status === 'approved' ? 
    "Your leave has been approved ✅" : 
    "Your leave has been rejected ❌",
  message: `Your ${leave.numberOfDays}-day leave (${leave.startDate} to ${leave.endDate}) has been ${leave.status}`,
  priority: 'high',
  read: false,
  metadata: { leaveId: leave._id, employeeId: leave.employeeId },
  createdAt: new Date()
};
await Notification.create(notification);
```

2. **When a new leave is REQUESTED**, create notification for Manager/HR to approve:
```javascript
// In LeaveController.create() method
const notification = {
  userId: leave.managerId, // or hr admin id
  type: 'leave_approval',
  title: `New leave request from ${employee.name}`,
  message: `${employee.name} requested ${leave.numberOfDays}-day leave (${leave.startDate} to ${leave.endDate})`,
  priority: 'high',
  read: false,
  metadata: { leaveId: leave._id, employeeId: leave.employeeId },
  createdAt: new Date()
};
await Notification.create(notification);
```

### API Endpoints
The backend should provide these endpoints:

### GET Endpoints:
- `GET /api/notifications?limit=10&skip=0` - Get paginated notifications
- `GET /api/notifications/unread` - Get unread count
- `GET /api/notifications/summary` - Get notification summary
- `GET /api/notifications/pending-approvals` - Get pending approvals
- `GET /api/notifications/leaves/pending` - Get pending leaves
- `GET /api/notifications/attendance/issues` - Get attendance issues
- `GET /api/notifications/payroll/updates` - Get payroll updates
- `GET /api/notifications/announcements` - Get announcements
- `GET /api/notifications/system-alerts` - Get system alerts

### PUT Endpoints:
- `PUT /api/notifications/:id/mark-read` - Mark single as read
- `PUT /api/notifications/mark-all-read` - Mark all as read

### DELETE Endpoints:
- `DELETE /api/notifications/:id` - Delete single notification
- `DELETE /api/notifications/delete-all` - Delete all notifications

---

## 🚀 Features & Capabilities

✅ **Aggregated Notifications** - Combines notifications from all sources
✅ **Real-time Updates** - Auto-refresh every 30 seconds
✅ **Priority Levels** - Urgent, High, Medium, Low
✅ **Type Filtering** - Filter by notification type
✅ **Sorting Options** - Latest, Oldest, Unread First
✅ **Batch Operations** - Mark all as read, delete all
✅ **Unread Badge** - Animated badge on bell icon
✅ **Quick Preview** - Hover dropdown for quick view
✅ **Full Modal Panel** - Comprehensive notification viewer
✅ **Error Handling** - Graceful error handling
✅ **Mobile Responsive** - Works on all screen sizes
✅ **Performance Optimized** - Efficient re-renders and polling

---

## 📝 Usage Examples

### Example 1: Display Unread Count
```jsx
const { unreadCount } = useNotifications();
return <span className="badge">{unreadCount}</span>;
```

### Example 2: Show Recent High Priority Notifications
```jsx
const { notifications } = useNotifications();
const urgent = notifications
  .filter(n => n.priority === 'urgent')
  .slice(0, 5);

return (
  <div>
    {urgent.map(notif => (
      <div key={notif.id} className="urgent-alert">
        <h4>{notif.title}</h4>
        <p>{notif.message}</p>
      </div>
    ))}
  </div>
);
```

### Example 3: Custom Notification Handler
```jsx
const { notifications, markAsRead, removeNotification } = useNotifications();

const handleActionClick = (notificationId, actionUrl) => {
  markAsRead(notificationId);
  // Navigate to action URL
  window.location.href = actionUrl;
};
```

---

## 🐛 Troubleshooting

### Notifications Not Showing
1. Ensure `NotificationProvider` wraps your app in App.js
2. Check that you're using `useNotifications()` hook inside a component
3. Verify backend endpoints are returning data

### Unread Count Not Updating
1. Check the polling interval (default: 30 seconds)
2. Verify `fetchUnreadCount()` is being called
3. Check browser console for errors

### Performance Issues
1. Adjust polling interval if needed
2. Consider pagination for large notification lists
3. Use filtering to reduce displayed items

---

## 📚 Files Created/Modified

### Created Files:
- `/client/src/services/notificationApi.js` - Notification API service
- `/client/src/context/NotificationContext.js` - Notification context provider
- `/client/src/components/Notifications/NotificationsPanel.jsx` - Notification panel component

### Modified Files:
- `/client/src/api/endpoints.js` - Added notification endpoints
- `/client/src/components/HRHeader/HRHeader.jsx` - Integrated notifications
- `/client/src/App.js` - Added NotificationProvider wrapper

---

## 🎉 Summary

The comprehensive notification system is now fully integrated into the HRMS application. It provides:

- **Multi-source aggregation** - Combines leave, attendance, payroll, announcements, and system notifications
- **Real-time updates** - Auto-refresh mechanism every 30 seconds
- **User-friendly UI** - Beautiful, responsive notification panel with filtering and sorting
- **Scalable architecture** - Easy to add new notification types
- **Global state management** - Available throughout the app via React context

The notification bell in the header now displays real, actionable notifications that help users stay informed about all HR-related updates and actions!
