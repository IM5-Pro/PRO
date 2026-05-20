import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FiGrid } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/client';
import { ANNOUNCEMENT_ENDPOINTS } from '../../api/endpoints';
import DashboardOverviewPage from '../Pages/HR/DashboardOverview';
import LeavesAttendancePage from '../Pages/HR/LeavesAttendance';
import EmployeesPage from '../Pages/Employees';
import LeavesPage from '../Pages/Leaves';
import PayrollPage from '../Pages/Payroll';
import HRHeader from '../HRHeader/HRHeader';
import HRSidebar from '../HRSidebar/HRSidebar';
import { ROLES } from '../../utils/roles';
import { applyOrgScopedDashboard, formatWorkContextLine } from '../../utils/dashboardVisibility';
import { sortPagesForSidebar } from '../../utils/sidebarNav';
import { filterShippedPages } from '../../config/portalNavManifest';
import {
  resolvePortalPageComponent,
  resolvePortalPageForContext,
  isOperationsPage,
  isStandaloneStandardPage,
} from '../../config/portalRoutes';
import {
  PORTAL_MODES,
  canSwitchPortal,
  getPortalModeOptions,
  isWorkPortalMode,
  persistPortalMode,
  resolveActivePortalMode,
} from '../../utils/portalMode';
import { fetchDashboardWidgetValues } from '../../services/unifiedDashboardApi';
import {
  attachMonoIconsToPages,
  ROLE_DASHBOARD_CONFIG,
  SINGLE_DASHBOARD_ROLES,
} from './UnifiedDashboardConfig';
import DashboardHome from './components/DashboardHome';
import RolePage from './components/RolePage';
import UnifiedComponentsGallery from './components/UnifiedComponentsGallery';
import LoadingSpinner from '../Auth/LoadingSpinner';

