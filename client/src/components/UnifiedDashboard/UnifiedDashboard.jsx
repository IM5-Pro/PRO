import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { fetchDashboardWidgetValues } from '../../services/unifiedDashboardApi';
import {
  attachMonoIconsToPages,
  ROLE_DASHBOARD_CONFIG,
  SINGLE_DASHBOARD_ROLES,
} from './UnifiedDashboardConfig';
import { HR_PAGE_COMPONENTS, STANDARD_PAGE_COMPONENTS, MANAGER_PAGE_COMPONENTS, SUPER_ADMIN_PAGE_COMPONENTS } from './pageRegistry';
import DashboardHome from './components/DashboardHome';
import RolePage from './components/RolePage';
import UnifiedComponentsGallery from './components/UnifiedComponentsGallery';

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
    const baseConfig = ROLE_DASHBOARD_CONFIG[userRole] || ROLE_DASHBOARD_CONFIG[ROLES.EMPLOYEE];
    return {
      ...baseConfig,
      pages: attachMonoIconsToPages(baseConfig.pages),
    };
  }, [userRole]);

  const [currentPage, setCurrentPage] = useState(() => searchParams.get('page') || 'dashboard');

  useEffect(() => {
    const pageFromUrl = searchParams.get('page');
    if (!pageFromUrl) {
      return;
    }

    setCurrentPage((previousPage) => {
      return previousPage === pageFromUrl ? previousPage : pageFromUrl;
    });
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

  const currentUser = useMemo(() => {
    return {
      name: user?.name || 'HRMS User',
      firstName: user?.firstName,
      lastName: user?.lastName,
      email: user?.email || 'user@company.com',
      role: userRole,
      avatar: user?.avatar || '👨‍💼',
      department: user?.department || 'People Operations',
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
    if (userRole === ROLES.SUPER_ADMIN) {
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

      const SuperAdminPage = SUPER_ADMIN_PAGE_COMPONENTS[currentPage];
      if (SuperAdminPage) {
        return <SuperAdminPage user={currentUser} pageConfig={{}} onUserUpdate={() => {}} onNavigate={handleNavigate} />;
      }

      const superAdminPage = roleConfig.pages.find((item) => item.id === currentPage);
      if (superAdminPage) {
        return (
          <RolePage
            title={superAdminPage.label}
            description={superAdminPage.description}
            role={userRole}
            pageId={currentPage}
          />
        );
      }

      return (
        <RolePage
          title="Admin Module"
          description="Live module data is unavailable for the selected page."
          role={userRole}
          pageId={currentPage}
        />
      );
    }

    if (userRole === ROLES.HR_ADMIN) {
      if (currentPage === 'dashboard') {
        return <DashboardOverviewPage user={currentUser} pageConfig={{}} onUserUpdate={() => {}} onNavigate={handleNavigate} />;
      }

      const HrPage = HR_PAGE_COMPONENTS[currentPage];
      if (HrPage) {
        return <HrPage user={currentUser} pageConfig={{}} onUserUpdate={() => {}} onNavigate={handleNavigate} />;
      }

      return <DashboardOverviewPage user={currentUser} pageConfig={{}} onUserUpdate={() => {}} onNavigate={handleNavigate} />;
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

      const ManagerPage = MANAGER_PAGE_COMPONENTS[currentPage];
      if (ManagerPage) {
        return <ManagerPage user={currentUser} pageConfig={{}} onUserUpdate={() => {}} onNavigate={handleNavigate} />;
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

    if (userRole === ROLES.SUPER_ADMIN) {
      const SuperAdminPage = SUPER_ADMIN_PAGE_COMPONENTS[currentPage];
      if (SuperAdminPage) {
        return <SuperAdminPage user={currentUser} pageConfig={{}} onUserUpdate={() => {}} onNavigate={handleNavigate} />;
      }
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
              className="rounded-2xl bg-white/70 border border-slate-200/80 ring-1 ring-white/60 overflow-hidden"
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
