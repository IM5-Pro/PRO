import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/client';
import { ANNOUNCEMENT_ENDPOINTS } from '../../api/endpoints';
import HRSidebar from '../HRSidebar/HRSidebar';
import HRHeader from '../HRHeader/HRHeader';
import ProfileCard from '../ProfileCard/ProfileCard';
import AttendanceCard from '../AttendanceCard/AttendanceCard';
import LeaveBalance from '../LeaveBalance/LeaveBalance';
import Announcements from '../Announcements/Announcements';
import Birthdays from '../Birthdays/Birthdays';
import TodoList from '../TodoList/TodoList';
import TimeTracker from '../TimeTracker/TimeTracker';
import TeamStatsCard from '../TeamStatsCard/TeamStatsCard';
import TeamScheduleCalendar from '../TeamScheduleCalendar/TeamScheduleCalendar';
import TimingsChart from '../TimingsChart/TimingsChart';
import PerformanceChart from '../PerformanceChart/PerformanceChart';
import AttendanceSheet from '../AttendanceSheet/AttendanceSheet';
import BookMeeting from '../BookMeeting/BookMeeting';
import ManagerActionCenter from '../ManagerDashboard/ManagerActionCenter';
import ManagerSidebarPageContent from '../ManagerDashboard/ManagerSidebarPages';
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
import { ROLES } from '../../utils/roles';
import {
  approveLeaveRequest,
  assignPermissionToRole,
  assignRoleToPermission,
  createEmployeeRecord,
  fetchDashboardWidgetValues,
  fetchRolePageData,
  processPayrollRun,
  rejectLeaveRequest,
} from '../../services/unifiedDashboardApi';

const ROLE_DASHBOARD_CONFIG = {
  [ROLES.EMPLOYEE]: {
    portalLabel: 'Employee Self-Service',
    heading: 'My Work Dashboard',
    subtitle: 'Manage attendance, leave, payroll, and documents in one place.',
    widgets: [
      { key: 'attendance', title: 'Attendance This Month', value: '0', note: 'Live attendance summary from your daily records' },
      { key: 'leaves', title: 'My Leave Requests', value: '0', note: 'Submitted and approved leave requests from backend' },
      { key: 'holidays', title: 'Upcoming Holidays', value: '0', note: 'Holiday calendar synced from company leave policy' },
      { key: 'payslip', title: 'Payslips Available', value: '0', note: 'Payroll statements available for secure download' },
    ],
    pages: [
      { id: 'dashboard', label: 'Dashboard', icon: '🏠', category: 'main', description: 'Personal HR summary and quick actions' },
      { id: 'attendance', label: 'Attendance', icon: '🕒', category: 'work', description: 'Daily punch history and attendance status' },
      { id: 'announcements', label: 'Announcements', icon: '📢', category: 'work', description: 'Company updates and important notices' },
      { id: 'employee-profile', label: 'Employee Profile', icon: '👤', category: 'work', description: 'Personal information and employment details' },
      { id: 'leaves', label: 'Leaves', icon: '🌴', category: 'work', description: 'Apply leave and track request progress' },
      { id: 'payroll', label: 'Payroll', icon: '💵', category: 'work', description: 'Payslips, deductions, and payroll details' },
      { id: 'performance', label: 'Performance', icon: '📈', category: 'work', description: 'Goals, ratings, and review insights' },
      { id: 'settings', label: 'Settings', icon: '⚙️', category: 'work', description: 'Update profile preferences and account settings' },
    ],
  },
  [ROLES.MANAGER]: {
    portalLabel: 'Manager Control Center',
    heading: 'Team Operations Dashboard',
    subtitle: 'Monitor team performance, approve requests, and remove blockers.',
    widgets: [
      { key: 'team-attendance', title: 'Team Attendance Today', value: '0', note: 'Live team attendance snapshot from backend' },
      { key: 'leave-requests', title: 'Pending Leave Decisions', value: '0', note: 'Leave requests awaiting manager action' },
      { key: 'team-performance', title: 'Average Work Hours', value: 'N/A', note: 'Monthly effort trend generated from attendance summary' },
      { key: 'team-members', title: 'Direct Reports', value: '0', note: 'Active team members assigned to your reporting line' },
    ],
    pages: [
      { id: 'dashboard', label: 'Dashboard', icon: '🏠', category: 'main', description: 'Team KPIs and actionable updates' },
      { id: 'attendance', label: 'Attendance', icon: '🕒', category: 'operations', description: 'Daily attendance and punctuality tracking' },
      { id: 'announcements', label: 'Announcements', icon: '📢', category: 'operations', description: 'Company updates and important notices' },
      { id: 'analytics', label: 'Analytics', icon: '📈', category: 'operations', description: 'Team analytics and productivity trends' },
      { id: 'employee-profile', label: 'Employee Profile', icon: '👤', category: 'operations', description: 'Profile and role details' },
      { id: 'team', label: 'Team', icon: '👥', category: 'operations', description: 'Direct reports and team member details' },
      { id: 'leaves', label: 'Leaves', icon: '🌴', category: 'operations', description: 'Approve and track leave requests' },
      { id: 'payroll', label: 'Payroll', icon: '💵', category: 'operations', description: 'Payroll summaries and payouts' },
      { id: 'performance', label: 'Performance', icon: '🎯', category: 'operations', description: 'Performance reviews and goals' },
      { id: 'reports', label: 'Reports', icon: '📊', category: 'operations', description: 'Attendance and performance reports' },
      { id: 'settings', label: 'Settings', icon: '⚙️', category: 'operations', description: 'Manager preferences and account settings' },
      { id: 'team-collaboration', label: 'Team Collaboration', icon: '🤝', category: 'operations', description: 'Collaborate, communicate, and coordinate with teams' },
    ],
  },
  [ROLES.HR_ADMIN]: {
    portalLabel: 'HR Operations Center',
    heading: 'Workforce Operations Dashboard',
    subtitle: 'Run employee lifecycle operations across attendance, leave, and payroll.',
    widgets: [
      { key: 'total-employees', title: 'Active Employees', value: '0', note: 'Current workforce headcount from employee records' },
      { key: 'new-joiners', title: 'New Joiners (Month)', value: '0', note: 'Employees onboarded in the current month' },
      { key: 'pending-leaves', title: 'Leaves Awaiting Approval', value: '0', note: 'Pending leave requests requiring HR attention' },
      { key: 'payroll-processing', title: 'Payroll Runs', value: '0', note: 'Payroll cycle status across ongoing runs' },
    ],
    pages: [
      { id: 'dashboard', label: 'HR Overview', icon: '🏠', category: 'main', description: 'Organization-wide HR health summary' },
      { id: 'announcements', label: 'Announcements', icon: '📢', category: 'operations', description: 'Create and send company announcements' },
      { id: 'leaves-attendance', label: 'Leaves & Attendance', icon: '📅', category: 'operations', description: 'Manage leave flow and attendance records' },
      { id: 'manpower-planning', label: 'Manpower Planning', icon: '🧠', category: 'operations', description: 'Workforce planning and staffing insights' },
      { id: 'hr-payroll', label: 'HR Payroll', icon: '💰', category: 'operations', description: 'Payroll operations and payouts' },
      { id: 'exit-clearance', label: 'Exit Clearance', icon: '🚪', category: 'operations', description: 'Handle separation and clearance process' },
      { id: 'meeting-room', label: 'Meeting Room', icon: '📍', category: 'operations', description: 'Schedule meetings and room usage' },
      { id: 'workflows', label: 'Workflows', icon: '🔁', category: 'operations', description: 'Automate HR approval workflows' },
      { id: 'letter-templates', label: 'Letter Templates', icon: '✉️', category: 'operations', description: 'Generate HR letters and documents' },
      { id: 'user-management', label: 'User Management', icon: '👤', category: 'operations', description: 'Manage user accounts and access' },
      { id: 'masters', label: 'Masters', icon: '🗂️', category: 'operations', description: 'Departments, designations, and masters' },
      { id: 'admin-panel-config', label: 'Admin Panel Config', icon: '⚙️', category: 'operations', description: 'Configure HR admin panel behavior' },
    ],
  },
  [ROLES.SUPER_ADMIN]: {
    portalLabel: 'Enterprise Admin Center',
    heading: 'Governance Dashboard',
    subtitle: 'Oversee system governance, access control, and organizational structure.',
    widgets: [
      { key: 'company-overview', title: 'Organization Headcount', value: '0', note: 'Enterprise employee volume from live backend records' },
      { key: 'system-settings', title: 'Configured Roles', value: '0', note: 'Role and access model definitions in the platform' },
      { key: 'audit-logs', title: 'Active Sessions', value: '0', note: 'Authenticated sessions and access activity overview' },
      { key: 'department-stats', title: 'Departments', value: '0', note: 'Department structure and coverage across the company' },
    ],
    pages: [
      { id: 'dashboard', label: 'Overview', icon: '🛡️', category: 'main', description: 'Enterprise risk, usage, and control summary' },
      { id: 'employees', label: 'Global Employees', icon: '👥', category: 'governance', description: 'Cross-organization employee governance controls' },
      { id: 'departments', label: 'Department Admin', icon: '🏢', category: 'governance', description: 'Department setup and structural governance' },
      { id: 'announcements', label: 'Announcements', icon: '📢', category: 'governance', description: 'Create and send announcements to employees' },
      { id: 'roles-permissions', label: 'Access Control', icon: '🔐', category: 'governance', description: 'Roles, permissions, and assignment management' },
      { id: 'system-settings', label: 'Platform Settings', icon: '⚙️', category: 'system', description: 'Core tenant and policy configuration' },
      { id: 'audit-logs', label: 'Compliance Logs', icon: '📜', category: 'system', description: 'Security and compliance activity trails' },
      { id: 'ui-components', label: 'UI Components', icon: '🧩', category: 'system', description: 'Browse all dashboard widgets and cards' },
    ],
  },
};

