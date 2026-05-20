import React, { useCallback, useEffect, useMemo, useState } from 'react';
import API from '../../../api/client';
import { EMPLOYEE_ENDPOINTS } from '../../../api/endpoints';
import { ROLES } from '../../../utils/roles';
import { fetchDepartments, fetchDesignations } from '../../../services/adminOperationsApi';
import {
  approveLeaveRequest,
  assignPermissionToRole,
  assignRoleToPermission,
  createEmployeeRecord,
  fetchRolePageData,
  processPayrollRun,
  rejectLeaveRequest,
} from '../../../services/unifiedDashboardApi';
import { formatINR } from '../../../utils/currency';

const apiPayload = (response) => response?.data || {};

const MONEY_COLUMN_PATTERN = /salary|gross|net|payout|budget|ctc|basic|hra|amount|pay|deduction|earning|total/i;

const extractListRows = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (Array.isArray(payload?.data)) {
    return payload.data;
  }
  return [];
};

const formatValue = (value, columnKey = '') => {
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

  if (columnKey && MONEY_COLUMN_PATTERN.test(columnKey)) {
    const inr = formatINR(value);
    if (inr !== '—') {
      return inr;
    }
  }

  if (typeof value === 'string' && /[$₹]/.test(value)) {
    const inr = formatINR(value);
    if (inr !== '—') {
      return inr;
    }
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

const normalizeText = (value) => String(value || '').trim().toLowerCase();

const formatWorkEmail = (firstName, lastName) => {
  const normalizeNamePart = (value) => String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/\.{2,}/g, '.')
    .replace(/^\.|\.$/g, '');

  const first = normalizeNamePart(firstName);
  const last = normalizeNamePart(lastName);
  if (!first || !last) {
    return '';
  }
  return `${first}.${last}@ispace.com`;
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
        { key: 'middleName', label: 'Middle Name', placeholder: 'Enter middle name (optional)', required: false },
        { key: 'lastName', label: 'Last Name', placeholder: 'Enter last name', required: true },
        { key: 'email', label: 'Work Email', placeholder: 'Enter work email', inputType: 'email', required: true },
        { key: 'department', label: 'Department (optional)', placeholder: 'Select department', inputType: 'select', required: false },
        { key: 'designation', label: 'Designation (optional)', placeholder: 'Select designation', inputType: 'select', required: false },
        { key: 'salary', label: 'Salary (optional)', placeholder: 'Enter salary amount', inputType: 'number', required: false },
        { key: 'joinDate', label: 'Join Date (optional)', placeholder: 'YYYY-MM-DD', inputType: 'date', required: false },
        { key: 'phoneNumber', label: 'Phone Number (optional)', placeholder: '10-digit phone number', required: false },
        { key: 'employmentType', label: 'Employment type (optional)', placeholder: 'Select type', inputType: 'select', options: [
          { value: 'FULL_TIME', label: 'Full time' },
          { value: 'PART_TIME', label: 'Part time' },
          { value: 'CONTRACT', label: 'Contract' },
        ], required: false },
        { key: 'dateOfBirth', label: 'Date of birth (optional)', placeholder: 'YYYY-MM-DD', inputType: 'date', required: false },
        { key: 'managerId', label: 'Reporting Manager (optional)', placeholder: 'Select manager', inputType: 'select', required: false },
        {
          key: 'accountRole',
          label: 'Account Role (optional)',
          placeholder: 'Select account role',
          inputType: 'select',
          options: [
            { value: 'EMPLOYEE', label: 'EMPLOYEE' },
            { value: 'MANAGER', label: 'MANAGER' },
            { value: 'HR_ADMIN', label: 'HR_ADMIN' },
            { value: 'DEPT_ADMIN', label: 'DEPT_ADMIN' },
          ],
          required: false,
        },
      ],
      run: async (values) => {
        return createEmployeeRecord({
          firstName: values.firstName,
          middleName: values.middleName,
          lastName: values.lastName,
          email: String(values.email || '').trim().toLowerCase(),
          department: values.department,
          designation: values.designation,
          salary: values.salary,
          joinDate: values.joinDate,
          phoneNumber: values.phoneNumber,
          employmentType: values.employmentType,
          dateOfBirth: values.dateOfBirth,
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
  '__v',
  'documents',
  'statusHistory',
  'salaryTemplateId',
  'refreshTokenHash',
  'passwordResetTokenHash',
  'failedLoginAttempts',
  'lockedUntil',
  'passwordChangedAt',
  'passwordResetExpiry',
]);

const HUMAN_LABELS = {
  _id: 'ID',
  firstName: 'First Name',
  lastName: 'Last Name',
  email: 'Email',
  phoneNumber: 'Phone',
  isActive: 'Status',
  createdAt: 'Created',
  updatedAt: 'Updated',
  employeeCode: 'Emp Code',
  department: 'Department',
  designation: 'Title',
  joinDate: 'Join Date',
  salary: 'Salary',
  role: 'Role',
  name: 'Name',
  description: 'Description',
  status: 'Status',
  type: 'Type',
  amount: 'Amount',
  startDate: 'Start',
  endDate: 'End',
  checkIn: 'Check-in',
  checkOut: 'Check-out',
  date: 'Date',
  leaveType: 'Leave Type',
  reason: 'Reason',
};

const humanLabel = (key) => {
  return HUMAN_LABELS[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
};

const pickColumns = (row, max = 5) => {
  if (!row) {
    return [];
  }
  return Object.keys(row).filter((k) => !SKIP_COLS.has(k)).slice(0, max);
};

const StatusBadge = ({ value, col }) => {
  if (col === 'isActive') {
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
          value ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
        }`}
      >
        {value ? 'Active' : 'Inactive'}
      </span>
    );
  }

  const str = String(value ?? '').toUpperCase();
  const cls =
    str === 'ACTIVE' || str === 'APPROVED'
      ? 'bg-green-100 text-green-700'
      : str === 'PENDING'
        ? 'bg-amber-100 text-amber-700'
        : str === 'REJECTED' || str === 'TERMINATED'
          ? 'bg-red-100 text-red-700'
          : 'bg-slate-100 text-slate-600';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {formatValue(value)}
    </span>
  );
};

const RolePage = ({ title, description, role, pageId }) => {
  const [loading, setLoading] = useState(true);
  const [datasets, setDatasets] = useState([]);
  const [formValues, setFormValues] = useState({});
  const [actionState, setActionState] = useState({ loadingId: '', message: '', isError: false });
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [selectedPermissionId, setSelectedPermissionId] = useState('');
  const [openActionId, setOpenActionId] = useState(null);
  const [createEmployeeEmailEdited, setCreateEmployeeEmailEdited] = useState(false);
  const [createEmployeeMasters, setCreateEmployeeMasters] = useState({
    departments: [],
    designations: [],
    loading: false,
  });
  const [createEmployeeManagers, setCreateEmployeeManagers] = useState({
    rows: [],
    loading: false,
  });

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

  const selectedCreateEmployeeDepartment = formValues['create-employee']?.department;

  useEffect(() => {
    if (openActionId !== 'create-employee') {
      setCreateEmployeeEmailEdited(false);
      return;
    }

    let active = true;
    setCreateEmployeeMasters((previous) => ({ ...previous, loading: true }));

    Promise.all([fetchDepartments(), fetchDesignations()])
      .then(([departmentRows, designationRows]) => {
        if (!active) {
          return;
        }
        setCreateEmployeeMasters({
          departments: Array.isArray(departmentRows) ? departmentRows : [],
          designations: Array.isArray(designationRows) ? designationRows : [],
          loading: false,
        });
      })
      .catch(() => {
        if (!active) {
          return;
        }
        setCreateEmployeeMasters({
          departments: [],
          designations: [],
          loading: false,
        });
      });

    return () => {
      active = false;
    };
  }, [openActionId]);

  useEffect(() => {
    if (openActionId !== 'create-employee') {
      return;
    }

    const department = String(selectedCreateEmployeeDepartment || '').trim();
    if (!department) {
      setCreateEmployeeManagers({ rows: [], loading: false });
      return;
    }

    let active = true;
    setCreateEmployeeManagers((previous) => ({ ...previous, loading: true }));

    API.get(
      EMPLOYEE_ENDPOINTS.managers({
        limit: 200,
        department,
      }),
    )
      .then((response) => {
        if (!active) {
          return;
        }
        const rows = extractListRows(apiPayload(response));
        setCreateEmployeeManagers({ rows, loading: false });
      })
      .catch(() => {
        if (!active) {
          return;
        }
        setCreateEmployeeManagers({ rows: [], loading: false });
      });

    return () => {
      active = false;
    };
  }, [openActionId, selectedCreateEmployeeDepartment]);

  useEffect(() => {
    if (openActionId !== 'create-employee') {
      return;
    }

    const selectedManagerId = String(formValues['create-employee']?.managerId || '').trim();
    if (!selectedManagerId) {
      return;
    }

    const stillValid = (createEmployeeManagers.rows || []).some(
      (manager) => normalizeId(manager?._id || manager?.id) === selectedManagerId,
    );

    if (!stillValid) {
      setFormValues((previous) => ({
        ...previous,
        'create-employee': {
          ...(previous['create-employee'] || {}),
          managerId: '',
        },
      }));
    }
  }, [openActionId, createEmployeeManagers.rows, formValues]);

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

      if (action.id === 'create-employee') {
        const normalizedEmail = String(values.email || '').trim().toLowerCase();
        if (!/^[A-Za-z0-9._%+-]+@ispace\.com$/i.test(normalizedEmail)) {
          setActionState({
            loadingId: '',
            message: 'Email must be a valid @ispace.com address',
            isError: true,
          });
          return;
        }
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

  const createEmployeeDepartmentOptions = useMemo(() => {
    return (createEmployeeMasters.departments || [])
      .filter((department) => department?.isActive !== false)
      .map((department) => {
        const name = String(department?.name || department?.departmentName || '').trim();
        if (!name) {
          return null;
        }
        return { value: name, label: name };
      })
      .filter(Boolean)
      .sort((left, right) => left.label.localeCompare(right.label));
  }, [createEmployeeMasters.departments]);

  const getFilteredDesignationsForCreate = useCallback((departmentName) => {
    const rows = (createEmployeeMasters.designations || []).filter((designation) => designation?.isActive !== false);
    const selectedDepartment = normalizeText(departmentName);

    const resolveDesignationDepartmentLabel = (designation) => {
      const dep = designation?.department;
      if (dep && typeof dep === 'object' && dep.name) {
        return String(dep.name).trim();
      }
      return String(
        designation?.departmentName
          || (typeof dep === 'string' ? dep : '')
          || designation?.departmentCode
          || '',
      ).trim();
    };

    const filtered = selectedDepartment
      ? rows.filter((designation) => {
          const departmentValue = normalizeText(resolveDesignationDepartmentLabel(designation));
          return departmentValue === selectedDepartment;
        })
      : rows;

    return filtered
      .map((designation) => {
        const name = String(designation?.name || '').trim();
        return name ? { value: name, label: name } : null;
      })
      .filter(Boolean)
      .sort((left, right) => left.label.localeCompare(right.label));
  }, [createEmployeeMasters.designations]);

  const managerSelectOptions = useMemo(() => {
    return (createEmployeeManagers.rows || [])
      .map((manager) => {
        const id = normalizeId(manager?._id || manager?.id);
        if (!id) {
          return null;
        }
        const name = [manager?.firstName, manager?.lastName].filter(Boolean).join(' ').trim()
          || String(manager?.email || id).trim();
        const label = `${name}${manager?.designation ? ` — ${manager.designation}` : ''}`;
        return { value: id, label };
      })
      .filter(Boolean)
      .sort((left, right) => left.label.localeCompare(right.label));
  }, [createEmployeeManagers.rows]);

  const getCreateEmployeeFieldOptions = useCallback((field, actionValues = {}) => {
    if (field.key === 'department') {
      return createEmployeeDepartmentOptions;
    }
    if (field.key === 'designation') {
      return getFilteredDesignationsForCreate(actionValues.department);
    }
    if (field.key === 'managerId') {
      if (!String(actionValues.department || '').trim()) {
        return [];
      }
      return managerSelectOptions;
    }
    return field.options || [];
  }, [createEmployeeDepartmentOptions, getFilteredDesignationsForCreate, managerSelectOptions]);

  const onFieldChange = useCallback((actionId, key, value) => {
    setFormValues((prev) => {
      const nextActionValues = {
        ...(prev[actionId] || {}),
        [key]: value,
      };

      if (actionId === 'create-employee') {
        if (key === 'email') {
          setCreateEmployeeEmailEdited(true);
        }

        if ((key === 'firstName' || key === 'lastName') && !createEmployeeEmailEdited) {
          const generatedEmail = formatWorkEmail(
            key === 'firstName' ? value : nextActionValues.firstName,
            key === 'lastName' ? value : nextActionValues.lastName,
          );
          if (generatedEmail) {
            nextActionValues.email = generatedEmail;
          }
        }
      }

      if (actionId === 'create-employee' && key === 'department') {
        nextActionValues.designation = '';
        nextActionValues.managerId = '';
      }

      return {
        ...prev,
        [actionId]: nextActionValues,
      };
    });
  }, [createEmployeeEmailEdited]);

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
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800">{title}</h1>
        {description && <p className="text-sm text-slate-400 mt-0.5">{description}</p>}
      </div>

      {actions.length > 0 && (
        <div className="mb-6">
          {pageId === 'roles-permissions' && (selectedRoleId || selectedPermissionId) && (
            <div className="mb-3 px-4 py-2.5 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-600 flex flex-wrap gap-4">
              <span>
                Role: <strong className="text-slate-800">{selectedRoleId || '—'}</strong>
              </span>
              <span>
                Permission: <strong className="text-slate-800">{selectedPermissionId || '—'}</strong>
              </span>
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
            if (openActionId !== action.id) {
              return null;
            }
            const values = formValues[action.id] || {};
            const isRunning = actionState.loadingId === action.id;
            return (
              <div
                key={action.id}
                className="bg-white rounded-xl border border-slate-200 p-5 mb-3"
                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
              >
                <h3 className="text-sm font-semibold text-slate-700 mb-4">{action.title}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  {action.fields.map((field) => (
                    <div key={field.key}>
                      <label className="block text-xs text-slate-500 mb-1">{field.label}</label>
                      {field.inputType === 'select' ? (
                        <select
                          value={values[field.key] || ''}
                          onChange={(event) => onFieldChange(action.id, field.key, event.target.value)}
                          disabled={
                            action.id === 'create-employee'
                            && (
                              (field.key === 'department' && createEmployeeMasters.loading)
                              || (field.key === 'designation' && createEmployeeMasters.loading)
                              || (field.key === 'managerId' && (!values.department || createEmployeeManagers.loading))
                            )
                          }
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white disabled:opacity-60"
                        >
                          <option value="">
                            {action.id === 'create-employee' && field.key === 'department' && createEmployeeMasters.loading
                              ? 'Loading departments...'
                              : action.id === 'create-employee' && field.key === 'designation' && createEmployeeMasters.loading
                                ? 'Loading designations...'
                                : action.id === 'create-employee' && field.key === 'managerId' && !values.department
                                  ? 'Select department first'
                                  : action.id === 'create-employee' && field.key === 'managerId' && createEmployeeManagers.loading
                                    ? 'Loading managers...'
                                    : field.placeholder || `Select ${field.label}`}
                          </option>
                          {(action.id === 'create-employee' ? getCreateEmployeeFieldOptions(field, values) : (field.options || []))
                            .map((option) => {
                              const normalizedOption = typeof option === 'string'
                                ? { value: option, label: option }
                                : option;
                              return (
                                <option key={`${field.key}-${normalizedOption.value}`} value={normalizedOption.value}>
                                  {normalizedOption.label}
                                </option>
                              );
                            })}
                        </select>
                      ) : (
                        <input
                          type={field.inputType || 'text'}
                          value={values[field.key] || ''}
                          onChange={(event) => onFieldChange(action.id, field.key, event.target.value)}
                          placeholder={field.placeholder}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white"
                        />
                      )}
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
            <p
              className={`text-sm rounded-lg px-4 py-2.5 ${
                actionState.isError
                  ? 'bg-red-50 text-red-600 border border-red-200'
                  : 'bg-green-50 text-green-700 border border-green-200'
              }`}
            >
              {actionState.message}
            </p>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-3 py-16 text-slate-500">
          <div
            className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600"
            aria-hidden="true"
          />
          <span className="text-sm font-medium leading-none">Loading records...</span>
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
              <div
                key={dataset.key}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden"
                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
              >
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
                  <h2 className="text-sm font-semibold text-slate-700">{dataset.label}</h2>
                  <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
                    {dataset.count ?? rows.length} records
                  </span>
                </div>

                {hasError ? (
                  <p className="px-5 py-4 text-sm text-red-500">{dataset.error}</p>
                ) : previewRows.length === 0 ? (
                  <p className="px-5 py-10 text-sm text-slate-400 text-center">No records found.</p>
                ) : columns.length === 0 ? (
                  <pre className="text-xs text-slate-600 overflow-auto bg-slate-50 m-4 p-3 rounded-lg">
                    {JSON.stringify(previewRows, null, 2)}
                  </pre>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50">
                        <tr>
                          {columns.map((col) => (
                            <th
                              key={col}
                              className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap"
                            >
                              {humanLabel(col)}
                            </th>
                          ))}
                          {hasRowActions && (
                            <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                              Actions
                            </th>
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
                                  {col === 'isActive' || col === 'status' ? (
                                    <StatusBadge value={row[col]} col={col} />
                                  ) : (
                                    formatValue(row[col], col)
                                  )}
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

export default RolePage;
