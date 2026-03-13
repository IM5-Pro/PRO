import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import HRSidebar from '../HRSidebar/HRSidebar';
import HRHeader from '../HRHeader/HRHeader';
import AdminPanelConfig from '../Pages/HR/AdminPanelConfig';
import HRUserManagement from '../Pages/HR/UserManagement';
import Workflows from '../Pages/HR/Workflows';
import Masters from '../Pages/HR/Masters';

const ADMIN_PAGE_CONFIGS = [
  {
    id: 'admin-home',
    label: 'Admin Dashboard',
    icon: '🛡️',
    category: 'overview',
    description: 'Super admin overview and controls',
  },
  {
    id: 'admin',
    label: 'System Configuration',
    icon: '🔧',
    category: 'administration',
    description: 'Manage core platform settings',
  },
  {
    id: 'users',
    label: 'User Governance',
    icon: '👥',
    category: 'administration',
    description: 'Manage user access and governance',
  },
  {
    id: 'workflows',
    label: 'Approval Workflows',
    icon: '🔄',
    category: 'operations',
    description: 'Monitor and update workflow templates',
  },
  {
    id: 'masters',
    label: 'Master Data',
    icon: '📚',
    category: 'operations',
    description: 'Manage master records and structures',
  },
];

const SuperAdminOverview = ({ user, onNavigate }) => {
  const summaryCards = [
    { title: 'Total Users', value: '1,284', caption: 'Active identities across portals' },
    { title: 'Pending Approvals', value: '23', caption: 'Policy and role change requests' },
    { title: 'Security Alerts', value: '2', caption: 'Require your immediate review' },
    { title: 'System Health', value: '99.2%', caption: 'Current platform availability' },
  ];

  const quickActions = [
    { id: 'admin', label: 'Open System Configuration' },
    { id: 'users', label: 'Review User Governance' },
    { id: 'workflows', label: 'Inspect Approval Flows' },
    { id: 'masters', label: 'Update Master Data' },
  ];

  return (
    <div className="min-h-screen bg-transparent p-6 md:p-8">
      <div className="mb-8 rounded-2xl p-6 bg-white/10 backdrop-blur-3xl border border-white/30 ring-1 ring-white/20">
        <h1 className="text-4xl font-bold text-slate-800 mb-2">Super Admin Dashboard</h1>
        <p className="text-slate-600">
          Welcome back, {user?.name || 'Super Admin'}. You are viewing enterprise-wide controls.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {summaryCards.map((card) => (
          <div
            key={card.title}
            className="bg-white/20 border border-white/30 rounded-2xl p-6"
            style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}
          >
            <p className="text-sm text-slate-600 mb-2">{card.title}</p>
            <p className="text-3xl font-bold text-slate-800 mb-1">{card.value}</p>
            <p className="text-sm text-slate-600">{card.caption}</p>
          </div>
        ))}
      </div>

      <div className="bg-white/20 border border-white/30 rounded-2xl p-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={() => onNavigate(action.id)}
              className="text-left px-4 py-3 rounded-xl bg-slate-100/40 border border-slate-300/60 text-slate-800 font-medium hover:bg-slate-200/60 hover:border-slate-400 transition-all duration-200"
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user = {}, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState('admin-home');
  const [notificationCount, setNotificationCount] = useState(4);
  const contentScrollRef = useRef(null);

  const currentUser = useMemo(
    () => ({
      name: user?.name || 'Super Admin',
      email: user?.email || 'admin@ispace.com',
      role: user?.role || 'super_admin',
      avatar: user?.avatar || '👨‍💼',
      department: user?.department || 'Administration',
    }),
    [user]
  );

  const onNavigate = useCallback((pageId) => {
    if (ADMIN_PAGE_CONFIGS.some((page) => page.id === pageId)) {
      setCurrentPage(pageId);
    }
  }, []);

  const onProfileAction = useCallback(
    async (action) => {
      if (action === 'logout') {
        await logout();
        navigate('/login');
      }

      if (action === 'settings') {
        onNavigate('admin');
      }
    },
    [logout, navigate, onNavigate]
  );

  const onClearNotifications = useCallback(() => {
    setNotificationCount(0);
  }, []);

  useEffect(() => {
    if (contentScrollRef.current) {
      contentScrollRef.current.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [currentPage]);

  const renderPageContent = () => {
    const sharedProps = {
      user: currentUser,
      pageConfig: ADMIN_PAGE_CONFIGS.find((item) => item.id === currentPage) || {},
      onUserUpdate: () => true,
      onNavigate,
    };

    if (currentPage === 'admin-home') {
      return <SuperAdminOverview user={currentUser} onNavigate={onNavigate} />;
    }

    if (currentPage === 'admin') {
      return <AdminPanelConfig {...sharedProps} />;
    }

    if (currentPage === 'users') {
      return <HRUserManagement {...sharedProps} />;
    }

    if (currentPage === 'workflows') {
      return <Workflows {...sharedProps} />;
    }

    if (currentPage === 'masters') {
      return <Masters {...sharedProps} />;
    }

    return <SuperAdminOverview user={currentUser} onNavigate={onNavigate} />;
  };

  return (
    <div className="app-shell flex h-screen overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100">
      <HRSidebar
        currentPage={currentPage}
        onNavigate={onNavigate}
        pageConfigs={ADMIN_PAGE_CONFIGS}
        portalLabel="Admin Portal"
      />

      <div className="flex-1 flex flex-col overflow-hidden md:ml-0">
        <HRHeader
          user={currentUser}
          onProfileClick={onProfileAction}
          notificationCount={notificationCount}
          onClearNotifications={onClearNotifications}
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

export default AdminDashboard;