const UI_COMPONENT_MEMBERS = [
  {
    id: 1,
    name: 'Sarah Johnson',
    role: 'Product Manager - PM01',
    avatar: '👩‍💼',
    calendar: ['present', 'present', 'present', 'halfDay', 'present', 'leave', 'leave', 'present', 'present', 'present', 'present', 'present', 'absent', 'leave', 'present', 'present', 'halfDay', 'present', 'present', 'present', 'leave', 'present', 'present', 'present', 'present', 'halfDay', 'leave', 'present', 'present', 'present'],
    lastWeekHours: 36,
    thisWeekHours: 34.5,
  },
  {
    id: 2,
    name: 'Mike Chen',
    role: 'Developer - DEV02',
    avatar: '👨‍💻',
    calendar: ['present', 'present', 'halfDay', 'present', 'present', 'leave', 'leave', 'present', 'present', 'present', 'present', 'present', 'present', 'leave', 'present', 'absent', 'present', 'present', 'present', 'present', 'leave', 'present', 'halfDay', 'present', 'present', 'present', 'leave', 'present', 'present', 'present'],
    lastWeekHours: 35.5,
    thisWeekHours: 36,
  },
  {
    id: 3,
    name: 'Emma Davis',
    role: 'Designer - DES01',
    avatar: '👩‍🎨',
    calendar: ['present', 'present', 'present', 'present', 'halfDay', 'leave', 'leave', 'present', 'present', 'present', 'absent', 'present', 'present', 'leave', 'present', 'present', 'present', 'halfDay', 'present', 'present', 'leave', 'present', 'present', 'present', 'present', 'present', 'leave', 'absent', 'present', 'present'],
    lastWeekHours: 32,
    thisWeekHours: 33.5,
  },
];

const MANAGER_PAGE_OPTIONS = [
  { id: 'users', label: 'Users' },
  { id: 'checklist', label: 'Checklist' },
  { id: 'leaves', label: 'Leaves' },
  { id: 'payroll', label: 'Payroll' },
  { id: 'recruit', label: 'Recruitment' },
  { id: 'messages', label: 'Messages' },
  { id: 'help', label: 'Help' },
  { id: 'settings', label: 'Settings' },
];

const STANDARD_PAGE_OPTIONS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'announcements', label: 'Announcements' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'employee-profile', label: 'Employee Profile' },
  { id: 'employees', label: 'Employees' },
  { id: 'leave-management', label: 'Leave Management' },
  { id: 'leaves', label: 'Leaves' },
  { id: 'payroll', label: 'Payroll' },
  { id: 'performance', label: 'Performance' },
  { id: 'reports', label: 'Reports' },
  { id: 'settings', label: 'Settings' },
  { id: 'team-collaboration', label: 'Team Collaboration' },
];

const HR_PAGE_OPTIONS = [
  { id: 'dashboard-overview', label: 'HR Overview' },
  { id: 'announcements', label: 'Announcements' },
  { id: 'leaves-attendance', label: 'Leaves & Attendance' },
  { id: 'manpower-planning', label: 'Manpower Planning' },
  { id: 'hr-payroll', label: 'HR Payroll' },
  { id: 'exit-clearance', label: 'Exit Clearance' },
  { id: 'meeting-room', label: 'Meeting Room' },
  { id: 'workflows', label: 'Workflows' },
  { id: 'letter-templates', label: 'Letter Templates' },
  { id: 'user-management', label: 'User Management' },
  { id: 'masters', label: 'Masters' },
  { id: 'admin-panel-config', label: 'Admin Panel Config' },
];

const STANDARD_PAGE_COMPONENTS = {
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
};

const HR_PAGE_COMPONENTS = {
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
};

