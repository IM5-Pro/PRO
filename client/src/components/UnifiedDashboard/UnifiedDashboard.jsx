import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import HRSidebar from '../HRSidebar/HRSidebar';
import HRHeader from '../HRHeader/HRHeader';
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
    portalLabel: 'Employee Portal',
    heading: 'Employee Dashboard',
    subtitle: 'Track your day-to-day work and personal HR actions.',
    widgets: [
      { key: 'attendance', title: 'My Attendance', value: '0', note: 'Attendance records loaded from backend' },
      { key: 'leaves', title: 'My Leaves', value: '0', note: 'Leave requests loaded from backend' },
      { key: 'holidays', title: 'Upcoming Holidays', value: '0', note: 'Leave policies loaded from backend' },
      { key: 'payslip', title: 'Payslip Download', value: '0', note: 'Payroll entries loaded from backend' },
    ],
    pages: [
      { id: 'dashboard', label: 'Dashboard', icon: '🏠', category: 'main', description: 'Personal overview' },
      { id: 'my-profile', label: 'My Profile', icon: '👤', category: 'main', description: 'Manage your profile' },
      { id: 'attendance', label: 'Attendance', icon: '🕒', category: 'work', description: 'View attendance logs' },
      { id: 'leaves', label: 'Leaves', icon: '🌴', category: 'work', description: 'Apply and review leaves' },
      { id: 'payroll', label: 'Payroll', icon: '💵', category: 'work', description: 'View payslips and payroll info' },
      { id: 'documents', label: 'Documents', icon: '📁', category: 'work', description: 'Access company documents' },
    ],
  },
  [ROLES.MANAGER]: {
    portalLabel: 'Manager Portal',
    heading: 'Manager Dashboard',
    subtitle: 'Manage team execution, approvals, and outcomes.',
    widgets: [
      { key: 'team-attendance', title: 'Team Attendance', value: '0', note: 'Team attendance rows loaded from backend' },
      { key: 'leave-requests', title: 'Pending Leave Requests', value: '0', note: 'Team leave requests loaded from backend' },
      { key: 'team-performance', title: 'Team Performance', value: 'N/A', note: 'Monthly summary loaded from backend' },
      { key: 'team-members', title: 'Team Members', value: '0', note: 'Team member list loaded from backend' },
    ],
    pages: [
      { id: 'dashboard', label: 'Dashboard', icon: '🏠', category: 'main', description: 'Team overview' },
      { id: 'team', label: 'Team', icon: '👥', category: 'main', description: 'Team directory and updates' },
      { id: 'attendance', label: 'Attendance', icon: '🕒', category: 'operations', description: 'Track team attendance' },
      { id: 'leave-approvals', label: 'Leave Approvals', icon: '✅', category: 'operations', description: 'Approve leave requests' },
      { id: 'reports', label: 'Reports', icon: '📊', category: 'operations', description: 'Team reports and exports' },
    ],
  },
  [ROLES.HR_ADMIN]: {
    portalLabel: 'HR Portal',
    heading: 'HR Dashboard',
    subtitle: 'Operate HR processes across workforce lifecycle.',
    widgets: [
      { key: 'total-employees', title: 'Total Employees', value: '0', note: 'Company-wide headcount from backend' },
      { key: 'new-joiners', title: 'New Joiners', value: '0', note: 'Recent joiners from backend records' },
      { key: 'pending-leaves', title: 'Pending Leave Approvals', value: '0', note: 'Leave approvals loaded from backend' },
      { key: 'payroll-processing', title: 'Payroll Processing', value: '0', note: 'Payroll runs loaded from backend' },
    ],
    pages: [
      { id: 'dashboard', label: 'Dashboard', icon: '🏠', category: 'main', description: 'HR overview' },
      { id: 'employees', label: 'Employees', icon: '👥', category: 'operations', description: 'Employee management' },
      { id: 'attendance', label: 'Attendance', icon: '🕒', category: 'operations', description: 'Attendance controls' },
      { id: 'leaves', label: 'Leaves', icon: '🌴', category: 'operations', description: 'Leave operations' },
      { id: 'payroll', label: 'Payroll', icon: '💰', category: 'operations', description: 'Payroll runs and setup' },
      { id: 'reports', label: 'Reports', icon: '📊', category: 'operations', description: 'HR reporting' },
    ],
  },
  [ROLES.SUPER_ADMIN]: {
    portalLabel: 'Admin Portal',
    heading: 'Admin Dashboard',
    subtitle: 'Control system governance and enterprise settings.',
    widgets: [
      { key: 'company-overview', title: 'Company Overview', value: '0', note: 'Employee data loaded from backend' },
      { key: 'system-settings', title: 'System Settings', value: '0', note: 'Role settings loaded from backend' },
      { key: 'audit-logs', title: 'Audit Logs', value: '0', note: 'Session activity loaded from backend' },
      { key: 'department-stats', title: 'Department Stats', value: '0', note: 'Department data loaded from backend' },
    ],
    pages: [
      { id: 'dashboard', label: 'Dashboard', icon: '🛡️', category: 'main', description: 'Enterprise overview' },
      { id: 'employees', label: 'Employees', icon: '👥', category: 'governance', description: 'Global employee controls' },
      { id: 'departments', label: 'Departments', icon: '🏢', category: 'governance', description: 'Department administration' },
      { id: 'roles-permissions', label: 'Roles & Permissions', icon: '🔐', category: 'governance', description: 'Access control management' },
      { id: 'system-settings', label: 'System Settings', icon: '⚙️', category: 'system', description: 'Core platform settings' },
      { id: 'audit-logs', label: 'Audit Logs', icon: '📜', category: 'system', description: 'Activity and compliance logs' },
    ],
  },
};

