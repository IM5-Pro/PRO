/**
 * LeavesAttendance Component
 * Comprehensive leave and attendance management interface
 * Features: Leave requests, attendance tracking, approval workflows, reports
 * API-integrated with real-time data, proper error handling & caching
 * 
 * @component
 * @author HR Team
 * @version 3.0.0 (API Integrated)
 * @example
 * <LeavesAttendance user={currentUser} pageConfig={pageConfig} />
 */

import React, { useMemo, useCallback, useState } from 'react';
import { FiCalendar, FiCheckCircle, FiClock, FiAlertCircle, FiRefreshCw, FiX, FiPlus } from 'react-icons/fi';
import { useAuth } from '../../../context/AuthContext';
import { normalizeRole, ROLES } from '../../../utils/roles';
import {
  useLeavesAttendanceDashboard,
  useLeaveActions,
  useCreateLeaveRequest,
} from '../../../hooks/useLeavesAttendance';

/**
 * LeavesAttendance Component
 * Full-featured interface for managing leaves and attendance with API integration
 * 
 * @param {Object} props - Component props
 * @param {Object} props.user - Current user object (optional, uses AuthContext)
 * @param {Object} props.pageConfig - Page configuration
 * @param {Function} props.onUserUpdate - Callback for user updates
 * @param {string} props.defaultTab - Initial tab to display
 * @returns {JSX.Element} Leaves and attendance management interface
 */

