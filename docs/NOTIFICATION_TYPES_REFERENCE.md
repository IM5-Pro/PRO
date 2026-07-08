# Notification Types Quick Reference

## Complete List of 65+ Notification Types Available in HRMS

### 🟢 Leave Management (3 types)
| Type | Icon | Priority | Recipient | Trigger |
|------|------|----------|-----------|---------|
| leave_request | 📝 | HIGH | Manager, HR Admin | Employee applies for leave |
| leave_approval | ✅ | HIGH | Employee | Manager approves leave |
| leave_rejection | ❌ | HIGH | Employee | Manager rejects leave |

### 🔵 Attendance & Timekeeping (8 types)
| Type | Icon | Priority | Recipient | Trigger |
|------|------|----------|-----------|---------|
| attendance_alert | ⏰ | MEDIUM | Employee, Manager | General attendance issue |
| attendance_late_arrival | ⏳ | MEDIUM | Employee, Manager | Employee checks in late |
| attendance_absent | ❌ | MEDIUM | Manager, HR Admin | Employee marked absent |
| attendance_correction | 📋 | HIGH | Manager, HR Admin | Attendance correction requested |
| attendance_correction_approval | ✅📋 | MEDIUM | Employee | Correction approved |
| attendance_correction_rejection | ❌📋 | MEDIUM | Employee | Correction rejected |
| attendance_overtime | ⚡ | LOW | Employee, Manager | Overtime recorded |
| attendance_shift_change | 🔄 | MEDIUM | Employee, Manager | Shift changed |

### 💰 Payroll & Compensation (10 types)
| Type | Icon | Priority | Recipient | Trigger |
|------|------|----------|-----------|---------|
| payroll_ready | 💰 | MEDIUM | Employees | Payroll processing starts |
| payroll_processed | ✓💰 | HIGH | Employees | Payroll processing completes |
| salary_slip_generated | 💵 | MEDIUM | Employee | Salary slip ready for download |
| reimbursement_request | 🧾 | HIGH | Manager, HR Admin | Employee requests reimbursement |
| reimbursement_approval | ✅🧾 | HIGH | Employee | Reimbursement approved |
| reimbursement_rejection | ❌🧾 | HIGH | Employee | Reimbursement rejected |
| bonus_notification | 🎁 | HIGH | Employee | Bonus awarded |
| incentive_notification | 🏆 | HIGH | Employee | Incentive/commission credited |
| tax_filing_reminder | 📊 | HIGH | Employee, Manager | Tax filing deadline approaching |
| payment_delay_alert | ⚠️💰 | URGENT | Employee, Manager | Salary payment delayed |

### ⭐ Performance Management (6 types)
| Type | Icon | Priority | Recipient | Trigger |
|------|------|----------|-----------|---------|
| performance_review_request | 📊 | HIGH | Employee | Performance review initiated |
| performance_feedback_request | 💬 | MEDIUM | Team Members | 360-degree feedback requested |
| performance_review_complete | ✅📊 | HIGH | Employee | Review completed |
| performance_rating | ⭐ | HIGH | Employee | Rating assigned |
| goal_setting | 🎯 | HIGH | Employee | Goal/OKR assigned |
| okr_update | 📈 | MEDIUM | Employee | OKR updated |

### 📚 Employee Development (5 types)
| Type | Icon | Priority | Recipient | Trigger |
|------|------|----------|-----------|---------|
| training_assigned | 📚 | HIGH | Employee | Training course assigned |
| training_completed | ✅📚 | HIGH | Employee, Manager | Training successfully completed |
| certification_expiry | ⏰📜 | HIGH | Employee, Manager | Certification expiring soon |
| skill_recommendation | 💡 | MEDIUM | Employee, Manager | Skill development recommended |
| promotion_eligible | 🚀 | HIGH | Employee, HR Admin | Employee eligible for promotion |

### 👥 HR Operations (6 types)
| Type | Icon | Priority | Recipient | Trigger |
|------|------|----------|-----------|---------|
| onboarding_task | 🆕 | HIGH | Employee, Manager | Onboarding task assigned |
| offboarding_notification | 👋 | MEDIUM | Team, Manager | Employee departing company |
| role_change | 👤 | HIGH | Employee, HR Admin | Employee role changed |
| designation_change | 🎖️ | HIGH | Employee, Manager, HR Admin | Designation changed |
| department_transfer | 🔄 | HIGH | Employee, Both Managers, HR | Department transfer |
| team_membership_change | 👥 | MEDIUM | Manager, Team Members | Team membership updated |

### 📅 Meetings & Calendar (4 types)
| Type | Icon | Priority | Recipient | Trigger |
|------|------|----------|-----------|---------|
| meeting_invitation | 📅 | HIGH | Attendees | Meeting scheduled |
| meeting_reminder | 🔔📅 | HIGH | Attendees | 1 hour before meeting |
| meeting_rescheduled | 🔄📅 | MEDIUM | Attendees | Meeting time changed |
| one_on_one_scheduled | 💼 | MEDIUM | Employee, Manager | 1-on-1 meeting scheduled |