const ROLE_AWARE_PREVIEW_CONFIG = {
  [ROLES.EMPLOYEE]: {
    showManagerSection: false,
    showHrSection: false,
    standardPages: ['dashboard', 'attendance', 'announcements', 'employee-profile', 'leaves', 'payroll', 'performance', 'settings'],
    showTeamWidgets: false,
  },
  [ROLES.MANAGER]: {
    showManagerSection: true,
    showHrSection: false,
    standardPages: ['dashboard', 'attendance', 'announcements', 'analytics', 'employee-profile', 'team', 'leaves', 'payroll', 'performance', 'reports', 'settings', 'team-collaboration'],
    showTeamWidgets: true,
  },
  [ROLES.HR_ADMIN]: {
    showManagerSection: false,
    showHrSection: true,
    standardPages: ['dashboard', 'attendance', 'announcements', 'analytics', 'employees', 'leave-management', 'leaves', 'payroll', 'performance', 'reports', 'settings', 'team-collaboration'],
    hrPages: ['dashboard-overview', 'announcements', 'leaves-attendance', 'manpower-planning', 'hr-payroll', 'exit-clearance', 'meeting-room', 'workflows', 'letter-templates', 'user-management', 'masters', 'admin-panel-config'],
    showTeamWidgets: true,
  },
  [ROLES.DEPT_ADMIN]: {
    showManagerSection: false,
    showHrSection: false,
    standardPages: ['dashboard', 'employees', 'attendance', 'leaves', 'reports', 'settings'],
    showTeamWidgets: true,
  },
  [ROLES.SUPER_ADMIN]: {
    showManagerSection: true,
    showHrSection: true,
    standardPages: STANDARD_PAGE_OPTIONS.map((item) => item.id),
    hrPages: HR_PAGE_OPTIONS.map((item) => item.id),
    showTeamWidgets: true,
  },
};

const SINGLE_DASHBOARD_ROLES = [];

const filterOptionsByIds = (options, ids = []) => {
  const allowed = new Set(ids);
  return options.filter((item) => allowed.has(item.id));
};

const PreviewFrame = ({ children }) => (
  <div className="rounded-2xl border border-slate-300/70 bg-white/30 overflow-hidden">
    <div className="bg-slate-100/70 border-b border-slate-300/70 px-4 py-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Preview</p>
    </div>
    <div>{children}</div>
  </div>
);

