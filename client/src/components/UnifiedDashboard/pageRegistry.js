import DashboardPage from '../Pages/Dashboard';
import AttendancePage from '../Pages/Attendance';
import AnnouncementsPage from '../Pages/Announcements';
import AnalyticsPage from '../Pages/Analytics';
import EmployeeProfilePage from '../Pages/EmployeeProfile';
import EmployeesPage from '../Pages/Employees';
import LeaveManagementPage from '../Pages/LeaveManagement';
import LeavesPage from '../Pages/Leaves';
import PayrollPage from '../Pages/Payroll';
import PerformancePage from '../Pages/Performance';
import ReportsPage from '../Pages/Reports';
import SettingsPortalPage from '../Pages/Settings';
import TeamCollaborationPage from '../Pages/TeamCollaboration';
import MyResignationPage from '../Pages/MyResignation';
import ResignationApprovalsPage from '../Pages/ResignationApprovals';
import DashboardOverviewPage from '../Pages/HR/DashboardOverview';
import LeavesAttendancePage from '../Pages/HR/LeavesAttendance';
import ManpowerPlanningPage from '../Pages/HR/ManpowerPlanning';
import HRPayrollPage from '../Pages/HR/Payroll';
import ExitClearancePage from '../Pages/HR/ExitClearance';
import MeetingRoomPage from '../Pages/HR/MeetingRoom';
import WorkflowsPage from '../Pages/HR/Workflows';
import LetterTemplatesPage from '../Pages/HR/LetterTemplates';
import UserManagementPage from '../Pages/HR/UserManagement';
import MastersPage from '../Pages/HR/Masters';
import AdminPanelConfigPage from '../Pages/HR/AdminPanelConfig';
import ResignationManagementPage from '../Pages/HR/ResignationManagement';
import DepartmentsAdminPage from '../Pages/SuperAdmin/DepartmentsAdmin';
import RolesPermissionsAdminPage from '../Pages/SuperAdmin/RolesPermissionsAdmin';
import SystemSettingsAdminPage from '../Pages/SuperAdmin/SystemSettingsAdmin';
import AuditLogsAdminPage from '../Pages/SuperAdmin/AuditLogsAdmin';
import ResignationAdminViewPage from '../Pages/SuperAdmin/ResignationAdminView';
import RoleTransferAdmin from '../Pages/SuperAdmin/RoleTransferAdmin';

export const STANDARD_PAGE_COMPONENTS = {
  dashboard: DashboardPage,
  attendance: AttendancePage,
  announcements: AnnouncementsPage,
  analytics: AnalyticsPage,
  'employee-profile': EmployeeProfilePage,
  employees: EmployeesPage,
  'leave-management': LeaveManagementPage,
  leaves: LeavesPage,
  payroll: PayrollPage,
  performance: PerformancePage,
  reports: ReportsPage,
  settings: SettingsPortalPage,
  'team-collaboration': TeamCollaborationPage,
  'resignation': MyResignationPage,
  departments: DepartmentsAdminPage,
  'roles-permissions': RolesPermissionsAdminPage,
  'system-settings': SystemSettingsAdminPage,
  'audit-logs': AuditLogsAdminPage,
  'role-transfer': RoleTransferAdmin,
};

export const MANAGER_PAGE_COMPONENTS = {
  dashboard: DashboardPage,
  attendance: AttendancePage,
  announcements: AnnouncementsPage,
  analytics: AnalyticsPage,
  payroll: PayrollPage,
  performance: PerformancePage,
  settings: SettingsPortalPage,
  'team-collaboration': TeamCollaborationPage,
  'resignation': ResignationApprovalsPage,
};

export const HR_PAGE_COMPONENTS = {
  'dashboard-overview': DashboardOverviewPage,
  announcements: AnnouncementsPage,
  'leaves-attendance': LeavesAttendancePage,
  'manpower-planning': ManpowerPlanningPage,
  'hr-payroll': HRPayrollPage,
  'exit-clearance': ExitClearancePage,
  'meeting-room': MeetingRoomPage,
  workflows: WorkflowsPage,
  'letter-templates': LetterTemplatesPage,
  'user-management': UserManagementPage,
  masters: MastersPage,
  'admin-panel-config': AdminPanelConfigPage,
  'resignation': ResignationManagementPage,
};

export const SUPER_ADMIN_PAGE_COMPONENTS = {
  departments: DepartmentsAdminPage,
  'roles-permissions': RolesPermissionsAdminPage,
  'system-settings': SystemSettingsAdminPage,
  'audit-logs': AuditLogsAdminPage,
  'resignation': ResignationAdminViewPage,
  'role-transfer': RoleTransferAdmin,
};
