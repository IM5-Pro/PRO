import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FiCheckCircle,
  FiEdit2,
  FiFilter,
  FiRefreshCw,
  FiSave,
  FiSearch,
  FiSettings,
  FiShield,
  FiTrash2,
  FiUserCheck,
  FiUsers,
  FiXCircle,
} from 'react-icons/fi';
import {
  assignPermissionToRole,
  deletePermission,
  disableMfa,
  enableMfa,
  fetchPermissions,
  fetchRoles,
  fetchSessions,
  removePermissionFromRole,
  terminateSession,
  toErrorMessage,
  updatePermission,
} from '../../../services/adminOperationsApi';

const ACTION_OPTIONS = [
  {
    value: 'access.assign_permission',
    label: 'Access: Assign selected permission to selected role',
    requirements: ['role', 'permission'],
  },
  {
    value: 'access.remove_permission',
    label: 'Access: Remove selected permission from selected role',
    requirements: ['role', 'permission'],
  },
  {
    value: 'security.enable_mfa',
    label: 'Security: Enable MFA for this admin account',
    requirements: [],
  },
  {
    value: 'security.disable_mfa',
    label: 'Security: Disable MFA for this admin account',
    requirements: [],
  },
  {
    value: 'sessions.terminate_selected',
    label: 'Session: Terminate selected session',
    requirements: ['session'],
  },
];

const getRowId = (row) => String(row?._id || row?.id || '');

const normalizePermission = (permission) => {
  const name = String(permission?.name || '').trim();
  const explicitModule = String(permission?.module || '').trim();
  const moduleFromName = name.includes('.') ? name.split('.')[0] : '';

  return {
    ...permission,
    module: explicitModule || moduleFromName || 'general',
    group: String(permission?.group || 'General').trim() || 'General',
    isSystem: Boolean(permission?.isSystem),
  };
};

