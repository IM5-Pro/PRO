import React, { useEffect, useMemo, useState } from 'react';
import ProfileCard from '../../ProfileCard/ProfileCard';
import AttendanceCard from '../../AttendanceCard/AttendanceCard';
import LeaveBalance from '../../LeaveBalance/LeaveBalance';
import Announcements from '../../Announcements/Announcements';
import Birthdays from '../../Birthdays/Birthdays';
import TodoList from '../../TodoList/TodoList';
import TimeTracker from '../../TimeTracker/TimeTracker';
import TeamStatsCard from '../../TeamStatsCard/TeamStatsCard';
import TeamScheduleCalendar from '../../TeamScheduleCalendar/TeamScheduleCalendar';
import TimingsChart from '../../TimingsChart/TimingsChart';
import PerformanceChart from '../../PerformanceChart/PerformanceChart';
import AttendanceSheet from '../../AttendanceSheet/AttendanceSheet';
import BookMeeting from '../../BookMeeting/BookMeeting';
import ManagerActionCenter from '../../ManagerDashboard/ManagerActionCenter';
import ManagerSidebarPageContent from '../../ManagerDashboard/ManagerSidebarPages';
import DashboardPage from '../../Pages/Dashboard';
import DashboardOverviewPage from '../../Pages/HR/DashboardOverview';
import { ROLES } from '../../../utils/roles';
import AttendancePage from '../../Pages/Attendance';
import AnnouncementsPage from '../../Pages/Announcements';
import AnalyticsPage from '../../Pages/Analytics';
import EmployeeProfilePage from '../../Pages/EmployeeProfile';
import EmployeesPage from '../../Pages/Employees';
import LeaveManagementPage from '../../Pages/LeaveManagement';
import LeavesPage from '../../Pages/Leaves';
import PayrollPage from '../../Pages/Payroll';
import PerformancePage from '../../Pages/Performance';
import ReportsPage from '../../Pages/Reports';
import SettingsPortalPage from '../../Pages/Settings';
import TeamCollaborationPage from '../../Pages/TeamCollaboration';
import LeavesAttendancePage from '../../Pages/HR/LeavesAttendance';
import ManpowerPlanningPage from '../../Pages/HR/ManpowerPlanning';
import HRPayrollPage from '../../Pages/HR/Payroll';
import ExitClearancePage from '../../Pages/HR/ExitClearance';
import MeetingRoomPage from '../../Pages/HR/MeetingRoom';
import WorkflowsPage from '../../Pages/HR/Workflows';
import LetterTemplatesPage from '../../Pages/HR/LetterTemplates';
import UserManagementPage from '../../Pages/HR/UserManagement';
import MastersPage from '../../Pages/HR/Masters';
import AdminPanelConfigPage from '../../Pages/HR/AdminPanelConfig';

/** Local map avoids circular import with pageRegistry.js */
const GALLERY_STANDARD_PAGE_COMPONENTS = {
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

const GALLERY_HR_PAGE_COMPONENTS = {
  'dashboard-overview': DashboardOverviewPage,
  dashboard: DashboardOverviewPage,
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

  const availableStandardPages = useMemo(() => {
    return filterOptionsByIds(STANDARD_PAGE_OPTIONS, previewConfig.standardPages || []);
  }, [previewConfig.standardPages]);

  const availableHrPages = useMemo(() => {
    return filterOptionsByIds(HR_PAGE_OPTIONS, previewConfig.hrPages || []);
  }, [previewConfig.hrPages]);

  const SelectedStandardPage = GALLERY_STANDARD_PAGE_COMPONENTS[selectedStandardPage] || DashboardPage;
  const SelectedHrPage = GALLERY_HR_PAGE_COMPONENTS[selectedHrPage] || DashboardOverviewPage;

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

export default UnifiedComponentsGallery;