/** Available from header for every role; may be omitted from role sidebar lists. */
const GLOBAL_PORTAL_PAGE_IDS = ['settings', 'employee-profile'];

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
  const portalSwitcherEnabled = canSwitchPortal(userRole);

  const portalMode = useMemo(
    () => resolveActivePortalMode(userRole, searchParams),
    [searchParams, userRole],
  );

  const currentPage = searchParams.get('page') || 'dashboard';

  const isWorkPortal = isWorkPortalMode(userRole, portalMode);
  const widgetFetchRole = isWorkPortal ? ROLES.EMPLOYEE : userRole;
  const portalModeOptions = useMemo(() => getPortalModeOptions(userRole), [userRole]);

  const workContextLine = useMemo(
    () => formatWorkContextLine(user?.designation, user?.department),
    [user?.designation, user?.department],
  );

  const roleConfig = useMemo(() => {
    const baseConfig = isWorkPortal
      ? ROLE_DASHBOARD_CONFIG[ROLES.EMPLOYEE]
      : ROLE_DASHBOARD_CONFIG[userRole] || ROLE_DASHBOARD_CONFIG[ROLES.EMPLOYEE];
    const withIcons = {
      ...baseConfig,
      pages: attachMonoIconsToPages(sortPagesForSidebar(filterShippedPages(baseConfig.pages))),
      widgets: baseConfig.widgets,
    };
    return applyOrgScopedDashboard(withIcons, {
      designation: user?.designation,
      department: user?.department,
      role: userRole,
    });
  }, [isWorkPortal, userRole, user?.designation, user?.department]);

  const applySearchParams = useCallback(
    (mutator) => {
      const nextParams = new URLSearchParams(searchParams);
      mutator(nextParams);
      const nextQuery = nextParams.toString();
      if (nextQuery === searchParams.toString()) {
        return;
      }
      setSearchParams(nextParams, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  useEffect(() => {
    const hasPage =
      roleConfig.pages.some((page) => page.id === currentPage) ||
      GLOBAL_PORTAL_PAGE_IDS.includes(currentPage);
    if (!hasPage && currentPage !== 'dashboard') {
      applySearchParams((nextParams) => {
        nextParams.delete('page');
      });
    }
  }, [applySearchParams, currentPage, roleConfig.pages]);

  useEffect(() => {
    if (isSingleDashboardLayout && currentPage !== 'dashboard') {
      applySearchParams((nextParams) => {
        nextParams.delete('page');
      });
    }
  }, [applySearchParams, currentPage, isSingleDashboardLayout]);

  const hasHydratedPortalUrlRef = useRef(false);
  useEffect(() => {
    if (!portalSwitcherEnabled || hasHydratedPortalUrlRef.current) {
      return;
    }
    hasHydratedPortalUrlRef.current = true;

    if (searchParams.has('portal')) {
      return;
    }

    if (portalMode !== PORTAL_MODES.WORK) {
      return;
    }

    applySearchParams((nextParams) => {
      nextParams.set('portal', PORTAL_MODES.WORK);
    });
  }, [applySearchParams, portalMode, portalSwitcherEnabled, searchParams]);

  useEffect(() => {
    let isMounted = true;

    const loadWidgets = async () => {
      setDashboardLoading(true);
      const liveValues = await fetchDashboardWidgetValues(widgetFetchRole);

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

    loadWidgets();

    return () => {
      isMounted = false;
    };
  }, [roleConfig.widgets, widgetFetchRole]);

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
  }, [currentPage, portalMode]);

  const handlePortalModeChange = useCallback(
    (mode) => {
      if (!portalSwitcherEnabled || mode === portalMode) {
        return;
      }

      persistPortalMode(userRole, mode);
      applySearchParams((nextParams) => {
        nextParams.delete('page');
        if (mode === PORTAL_MODES.WORK) {
          nextParams.set('portal', PORTAL_MODES.WORK);
        } else {
          nextParams.delete('portal');
        }
      });
    },
    [applySearchParams, portalMode, portalSwitcherEnabled, userRole],
  );

  const currentUser = useMemo(() => {
    return {
      name: user?.name || 'HRMS User',
      firstName: user?.firstName,
      lastName: user?.lastName,
      email: user?.email || 'user@company.com',
      role: userRole,
      avatar: user?.avatar || '👨‍💼',
      department: user?.department || 'People Operations',
      designation: user?.designation || '',
    };
  }, [user, userRole]);

  const sidebarPageConfigs = useMemo(() => {
    if (!isSingleDashboardLayout) {
      return roleConfig.pages;
    }

    const layoutLabel = userRole === ROLES.MANAGER ? 'Manager Pages Preview' : 'Employee Pages Preview';

    return [
      {
        id: 'dashboard',
        label: layoutLabel,
        icon: FiGrid,
        category: 'main',
        description: 'Single role-based workspace with live modules',
      },
    ];
  }, [isSingleDashboardLayout, roleConfig.pages, userRole]);

  const handleNavigate = useCallback(
    (pageId) => {
      if (
        !roleConfig.pages.some((page) => page.id === pageId) &&
        !GLOBAL_PORTAL_PAGE_IDS.includes(pageId)
      ) {
        return;
      }

      applySearchParams((nextParams) => {
        if (pageId === 'dashboard') {
          nextParams.delete('page');
        } else {
          nextParams.set('page', pageId);
        }
      });
    },
    [applySearchParams, roleConfig.pages],
  );

  const handleProfileAction = useCallback(
    async (action) => {
      if (action === 'logout') {
        await logout();
        navigate('/login');
        return;
      }

      if (action === 'settings') {
        handleNavigate('settings');
        return;
      }

      if (action === 'profile') {
        handleNavigate('employee-profile');
        return;
      }
    },
    [logout, navigate, handleNavigate]
  );

  const handleClearNotifications = useCallback(() => {
    setNotificationCount(0);
  }, []);

  const renderPortalPage = useCallback(
    (PageComponent) => {
      if (!PageComponent) {
        return null;
      }

      if (currentPage === 'ui-components') {
        return <PageComponent user={currentUser} />;
      }

      if (
        isOperationsPage(currentPage) ||
        isStandaloneStandardPage(currentPage) ||
        currentPage === 'announcements'
      ) {
        return <PageComponent />;
      }

      return (
        <PageComponent
          user={currentUser}
          pageConfig={{}}
          onUserUpdate={() => {}}
          onNavigate={handleNavigate}
        />
      );
    },
    [currentPage, currentUser, handleNavigate],
  );

  const renderWorkPortalContent = () => {
    if (currentPage === 'dashboard') {
      return (
        <DashboardHome
          heading={roleConfig.heading}
          subtitle={roleConfig.subtitle}
          workContextLine={workContextLine}
          widgets={dashboardWidgets}
          pages={roleConfig.pages}
          onNavigate={handleNavigate}
          loading={dashboardLoading}
        />
      );
    }

    if (currentPage === 'leaves') {
      return <LeavesPage />;
    }

    if (currentPage === 'payroll') {
      return <PayrollPage />;
    }

    const WorkPage = resolvePortalPageForContext(userRole, currentPage, portalMode);
    const workView = renderPortalPage(WorkPage);
    if (workView) {
      return workView;
    }

    return (
      <RolePage
        title="Page Not Found"
        description="This module is not available in My work. Switch to your operations portal or pick another page."
        role={userRole}
        pageId={currentPage}
      />
    );
  };

  const renderPageContent = () => {
    if (isWorkPortal) {
      return renderWorkPortalContent();
    }

    if (userRole === ROLES.SUPER_ADMIN) {
      if (currentPage === 'dashboard') {
        return (
          <DashboardHome
            heading={roleConfig.heading}
            subtitle={roleConfig.subtitle}
            workContextLine={workContextLine}
            widgets={dashboardWidgets}
            pages={roleConfig.pages}
            onNavigate={handleNavigate}
            loading={dashboardLoading}
          />
        );
      }

      const SuperAdminPage = resolvePortalPageComponent(userRole, currentPage);
      const superAdminView = renderPortalPage(SuperAdminPage);
      if (superAdminView) {
        return superAdminView;
      }

      return (
        <RolePage
          title="Page Not Found"
          description="This module is not registered for Super Admin. Check pageRegistry.js."
          role={userRole}
          pageId={currentPage}
        />
      );
    }

    if (userRole === ROLES.HR_ADMIN) {
      if (currentPage === 'dashboard') {
        return <DashboardOverviewPage user={currentUser} pageConfig={{}} onUserUpdate={() => {}} onNavigate={handleNavigate} />;
      }

      const HrPage = resolvePortalPageForContext(userRole, currentPage, portalMode);
      const hrView = renderPortalPage(HrPage);
      if (hrView) {
        return hrView;
      }

      return (
        <RolePage
          title="Page Not Found"
          description="This HR module is not registered. Check pageRegistry.js."
          role={userRole}
          pageId={currentPage}
        />
      );
    }

    if (userRole === ROLES.DEPT_ADMIN) {
      if (currentPage === 'dashboard') {
        return (
          <DashboardHome
            heading={roleConfig.heading}
            subtitle={roleConfig.subtitle}
            workContextLine={workContextLine}
            widgets={dashboardWidgets}
            pages={roleConfig.pages}
            onNavigate={handleNavigate}
            loading={dashboardLoading}
          />
        );
      }

      if (currentPage === 'leaves') {
        return <LeavesPage />;
      }

      const DeptPage = resolvePortalPageForContext(userRole, currentPage, portalMode);
      const deptView = renderPortalPage(DeptPage);
      if (deptView) {
        return deptView;
      }

      return (
        <RolePage
          title="Page Not Found"
          description="This department module is not registered. Check pageRegistry.js."
          role={userRole}
          pageId={currentPage}
        />
      );
    }

    if (userRole === ROLES.MANAGER) {
      if (currentPage === 'dashboard') {
        return (
          <DashboardHome
            heading={roleConfig.heading}
            subtitle={roleConfig.subtitle}
            workContextLine={workContextLine}
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

      if (currentPage === 'payroll') {
        return <PayrollPage />;
      }

      const ManagerPage = resolvePortalPageForContext(userRole, currentPage, portalMode);
      const managerView = renderPortalPage(ManagerPage);
      if (managerView) {
        return managerView;
      }

      return (
        <RolePage
          title="Page Not Found"
          description="This manager module is not registered. Check pageRegistry.js."
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
          workContextLine={workContextLine}
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

    const ResolvedPage = resolvePortalPageForContext(userRole, currentPage, portalMode);
    const resolvedView = renderPortalPage(ResolvedPage);
    if (resolvedView) {
      return resolvedView;
    }

    return (
      <RolePage
        title="Page Not Found"
        description="This module is not registered for your role. Check pageRegistry.js."
        role={userRole}
        pageId={currentPage}
      />
    );
  };

  return (
    <div className="app-shell flex min-h-0 overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100">
      <HRSidebar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        pageConfigs={sidebarPageConfigs}
        portalLabel={roleConfig.portalLabel}
        contextSubtitle={workContextLine}
      />

      <div className="flex-1 flex flex-col overflow-hidden md:ml-0">
        <HRHeader
          user={currentUser}
          onProfileClick={handleProfileAction}
          notificationCount={notificationCount}
          onClearNotifications={handleClearNotifications}
          showPortalSwitcher={portalSwitcherEnabled}
          portalMode={portalMode}
          portalModeOptions={portalModeOptions}
          onPortalModeChange={handlePortalModeChange}
        />

        <main className="flex flex-1 min-h-0 flex-col overflow-hidden">
          <div className="flex min-h-0 flex-1 flex-col p-3 md:p-5">
            <div
              className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white/70 ring-1 ring-white/60"
              style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}
            >
              <div
                ref={contentScrollRef}
                className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain"
              >
                <Suspense
                  fallback={
                    <LoadingSpinner
                      variant="card"
                      message="Loading module…"
                      className="flex-1 min-h-[12rem]"
                    />
                  }
                >
                  {renderPageContent()}
                </Suspense>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default UnifiedDashboard;