const SystemSettingsAdmin = () => {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [banner, setBanner] = useState({ type: '', text: '' });
  const [selectedAction, setSelectedAction] = useState('access.assign_permission');
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [selectedPermissionId, setSelectedPermissionId] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [permissionSearch, setPermissionSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [permissionTypeFilter, setPermissionTypeFilter] = useState('all');
  const [editingPermissionId, setEditingPermissionId] = useState('');
  const [permissionDraft, setPermissionDraft] = useState({ name: '', description: '' });

  const loadSystemData = useCallback(async () => {
    setLoading(true);
    try {
      const [roleRows, permissionRows, sessionRows] = await Promise.all([
        fetchRoles(),
        fetchPermissions(),
        fetchSessions(),
      ]);
      setRoles(roleRows);
      setPermissions(permissionRows);
      setSessions(sessionRows);
    } catch (error) {
      setBanner({ type: 'error', text: toErrorMessage(error, 'Failed to load system settings') });
      setRoles([]);
      setPermissions([]);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSystemData();
  }, [loadSystemData]);

  useEffect(() => {
    if (roles.length === 0) {
      if (selectedRoleId) {
        setSelectedRoleId('');
      }
      return;
    }

    const hasSelectedRole = roles.some((role) => getRowId(role) === selectedRoleId);
    if (!selectedRoleId || !hasSelectedRole) {
      setSelectedRoleId(getRowId(roles[0]));
    }
  }, [roles, selectedRoleId]);

  useEffect(() => {
    if (permissions.length === 0) {
      if (selectedPermissionId) {
        setSelectedPermissionId('');
      }
      return;
    }

    const hasSelectedPermission = permissions.some((permission) => getRowId(permission) === selectedPermissionId);
    if (!selectedPermissionId || !hasSelectedPermission) {
      setSelectedPermissionId(getRowId(permissions[0]));
    }
  }, [permissions, selectedPermissionId]);

  useEffect(() => {
    if (sessions.length === 0) {
      if (selectedSessionId) {
        setSelectedSessionId('');
      }
      return;
    }

    const hasSelectedSession = sessions.some((session) => getRowId(session) === selectedSessionId);
    if (!selectedSessionId || !hasSelectedSession) {
      setSelectedSessionId(getRowId(sessions[0]));
    }
  }, [sessions, selectedSessionId]);

  const normalizedPermissions = useMemo(() => {
    return permissions.map((permission) => normalizePermission(permission));
  }, [permissions]);

  const modules = useMemo(() => {
    const moduleNames = normalizedPermissions.map((permission) => permission.module);
    return Array.from(new Set(moduleNames)).sort((a, b) => a.localeCompare(b));
  }, [normalizedPermissions]);

  const selectedRole = useMemo(() => {
    return roles.find((role) => getRowId(role) === selectedRoleId) || null;
  }, [roles, selectedRoleId]);

  const selectedPermission = useMemo(() => {
    return normalizedPermissions.find((permission) => getRowId(permission) === selectedPermissionId) || null;
  }, [normalizedPermissions, selectedPermissionId]);

  const selectedSession = useMemo(() => {
    return sessions.find((session) => getRowId(session) === selectedSessionId) || null;
  }, [sessions, selectedSessionId]);

  const permissionRolesMap = useMemo(() => {
    const map = new Map();
    const permissionIdsByName = new Map();

    normalizedPermissions.forEach((permission) => {
      const permissionId = getRowId(permission);
      if (permissionId) {
        map.set(permissionId, []);
      }

      if (permission?.name) {
        permissionIdsByName.set(permission.name, permissionId);
      }
    });

    roles.forEach((role) => {
      const roleName = role?.name || 'Unknown Role';
      const rolePermissions = Array.isArray(role?.permissions) ? role.permissions : [];

      rolePermissions.forEach((permissionEntry) => {
        let permissionId = '';

        if (typeof permissionEntry === 'string') {
          permissionId = String(permissionEntry);
        } else {
          permissionId = getRowId(permissionEntry);

          if (!permissionId && permissionEntry?.name) {
            permissionId = permissionIdsByName.get(permissionEntry.name) || '';
          }
        }

        if (!permissionId) {
          return;
        }

        if (!map.has(permissionId)) {
          map.set(permissionId, []);
        }

        const currentRoles = map.get(permissionId);
        if (!currentRoles.includes(roleName)) {
          currentRoles.push(roleName);
        }
      });
    });

    return map;
  }, [normalizedPermissions, roles]);

  const filteredPermissions = useMemo(() => {
    const search = permissionSearch.trim().toLowerCase();

    return normalizedPermissions.filter((permission) => {
      const searchMatch =
        !search ||
        String(permission?.name || '').toLowerCase().includes(search) ||
        String(permission?.description || '').toLowerCase().includes(search) ||
        String(permission?.module || '').toLowerCase().includes(search) ||
        String(permission?.group || '').toLowerCase().includes(search);

      const moduleMatch = moduleFilter === 'all' || permission.module === moduleFilter;

      const typeMatch =
        permissionTypeFilter === 'all' ||
        (permissionTypeFilter === 'system' && permission.isSystem) ||
        (permissionTypeFilter === 'custom' && !permission.isSystem);

      return searchMatch && moduleMatch && typeMatch;
    });
  }, [moduleFilter, normalizedPermissions, permissionSearch, permissionTypeFilter]);

  const selectedActionConfig = useMemo(() => {
    return ACTION_OPTIONS.find((option) => option.value === selectedAction) || ACTION_OPTIONS[0];
  }, [selectedAction]);

  const canRunSelectedAction = useMemo(() => {
    const requirements = selectedActionConfig?.requirements || [];

    if (requirements.includes('role') && !selectedRoleId) {
      return false;
    }

    if (requirements.includes('permission') && !selectedPermissionId) {
      return false;
    }

    if (requirements.includes('session') && !selectedSessionId) {
      return false;
    }

    return true;
  }, [selectedActionConfig, selectedPermissionId, selectedRoleId, selectedSessionId]);

  const summary = useMemo(() => {
    return {
      roles: roles.length,
      permissions: permissions.length,
      sessions: sessions.length,
      modules: modules.length,
    };
  }, [modules.length, permissions.length, roles.length, sessions.length]);

  const runAction = async (key, action, successMessage) => {
    setActionLoading(key);
    setBanner({ type: '', text: '' });

    try {
      await action();
      setBanner({ type: 'success', text: successMessage });
      await loadSystemData();
    } catch (error) {
      setBanner({ type: 'error', text: toErrorMessage(error, 'Action failed') });
    } finally {
      setActionLoading('');
    }
  };

  const executeSelectedAction = async () => {
    if (!canRunSelectedAction) {
      return;
    }

    switch (selectedAction) {
      case 'access.assign_permission':
        await runAction(
          'access.assign_permission',
          () => assignPermissionToRole(selectedRoleId, selectedPermissionId),
          'Permission assigned successfully.'
        );
        break;
      case 'access.remove_permission':
        await runAction(
          'access.remove_permission',
          () => removePermissionFromRole(selectedRoleId, selectedPermissionId),
          'Permission removed successfully.'
        );
        break;
      case 'security.enable_mfa':
        await runAction('security.enable_mfa', () => enableMfa(), 'MFA enabled successfully.');
        break;
      case 'security.disable_mfa':
        await runAction('security.disable_mfa', () => disableMfa(), 'MFA disabled successfully.');
        break;
      case 'sessions.terminate_selected':
        await runAction('sessions.terminate_selected', () => terminateSession(selectedSessionId), 'Session terminated successfully.');
        break;
      default:
        break;
    }
  };

  const selectedRolePermissionCount = Array.isArray(selectedRole?.permissions) ? selectedRole.permissions.length : 0;

  const startPermissionEdit = (permission) => {
    setEditingPermissionId(getRowId(permission));
    setPermissionDraft({
      name: String(permission?.name || ''),
      description: String(permission?.description || ''),
    });
  };

  const cancelPermissionEdit = () => {
    setEditingPermissionId('');
    setPermissionDraft({ name: '', description: '' });
  };

  const savePermissionEdit = async (permissionId) => {
    await runAction(
      `permission.update.${permissionId}`,
      async () => {
        await updatePermission(permissionId, {
          name: permissionDraft.name.trim(),
          description: permissionDraft.description.trim(),
        });
        cancelPermissionEdit();
      },
      'Permission updated successfully.'
    );
  };

  const removePermission = async (permissionId) => {
    await runAction(
      `permission.delete.${permissionId}`,
      async () => {
        await deletePermission(permissionId);
        if (selectedPermissionId === permissionId) {
          setSelectedPermissionId('');
        }
        if (editingPermissionId === permissionId) {
          cancelPermissionEdit();
        }
      },
      'Permission deleted successfully.'
    );
  };

  return (
    <div className="min-h-screen bg-transparent p-6 md:p-8">
      <div className="rounded-2xl bg-white border border-slate-200 p-6 mb-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
              <FiSettings size={28} /> System Control Center
            </h1>
            <p className="text-slate-600 mt-1">Use selectable controls to manage access, sessions, and security from one place</p>
          </div>
          <button
            onClick={loadSystemData}
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl bg-white border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Roles</p>
          <p className="text-2xl font-bold text-slate-800 inline-flex items-center gap-2">
            <FiShield size={18} /> {summary.roles}
          </p>
        </div>
        <div className="rounded-xl bg-white border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Permissions</p>
          <p className="text-2xl font-bold text-slate-800">{summary.permissions}</p>
        </div>
        <div className="rounded-xl bg-white border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Modules</p>
          <p className="text-2xl font-bold text-slate-800">{summary.modules}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-6">
        <div className="rounded-xl bg-white border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Active Sessions</p>
          <p className="text-2xl font-bold text-slate-800 inline-flex items-center gap-2">
            <FiUsers size={18} /> {summary.sessions}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 xl:col-span-2">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Control Actions (Select and Apply)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Action</label>
              <select
                value={selectedAction}
                onChange={(event) => setSelectedAction(event.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {ACTION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">Role</label>
              <select
                value={selectedRoleId}
                onChange={(event) => setSelectedRoleId(event.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select role</option>
                {roles.map((role) => (
                  <option key={getRowId(role)} value={getRowId(role)}>
                    {role?.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">Permission</label>
              <select
                value={selectedPermissionId}
                onChange={(event) => setSelectedPermissionId(event.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select permission</option>
                {normalizedPermissions.map((permission) => (
                  <option key={getRowId(permission)} value={getRowId(permission)}>
                    {permission?.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">Session</label>
              <select
                value={selectedSessionId}
                onChange={(event) => setSelectedSessionId(event.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select session</option>
                {sessions.map((session) => {
                  const sessionId = getRowId(session);
                  const sessionUser = session?.user || session?.email || 'Unknown user';

                  return (
                    <option key={sessionId} value={sessionId}>
                      {sessionId} ({sessionUser})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={executeSelectedAction}
              disabled={!canRunSelectedAction || Boolean(actionLoading)}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-50"
            >
              Apply Selected Action
            </button>
            <span className="text-xs text-slate-500">
              Required for this action: {(selectedActionConfig?.requirements || []).length === 0 ? 'No extra selection' : selectedActionConfig.requirements.join(', ')}
            </span>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Selection Context</h2>
          <div className="space-y-3 text-sm text-slate-700">
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-xs text-slate-500 mb-1">Active Role</p>
              <p className="font-semibold text-slate-800">{selectedRole?.name || 'Not selected'}</p>
              <p className="text-xs text-slate-500 mt-1">{selectedRolePermissionCount} permission(s) assigned</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-xs text-slate-500 mb-1">Active Permission</p>
              <p className="font-semibold text-slate-800">{selectedPermission?.name || 'Not selected'}</p>
              <p className="text-xs text-slate-500 mt-1">
                {selectedPermission ? `${selectedPermission.module} / ${selectedPermission.group}` : 'Select a permission to inspect details'}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-xs text-slate-500 mb-1">Selected Session</p>
              <p className="font-semibold text-slate-800">{selectedSession ? getRowId(selectedSession) : 'Not selected'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Permissions Visibility</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Search</label>
            <div className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2">
              <FiSearch size={14} className="text-slate-500" />
              <input
                value={permissionSearch}
                onChange={(event) => setPermissionSearch(event.target.value)}
                placeholder="Search by name, description, module"
                className="w-full text-sm focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Module</label>
            <div className="relative">
              <FiFilter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <select
                value={moduleFilter}
                onChange={(event) => setModuleFilter(event.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All modules</option>
                {modules.map((moduleName) => (
                  <option key={moduleName} value={moduleName}>
                    {moduleName}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Permission Type</label>
            <select
              value={permissionTypeFilter}
              onChange={(event) => setPermissionTypeFilter(event.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="system">System</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Permission</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Module</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Group</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Type</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Assigned Roles</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPermissions.map((permission) => {
                const permissionId = getRowId(permission);
                const assignedRoles = permissionRolesMap.get(permissionId) || [];
                const isEditing = editingPermissionId === permissionId;
                const isRowBusy = Boolean(actionLoading) && actionLoading.includes(permissionId);

                return (
                  <tr key={permissionId} className="border-t border-slate-200">
                    <td className="px-4 py-3 align-top">
                      {isEditing ? (
                        <div className="space-y-2">
                          <input
                            value={permissionDraft.name}
                            onChange={(event) => setPermissionDraft((previous) => ({ ...previous, name: event.target.value }))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Permission name"
                          />
                          <input
                            value={permissionDraft.description}
                            onChange={(event) => setPermissionDraft((previous) => ({ ...previous, description: event.target.value }))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Permission description"
                          />
                        </div>
                      ) : (
                        <>
                          <p className="font-medium text-slate-800">{permission.name}</p>
                          {permission.description && (
                            <p className="text-xs text-slate-500 mt-1">{permission.description}</p>
                          )}
                        </>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-700 align-top">{permission.module}</td>
                    <td className="px-4 py-3 text-slate-700 align-top">{permission.group}</td>
                    <td className="px-4 py-3 align-top">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${permission.isSystem ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>
                        {permission.isSystem ? 'System' : 'Custom'}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      {assignedRoles.length === 0 ? (
                        <span className="text-xs text-slate-500">No roles assigned</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {assignedRoles.map((roleName) => (
                            <span key={`${permissionId}-${roleName}`} className="inline-flex px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
                              {roleName}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-wrap gap-2">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={() => savePermissionEdit(permissionId)}
                              disabled={!permissionDraft.name.trim() || isRowBusy}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold disabled:opacity-50"
                            >
                              <FiSave size={12} /> Save
                            </button>
                            <button
                              type="button"
                              onClick={cancelPermissionEdit}
                              disabled={isRowBusy}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50"
                            >
                              <FiXCircle size={12} /> Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => startPermissionEdit(permission)}
                              disabled={Boolean(editingPermissionId) || isRowBusy}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50"
                            >
                              <FiEdit2 size={12} /> Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => removePermission(permissionId)}
                              disabled={Boolean(editingPermissionId) || isRowBusy}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold disabled:opacity-50"
                            >
                              <FiTrash2 size={12} /> Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!loading && filteredPermissions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    No permissions found for the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Role Snapshot</h2>
          <div className="space-y-2 max-h-80 overflow-auto pr-1">
            {roles.map((role) => {
              const roleId = getRowId(role);
              const isSelected = roleId === selectedRoleId;
              const permissionCount = Array.isArray(role?.permissions) ? role.permissions.length : 0;

              return (
                <button
                  key={roleId}
                  type="button"
                  onClick={() => setSelectedRoleId(roleId)}
                  className={`w-full text-left px-3 py-2 rounded-lg border flex items-center justify-between ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                >
                  <span className="text-slate-800 font-medium inline-flex items-center gap-2">
                    <FiUserCheck size={14} /> {role?.name}
                  </span>
                  <span className="text-xs text-slate-500">{permissionCount} permissions</span>
                </button>
              );
            })}
            {!loading && roles.length === 0 && <p className="text-sm text-slate-500">No roles available.</p>}
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Session Control</h2>
          <div className="space-y-2 max-h-80 overflow-auto pr-1">
            {sessions.map((session) => {
              const sessionId = getRowId(session);
              const isSelected = sessionId === selectedSessionId;

              return (
                <div key={sessionId} className={`px-3 py-3 rounded-lg border ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{sessionId || 'Unknown session id'}</p>
                      <p className="text-xs text-slate-500">User: {session?.user || session?.email || 'Unknown user'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedSessionId(sessionId)}
                        className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                      >
                        Select
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          runAction(
                            `sessions.terminate.${sessionId}`,
                            () => terminateSession(sessionId),
                            'Session terminated successfully.'
                          )
                        }
                        disabled={Boolean(actionLoading)}
                        className="px-3 py-1.5 text-xs rounded-lg bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                      >
                        Terminate
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {!loading && sessions.length === 0 && (
              <p className="text-sm text-slate-500">No active sessions reported.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettingsAdmin;