### 📦 Asset Management (6 types)
| Type | Icon | Priority | Recipient | Trigger |
|------|------|----------|-----------|---------|
| asset_assigned | 📦 | MEDIUM | Employee | Asset allocated to employee |
| asset_return_request | 📤 | HIGH | Employee | Asset return requested |
| asset_expiry | ⏰📦 | HIGH | Manager, HR Admin | Asset maintenance/renewal due |
| asset_maintenance | 🔧 | MEDIUM | Manager, HR Admin | Asset maintenance scheduled |
| system_access_grant | 🔓 | HIGH | Employee | System access granted |
| system_access_revoke | 🔒 | HIGH | Employee, Manager | System access removed |

### 📄 Documents & Compliance (6 types)
| Type | Icon | Priority | Recipient | Trigger |
|------|------|----------|-----------|---------|
| document_request | 📄 | HIGH | Employee | Document submission requested |
| document_uploaded | 📤📄 | MEDIUM | HR Admin, Manager | Document uploaded for review |
| document_expiry | ⏰📄 | HIGH | Employee, Manager | Document expiry approaching |
| document_approval | ✅📄 | MEDIUM | Employee, HR | Document approved |
| document_rejection | ❌📄 | HIGH | Employee | Document rejected |
| compliance_alert | ⚖️ | URGENT | Employees, HR | Compliance issue/deadline |

### 📢 Administrative & System (9 types)
| Type | Icon | Priority | Recipient | Trigger |
|------|------|----------|-----------|---------|
| announcement | 📢 | MEDIUM | All Employees | New company announcement |
| policy_update | 📖 | HIGH | All Employees | Policy updated/changed |
| system_alert | ⚠️ | URGENT | All Relevant Users | Critical system issue |
| system_maintenance | 🔧⚙️ | HIGH | All Employees | Scheduled system maintenance |
| holiday_update | 🎉 | MEDIUM | All Employees | Holiday calendar updated |
| birthday_reminder | 🎂 | LOW | Employee, Manager, HR | Employee's birthday |
| work_anniversary | 🎊 | LOW | Employee, Manager, HR | Work anniversary |
| probation_end | ✅🆕 | HIGH | Employee, Manager, HR | Probation period complete |
| contract_renewal | 📝 | HIGH | Employee, HR Admin | Contract renewal due |

### 👔 Manager-Specific (4 types)
| Type | Icon | Priority | Recipient | Trigger |
|------|------|----------|-----------|---------|
| manager_assignment | 👔 | MEDIUM | Manager | New team member assigned |
| team_performance_summary | 📈👥 | LOW | Manager | Weekly/monthly team summary |
| pending_approvals | ⏳✅ | HIGH | Manager | New approval requests pending |
| direct_report_milestone | 🏅 | MEDIUM | Manager | Team member reached milestone |

---

## By Category

### 🔴 URGENT (Requires immediate attention)
- compliance_alert
- payment_delay_alert
- system_alert

### 🟥 HIGH (Important, time-sensitive)
- leave_request, leave_approval, leave_rejection
- attendance_correction, attendance_correction_approval
- reimbursement_request, reimbursement_approval
- payroll_processed
- performance_review_request, performance_review_complete, performance_rating
- training_assigned, training_completed, certification_expiry
- onboarding_task, role_change, designation_change, department_transfer
- document_request, document_expiry
- policy_update, system_maintenance
- probation_end, contract_renewal
- meeting_invitation, meeting_reminder
- pending_approvals

### 🟨 MEDIUM (Should be reviewed)
- payroll_ready
- salary_slip_generated
- attendance_alert, attendance_late_arrival, attendance_absent
- skill_recommendation
- asset_assigned, asset_maintenance
- document_uploaded
- meeting_rescheduled
- one_on_one_scheduled
- offboarding_notification
- announcement
- manager_assignment
- team_performance_summary

### 🟩 LOW (FYI)
- attendance_overtime
- attendance_shift_change
- incentive_notification (sometimes HIGH)
- holiday_update
- birthday_reminder
- work_anniversary
- direct_report_milestone

---

## By Recipient Role

### For EMPLOYEES
- Approvals: leave_approval, leave_rejection, attendance_correction_approval, reimbursement_approval, document_approval
- Personal Updates: payroll_processed, salary_slip_generated, bonus_notification, incentive_notification
- Requests: performance_review_request, performance_feedback_request, training_assigned, onboarding_task, document_request
- Changes: role_change, designation_change, department_transfer, asset_assigned, asset_return_request, system_access_grant, system_access_revoke
- Milestones: promotion_eligible, training_completed, probation_end, work_anniversary, birthday_reminder, performance_review_complete
- Organization: policy_update, announcement, holiday_update, compliance_alert, system_maintenance
- Meetings: meeting_invitation, meeting_reminder, meeting_rescheduled, one_on_one_scheduled
- Alerts: attendance_alert, certification_expiry, document_expiry, tax_filing_reminder, payment_delay_alert

