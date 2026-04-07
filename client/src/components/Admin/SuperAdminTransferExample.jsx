/**
 * Example: How to Use SuperAdminRoleTransfer Component
 * This file shows how to integrate the Super Admin Role Transfer feature
 * into your Admin Dashboard or Settings page.
 * 
 * @example
 */

import React, { useState } from 'react';
import { FiShield, FiAlertTriangle } from 'react-icons/fi';
import SuperAdminRoleTransfer from './components/Admin/SuperAdminRoleTransfer';
import { useAuth } from './context/AuthContext';
import superAdminTransferApi from './services/superAdminTransferApi';

/**
 * Example 1: Simple Admin Settings Page
 */
export function AdminSettingsExample() {
  const { user } = useAuth();
  const [showTransferModal, setShowTransferModal] = useState(false);

  // Only render for super admin users
  if (user?.role !== 'super_admin') {
    return (
      <div className="p-8 bg-yellow-50 border border-yellow-200 rounded">
        <p className="text-yellow-900">Only super admin users can access this page.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Admin Settings</h1>

      {/* Danger Zone Section */}
      <div className="bg-red-50 border-l-4 border-red-600 p-6 rounded mb-8">
        <div className="flex items-start gap-4">
          <FiAlertTriangle className="text-red-600 flex-shrink-0 mt-1" size={24} />
          <div>
            <h2 className="text-xl font-bold text-red-900 mb-2">Danger Zone</h2>
            <p className="text-sm text-red-800 mb-4">
              The following actions have irreversible consequences. Please proceed with caution.
            </p>

            <button
              onClick={() => setShowTransferModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white hover:bg-red-700 rounded-lg font-semibold transition-colors"
            >
              <FiShield size={20} />
              Transfer Super Admin Role
            </button>
          </div>
        </div>
      </div>

      {/* Transfer Modal */}
      <SuperAdminRoleTransfer
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        currentAdmin={{
          name: user.name || 'Admin User',
          email: user.email || 'admin@company.com'
        }}
      />

      {/* Other Admin Settings Sections */}
      <div className="space-y-6">
        <SettingSection
          title="System Configuration"
          description="Manage system-wide settings and features"
          content={<p className="text-slate-600">System settings will be displayed here...</p>}
        />

        <SettingSection
          title="User Management"
          description="View and manage all system users"
          content={<p className="text-slate-600">User management interface will be displayed here...</p>}
        />

        <SettingSection
          title="Audit Logs"
          description="View system audit logs and activity history"
          content={<p className="text-slate-600">Audit logs will be displayed here...</p>}
        />
      </div>
    </div>
  );
}

/**
 * Reusable Setting Section Component
 */
function SettingSection({ title, description, content }) {
  return (
    <div className="border border-slate-200 rounded-lg p-6 bg-white">
      <h3 className="text-lg font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-600 mb-4">{description}</p>
      <div className="border-t border-slate-200 pt-4">
        {content}
      </div>
    </div>
  );
}

/**
 * Example 2: Admin Context Hook for Transfer
 * Use this hook in components to manage transfer state globally
 */
export function useAdminTransfer() {
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferInProgress, setTransferInProgress] = useState(false);
  const [transferError, setTransferError] = useState(null);

  const openTransferModal = () => {
    setShowTransferModal(true);
    setTransferError(null);
  };

  const closeTransferModal = () => {
    setShowTransferModal(false);
  };

  return {
    showTransferModal,
    transferInProgress,
    transferError,
    openTransferModal,
    closeTransferModal,
    setTransferInProgress,
    setTransferError,
  };
}

/**
 * Example 3: Integration with Navbar/Header
 */
export function AdminHeaderExample() {
  const { user } = useAuth();
  const { showTransferModal, openTransferModal, closeTransferModal } = useAdminTransfer();

  return (
    <div className="flex items-center justify-between p-4 border-b border-slate-200">
      <h1 className="text-2xl font-bold text-slate-900">HRMS Admin Panel</h1>

      {user?.role === 'super_admin' && (
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-600">Role: <strong>Super Admin</strong></span>
          <button
            onClick={openTransferModal}
            className="text-sm text-red-600 hover:text-red-700 font-semibold"
            title="Transfer your super admin role to another person"
          >
            Transfer Role
          </button>

          <SuperAdminRoleTransfer
            isOpen={showTransferModal}
            onClose={closeTransferModal}
            currentAdmin={{
              name: user.name,
              email: user.email
            }}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Example 4: Protected Admin Route
 */
export function AdminRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (user?.role !== 'super_admin') {
    return (
      <div className="p-8 max-w-md mx-auto border border-orange-200 bg-orange-50 rounded">
        <h2 className="text-lg font-bold text-orange-900 mb-2">Access Denied</h2>
        <p className="text-sm text-orange-800">
          You must be a super admin to access this page.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Example 5: Full Admin Dashboard with Transfer
 */
export function AdminDashboardExample() {
  const { user } = useAuth();
  const { showTransferModal, openTransferModal, closeTransferModal } = useAdminTransfer();

  return (
    <AdminRoute>
      <div className="min-h-screen bg-slate-50">
        <AdminHeaderExample />

        <div className="p-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900">Welcome, {user?.name || 'Admin'}</h2>
            <p className="text-slate-600 mt-2">
              You are logged in as a Super Admin with full system access.
            </p>
          </div>

          {/* Admin Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <AdminCard
              title="User Management"
              icon={<span className="text-2xl">👥</span>}
              description="Create, modify, and delete users"
              actionText="Manage Users"
            />
            <AdminCard
              title="System Settings"
              icon={<span className="text-2xl">⚙️</span>}
              description="Configure system-wide settings"
              actionText="Edit Settings"
            />
            <AdminCard
              title="Audit Logs"
              icon={<span className="text-2xl">📋</span>}
              description="View activity logs and audit trail"
              actionText="View Logs"
            />
            <AdminCard
              title="Role Management"
              icon={<span className="text-2xl">🔐</span>}
              description="Manage permissions and roles"
              actionText="Edit Roles"
            />
          </div>

          {/* Danger Zone */}
          <div className="bg-red-50 border-l-4 border-red-600 p-6 rounded">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-red-900 mb-1">Role Transfer</h3>
                <p className="text-sm text-red-800 mb-4">
                  Transfer your super admin credentials to another trusted person.
                </p>
              </div>
              <button
                onClick={openTransferModal}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded font-semibold"
              >
                Transfer Now
              </button>
            </div>
          </div>

          {/* Transfer Modal */}
          <SuperAdminRoleTransfer
            isOpen={showTransferModal}
            onClose={closeTransferModal}
            currentAdmin={{
              name: user?.name || 'Admin User',
              email: user?.email || 'admin@company.com'
            }}
          />
        </div>
      </div>
    </AdminRoute>
  );
}

/**
 * Reusable Admin Card Component
 */
function AdminCard({ title, icon, description, actionText, onAction }) {
  return (
    <div className="border border-slate-200 rounded-lg p-6 bg-white hover:shadow-lg transition-shadow">
      <div className="mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-600 mb-4">{description}</p>
      <button
        onClick={onAction}
        className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
      >
        {actionText} →
      </button>
    </div>
  );
}

/**
 * Example 6: API Usage
 */
export async function superAdminTransferExample() {
  try {
    // Get eligible recipients
    const recipients = await superAdminTransferApi.getEligibleRecipients({
      department: 'Leadership'
    });
    console.log('Eligible Recipients:', recipients);

    // Get transfer details before proceeding
    const details = await superAdminTransferApi.getTransferDetails();
    console.log('Transfer Details:', details);

    // Create backup before transfer
    const backup = await superAdminTransferApi.createBackup();
    console.log('Backup Created:', backup.backupId);

    // Execute the transfer
    const result = await superAdminTransferApi.transferRole({
      recipientUserId: 'user-123',
      recipientEmail: 'jane@company.com',
      reason: 'Planned succession for Jane Smith'
    });
    console.log('Transfer Completed:', result.auditLogId);

    // Check transfer history
    const history = await superAdminTransferApi.getTransferHistory({ limit: 10 });
    console.log('Transfer History:', history);

  } catch (error) {
    console.error('Transfer Error:', error.message);
  }
}

export default AdminSettingsExample;