const DashboardHome = ({ heading, subtitle, widgets, pages, onNavigate, loading }) => {
  const quickPages = pages.filter((page) => page.id !== 'dashboard').slice(0, 6);

  return (
    <div className="min-h-screen bg-transparent p-6 md:p-8">
      <div className="mb-8 rounded-2xl p-6 bg-white/10 backdrop-blur-3xl border border-white/30 ring-1 ring-white/20">
        <h1 className="text-4xl font-bold text-slate-800 mb-2">{heading}</h1>
        <p className="text-slate-600">{subtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {widgets.map((widget) => (
          <div
            key={widget.title}
            className="bg-white/20 border border-white/30 rounded-2xl p-6"
            style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}
          >
            <p className="text-sm text-slate-600 mb-2">{widget.title}</p>
            <p className="text-3xl font-bold text-slate-800 mb-1">{loading ? '...' : widget.value}</p>
            <p className="text-sm text-slate-600">{widget.note}</p>
          </div>
        ))}
      </div>

      <div className="bg-white/20 border border-white/30 rounded-2xl p-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Quick Access</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickPages.map((page) => (
            <button
              key={page.id}
              onClick={() => onNavigate(page.id)}
              className="text-left px-4 py-3 rounded-xl bg-slate-100/40 border border-slate-300/60 text-slate-800 font-medium hover:bg-slate-200/60 hover:border-slate-400 transition-all duration-200"
            >
              {page.label}
            </button>
          ))}
        </div>
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
          key: 'accountPassword',
          label: 'Account Password (optional)',
          placeholder: 'Set password to create login account',
          required: false,
          inputType: 'password',
        },
        {
          key: 'confirmPassword',
          label: 'Confirm Password (optional)',
          placeholder: 'Confirm account password',
          required: false,
          inputType: 'password',
        },
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
          accountPassword: values.accountPassword,
          confirmPassword: values.confirmPassword,
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

