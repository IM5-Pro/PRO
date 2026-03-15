/**
 * Employees Management Page
 * View, manage, and organize employees with modern UI
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUsers, FiSearch, FiFilter, FiMail, FiPhone, FiMapPin, FiMoreVertical, FiPlus, FiKey, FiCalendar, FiBriefcase, FiHash, FiUser, FiDollarSign, FiAlertCircle } from 'react-icons/fi';
import API from '../../api/client';
import { EMPLOYEE_ENDPOINTS, USER_ENDPOINTS } from '../../api/endpoints';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { createEmployeeRecord } from '../../services/unifiedDashboardApi';
import { normalizeRole, ROLES } from '../../utils/roles';

const toPayload = (response) => response?.data || {};

const extractRows = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
};

const mapEmployee = (employee, index) => {
  const fullName = [employee?.firstName, employee?.lastName].filter(Boolean).join(' ').trim();

  return {
    id: employee?._id || employee?.id || `employee-${index}`,
    name: fullName || employee?.name || 'Unknown Employee',
    email: employee?.email || 'N/A',
    phone: employee?.phoneNumber || employee?.phone || 'N/A',
    position: employee?.designation || employee?.position || 'Unassigned',
    department: employee?.department || 'Unassigned',
    location: employee?.location || employee?.city || 'N/A',
    avatar: employee?.avatar || '👤',
    status: employee?.isActive === false ? 'inactive' : 'active',
    joinDate: employee?.joinDate || employee?.joiningDate || employee?.dateOfJoining || employee?.createdAt || null,
  };
};

const InfoRow = ({ icon: Icon, value }) => {
  if (!value) return null;
  return (
    <div className="flex items-center gap-3 text-sm text-slate-700">
      <Icon size={15} className="text-slate-400 shrink-0" />
      <span className="break-words min-w-0">{value}</span>
    </div>
  );
};

const Employees = () => {
  const { colors } = useTheme();
  const { user = {} } = useAuth();
  const navigate = useNavigate();
  const role = normalizeRole(user?.role);
  const isManagerView = role === ROLES.MANAGER;
  const canCreateEmployee = role === ROLES.HR_ADMIN || role === ROLES.SUPER_ADMIN;

  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('all');
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');
  const [resetModal, setResetModal] = useState({ open: false, employeeId: null, employeeName: '', loading: false, result: null, error: '' });
  const [copiedTempPassword, setCopiedTempPassword] = useState(false);
  const [profileModal, setProfileModal] = useState({ open: false, loading: false, data: null, error: '' });
  const [managerOptions, setManagerOptions] = useState([]);
  const [managersLoading, setManagersLoading] = useState(false);
  const [managerSearchTerm, setManagerSearchTerm] = useState('');
  const [createForm, setCreateForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    department: '',
    designation: '',
    salary: '',
    joinDate: '',
    managerId: '',
    city: '',
    state: '',
    zipCode: '',
    accountRole: 'EMPLOYEE',
  });

  const resetCreateForm = () => {
    setCreateForm({
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      department: '',
      designation: '',
      salary: '',
      joinDate: '',
      managerId: '',
      city: '',
      state: '',
      zipCode: '',
      accountRole: 'EMPLOYEE',
    });
    setManagerSearchTerm('');
  };

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const endpoint = isManagerView ? EMPLOYEE_ENDPOINTS.myTeam(100) : EMPLOYEE_ENDPOINTS.list(100);
      const response = await API.get(endpoint);
      const payload = toPayload(response);
      const rows = extractRows(payload);
      const mappedEmployees = rows.map((employee, index) => mapEmployee(employee, index));
      setEmployees(mappedEmployees);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || `Failed to load ${isManagerView ? 'team members' : 'employees'}`);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, [isManagerView]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const loadManagers = useCallback(async ({ department = '', search = '' } = {}) => {
    if (!canCreateEmployee) {
      return;
    }

    setManagersLoading(true);
    setCreateError('');
    try {
      const response = await API.get(
        EMPLOYEE_ENDPOINTS.managers({
          limit: 200,
          department: department.trim() || undefined,
          search: search.trim() || undefined,
        })
      );
      const payload = toPayload(response);
      const rows = extractRows(payload);

      const mappedManagers = rows.map((manager) => ({
        id: manager?._id || manager?.id,
        name: [manager?.firstName, manager?.lastName].filter(Boolean).join(' ').trim() || manager?.email || 'Manager',
        designation: manager?.designation || 'Manager',
        department: manager?.department || '',
      }));

      setManagerOptions(mappedManagers.filter((manager) => manager.id));
    } catch (err) {
      setManagerOptions([]);
      setCreateError(err?.response?.data?.message || err?.message || 'Failed to load managers list');
    } finally {
      setManagersLoading(false);
    }
  }, [canCreateEmployee]);

  useEffect(() => {
    if (!showCreateModal || !canCreateEmployee) {
      return;
    }

    const timer = setTimeout(() => {
      loadManagers({
        department: createForm.department,
        search: managerSearchTerm,
      });
    }, 250);

    return () => clearTimeout(timer);
  }, [canCreateEmployee, createForm.department, loadManagers, managerSearchTerm, showCreateModal]);

  useEffect(() => {
    if (!createForm.managerId) {
      return;
    }

    const exists = managerOptions.some((manager) => String(manager.id) === String(createForm.managerId));
    if (!exists) {
      setCreateForm((previous) => ({
        ...previous,
        managerId: '',
      }));
    }
  }, [createForm.managerId, managerOptions]);

  useEffect(() => {
    setCopiedTempPassword(false);
  }, [resetModal.open, resetModal.result]);

  const updateCreateForm = (field) => (event) => {
    setCreateForm((previous) => ({
      ...previous,
      [field]: event.target.value,
    }));
  };

  const handleCreateEmployee = async (event) => {
    event.preventDefault();

    if (!canCreateEmployee) {
      return;
    }

    const normalizedFirstName = createForm.firstName.trim();
    const normalizedLastName = createForm.lastName.trim();
    const normalizedEmail = createForm.email.trim().toLowerCase();
    const normalizedPhone = createForm.phoneNumber.trim();

    if (!normalizedFirstName || normalizedFirstName.length < 2) {
      setCreateError('First name must be at least 2 characters');
      return;
    }

    if (!normalizedLastName || normalizedLastName.length < 2) {
      setCreateError('Last name must be at least 2 characters');
      return;
    }

    if (!/^[A-Za-z0-9._%+-]+@ispace\.com$/i.test(normalizedEmail)) {
      setCreateError('Email must be a valid @ispace.com address');
      return;
    }

    if (normalizedPhone && !/^\d{10}$/.test(normalizedPhone)) {
      setCreateError('Phone number must be 10 digits');
      return;
    }

    try {
      setCreateError('');
      setCreateSuccess('');
      setCreateLoading(true);

      const response = await createEmployeeRecord({
        firstName: normalizedFirstName,
        lastName: normalizedLastName,
        email: normalizedEmail,
        phoneNumber: normalizedPhone,
        department: createForm.department,
        designation: createForm.designation,
        salary: createForm.salary,
        joinDate: createForm.joinDate,
        managerId: createForm.managerId,
        city: createForm.city,
        state: createForm.state,
        zipCode: createForm.zipCode,
        accountRole: createForm.accountRole,
      });
      const message = response?.message || 'Employee and login account created successfully';

      setCreateSuccess(message);
      resetCreateForm();
      await loadEmployees();
      setTimeout(() => {
        setShowCreateModal(false);
        setCreateSuccess('');
      }, 800);
    } catch (err) {
      setCreateError(err?.response?.data?.message || err?.message || 'Failed to create employee');
    } finally {
      setCreateLoading(false);
    }
  };

  const departments = useMemo(() => {
    const uniqueDepartments = [...new Set(employees.map((employee) => employee.department).filter(Boolean))].sort();
    return ['all', ...uniqueDepartments];
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      const matchesSearch =
        employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.position.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDepartment = filterDept === 'all' || employee.department === filterDept;

      return matchesSearch && matchesDepartment;
    });
  }, [employees, filterDept, searchTerm]);

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 md:p-8"
    >
      {/* Header */}
      <div className="glass rounded-2xl p-6 mb-8 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className={`text-4xl font-bold ${colors.text.primary} mb-2 flex items-center gap-3`}>
              <FiUsers className="w-10 h-10" /> {isManagerView ? 'Team' : 'Employees'}
            </h1>
            <p className={colors.text.tertiary}>{isManagerView ? 'View your direct reports with live data' : 'Manage and view all employees'}</p>
          </div>

          {canCreateEmployee && (
            <button
              type="button"
              onClick={() => {
                setCreateError('');
                setCreateSuccess('');
                resetCreateForm();
                setShowCreateModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all duration-200"
            >
              <FiPlus size={18} /> Add Employee
            </button>
          )}
        </div>
      </div>

      {/* Search & Filter */}
      <div className="glass rounded-2xl p-4 mb-8 backdrop-blur-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <FiSearch className="absolute left-4 top-3.5 text-slate-400" size={20} />
            <input
              type="text"
              placeholder={isManagerView ? 'Search team members...' : 'Search employees...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-12 pr-4 py-3 bg-white/10 border ${colors.border.primary} rounded-xl ${colors.text.primary} placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-all duration-300`}
            />
          </div>

          <div className={`flex items-center gap-2 bg-white/10 border ${colors.border.primary} rounded-xl px-4 py-3 hover:border-slate-600 transition-all duration-300`}>
            <FiFilter className="text-slate-400" size={20} />
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className={`bg-transparent ${colors.text.primary} outline-none font-medium flex-1`}
            >
              {departments.map((dept) => (
                <option key={dept} value={dept} className="bg-slate-800">
                  {dept === 'all' ? 'All Departments' : dept}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="glass rounded-2xl p-4 mb-6 border border-red-500/30 bg-red-500/10 text-red-300">
          {error}
        </div>
      )}

      {loading && (
        <div className="glass rounded-2xl p-8 mb-6 text-center text-slate-300">
          {isManagerView ? 'Loading team members...' : 'Loading employees...'}
        </div>
      )}

      {!loading && !error && filteredEmployees.length === 0 && (
        <div className="glass rounded-2xl p-8 mb-6 text-center text-slate-300">
          {isManagerView ? 'No team members found for the selected filters.' : 'No employees found for the selected filters.'}
        </div>
      )}

      {/* Employees Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmployees.map((employee) => (
          <div
            key={employee.id}
            className={`group glass rounded-2xl border ${colors.border.primary} p-6 hover:border-slate-600 transition-all duration-300 hover:shadow-2xl ${colors.shadow} transform hover:-translate-y-1`}
          >
            {/* Avatar & Name */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-3xl">
                  {employee.avatar}
                </div>
                <div>
                  <h3 className={`${colors.text.primary} font-bold text-lg`}>{employee.name}</h3>
                  <p className={colors.text.tertiary}>{employee.position}</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/profile')}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors duration-300"
              >
                <FiMoreVertical className="text-slate-400 hover:text-white" size={20} />
              </button>
            </div>

            {/* Department Badge */}
            <div className="mb-4">
              <span className="inline-block px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full text-xs font-semibold">
                {employee.department}
              </span>
            </div>

            {/* Contact Info */}
            <div className="space-y-3 mb-6">
              <div className={`flex items-center gap-3 ${colors.text.secondary} text-sm`}>
                <FiMail className="text-blue-400" size={16} />
                <span className="truncate">{employee.email}</span>
              </div>
              <div className={`flex items-center gap-3 ${colors.text.secondary} text-sm`}>
                <FiPhone className="text-blue-400" size={16} />
                <span>{employee.phone}</span>
              </div>
              <div className={`flex items-center gap-3 ${colors.text.secondary} text-sm`}>
                <FiMapPin className="text-blue-400" size={16} />
                <span>{employee.location}</span>
              </div>
            </div>

            {/* Divider */}
            <div className={`border-t ${colors.border.primary} my-4`}></div>

            {/* Join Date & Status */}
            <div className="flex items-center justify-between mb-4">
              <p className={`${colors.text.tertiary} text-xs`}>
                Joined {employee.joinDate ? new Date(employee.joinDate).toLocaleDateString() : 'N/A'}
              </p>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${employee.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className={`${employee.status === 'active' ? 'text-green-400' : 'text-red-400'} text-xs font-semibold`}>
                  {employee.status === 'active' ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className={`grid gap-3 ${canCreateEmployee ? 'grid-cols-2' : 'grid-cols-1'}`}>
              <button
                onClick={async () => {
                  setProfileModal({ open: true, loading: true, data: null, error: '' });
                  try {
                    const response = await API.get(EMPLOYEE_ENDPOINTS.profile(employee.id));
                    const data = response.data?.data || response.data;
                    setProfileModal({ open: true, loading: false, data, error: '' });
                  } catch (err) {
                    const msg = err.response?.data?.message || 'Failed to load profile.';
                    setProfileModal({ open: true, loading: false, data: null, error: msg });
                  }
                }}
                className="py-2 px-4 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition-all duration-300 text-sm font-medium"
              >
                View Profile
              </button>
              {canCreateEmployee && (
                <button
                  onClick={() => setResetModal({ open: true, employeeId: employee.id, employeeName: employee.name, loading: false, result: null, error: '' })}
                  className="py-2 px-4 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg transition-all duration-300 text-sm font-medium flex items-center justify-center gap-1"
                >
                  <FiKey size={14} /> Reset Password
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create Employee Modal (HR/Admin only) */}
      {canCreateEmployee && showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 overflow-y-auto">
          <div className="flex min-h-full items-start justify-center p-3 sm:p-4 md:items-center">
            <div className="w-full max-w-3xl max-h-[calc(100vh-1.5rem)] sm:max-h-[calc(100vh-2rem)] bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-4 py-4 sm:px-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Add Employee</h2>
                <p className="text-sm text-slate-600 mt-1">Create a new employee profile and save it to the HRMS database.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateError('');
                  setCreateSuccess('');
                  resetCreateForm();
                }}
                className="text-slate-500 hover:text-slate-700 text-sm font-semibold"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
                {createError && (
                  <div className="rounded-xl border border-red-300 bg-red-50 text-red-700 px-4 py-3 mb-4 break-words">
                    {createError}
                  </div>
                )}

                {createSuccess && (
                  <div className="rounded-xl border border-green-300 bg-green-50 text-green-700 px-4 py-3 mb-4 break-words">
                    {createSuccess}
                  </div>
                )}

                <div className="space-y-4 pb-2">
                  <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 break-words">
                    HRMS will generate a temporary password automatically. Share it with the employee so they can sign in and create their own password on first login.
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={createForm.firstName}
                    onChange={updateCreateForm('firstName')}
                    placeholder="Enter first name"
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={createForm.lastName}
                    onChange={updateCreateForm('lastName')}
                    placeholder="Enter last name"
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Work Email</label>
                  <input
                    type="email"
                    value={createForm.email}
                    onChange={updateCreateForm('email')}
                    placeholder="name@ispace.com"
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={createForm.phoneNumber}
                    onChange={updateCreateForm('phoneNumber')}
                    placeholder="10-digit phone"
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={createForm.department}
                    onChange={updateCreateForm('department')}
                    placeholder="e.g. HR"
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    value={createForm.designation}
                    onChange={updateCreateForm('designation')}
                    placeholder="e.g. Analyst"
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Salary</label>
                  <input
                    type="number"
                    min="0"
                    value={createForm.salary}
                    onChange={updateCreateForm('salary')}
                    placeholder="0"
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                  </div>

                  <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reporting Manager</label>
                <input
                  type="text"
                  value={managerSearchTerm}
                  onChange={(event) => setManagerSearchTerm(event.target.value)}
                  placeholder="Search managers by name, email, or designation"
                  className="w-full mb-2 px-3 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={createForm.managerId}
                  onChange={updateCreateForm('managerId')}
                  disabled={managersLoading}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No manager assigned</option>
                  {managerOptions.map((manager) => (
                    <option key={manager.id} value={manager.id}>
                      {manager.name} - {manager.designation}{manager.department ? ` (${manager.department})` : ''}
                    </option>
                  ))}
                </select>
                {managersLoading && (
                  <p className="text-xs text-slate-500 mt-1">Loading managers...</p>
                )}
                {!managersLoading && managerOptions.length === 0 && (
                  <p className="text-xs text-slate-500 mt-1">No managers found for the selected filters.</p>
                )}
                {createForm.department.trim() && (
                  <p className="text-xs text-slate-500 mt-1">
                    Showing managers in department: <span className="font-semibold">{createForm.department.trim()}</span>
                  </p>
                )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Join Date</label>
                  <input
                    type="date"
                    value={createForm.joinDate}
                    onChange={updateCreateForm('joinDate')}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={createForm.city}
                    onChange={updateCreateForm('city')}
                    placeholder="City"
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    value={createForm.state}
                    onChange={updateCreateForm('state')}
                    placeholder="State"
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                  </div>

                  <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Zip Code</label>
                <input
                  type="text"
                  value={createForm.zipCode}
                  onChange={updateCreateForm('zipCode')}
                  placeholder="Zip code"
                  className="w-full md:w-1/3 px-3 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Account Role</label>
                  <select
                    value={createForm.accountRole}
                    onChange={updateCreateForm('accountRole')}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="EMPLOYEE">Employee</option>
                    <option value="MANAGER">Manager</option>
                    <option value="HR_ADMIN">HR Admin</option>
                    <option value="DEPT_ADMIN">Department Admin</option>
                  </select>
                </div>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 border-t border-slate-200 bg-white px-4 py-4 sm:px-6">
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateError('');
                    setCreateSuccess('');
                    resetCreateForm();
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold"
                >
                  {createLoading ? 'Creating...' : 'Create Employee'}
                </button>
                </div>
              </div>
            </form>
          </div>
          </div>
        </div>
      )}

      {/* View Profile Modal */}
      {profileModal.open && (
        <div className="fixed inset-0 z-50 bg-black/40 overflow-y-auto">
          <div className="flex min-h-full items-start justify-center p-3 sm:p-6 md:items-center">
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[calc(100vh-1.5rem)]">

              {/* Loading */}
              {profileModal.loading && (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mb-3" />
                  <span className="text-sm">Loading...</span>
                </div>
              )}

              {/* Error */}
              {profileModal.error && (
                <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
                  <FiAlertCircle size={32} className="text-red-400 mb-3" />
                  <p className="text-sm text-slate-600">{profileModal.error}</p>
                  <button onClick={() => setProfileModal({ open: false, loading: false, data: null, error: '' })} className="mt-4 text-sm text-blue-600 hover:underline">Close</button>
                </div>
              )}

              {/* Profile Content */}
              {!profileModal.loading && profileModal.data && (() => {
                const emp = profileModal.data;
                const fullName = [emp.firstName, emp.lastName].filter(Boolean).join(' ') || 'Unknown';
                const manager = emp.managerID || emp.managerId || emp.manager;
                const managerName = manager
                  ? [manager.firstName, manager.lastName].filter(Boolean).join(' ') || manager.email
                  : null;
                const location = [emp.city || emp.address?.city, emp.state || emp.address?.state].filter(Boolean).join(', ') || null;
                const joinDate = emp.joinDate || emp.joiningDate;
                const ec = emp.emergencyContact;
                const hasEC = ec?.name || ec?.phone;

                return (
                  <>
                    {/* Hero */}
                    <div className="bg-gradient-to-br from-blue-50 to-slate-50 px-6 pt-8 pb-6 text-center relative">
                      <button
                        onClick={() => setProfileModal({ open: false, loading: false, data: null, error: '' })}
                        className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white/70 rounded-lg transition-colors"
                      >
                        ✕
                      </button>
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-3xl mx-auto mb-3 shadow-sm">
                        👤
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 leading-tight">{fullName}</h3>
                      <p className="text-sm text-blue-600 mt-0.5">{emp.designation || '—'}</p>
                      <div className="flex items-center justify-center gap-2 mt-2">
                        {emp.department && (
                          <span className="text-xs px-2.5 py-0.5 bg-white border border-slate-200 text-slate-600 rounded-full">{emp.department}</span>
                        )}
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                          emp.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {emp.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="overflow-y-auto min-h-0 flex-1 px-6 py-5 space-y-3">
                      {emp.employeeCode && (
                        <InfoRow icon={FiHash} value={emp.employeeCode} />
                      )}
                      <InfoRow icon={FiMail} value={emp.email} />
                      <InfoRow icon={FiPhone} value={emp.phoneNumber || emp.phone} />
                      <InfoRow icon={FiBriefcase} value={managerName ? `Reports to ${managerName}` : null} />
                      <InfoRow icon={FiMapPin} value={location} />
                      <InfoRow icon={FiCalendar} value={joinDate ? `Joined ${new Date(joinDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}` : null} />
                      {canCreateEmployee && emp.salary != null && emp.salary > 0 && (
                        <InfoRow icon={FiDollarSign} value={`₹${Number(emp.salary).toLocaleString()} / month`} />
                      )}

                      {/* Emergency Contact */}
                      {hasEC && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                          <p className="text-xs text-slate-400 font-medium mb-2">Emergency Contact</p>
                          <InfoRow icon={FiUser} value={[ec.name, ec.relation].filter(Boolean).join(' · ')} />
                          <InfoRow icon={FiPhone} value={ec.phone} />
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-3">
                      {canCreateEmployee && (
                        <button
                          onClick={() => {
                            const name = [emp.firstName, emp.lastName].filter(Boolean).join(' ');
                            setProfileModal({ open: false, loading: false, data: null, error: '' });
                            setResetModal({ open: true, employeeId: emp._id || emp.id, employeeName: name, loading: false, result: null, error: '' });
                          }}
                          className="text-xs text-amber-600 hover:text-amber-700 flex items-center gap-1 font-medium"
                        >
                          <FiKey size={13} /> Reset Password
                        </button>
                      )}
                      <button
                        onClick={() => setProfileModal({ open: false, loading: false, data: null, error: '' })}
                        className="ml-auto text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
                      >
                        Done
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetModal.open && (
        <div className="fixed inset-0 z-50 bg-black/50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl">
              <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <FiKey className="text-amber-600" size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Reset Login Password</h2>
                    <p className="text-sm text-slate-500">{resetModal.employeeName}</p>
                  </div>
                </div>
                <button
                  onClick={() => setResetModal({ open: false, employeeId: null, employeeName: '', loading: false, result: null, error: '' })}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  ✕
                </button>
              </div>

              <div className="px-6 py-5">
                {!resetModal.result ? (
                  <>
                    <p className="text-slate-700 text-sm mb-4">
                      This will generate a new temporary password for <strong>{resetModal.employeeName}</strong>. The employee will be required to set a new password on their next login.
                    </p>
                    {resetModal.error && (
                      <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">{resetModal.error}</p>
                    )}
                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                      <button
                        onClick={() => setResetModal({ open: false, employeeId: null, employeeName: '', loading: false, result: null, error: '' })}
                        className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-sm font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        disabled={resetModal.loading}
                        onClick={async () => {
                          setResetModal((prev) => ({ ...prev, loading: true, error: '' }));
                          try {
                            const response = await API.post(USER_ENDPOINTS.resetPassword(resetModal.employeeId));
                            const temporaryPassword =
                              response?.data?.temporaryPassword ||
                              response?.data?.data?.temporaryPassword ||
                              response?.temporaryPassword;

                            if (!temporaryPassword) {
                              throw new Error('Temporary password not returned by server.');
                            }

                            setResetModal((prev) => ({ ...prev, loading: false, result: temporaryPassword }));
                          } catch (err) {
                            const msg = err.response?.data?.message || err.message || 'Failed to reset password. Please try again.';
                            setResetModal((prev) => ({ ...prev, loading: false, error: msg }));
                          }
                        }}
                        className="px-4 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white text-sm font-semibold"
                      >
                        {resetModal.loading ? 'Resetting...' : 'Confirm Reset'}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-slate-700 text-sm mb-3">Password successfully reset. Share this temporary password with the employee:</p>
                    <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 mb-4">
                      <code className="flex-1 text-slate-900 font-mono text-sm break-all">{resetModal.result}</code>
                      <button
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(resetModal.result);
                            setCopiedTempPassword(true);
                            setTimeout(() => {
                              setCopiedTempPassword(false);
                            }, 1500);
                          } catch {
                            setCopiedTempPassword(false);
                          }
                        }}
                        className={`text-xs font-medium whitespace-nowrap ${copiedTempPassword ? 'text-green-600' : 'text-blue-600 hover:text-blue-800'}`}
                      >
                        {copiedTempPassword ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mb-4">The employee will be prompted to change this password on their next login.</p>
                    <div className="flex justify-end">
                      <button
                        onClick={() => setResetModal({ open: false, employeeId: null, employeeName: '', loading: false, result: null, error: '' })}
                        className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold"
                      >
                        Done
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