### For MANAGERS
- Team Requests: leave_request, attendance_correction, reimbursement_request
- Team Updates: attendance_late_arrival, attendance_absent, overtime, role_change, designation_change, manager_assignment, team_membership_change, department_transfer
- Team Milestones: promotion_eligible (for team), direct_report_milestone, team_performance_summary
- Team Documents: document_request (from team), document_uploaded
- Team Meetings: meeting_invitation, meeting_reminder
- Organizational: pending_approvals, policy_update, announcement, compliance_alert, system_maintenance
- Reminders: certification_expiry, document_expiry, tax_filing_reminder, birthday_reminder (team), work_anniversary (team)

### For HR ADMINS
- All Leave Requests: leave_request
- Attendance: attendance_correction, attendance_absent
- Payroll: payroll_ready, payroll_processed
- Reimbursement: reimbursement_request
- Employee Changes: role_change, designation_change, department_transfer, promotion_eligible
- Documents: document_request, document_uploaded, document_expiry, compliance_alert
- Training: training_assigned, training_completed, certification_expiry, promotion_eligible
- System: system_access_grant, system_access_revoke, asset_expiry, asset_maintenance
- Organization: policy_update, announcement, system_maintenance, contract_renewal
- Onboarding: onboarding_task, offboarding_notification
- Scheduling: onboarding_task
- Reminders: birthday_reminder (all), work_anniversary (all)

### For SUPER ADMINS
- All notifications
- Special: system_alert, system_maintenance, compliance_alert

---

## Integration Checklist

### Immediate (Must Have)
- [x] leave_request, leave_approval, leave_rejection
- [x] attendance_correction, attendance_correction_approval
- [x] payroll_ready, payroll_processed, salary_slip_generated

### Phase 1 (High Priority)
- [ ] attendance_late_arrival, attendance_absent
- [ ] reimbursement_request, reimbursement_approval
- [ ] performance_review_request, performance_review_complete
- [ ] training_assigned, training_completed
- [ ] meeting_invitation, meeting_reminder

### Phase 2 (Important)
- [ ] onboarding_task, offboarding_notification
- [ ] role_change, designation_change, department_transfer
- [ ] document_request, document_uploaded
- [ ] asset_assigned, asset_return_request
- [ ] announcement, policy_update

### Phase 3 (Nice to Have)
- [ ] birthday_reminder, work_anniversary
- [ ] certification_expiry
- [ ] bonus_notification, incentive_notification
- [ ] probation_end, contract_renewal
- [ ] system_alert, system_maintenance

### Scheduled Jobs
- [ ] Birthday reminders (daily)
- [ ] Work anniversary notifications (daily)
- [ ] Meeting reminders (every 5 mins)
- [ ] Certification expiry warnings (daily)
- [ ] Document expiry warnings (daily)
- [ ] Contract renewal reminders (weekly)

---

## API Endpoints Reference

All notifications are accessible via:
```
GET /api/notifications              # Get all notifications
GET /api/notifications/unread       # Get unread notifications
GET /api/notifications/summary      # Get notification summary
GET /api/notifications/pending-approvals  # Get pending approvals
GET /api/notifications/by-type/:type # Get by specific type

PATCH /api/notifications/:id/read   # Mark as read
PATCH /api/notifications/mark-all-read # Mark all as read

DELETE /api/notifications/:id       # Delete notification
DELETE /api/notifications           # Delete all notifications
```

---

## Frontend Usage Example

```jsx
import { useNotifications } from '../context/NotificationContext';

function NotificationCenter() {
  const { notifications, unreadCount, markAllAsRead } = useNotifications();

  return (
    <div>
      <h2>Notifications ({unreadCount})</h2>
      {notifications.map((notif) => (
        <div key={notif.id} className={notif.read ? 'read' : 'unread'}>
          <span>{notif.icon}</span>
          <div>
            <strong>{notif.title}</strong>
            <p>{notif.message}</p>
            <small>{notif.priority}</small>
          </div>
        </div>
      ))}
      <button onClick={markAllAsRead}>Mark all as read</button>
    </div>
  );
}
```

---

## Notes

1. **Notification Types** can be extended by adding to `NOTIFICATION_TYPES` in both:
   - Frontend: `client/src/services/notificationApi.js`
   - Backend: `server/src/models/Notification.js`

2. **Icons** can be customized in `NOTIFICATION_ICONS` in `notificationApi.js`

3. **Priorities** follow this hierarchy:
   - `urgent` - Red, immediate action required
   - `high` - Orange, important
   - `medium` - Blue, should review
   - `low` - Gray, FYI

4. **Categories** help with filtering:
   - `approval` - Requires user action
   - `reminder` - Scheduled reminders
   - `update` - Informational updates
   - `alert` - Warnings/errors
   - `achievement` - Positive news
   - `administrative` - org-wide info

Generate All! 🚀