const LeavesAttendance = ({
  user: propsUser = null,
  pageConfig = {},
  onUserUpdate = () => {},
  defaultTab = 'overview',
}) => {
  const { user: contextUser } = useAuth();
  const currentUser = propsUser || contextUser;
  const userRole = normalizeRole(currentUser?.role);

  const [activeTab, setActiveTab] = useState(defaultTab);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [formValues, setFormValues] = useState({
    leaveTypeId: '',
    startDate: '',
    endDate: '',
    reason: '',
  });
  const [formError, setFormError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // ============================================================================
  // API HOOKS & DATA FETCHING
  // ============================================================================

  // Fetch all dashboard data
  const dashboardData = useLeavesAttendanceDashboard(userRole, { cacheEnabled: true });

  // Individual hooks for specific operations
  const leaveActions = useLeaveActions();
  const createLeaveForm = useCreateLeaveRequest();

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const canApproveOrReject = useMemo(() => {
    return userRole === ROLES.MANAGER || userRole === ROLES.HR_ADMIN || userRole === ROLES.SUPER_ADMIN;
  }, [userRole]);

  const leaveTypeOptions = useMemo(() => {
    return dashboardData.leavePolicies.map((policy) => ({
      id: policy.id,
      name: policy.name,
    }));
  }, [dashboardData.leavePolicies]);

  const overviewStats = useMemo(() => {
    const totalUsed = dashboardData.leaveBalance.reduce((sum, lb) => sum + lb.used, 0);
    const totalApproved = dashboardData.leaveRequests.filter(
      (lr) => lr.status === 'approved'
    ).length;
    const totalPending = dashboardData.leaveRequests.filter(
      (lr) => lr.status === 'pending'
    ).length;
    const attendanceRate = dashboardData.monthlySummary?.attendanceRate || 0;

    return [
      {
        title: 'Total Leave Used',
        value: String(totalUsed),
        icon: FiCalendar,
        color: 'from-blue-500 to-cyan-500',
      },
      {
        title: 'Pending Approvals',
        value: String(totalPending),
        icon: FiClock,
        color: 'from-yellow-500 to-orange-500',
      },
      {
        title: 'Approved Leaves',
        value: String(totalApproved),
        icon: FiCheckCircle,
        color: 'from-green-500 to-emerald-500',
      },
      {
        title: 'Attendance Rate',
        value: `${attendanceRate}%`,
        icon: FiAlertCircle,
        color: 'from-purple-500 to-pink-500',
      },
    ];
  }, [dashboardData.leaveBalance, dashboardData.leaveRequests, dashboardData.monthlySummary]);

  // ============================================================================
  // VALIDATION FUNCTIONS
  // ============================================================================

  /**
   * Validate leave request form data
   */
  const validateLeaveForm = useCallback((data) => {
    if (!data.leaveTypeId) {
      return 'Please select a leave type';
    }

    if (!data.startDate) {
      return 'Please select a start date';
    }

    if (!data.endDate) {
      return 'Please select an end date';
    }

    if (new Date(data.startDate) > new Date(data.endDate)) {
      return 'Start date must be before or equal to end date';
    }

    if (!data.reason || data.reason.trim().length === 0) {
      return 'Please provide a reason for leave';
    }

    return '';
  }, []);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleFormChange = useCallback((field) => (e) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  }, []);

  const handleSubmitLeaveRequest = useCallback(
    async (e) => {
      e.preventDefault();
      setFormError('');
      setActionSuccess('');

      const validationError = validateLeaveForm(formValues);
      if (validationError) {
        setFormError(validationError);
        return;
      }

      const result = await createLeaveForm.submit(formValues);

      if (result.error) {
        setFormError(result.error);
      } else {
        setActionSuccess('Leave request submitted successfully.');
        setShowLeaveForm(false);
        setFormValues({
          leaveTypeId: '',
          startDate: '',
          endDate: '',
          reason: '',
        });
        // Refresh data
        dashboardData.refetch();
      }
    },
    [formValues, validateLeaveForm, createLeaveForm, dashboardData]
  );

  const handleApproveLeave = useCallback(
    async (requestId) => {
      setActionLoading(requestId);
      setActionError('');
      setActionSuccess('');

      const result = await leaveActions.approve(requestId);

      if (result.error) {
        setActionError(result.error);
      } else {
        setActionSuccess('Leave request approved successfully.');
        // Refresh data
        dashboardData.refetch();
      }

      setActionLoading(null);
    },
    [leaveActions, dashboardData]
  );

  const handleRejectLeave = useCallback(
    async (requestId) => {
      setActionLoading(requestId);
      setActionError('');
      setActionSuccess('');

      const result = await leaveActions.reject(requestId);

      if (result.error) {
        setActionError(result.error);
      } else {
        setActionSuccess('Leave request rejected successfully.');
        // Refresh data
        dashboardData.refetch();
      }

      setActionLoading(null);
    },
    [leaveActions, dashboardData]
  );

  const handleCancelLeave = useCallback(
    async (requestId) => {
      setActionLoading(requestId);
      setActionError('');
      setActionSuccess('');

      const result = await leaveActions.cancel(requestId);

      if (result.error) {
        setActionError(result.error);
      } else {
        setActionSuccess('Leave request cancelled successfully.');
        // Refresh data
        dashboardData.refetch();
      }

      setActionLoading(null);
    },
    [leaveActions, dashboardData]
  );

  // ============================================================================
  // COMPONENT RENDER
  // ============================================================================

  // Loading state
  if (dashboardData.loading) {
    return (
      <div className="min-h-screen bg-transparent p-6 md:p-8">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin mb-4 flex justify-center">
              <FiRefreshCw className="w-8 h-8 text-blue-500" />
            </div>
            <p className="text-slate-600 font-medium">Loading leaves & attendance data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent p-6 md:p-8">
      {/* Header */}
      <div className="rounded-2xl p-6 mb-6 bg-white border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-1 flex items-center gap-3">
              📅 Leaves & Attendance
            </h1>
            <p className="text-slate-500 text-sm">Manage leaves and track attendance records</p>
          </div>
          {activeTab === 'requests' && (
            <button
              onClick={() => {
                setShowLeaveForm(!showLeaveForm);
                setFormError('');
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg flex items-center gap-2 transition-all"
            >
              <FiPlus size={18} /> New Request
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border border-slate-200 rounded-2xl mb-6 p-2 flex gap-1">
        {['overview', 'requests', 'attendance', 'balance'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
              activeTab === tab
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Error Messages */}
      {actionError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <p className="text-red-700">{actionError}</p>
          <button onClick={() => setActionError('')}>
            <FiX className="text-red-500" />
          </button>
        </div>
      )}

      {actionSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
          <p className="text-green-700">{actionSuccess}</p>
          <button onClick={() => setActionSuccess('')}>
            <FiX className="text-green-600" />
          </button>
        </div>
      )}

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {overviewStats.map((stat, idx) => {
              const IconComponent = stat.icon;
              return (
                <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} text-white`}>
                      <IconComponent size={24} />
                    </div>
                  </div>
                  <p className="text-slate-500 text-sm font-medium mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-slate-800">{stat.value}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Requests Tab */}
      {activeTab === 'requests' && (
        <>
          {/* Leave Request Form */}
          {showLeaveForm && (
            <div className="mb-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4">New Leave Request</h3>
              {formError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {formError}
                </div>
              )}
              <form onSubmit={handleSubmitLeaveRequest} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Leave Type *
                    </label>
                    <select
                      value={formValues.leaveTypeId}
                      onChange={handleFormChange('leaveTypeId')}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select leave type</option>
                      {leaveTypeOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={formValues.startDate}
                      onChange={handleFormChange('startDate')}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      End Date *
                    </label>
                    <input
                      type="date"
                      value={formValues.endDate}
                      onChange={handleFormChange('endDate')}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Reason *
                    </label>
                    <input
                      type="text"
                      value={formValues.reason}
                      onChange={handleFormChange('reason')}
                      placeholder="Enter reason"
                      maxLength={100}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <button
                    type="submit"
                    disabled={createLeaveForm.loading}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg disabled:opacity-50 transition-all"
                  >
                    {createLeaveForm.loading ? 'Submitting...' : 'Submit Request'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowLeaveForm(false);
                      setFormError('');
                    }}
                    className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Leave Requests List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Leave Requests</h2>
            {dashboardData.leaveRequests.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No leave requests found</p>
            ) : (
              <div className="space-y-4">
                {dashboardData.leaveRequests.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-all"
                  >
                    <div className="flex-1">
                      <p className="text-slate-800 font-semibold">{req.employeeName}</p>
                      <p className="text-slate-500 text-sm">
                        {req.type} • {req.startDate} to {req.endDate} ({req.days} days)
                      </p>
                      <p className="text-slate-400 text-xs mt-1">{req.reason}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          req.status === 'approved'
                            ? 'bg-green-100 text-green-700'
                            : req.status === 'pending'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                      </span>
                      {canApproveOrReject && req.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApproveLeave(req.id)}
                            disabled={actionLoading === req.id}
                            className="px-3 py-1 bg-green-600 text-white hover:bg-green-700 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectLeave(req.id)}
                            disabled={actionLoading === req.id}
                            className="px-3 py-1 bg-red-600 text-white hover:bg-red-700 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {req.status === 'pending' && (
                        <button
                          onClick={() => handleCancelLeave(req.id)}
                          disabled={actionLoading === req.id}
                          className="px-3 py-1 bg-slate-400 text-white hover:bg-slate-500 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Attendance Tab */}
      {activeTab === 'attendance' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Attendance Records</h2>
          {dashboardData.attendanceData.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No attendance records found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-slate-500 font-semibold">Date</th>
                    <th className="text-left py-3 px-4 text-slate-500 font-semibold">Check In</th>
                    <th className="text-left py-3 px-4 text-slate-500 font-semibold">Check Out</th>
                    <th className="text-left py-3 px-4 text-slate-500 font-semibold">Status</th>
                    <th className="text-left py-3 px-4 text-slate-500 font-semibold">Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.attendanceData.map((record) => (
                    <tr key={record.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 text-slate-700 font-medium">{record.date}</td>
                      <td className="py-3 px-4 text-slate-600">{record.checkInTime || '-'}</td>
                      <td className="py-3 px-4 text-slate-600">{record.checkOutTime || '-'}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">
                          {record.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-800 font-semibold">{record.workingHours}h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Balance Tab */}
      {activeTab === 'balance' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {dashboardData.leaveBalance.length === 0 ? (
            <p className="text-slate-500 col-span-full text-center py-8">No leave balance data available</p>
          ) : (
            dashboardData.leaveBalance.map((leave) => (
              <div key={leave.leaveTypeId} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4">{leave.type}</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-sm">Total Days:</span>
                    <span className="text-slate-800 font-semibold">{leave.total}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-sm">Used:</span>
                    <span className="text-red-500 font-semibold">{leave.used}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-sm">Available:</span>
                    <span className="text-green-600 font-semibold">{leave.available}</span>
                  </div>
                  <div className="mt-4">
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${leave.color} rounded-full transition-all`}
                        style={{ width: `${leave.percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-1 text-right">{leave.percentage}% used</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default LeavesAttendance;