const UnifiedComponentsGallery = ({ user }) => {
  const [selectedMember, setSelectedMember] = useState(UI_COMPONENT_MEMBERS[0]);
  const [selectedManagerPage, setSelectedManagerPage] = useState('users');
  const [selectedStandardPage, setSelectedStandardPage] = useState('dashboard');
  const [selectedHrPage, setSelectedHrPage] = useState('dashboard-overview');
  const previewConfig = ROLE_AWARE_PREVIEW_CONFIG[user?.role] || ROLE_AWARE_PREVIEW_CONFIG[ROLES.EMPLOYEE];

  const currentUserName = user?.name || 'HRMS User';
  const currentUserRole = String(user?.role || 'employee').replace(/_/g, ' ');
  const currentUserDepartment = user?.department || 'People Operations';
  const currentUserEmail = user?.email || 'user@company.com';
  const availableStandardPages = useMemo(
    () => filterOptionsByIds(STANDARD_PAGE_OPTIONS, previewConfig.standardPages || []),
    [previewConfig.standardPages]
  );
  const availableHrPages = useMemo(
    () => filterOptionsByIds(HR_PAGE_OPTIONS, previewConfig.hrPages || []),
    [previewConfig.hrPages]
  );
  const SelectedStandardPage = STANDARD_PAGE_COMPONENTS[selectedStandardPage] || DashboardPage;
  const SelectedHrPage = HR_PAGE_COMPONENTS[selectedHrPage] || DashboardOverviewPage;

  useEffect(() => {
    if (availableStandardPages.length === 0) {
      return;
    }

    const hasSelectedStandardPage = availableStandardPages.some((item) => item.id === selectedStandardPage);
    if (!hasSelectedStandardPage) {
      setSelectedStandardPage(availableStandardPages[0].id);
    }
  }, [availableStandardPages, selectedStandardPage]);

  useEffect(() => {
    if (availableHrPages.length === 0) {
      return;
    }

    const hasSelectedHrPage = availableHrPages.some((item) => item.id === selectedHrPage);
    if (!hasSelectedHrPage) {
      setSelectedHrPage(availableHrPages[0].id);
    }
  }, [availableHrPages, selectedHrPage]);

  useEffect(() => {
    if (!previewConfig.showManagerSection) {
      return;
    }

    const hasSelectedManagerPage = MANAGER_PAGE_OPTIONS.some((item) => item.id === selectedManagerPage);
    if (!hasSelectedManagerPage) {
      setSelectedManagerPage(MANAGER_PAGE_OPTIONS[0].id);
    }
  }, [previewConfig.showManagerSection, selectedManagerPage]);

  return (
    <div className="min-h-screen bg-transparent p-6 md:p-8 space-y-6">
      <div className="rounded-2xl p-6 bg-white/10 backdrop-blur-3xl border border-white/30 ring-1 ring-white/20">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Unified UI Components</h1>
        <p className="text-slate-600">All dashboard cards, charts, lists, and planning widgets are available in this module, filtered for the current role.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <ProfileCard
          name={currentUserName}
          role={currentUserRole}
          department={currentUserDepartment}
          email={currentUserEmail}
          phone="+1-234-567-8900"
          location="HQ Campus"
          avatar={user?.avatar || '👨‍💼'}
        />
        <AttendanceCard present={20} absent={2} late={1} percentage={91} />
        <LeaveBalance totalLeaves={24} usedLeaves={8} sickLeaves={8} casualLeaves={16} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Announcements />
        <TodoList />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Birthdays />
        <TimeTracker />
        <BookMeeting />
      </div>

      {previewConfig.showTeamWidgets && (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <TeamStatsCard />
            <TimingsChart selectedMember={selectedMember} onMemberSelect={setSelectedMember} period="This Week" />
          </div>

          <TeamScheduleCalendar
            teamMembers={UI_COMPONENT_MEMBERS}
            selectedMember={selectedMember}
            onMemberSelect={setSelectedMember}
          />
        </>
      )}

      <PerformanceChart />

      <AttendanceSheet />

      {previewConfig.showManagerSection && (
        <div className="bg-white/20 border border-white/30 rounded-2xl p-6 space-y-5">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Manager Action Center Pages</h2>
            <p className="text-slate-600 text-sm">Preview manager action center modules and sidebar pages relevant to this role.</p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-1">
              <ManagerActionCenter
                onNavigate={(pageId) => {
                  if (MANAGER_PAGE_OPTIONS.some((item) => item.id === pageId)) {
                    setSelectedManagerPage(pageId);
                    return;
                  }

                  setSelectedManagerPage('users');
                }}
              />
            </div>

            <div className="xl:col-span-2 space-y-3">
              <div className="flex flex-wrap gap-2">
                {MANAGER_PAGE_OPTIONS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedManagerPage(item.id)}
                    className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                      selectedManagerPage === item.id
                        ? 'bg-blue-600 text-white border-blue-700'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <PreviewFrame>
                <ManagerSidebarPageContent pageId={selectedManagerPage} onAction={() => {}} />
              </PreviewFrame>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white/20 border border-white/30 rounded-2xl p-6 space-y-5">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Application Pages Preview</h2>
          <p className="text-slate-600 text-sm">Browse the standard application pages relevant to the current role.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {availableStandardPages.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedStandardPage(item.id)}
              className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                selectedStandardPage === item.id
                  ? 'bg-blue-600 text-white border-blue-700'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <PreviewFrame>
          <SelectedStandardPage />
        </PreviewFrame>
      </div>

      {previewConfig.showHrSection && availableHrPages.length > 0 && (
        <div className="bg-white/20 border border-white/30 rounded-2xl p-6 space-y-5">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">HR Pages Preview</h2>
            <p className="text-slate-600 text-sm">Browse HR module pages relevant to the current role from the same unified components area.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {availableHrPages.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedHrPage(item.id)}
                className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                  selectedHrPage === item.id
                    ? 'bg-blue-600 text-white border-blue-700'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <PreviewFrame>
            <SelectedHrPage user={user || {}} pageConfig={{}} onUserUpdate={() => {}} onNavigate={() => {}} />
          </PreviewFrame>
        </div>
      )}
    </div>
  );
};

const HrPagesPreviewWorkspace = ({ user }) => {
  const [selectedHrPage, setSelectedHrPage] = useState('dashboard-overview');
  const availableHrPages = useMemo(() => HR_PAGE_OPTIONS, []);
  const SelectedHrPage = HR_PAGE_COMPONENTS[selectedHrPage] || DashboardOverviewPage;

  useEffect(() => {
    if (availableHrPages.length === 0) {
      return;
    }

    const hasSelectedHrPage = availableHrPages.some((item) => item.id === selectedHrPage);
    if (!hasSelectedHrPage) {
      setSelectedHrPage(availableHrPages[0].id);
    }
  }, [availableHrPages, selectedHrPage]);

  return (
    <div className="min-h-screen bg-transparent p-6 md:p-8 space-y-5">
      <div className="rounded-2xl p-6 bg-white border border-slate-200 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">HR Pages Preview</h1>
        <p className="text-slate-500 text-sm">This is the complete HR dashboard workspace. Open each HR module below and work with live backend data.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-3 flex flex-wrap gap-2">
        {availableHrPages.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSelectedHrPage(item.id)}
            className={`px-4 py-2 rounded-lg border text-sm font-semibold transition-colors ${
              selectedHrPage === item.id
                ? 'bg-blue-600 text-white border-blue-700'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <PreviewFrame>
        <SelectedHrPage user={user || {}} pageConfig={{}} onUserUpdate={() => {}} onNavigate={() => {}} />
      </PreviewFrame>
    </div>
  );
};

const StandardPagesPreviewWorkspace = ({ user, role, rolePages = [] }) => {
  const previewConfig = ROLE_AWARE_PREVIEW_CONFIG[role] || ROLE_AWARE_PREVIEW_CONFIG[ROLES.EMPLOYEE];
  const [selectedStandardPage, setSelectedStandardPage] = useState('dashboard');

  const availableStandardPages = useMemo(
    () => filterOptionsByIds(STANDARD_PAGE_OPTIONS, previewConfig.standardPages || []),
    [previewConfig.standardPages]
  );

  const selectedOption = availableStandardPages.find((item) => item.id === selectedStandardPage) || availableStandardPages[0];
  const effectivePageId = selectedOption?.id || 'dashboard';
  const SelectedStandardPage = STANDARD_PAGE_COMPONENTS[effectivePageId];

  useEffect(() => {
    if (availableStandardPages.length === 0) {
      return;
    }

    const hasSelectedStandardPage = availableStandardPages.some((item) => item.id === selectedStandardPage);
    if (!hasSelectedStandardPage) {
      setSelectedStandardPage(availableStandardPages[0].id);
    }
  }, [availableStandardPages, selectedStandardPage]);

  const roleLabel = role === ROLES.MANAGER ? 'Manager' : 'Employee';
  const pageMeta = rolePages.find((page) => page.id === effectivePageId);

  return (
    <div className="min-h-screen bg-transparent p-6 md:p-8 space-y-5">
      <div className="rounded-2xl p-6 bg-white border border-slate-200 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">{roleLabel} Pages Preview</h1>
        <p className="text-slate-500 text-sm">One dashboard layout with role-based modules. Each tab renders the actual component with live backend data.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-3 flex flex-wrap gap-2">
        {availableStandardPages.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSelectedStandardPage(item.id)}
            className={`px-4 py-2 rounded-lg border text-sm font-semibold transition-colors ${
              effectivePageId === item.id
                ? 'bg-blue-600 text-white border-blue-700'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <PreviewFrame>
        {SelectedStandardPage ? (
          <SelectedStandardPage user={user || {}} />
        ) : (
          <RolePage
            title={pageMeta?.label || 'Page'}
            description={pageMeta?.description || 'Live data module'}
            role={role}
            pageId={effectivePageId}
          />
        )}
      </PreviewFrame>
    </div>
  );
};

const DashboardHome = ({ heading, subtitle, widgets, pages, onNavigate, loading }) => {
  const quickPages = pages.filter((page) => page.id !== 'dashboard').slice(0, 6);

  return (
    <div className="min-h-screen bg-transparent p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-1">{heading}</h1>
        <p className="text-sm text-slate-500">{subtitle}</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {widgets.map((widget) => (
          <div
            key={widget.title}
            className="bg-white rounded-xl border border-slate-200 px-5 py-4"
            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
          >
            <p className="text-xs font-medium text-slate-500 mb-2">{widget.title}</p>
            <p className="text-3xl font-bold text-slate-800 mb-1">{loading ? '—' : widget.value}</p>
            <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{widget.note}</p>
          </div>
        ))}
      </div>

      {/* Quick Access */}
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Quick Access</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {quickPages.map((page) => (
          <button
            key={page.id}
            onClick={() => onNavigate(page.id)}
            className="text-left p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition-all group"
            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
          >
            <span className="text-xl block mb-2">{page.icon}</span>
            <p className="text-sm font-semibold text-slate-800 group-hover:text-blue-700 leading-tight">{page.label}</p>
            {page.description && (
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{page.description}</p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

const formatValue = (value) => {
  if (value === null || value === undefined) {
    return '-';
  }

  if (typeof value === 'object') {
    if (value.name) {
      return value.name;
    }

    if (value.firstName || value.lastName) {
      return `${value.firstName || ''} ${value.lastName || ''}`.trim();
    }

    return JSON.stringify(value).slice(0, 60);
  }

  return String(value);
};

const getByPath = (input, path) => {
  if (!input || !path) {
    return undefined;
  }

  return path.split('.').reduce((acc, key) => {
    if (acc && Object.prototype.hasOwnProperty.call(acc, key)) {
      return acc[key];
    }

    return undefined;
  }, input);
};

const normalizeId = (value) => {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'string') {
    return value.trim();
  }

  if (typeof value === 'number') {
    return String(value);
  }

  if (typeof value === 'object') {
    if (typeof value._id === 'string') {
      return value._id;
    }

    if (typeof value.id === 'string') {
      return value.id;
    }
  }

  return '';
};

const extractIdFromRow = (row, candidates) => {
  for (const key of candidates) {
    const rawValue = getByPath(row, key);
    const id = normalizeId(rawValue);
    if (id) {
      return id;
    }
  }

  return '';
};

const extractLeaveId = (row) => {
  return extractIdFromRow(row, ['leaveId', 'leaveRequestId', 'requestId', '_id', 'id']);
};

const extractRunId = (row) => {
  return extractIdFromRow(row, ['runId', 'payrollRunId', '_id', 'id']);
};

const extractRoleId = (row) => {
  return extractIdFromRow(row, ['roleId', '_id', 'id', 'role._id', 'role.id']);
};

const extractPermissionId = (row) => {
  return extractIdFromRow(row, ['permissionId', '_id', 'id', 'permission._id', 'permission.id']);
};

const buildRoleActions = (role, pageId) => {
  const actions = [];

  if (
    (role === ROLES.MANAGER && pageId === 'leave-approvals') ||
    ((role === ROLES.HR_ADMIN || role === ROLES.SUPER_ADMIN) && pageId === 'leaves')
  ) {
    actions.push({
      id: 'approve-leave',
      title: 'Approve Leave Request',
      buttonLabel: 'Approve',
      fields: [{ key: 'leaveId', label: 'Leave Request ID', placeholder: 'Enter leave request ID' }],
      run: async (values) => {
        return approveLeaveRequest(values.leaveId);
      },
    });

    actions.push({
      id: 'reject-leave',
      title: 'Reject Leave Request',
      buttonLabel: 'Reject',
      fields: [{ key: 'leaveId', label: 'Leave Request ID', placeholder: 'Enter leave request ID' }],
      run: async (values) => {
        return rejectLeaveRequest(values.leaveId);
      },
    });
  }

  if ((role === ROLES.HR_ADMIN || role === ROLES.SUPER_ADMIN) && pageId === 'payroll') {
    actions.push({
      id: 'process-payroll',
      title: 'Trigger Payroll Process',
      buttonLabel: 'Process Payroll',
      fields: [{ key: 'runId', label: 'Payroll Run ID', placeholder: 'Enter payroll run ID' }],
      run: async (values) => {
        return processPayrollRun(values.runId);
      },
    });
  }

  if ((role === ROLES.HR_ADMIN || role === ROLES.SUPER_ADMIN) && pageId === 'employees') {
    actions.push({
      id: 'create-employee',
      title: 'Add Employee',
      buttonLabel: 'Create Employee',
      fields: [
        { key: 'firstName', label: 'First Name', placeholder: 'Enter first name', required: true },
        { key: 'lastName', label: 'Last Name', placeholder: 'Enter last name', required: true },
        { key: 'email', label: 'Work Email', placeholder: 'Enter work email', required: true },
        { key: 'department', label: 'Department (optional)', placeholder: 'Enter department', required: false },
        { key: 'designation', label: 'Designation (optional)', placeholder: 'Enter designation', required: false },
        { key: 'salary', label: 'Salary (optional)', placeholder: 'Enter salary amount', required: false },
        { key: 'joinDate', label: 'Join Date (optional)', placeholder: 'YYYY-MM-DD', required: false },
        { key: 'phoneNumber', label: 'Phone Number (optional)', placeholder: '10-digit phone number', required: false },
        { key: 'managerId', label: 'Manager ID (optional)', placeholder: 'Enter manager employee ID', required: false },
        {
          key: 'accountRole',
          label: 'Account Role (optional)',
          placeholder: 'EMPLOYEE (default), MANAGER, or HR_ADMIN',
          required: false,
        },
      ],
      run: async (values) => {
        return createEmployeeRecord({
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          department: values.department,
          designation: values.designation,
          salary: values.salary,
          joinDate: values.joinDate,
          phoneNumber: values.phoneNumber,
          managerId: values.managerId,
          accountRole: values.accountRole,
        });
      },
    });
  }

  if ((role === ROLES.HR_ADMIN || role === ROLES.SUPER_ADMIN) && pageId === 'roles-permissions') {
    actions.push({
      id: 'assign-permission-to-role',
      title: 'Assign Permission to Role',
      buttonLabel: 'Assign Permission',
      fields: [
        { key: 'roleId', label: 'Role ID', placeholder: 'Enter role ID' },
        { key: 'permissionId', label: 'Permission ID', placeholder: 'Enter permission ID' },
      ],
      run: async (values) => {
        return assignPermissionToRole({
          roleId: values.roleId,
          permissionId: values.permissionId,
        });
      },
    });

    actions.push({
      id: 'assign-role-to-permission',
      title: 'Assign Role to Permission',
      buttonLabel: 'Assign Role',
      fields: [
        { key: 'permissionId', label: 'Permission ID', placeholder: 'Enter permission ID' },
        { key: 'roleId', label: 'Role ID', placeholder: 'Enter role ID' },
      ],
      run: async (values) => {
        return assignRoleToPermission({
          permissionId: values.permissionId,
          roleId: values.roleId,
        });
      },
    });
  }

  return actions;
};

const SKIP_COLS = new Set([
  '__v', 'documents', 'statusHistory', 'salaryTemplateId',
  'refreshTokenHash', 'passwordResetTokenHash', 'failedLoginAttempts',
  'lockedUntil', 'passwordChangedAt', 'passwordResetExpiry',
]);

const HUMAN_LABELS = {
  _id: 'ID', firstName: 'First Name', lastName: 'Last Name', email: 'Email',
  phoneNumber: 'Phone', isActive: 'Status', createdAt: 'Created', updatedAt: 'Updated',
  employeeCode: 'Emp Code', department: 'Department', designation: 'Title',
  joinDate: 'Join Date', salary: 'Salary', role: 'Role', name: 'Name',
  description: 'Description', status: 'Status', type: 'Type', amount: 'Amount',
  startDate: 'Start', endDate: 'End', checkIn: 'Check-in', checkOut: 'Check-out',
  date: 'Date', leaveType: 'Leave Type', reason: 'Reason',
};
const humanLabel = (key) =>
  HUMAN_LABELS[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());

const pickColumns = (row, max = 5) => {
  if (!row) return [];
  return Object.keys(row).filter((k) => !SKIP_COLS.has(k)).slice(0, max);
};

const StatusBadge = ({ value, col }) => {
  if (col === 'isActive') {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
        value ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
      }`}>{value ? 'Active' : 'Inactive'}</span>
    );
  }
  const str = String(value ?? '').toUpperCase();
  const cls = str === 'ACTIVE' || str === 'APPROVED'
    ? 'bg-green-100 text-green-700'
    : str === 'PENDING' ? 'bg-amber-100 text-amber-700'
    : str === 'REJECTED' || str === 'TERMINATED' ? 'bg-red-100 text-red-700'
    : 'bg-slate-100 text-slate-600';
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{formatValue(value)}</span>;
};

const RolePage = ({ title, description, role, pageId }) => {
  const [loading, setLoading] = useState(true);
  const [datasets, setDatasets] = useState([]);
  const [formValues, setFormValues] = useState({});
  const [actionState, setActionState] = useState({ loadingId: '', message: '', isError: false });
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [selectedPermissionId, setSelectedPermissionId] = useState('');

  const [openActionId, setOpenActionId] = useState(null);

  const actions = useMemo(() => buildRoleActions(role, pageId), [role, pageId]);
  const actionsById = useMemo(() => {
    return actions.reduce((acc, action) => {
      acc[action.id] = action;
      return acc;
    }, {});
  }, [actions]);

  const loadPageData = useCallback(async () => {
    setLoading(true);
    const response = await fetchRolePageData(role, pageId);
    setDatasets(response);
    setLoading(false);
  }, [role, pageId]);

  useEffect(() => {
    loadPageData();
  }, [loadPageData]);

  const onFieldChange = useCallback((actionId, key, value) => {
    setFormValues((prev) => ({
      ...prev,
      [actionId]: {
        ...(prev[actionId] || {}),
        [key]: value,
      },
    }));
  }, []);

  const runAction = useCallback(
    async (action, overrides = {}) => {
      const values = {
        ...(formValues[action.id] || {}),
        ...overrides,
      };

      if (Object.keys(overrides).length > 0) {
        setFormValues((prev) => ({
          ...prev,
          [action.id]: {
            ...(prev[action.id] || {}),
            ...overrides,
          },
        }));
      }

      const missingField = action.fields.find((field) => {
        if (field.required === false) {
          return false;
        }

        return !String(values[field.key] || '').trim();
      });

      if (missingField) {
        setActionState({
          loadingId: '',
          message: `${missingField.label} is required`,
          isError: true,
        });
        return;
      }

      setActionState({ loadingId: action.id, message: '', isError: false });

      try {
        const actionResult = await action.run(values);
        setActionState({
          loadingId: '',
          message: actionResult?.message || `${action.title} completed successfully`,
          isError: false,
        });
        await loadPageData();
      } catch (err) {
        setActionState({
          loadingId: '',
          message: err?.response?.data?.message || err?.message || 'Action failed',
          isError: true,
        });
      }
    },
    [formValues, loadPageData]
  );

  useEffect(() => {
    if (pageId !== 'roles-permissions') {
      if (selectedRoleId) {
        setSelectedRoleId('');
      }

      if (selectedPermissionId) {
        setSelectedPermissionId('');
      }

      return;
    }

    const rolesDataset = datasets.find((dataset) => dataset.key === 'roles');
    const permissionsDataset = datasets.find((dataset) => dataset.key === 'permissions');

    const roleIds = (Array.isArray(rolesDataset?.rows) ? rolesDataset.rows : [])
      .map((row) => extractRoleId(row))
      .filter(Boolean);

    const permissionIds = (Array.isArray(permissionsDataset?.rows) ? permissionsDataset.rows : [])
      .map((row) => extractPermissionId(row))
      .filter(Boolean);

    if (roleIds.length === 0) {
      if (selectedRoleId) {
        setSelectedRoleId('');
      }
    } else if (!selectedRoleId || !roleIds.includes(selectedRoleId)) {
      setSelectedRoleId(roleIds[0]);
    }

    if (permissionIds.length === 0) {
      if (selectedPermissionId) {
        setSelectedPermissionId('');
      }
    } else if (!selectedPermissionId || !permissionIds.includes(selectedPermissionId)) {
      setSelectedPermissionId(permissionIds[0]);
    }
  }, [datasets, pageId, selectedPermissionId, selectedRoleId]);

  const getRowActions = useCallback(
    (datasetKey, row) => {
      const rowActions = [];
      const status = String(row?.status || '').toUpperCase();

      if (datasetKey === 'leaves' || datasetKey === 'leave-requests') {
        const leaveId = extractLeaveId(row);
        const canApproveOrReject = !status || status === 'PENDING';

        if (leaveId && actionsById['approve-leave']) {
          rowActions.push({
            key: `approve-${leaveId}`,
            label: 'Approve',
            tone: 'success',
            actionId: 'approve-leave',
            values: { leaveId },
            disabled: !canApproveOrReject,
          });
        }

        if (leaveId && actionsById['reject-leave']) {
          rowActions.push({
            key: `reject-${leaveId}`,
            label: 'Reject',
            tone: 'danger',
            actionId: 'reject-leave',
            values: { leaveId },
            disabled: !canApproveOrReject,
          });
        }
      }

      if (datasetKey === 'payroll-runs') {
        const runId = extractRunId(row);
        const canProcess = !status || status === 'DRAFT';

        if (runId && actionsById['process-payroll']) {
          rowActions.push({
            key: `process-${runId}`,
            label: 'Process',
            tone: 'primary',
            actionId: 'process-payroll',
            values: { runId },
            disabled: !canProcess,
          });
        }
      }

      if (pageId === 'roles-permissions' && datasetKey === 'roles') {
        const roleId = extractRoleId(row);

        if (roleId) {
          rowActions.push({
            key: `use-role-${roleId}`,
            label: selectedRoleId === roleId ? 'Role Selected' : 'Use Role',
            tone: selectedRoleId === roleId ? 'active' : 'secondary',
            onClick: () => setSelectedRoleId(roleId),
          });

          if (selectedPermissionId && actionsById['assign-permission-to-role']) {
            rowActions.push({
              key: `assign-permission-${roleId}`,
              label: 'Assign Permission',
              tone: 'primary',
              actionId: 'assign-permission-to-role',
              values: {
                roleId,
                permissionId: selectedPermissionId,
              },
            });
          }
        }
      }

      if (pageId === 'roles-permissions' && datasetKey === 'permissions') {
        const permissionId = extractPermissionId(row);

        if (permissionId) {
          rowActions.push({
            key: `use-permission-${permissionId}`,
            label: selectedPermissionId === permissionId ? 'Permission Selected' : 'Use Permission',
            tone: selectedPermissionId === permissionId ? 'active' : 'secondary',
            onClick: () => setSelectedPermissionId(permissionId),
          });

          if (selectedRoleId && actionsById['assign-role-to-permission']) {
            rowActions.push({
              key: `assign-role-${permissionId}`,
              label: 'Assign Role',
              tone: 'primary',
              actionId: 'assign-role-to-permission',
              values: {
                permissionId,
                roleId: selectedRoleId,
              },
            });
          }
        }
      }

      return rowActions;
    },
    [actionsById, pageId, selectedPermissionId, selectedRoleId]
  );

  const getRowActionClassName = useCallback((tone) => {
    if (tone === 'danger') {
      return 'bg-red-100 text-red-700 border border-red-200 hover:bg-red-200 disabled:bg-red-100/60 disabled:text-red-400 disabled:border-red-100';
    }

    if (tone === 'success') {
      return 'bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-200 disabled:bg-emerald-100/60 disabled:text-emerald-400 disabled:border-emerald-100';
    }

    if (tone === 'active') {
      return 'bg-blue-600 text-white border border-blue-700 hover:bg-blue-700 disabled:bg-blue-300 disabled:border-blue-300';
    }

    if (tone === 'secondary') {
      return 'bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200 disabled:bg-slate-100/70 disabled:text-slate-400 disabled:border-slate-200';
    }

    return 'bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200 disabled:bg-blue-100/70 disabled:text-blue-400 disabled:border-blue-100';
  }, []);

  return (
    <div className="min-h-screen bg-transparent p-6 md:p-8">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800">{title}</h1>
        {description && <p className="text-sm text-slate-400 mt-0.5">{description}</p>}
      </div>

      {/* Actions toolbar */}
      {actions.length > 0 && (
        <div className="mb-6">
          {pageId === 'roles-permissions' && (selectedRoleId || selectedPermissionId) && (
            <div className="mb-3 px-4 py-2.5 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-600 flex flex-wrap gap-4">
              <span>Role: <strong className="text-slate-800">{selectedRoleId || '—'}</strong></span>
              <span>Permission: <strong className="text-slate-800">{selectedPermissionId || '—'}</strong></span>
            </div>
          )}
          <div className="flex flex-wrap gap-2 mb-3">
            {actions.map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={() => setOpenActionId(openActionId === action.id ? null : action.id)}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  openActionId === action.id
                    ? 'bg-blue-600 text-white border-blue-700'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                {openActionId === action.id ? '✕ Close' : `+ ${action.buttonLabel}`}
              </button>
            ))}
          </div>
          {actions.map((action) => {
            if (openActionId !== action.id) return null;
            const values = formValues[action.id] || {};
            const isRunning = actionState.loadingId === action.id;
            return (
              <div key={action.id} className="bg-white rounded-xl border border-slate-200 p-5 mb-3" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <h3 className="text-sm font-semibold text-slate-700 mb-4">{action.title}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  {action.fields.map((field) => (
                    <div key={field.key}>
                      <label className="block text-xs text-slate-500 mb-1">{field.label}</label>
                      <input
                        type={field.inputType || 'text'}
                        value={values[field.key] || ''}
                        onChange={(event) => onFieldChange(action.id, field.key, event.target.value)}
                        placeholder={field.placeholder}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white"
                      />
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => runAction(action)}
                  disabled={isRunning}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold text-sm transition-colors"
                >
                  {isRunning ? 'Processing...' : action.buttonLabel}
                </button>
              </div>
            );
          })}
          {actionState.message && (
            <p className={`text-sm rounded-lg px-4 py-2.5 ${
              actionState.isError
                ? 'bg-red-50 text-red-600 border border-red-200'
                : 'bg-green-50 text-green-700 border border-green-200'
            }`}>
              {actionState.message}
            </p>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-3 text-slate-400 py-16">
          <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          Loading records...
        </div>
      ) : datasets.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-400 text-sm">
          No data is mapped for this module yet.
        </div>
      ) : (
        <div className="space-y-5">
          {datasets.map((dataset) => {
            const rows = Array.isArray(dataset.rows) ? dataset.rows : [];
            const hasError = Boolean(dataset.error);
            const previewRows = rows.slice(0, 8);
            const firstRow = previewRows.find((row) => row && typeof row === 'object' && !Array.isArray(row));
            const columns = pickColumns(firstRow);
            const rowActionsByIndex = previewRows.map((row) => getRowActions(dataset.key, row));
            const hasRowActions = rowActionsByIndex.some((rowActions) => rowActions.length > 0);

            return (
              <div key={dataset.key} className="bg-white rounded-xl border border-slate-200 overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
                  <h2 className="text-sm font-semibold text-slate-700">{dataset.label}</h2>
                  <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">{dataset.count ?? rows.length} records</span>
                </div>

                {hasError ? (
                  <p className="px-5 py-4 text-sm text-red-500">{dataset.error}</p>
                ) : previewRows.length === 0 ? (
                  <p className="px-5 py-10 text-sm text-slate-400 text-center">No records found.</p>
                ) : columns.length === 0 ? (
                  <pre className="text-xs text-slate-600 overflow-auto bg-slate-50 m-4 p-3 rounded-lg">{JSON.stringify(previewRows, null, 2)}</pre>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50">
                        <tr>
                          {columns.map((col) => (
                            <th key={col} className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                              {humanLabel(col)}
                            </th>
                          ))}
                          {hasRowActions && (
                            <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {previewRows.map((row, index) => {
                          const rowActions = rowActionsByIndex[index] || [];
                          return (
                            <tr key={index} className="hover:bg-slate-50/60 transition-colors">
                              {columns.map((col) => (
                                <td key={`${index}-${col}`} className="px-4 py-3 text-sm text-slate-700 max-w-[200px] truncate">
                                  {(col === 'isActive' || col === 'status')
                                    ? <StatusBadge value={row[col]} col={col} />
                                    : formatValue(row[col])
                                  }
                                </td>
                              ))}
                              {hasRowActions && (
                                <td className="px-4 py-3">
                                  <div className="flex flex-wrap gap-1.5">
                                    {rowActions.map((rowAction) => {
                                      const isRunning = rowAction.actionId && actionState.loadingId === rowAction.actionId;
                                      return (
                                        <button
                                          key={rowAction.key}
                                          type="button"
                                          onClick={() => {
                                            if (rowAction.onClick) { rowAction.onClick(); return; }
                                            const action = actionsById[rowAction.actionId];
                                            if (action) runAction(action, rowAction.values || {});
                                          }}
                                          disabled={Boolean(rowAction.disabled) || Boolean(isRunning)}
                                          className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${getRowActionClassName(rowAction.tone)}`}
                                        >
                                          {isRunning ? '…' : rowAction.label}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const UnifiedDashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user = {}, logout } = useAuth();
  const contentScrollRef = useRef(null);
  const [notificationCount, setNotificationCount] = useState(3);
  const [dashboardWidgets, setDashboardWidgets] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  const userRole = user?.role || ROLES.EMPLOYEE;
  const isSingleDashboardLayout = SINGLE_DASHBOARD_ROLES.includes(userRole);
  const roleConfig = useMemo(() => {
    return ROLE_DASHBOARD_CONFIG[userRole] || ROLE_DASHBOARD_CONFIG[ROLES.EMPLOYEE];
  }, [userRole]);

  const [currentPage, setCurrentPage] = useState(() => searchParams.get('page') || 'dashboard');

  useEffect(() => {
    const pageFromUrl = searchParams.get('page');
    if (!pageFromUrl) {
      return;
    }

    setCurrentPage((previousPage) => (
      previousPage === pageFromUrl ? previousPage : pageFromUrl
    ));
  }, [searchParams]);

  useEffect(() => {
    const hasPage = roleConfig.pages.some((page) => page.id === currentPage);
    if (!hasPage && currentPage !== 'dashboard') {
      setCurrentPage('dashboard');
    }
  }, [currentPage, roleConfig.pages]);

  useEffect(() => {
    if (isSingleDashboardLayout && currentPage !== 'dashboard') {
      setCurrentPage('dashboard');
    }
  }, [currentPage, isSingleDashboardLayout]);

  useEffect(() => {
    const currentPageFromUrl = searchParams.get('page') || 'dashboard';
    if (currentPageFromUrl === currentPage) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams);
    if (currentPage === 'dashboard') {
      nextParams.delete('page');
    } else {
      nextParams.set('page', currentPage);
    }
    setSearchParams(nextParams, { replace: true });
  }, [currentPage, searchParams, setSearchParams]);

  useEffect(() => {
    let isMounted = true;

    const loadWidgets = async () => {
      setDashboardLoading(true);
      const liveValues = await fetchDashboardWidgetValues(userRole);

      const mergedWidgets = roleConfig.widgets.map((widget) => {
        const liveValue = liveValues[widget.key];
        if (!liveValue) {
          return widget;
        }

        return {
          ...widget,
          value: liveValue.value,
          note: `${widget.note} ${liveValue.noteSuffix}`.trim(),
        };
      });

      if (isMounted) {
        setDashboardWidgets(mergedWidgets);
        setDashboardLoading(false);
      }
    };

    setDashboardWidgets(roleConfig.widgets);
    loadWidgets();

    return () => {
      isMounted = false;
    };
  }, [roleConfig.widgets, userRole]);

  useEffect(() => {
    let isMounted = true;

    const loadAnnouncementNotifications = async () => {
      try {
        const response = await API.get(ANNOUNCEMENT_ENDPOINTS.list);
        const payload = response?.data || {};
        const rows = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload)
            ? payload
            : [];

        const unreadCount = rows.filter((item) => item?.deliveryChannels?.notification !== false).length;
        if (isMounted) {
          setNotificationCount(unreadCount);
        }
      } catch (error) {
        if (isMounted) {
          setNotificationCount(0);
        }
      }
    };

    loadAnnouncementNotifications();

    return () => {
      isMounted = false;
    };
  }, [userRole]);

  useEffect(() => {
    if (contentScrollRef.current) {
      contentScrollRef.current.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [currentPage]);

  const currentUser = useMemo(
    () => ({
      name: user?.name || 'HRMS User',
      email: user?.email || 'user@company.com',
      role: userRole,
      avatar: user?.avatar || '👨‍💼',
      department: user?.department || 'People Operations',
    }),
    [user, userRole]
  );

  const sidebarPageConfigs = useMemo(() => {
    if (!isSingleDashboardLayout) {
      return roleConfig.pages;
    }

    const layoutLabel = userRole === ROLES.MANAGER ? 'Manager Pages Preview' : 'Employee Pages Preview';

    return [
      {
        id: 'dashboard',
        label: layoutLabel,
        icon: '🧩',
        category: 'main',
        description: 'Single role-based workspace with live modules',
      },
    ];
  }, [isSingleDashboardLayout, roleConfig.pages, userRole]);

  const handleNavigate = useCallback(
    (pageId) => {
      if (roleConfig.pages.some((page) => page.id === pageId)) {
        setCurrentPage(pageId);
      }
    },
    [roleConfig.pages]
  );

  const handleProfileAction = useCallback(
    async (action) => {
      if (action === 'logout') {
        await logout();
        navigate('/login');
        return;
      }

      if (action === 'settings') {
        handleNavigate('dashboard');
      }
    },
    [logout, navigate, handleNavigate]
  );

  const handleClearNotifications = useCallback(() => {
    setNotificationCount(0);
  }, []);

  const renderPageContent = () => {
    if (userRole === ROLES.HR_ADMIN) {
      if (currentPage === 'dashboard') {
        return <DashboardOverviewPage user={currentUser} pageConfig={{}} onUserUpdate={() => {}} onNavigate={() => {}} />;
      }

      const HrPage = HR_PAGE_COMPONENTS[currentPage];
      if (HrPage) {
        return <HrPage user={currentUser} pageConfig={{}} onUserUpdate={() => {}} onNavigate={() => {}} />;
      }

      return <DashboardOverviewPage user={currentUser} pageConfig={{}} onUserUpdate={() => {}} onNavigate={() => {}} />;
    }

    if (userRole === ROLES.MANAGER) {
      if (currentPage === 'dashboard') {
        return (
          <DashboardHome
            heading={roleConfig.heading}
            subtitle={roleConfig.subtitle}
            widgets={dashboardWidgets}
            pages={roleConfig.pages}
            onNavigate={handleNavigate}
            loading={dashboardLoading}
          />
        );
      }

      if (currentPage === 'team' || currentPage === 'employees') {
        return <EmployeesPage />;
      }

      if (currentPage === 'leaves') {
        return <LeavesPage />;
      }

      const ManagerPage = STANDARD_PAGE_COMPONENTS[currentPage];
      if (ManagerPage) {
        return <ManagerPage />;
      }

      const managerPage = roleConfig.pages.find((item) => item.id === currentPage);
      if (managerPage) {
        return (
          <RolePage
            title={managerPage.label}
            description={managerPage.description}
            role={userRole}
            pageId={currentPage}
          />
        );
      }

      return (
        <RolePage
          title="Manager Module"
          description="Live module data is unavailable for the selected page."
          role={userRole}
          pageId={currentPage}
        />
      );
    }

    if (currentPage === 'dashboard') {
      return (
        <DashboardHome
          heading={roleConfig.heading}
          subtitle={roleConfig.subtitle}
            widgets={dashboardWidgets}
          pages={roleConfig.pages}
          onNavigate={handleNavigate}
            loading={dashboardLoading}
        />
      );
    }

    if (currentPage === 'ui-components') {
      return <UnifiedComponentsGallery user={currentUser} />;
    }

    if (currentPage === 'employees') {
      return <EmployeesPage />;
    }

    if (currentPage === 'leaves') {
      return <LeavesPage />;
    }

      if (currentPage === 'attendance' && userRole === ROLES.SUPER_ADMIN) {
        return <LeavesAttendancePage defaultTab="attendance" />;
      }

      if (currentPage === 'payroll') {
      return <PayrollPage />;
    }

    const StandardPage = STANDARD_PAGE_COMPONENTS[currentPage];
    if (StandardPage) {
      return <StandardPage />;
    }

    const page = roleConfig.pages.find((item) => item.id === currentPage);
    if (!page) {
      return (
        <RolePage
          title="Page Not Found"
          description="This module is not available for the current access role."
        />
      );
    }

    return <RolePage title={page.label} description={page.description} role={userRole} pageId={page.id} />;
  };

  return (
    <div className="app-shell flex h-screen overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100">
      <HRSidebar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        pageConfigs={sidebarPageConfigs}
        portalLabel={roleConfig.portalLabel}
      />

      <div className="flex-1 flex flex-col overflow-hidden md:ml-0">
        <HRHeader
          user={currentUser}
          onProfileClick={handleProfileAction}
          notificationCount={notificationCount}
          onClearNotifications={handleClearNotifications}
        />

        <main ref={contentScrollRef} className="flex-1 overflow-auto">
          <div className="p-4 md:p-8">
            <div
              className="rounded-2xl bg-white/10 backdrop-blur-3xl border border-white/30 ring-1 ring-white/20 overflow-hidden"
              style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}
            >
              {renderPageContent()}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default UnifiedDashboard;
