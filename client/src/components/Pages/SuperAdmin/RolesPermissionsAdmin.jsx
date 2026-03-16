import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FiCheckCircle, FiLock, FiPlus, FiRefreshCw, FiShield, FiXCircle } from 'react-icons/fi';
import {
  assignPermissionToRole,
  createPermission,
  createRole,
  fetchPermissions,
  fetchRoles,
  removePermissionFromRole,
  toErrorMessage,
} from '../../../services/adminOperationsApi';

const RolesPermissionsAdmin = () => {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [selectedPermissionId, setSelectedPermissionId] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [banner, setBanner] = useState({ type: '', text: '' });
  const [roleForm, setRoleForm] = useState({ name: '', description: '' });
  const [permissionForm, setPermissionForm] = useState({ name: '', description: '' });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [roleRows, permissionRows] = await Promise.all([fetchRoles(), fetchPermissions()]);
      setRoles(roleRows);
      setPermissions(permissionRows);

      if (!selectedRoleId && roleRows.length > 0) {
        setSelectedRoleId(roleRows[0]?._id || roleRows[0]?.id || '');
      }

      if (!selectedPermissionId && permissionRows.length > 0) {
        setSelectedPermissionId(permissionRows[0]?._id || permissionRows[0]?.id || '');
      }
    } catch (error) {
      setBanner({ type: 'error', text: toErrorMessage(error, 'Failed to load roles and permissions') });
      setRoles([]);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  }, [selectedPermissionId, selectedRoleId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedRole = useMemo(() => {
    return roles.find((role) => String(role?._id || role?.id) === String(selectedRoleId)) || null;
  }, [roles, selectedRoleId]);

  const runAction = async (key, action, successMessage) => {
    setActionLoading(key);
    setBanner({ type: '', text: '' });
    try {
      await action();
      setBanner({ type: 'success', text: successMessage });
      await loadData();
    } catch (error) {
      setBanner({ type: 'error', text: toErrorMessage(error, 'Action failed') });
    } finally {
      setActionLoading('');
    }
  };

  return (
    <div className="min-h-screen bg-transparent p-6 md:p-8">
      <div className="rounded-2xl bg-white border border-slate-200 p-6 mb-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
              <FiLock size={28} /> Roles and Permissions
            </h1>
            <p className="text-slate-600 mt-1">Manage access policies and role capabilities</p>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <span className="inline-flex items-center gap-2">
              <FiRefreshCw size={15} /> Refresh
            </span>
          </button>
        </div>
      </div>

      {banner.text && (
        <div
          className={`mb-6 rounded-lg border px-4 py-3 text-sm inline-flex items-center gap-2 ${
            banner.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          {banner.type === 'success' ? <FiCheckCircle size={16} /> : <FiXCircle size={16} />}
          {banner.text}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Create Role</h2>
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              await runAction(
                'create-role',
                async () => {
                  await createRole({
                    name: roleForm.name.trim().toUpperCase(),
                    description: roleForm.description.trim(),
                  });
                  setRoleForm({ name: '', description: '' });
                },
                'Role created successfully.'
              );
            }}
            className="space-y-3"
          >
            <input
              required
              value={roleForm.name}
              onChange={(event) => setRoleForm((previous) => ({ ...previous, name: event.target.value }))}
              placeholder="Role name (e.g., DEPT_ADMIN)"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              value={roleForm.description}
              onChange={(event) => setRoleForm((previous) => ({ ...previous, description: event.target.value }))}
              placeholder="Description"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={actionLoading === 'create-role'}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-50"
            >
              <span className="inline-flex items-center gap-2">
                <FiPlus size={14} /> Create Role
              </span>
            </button>
          </form>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Create Permission</h2>
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              await runAction(
                'create-permission',
                async () => {
                  await createPermission({
                    name: permissionForm.name.trim(),
                    description: permissionForm.description.trim(),
                  });
                  setPermissionForm({ name: '', description: '' });
                },
                'Permission created successfully.'
              );
            }}
            className="space-y-3"
          >
            <input
              required
              value={permissionForm.name}
              onChange={(event) => setPermissionForm((previous) => ({ ...previous, name: event.target.value }))}
              placeholder="Permission name"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              value={permissionForm.description}
              onChange={(event) => setPermissionForm((previous) => ({ ...previous, description: event.target.value }))}
              placeholder="Description"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={actionLoading === 'create-permission'}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-50"
            >
              <span className="inline-flex items-center gap-2">
                <FiPlus size={14} /> Create Permission
              </span>
            </button>
          </form>
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Permission Assignment</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <select
            value={selectedRoleId}
            onChange={(event) => setSelectedRoleId(event.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select role</option>
            {roles.map((role) => (
              <option key={role?._id || role?.id} value={role?._id || role?.id}>
                {role?.name}
              </option>
            ))}
          </select>
          <select
            value={selectedPermissionId}
            onChange={(event) => setSelectedPermissionId(event.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select permission</option>
            {permissions.map((permission) => (
              <option key={permission?._id || permission?.id} value={permission?._id || permission?.id}>
                {permission?.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => runAction('assign', () => assignPermissionToRole(selectedRoleId, selectedPermissionId), 'Permission assigned successfully.')}
            disabled={!selectedRoleId || !selectedPermissionId || actionLoading === 'assign'}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold disabled:opacity-50"
          >
            Assign Permission
          </button>
          <button
            onClick={() => runAction('remove', () => removePermissionFromRole(selectedRoleId, selectedPermissionId), 'Permission removed successfully.')}
            disabled={!selectedRoleId || !selectedPermissionId || actionLoading === 'remove'}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold disabled:opacity-50"
          >
            Remove Permission
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-3">Roles</h3>
          <div className="space-y-2">
            {roles.map((role) => (
              <div key={role?._id || role?.id} className="px-3 py-2 rounded-lg border border-slate-200 flex items-center justify-between">
                <span className="text-slate-800 font-medium inline-flex items-center gap-2">
                  <FiShield size={14} /> {role?.name}
                </span>
                <span className="text-xs text-slate-500">{Array.isArray(role?.permissions) ? role.permissions.length : 0} permissions</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-3">Permissions</h3>
          <div className="space-y-2 max-h-96 overflow-auto pr-1">
            {permissions.map((permission) => (
              <div key={permission?._id || permission?.id} className="px-3 py-2 rounded-lg border border-slate-200 text-slate-700">
                {permission?.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedRole && (
        <div className="mt-6 text-xs text-slate-500">
          Active role context: {selectedRole.name}
        </div>
      )}
    </div>
  );
};

export default RolesPermissionsAdmin;
