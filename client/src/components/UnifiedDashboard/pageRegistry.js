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
import UnifiedComponentsGallery from './components/UnifiedComponentsGallery';
import RecruitmentManagementPage from '../Pages/operations/RecruitmentManagement';
import ToolProvisioningPage from '../Pages/operations/ToolProvisioningPage';
import ProjectsAdminPage from '../Pages/operations/ProjectsAdmin';
import ShiftManagementPage from '../Pages/operations/ShiftManagement';
import OrgStructurePage from '../Pages/operations/OrgStructurePage';
import EmployeeBulkOpsPage from '../Pages/operations/EmployeeBulkOps';
import PerformanceManagementPage from '../Pages/operations/PerformanceManagement';
import AttendanceApprovalsPage from '../Pages/operations/AttendanceApprovals';
import ProfileChangeApprovalsPage from '../Pages/HR/ProfileChangeApprovals';
import InsuranceDetailsPage from '../Pages/InsuranceDetails';
import InsuranceApprovalsPage from '../Pages/HR/InsuranceApprovals';
import InsuranceCyclesPage from '../Pages/HR/InsuranceCycles';

export const OPERATIONS_PAGE_COMPONENTS = {
  recruitment: RecruitmentManagementPage,
  'tool-provisioning': ToolProvisioningPage,
  'projects-admin': ProjectsAdminPage,
  'shift-management': ShiftManagementPage,
  'org-structure': OrgStructurePage,
  'employee-bulk-ops': EmployeeBulkOpsPage,
  'performance-management': PerformanceManagementPage,
  'attendance-approvals': AttendanceApprovalsPage,
  'profile-approvals': ProfileChangeApprovalsPage,
  'insurance-approvals': InsuranceApprovalsPage,
  'insurance-cycles': InsuranceCyclesPage,
};

export const STANDARD_PAGE_COMPONENTS = {
  dashboard: DashboardPage,
  attendance: AttendancePage,
  announcements: AnnouncementsPage,
  analytics: AnalyticsPage,
  'employee-profile': EmployeeProfilePage,
  'insurance-details': InsuranceDetailsPage,
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
  ...OPERATIONS_PAGE_COMPONENTS,
};

export const HR_PAGE_COMPONENTS = {
  dashboard: DashboardOverviewPage,
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
  settings: SettingsPortalPage,
  'employee-profile': EmployeeProfilePage,
  'insurance-details': InsuranceDetailsPage,
  ...OPERATIONS_PAGE_COMPONENTS,
};

export const DEPT_ADMIN_PAGE_COMPONENTS = {
  dashboard: DashboardPage,
  attendance: AttendancePage,
  leaves: LeavesPage,
  settings: SettingsPortalPage,
  'employee-profile': EmployeeProfilePage,
  'insurance-details': InsuranceDetailsPage,
  'attendance-approvals': AttendanceApprovalsPage,
  'tool-provisioning': ToolProvisioningPage,
  'org-structure': OrgStructurePage,
  'performance-management': PerformanceManagementPage,
};

export const SUPER_ADMIN_PAGE_COMPONENTS = {
  departments: DepartmentsAdminPage,
  employees: EmployeesPage,
  announcements: AnnouncementsPage,
  'roles-permissions': RolesPermissionsAdminPage,
  'system-settings': SystemSettingsAdminPage,
  'audit-logs': AuditLogsAdminPage,
  'resignation': ResignationAdminViewPage,
  'role-transfer': RoleTransferAdmin,
  settings: SettingsPortalPage,
  'employee-profile': EmployeeProfilePage,
  'projects-admin': ProjectsAdminPage,
  'employee-bulk-ops': EmployeeBulkOpsPage,
  'org-structure': OrgStructurePage,
  'ui-components': UnifiedComponentsGallery,
};
