import { lazy } from 'react';

const DashboardPage = lazy(() => import('../Pages/Dashboard'));
const AttendancePage = lazy(() => import('../Pages/Attendance'));
const AnnouncementsPage = lazy(() => import('../Pages/Announcements'));
const AnalyticsPage = lazy(() => import('../Pages/Analytics'));
const EmployeeProfilePage = lazy(() => import('../Pages/EmployeeProfile'));
const EmployeesPage = lazy(() => import('../Pages/Employees'));
const LeaveManagementPage = lazy(() => import('../Pages/LeaveManagement'));
const LeavesPage = lazy(() => import('../Pages/Leaves'));
const PayrollPage = lazy(() => import('../Pages/Payroll'));
const PerformancePage = lazy(() => import('../Pages/Performance'));
const ReportsPage = lazy(() => import('../Pages/Reports'));
const SettingsPortalPage = lazy(() => import('../Pages/Settings'));
const TeamCollaborationPage = lazy(() => import('../Pages/TeamCollaboration'));
const MyResignationPage = lazy(() => import('../Pages/MyResignation'));
const ResignationApprovalsPage = lazy(() => import('../Pages/ResignationApprovals'));
const DashboardOverviewPage = lazy(() => import('../Pages/HR/DashboardOverview'));
const LeavesAttendancePage = lazy(() => import('../Pages/HR/LeavesAttendance'));
const HRPayrollPage = lazy(() => import('../Pages/HR/Payroll'));
const ExitClearancePage = lazy(() => import('../Pages/HR/ExitClearance'));
const MeetingRoomPage = lazy(() => import('../Pages/HR/MeetingRoom'));
const WorkflowsPage = lazy(() => import('../Pages/HR/Workflows'));
const LetterTemplatesPage = lazy(() => import('../Pages/HR/LetterTemplates'));
const UserManagementPage = lazy(() => import('../Pages/HR/UserManagement'));
const MastersPage = lazy(() => import('../Pages/HR/Masters'));
const AdminPanelConfigPage = lazy(() => import('../Pages/HR/AdminPanelConfig'));
const ResignationManagementPage = lazy(() => import('../Pages/HR/ResignationManagement'));
const DepartmentsAdminPage = lazy(() => import('../Pages/SuperAdmin/DepartmentsAdmin'));
const RolesPermissionsAdminPage = lazy(() => import('../Pages/SuperAdmin/RolesPermissionsAdmin'));
const SystemSettingsAdminPage = lazy(() => import('../Pages/SuperAdmin/SystemSettingsAdmin'));
const AuditLogsAdminPage = lazy(() => import('../Pages/SuperAdmin/AuditLogsAdmin'));
const ResignationAdminViewPage = lazy(() => import('../Pages/SuperAdmin/ResignationAdminView'));
const RoleTransferAdmin = lazy(() => import('../Pages/SuperAdmin/RoleTransferAdmin'));
const UnifiedComponentsGallery = lazy(() => import('./components/UnifiedComponentsGallery'));
const RecruitmentManagementPage = lazy(() => import('../Pages/operations/RecruitmentManagement'));
const ToolProvisioningPage = lazy(() => import('../Pages/operations/ToolProvisioningPage'));
const ProjectsAdminPage = lazy(() => import('../Pages/operations/ProjectsAdmin'));
const ShiftManagementPage = lazy(() => import('../Pages/operations/ShiftManagement'));
const OrgStructurePage = lazy(() => import('../Pages/operations/OrgStructurePage'));
const EmployeeBulkOpsPage = lazy(() => import('../Pages/operations/EmployeeBulkOps'));
const PerformanceManagementPage = lazy(() => import('../Pages/operations/PerformanceManagement'));
const AttendanceApprovalsPage = lazy(() => import('../Pages/operations/AttendanceApprovals'));
const ProfileChangeApprovalsPage = lazy(() => import('../Pages/HR/ProfileChangeApprovals'));
const InsuranceDetailsPage = lazy(() => import('../Pages/InsuranceDetails'));
const InsuranceApprovalsPage = lazy(() => import('../Pages/HR/InsuranceApprovals'));
const InsuranceCyclesPage = lazy(() => import('../Pages/HR/InsuranceCycles'));

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