const RolePage = ({ title, description, role, pageId }) => {
  const [loading, setLoading] = useState(true);
  const [datasets, setDatasets] = useState([]);
  const [formValues, setFormValues] = useState({});
  const [actionState, setActionState] = useState({ loadingId: '', message: '', isError: false });
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [selectedPermissionId, setSelectedPermissionId] = useState('');

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
      <div className="rounded-2xl p-6 bg-white/10 backdrop-blur-3xl border border-white/30 ring-1 ring-white/20 mb-6">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">{title}</h1>
        <p className="text-slate-600">{description}</p>
      </div>

      {actions.length > 0 && (
        <div className="space-y-4 mb-6">
          <div className="bg-white/20 border border-white/30 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-3">Role Actions</h2>
            <p className="text-slate-600 text-sm mb-5">Run secured backend actions directly from this module or use row actions in the data tables below.</p>

            {pageId === 'roles-permissions' && (
              <div className="mb-4 p-3 rounded-xl bg-slate-100/60 border border-slate-300/70 text-sm text-slate-700">
                <p>Selected Role ID: {selectedRoleId || 'Not selected yet'}</p>
                <p>Selected Permission ID: {selectedPermissionId || 'Not selected yet'}</p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {actions.map((action) => {
                const values = formValues[action.id] || {};
                const isRunning = actionState.loadingId === action.id;

                return (
                  <div key={action.id} className="bg-slate-100/50 border border-slate-300/70 rounded-xl p-4">
                    <h3 className="text-lg font-semibold text-slate-800 mb-3">{action.title}</h3>

                    <div className="space-y-3">
                      {action.fields.map((field) => (
                        <div key={field.key}>
                          <label className="block text-xs text-slate-700 mb-1">{field.label}</label>
                          <input
                            type={field.inputType || 'text'}
                            value={values[field.key] || ''}
                            onChange={(event) => onFieldChange(action.id, field.key, event.target.value)}
                            placeholder={field.placeholder}
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      ))}

                      <button
                        onClick={() => runAction(action)}
                        disabled={isRunning}
                        className="w-full px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold text-sm transition-colors"
                      >
                        {isRunning ? 'Processing...' : action.buttonLabel}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {actionState.message && (
              <p className={`mt-4 text-sm ${actionState.isError ? 'text-red-600' : 'text-green-700'}`}>
                {actionState.message}
              </p>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-white/20 border border-white/30 rounded-2xl p-6 text-slate-700">Loading live data...</div>
      ) : datasets.length === 0 ? (
        <div className="bg-white/20 border border-white/30 rounded-2xl p-6 text-slate-700">No backend dataset is mapped for this page yet.</div>
      ) : (
        <div className="space-y-6">
          {datasets.map((dataset) => {
            const rows = Array.isArray(dataset.rows) ? dataset.rows : [];
            const hasError = Boolean(dataset.error);
            const previewRows = rows.slice(0, 6);
            const firstRow = previewRows.find((row) => row && typeof row === 'object' && !Array.isArray(row));
            const columns = firstRow ? Object.keys(firstRow).slice(0, 5) : [];
            const rowActionsByIndex = previewRows.map((row) => getRowActions(dataset.key, row));
            const hasRowActions = rowActionsByIndex.some((rowActions) => rowActions.length > 0);

            return (
              <div key={dataset.key} className="bg-white/20 border border-white/30 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-slate-800">{dataset.label}</h2>
                  <span className="text-sm text-slate-600">Count: {dataset.count ?? 0}</span>
                </div>

                {hasError ? (
                  <p className="text-red-600 text-sm">{dataset.error}</p>
                ) : previewRows.length === 0 ? (
                  <p className="text-slate-600 text-sm">No records returned from {dataset.endpoint}</p>
                ) : columns.length === 0 ? (
                  <pre className="text-xs text-slate-700 overflow-auto bg-slate-100/60 p-3 rounded-xl">{JSON.stringify(previewRows, null, 2)}</pre>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-300">
                          {columns.map((column) => (
                            <th key={column} className="py-2 pr-4 text-slate-700 font-semibold">{column}</th>
                          ))}
                          {hasRowActions && <th className="py-2 pr-4 text-slate-700 font-semibold">Actions</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {previewRows.map((row, index) => {
                          const rowActions = rowActionsByIndex[index] || [];

                          return (
                            <tr key={index} className="border-b border-slate-200/70">
                              {columns.map((column) => (
                                <td key={`${index}-${column}`} className="py-2 pr-4 text-slate-700">
                                  {formatValue(row[column])}
                                </td>
                              ))}

                              {hasRowActions && (
                                <td className="py-2 pr-4">
                                  {rowActions.length === 0 ? (
                                    <span className="text-xs text-slate-500">No action</span>
                                  ) : (
                                    <div className="flex flex-wrap gap-2">
                                      {rowActions.map((rowAction) => {
                                        const isRunning = rowAction.actionId && actionState.loadingId === rowAction.actionId;

                                        return (
                                          <button
                                            key={rowAction.key}
                                            type="button"
                                            onClick={() => {
                                              if (rowAction.onClick) {
                                                rowAction.onClick();
                                                return;
                                              }

                                              const action = actionsById[rowAction.actionId];
                                              if (action) {
                                                runAction(action, rowAction.values || {});
                                              }
                                            }}
                                            disabled={Boolean(rowAction.disabled) || Boolean(isRunning)}
                                            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${getRowActionClassName(rowAction.tone)}`}
                                          >
                                            {isRunning ? 'Processing...' : rowAction.label}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}
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
  const { user = {}, logout } = useAuth();
  const contentScrollRef = useRef(null);
  const [notificationCount, setNotificationCount] = useState(3);
  const [dashboardWidgets, setDashboardWidgets] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  const userRole = user?.role || ROLES.EMPLOYEE;
  const roleConfig = useMemo(() => {
    return ROLE_DASHBOARD_CONFIG[userRole] || ROLE_DASHBOARD_CONFIG[ROLES.EMPLOYEE];
  }, [userRole]);

  const [currentPage, setCurrentPage] = useState('dashboard');

  useEffect(() => {
    const hasPage = roleConfig.pages.some((page) => page.id === currentPage);
    if (!hasPage) {
      setCurrentPage('dashboard');
    }
  }, [currentPage, roleConfig.pages]);

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
    if (contentScrollRef.current) {
      contentScrollRef.current.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [currentPage]);

  const currentUser = useMemo(
    () => ({
      name: user?.name || 'User',
      email: user?.email || 'user@ispace.com',
      role: userRole,
      avatar: user?.avatar || '👨‍💼',
      department: user?.department || 'Operations',
    }),
    [user, userRole]
  );

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

    const page = roleConfig.pages.find((item) => item.id === currentPage);
    if (!page) {
      return (
        <RolePage
          title="Page Not Found"
          description="The requested page is not available for your role."
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
        pageConfigs={roleConfig.pages}
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
