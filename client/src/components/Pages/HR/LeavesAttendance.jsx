/**
 * LeavesAttendance Component
 * Comprehensive leave and attendance management interface
 * Features: Leave requests, attendance tracking, approval workflows, reports
 * 
 * @component
 * @author HR Team
 * @version 2.0.0
 * @example
 * <LeavesAttendance user={currentUser} pageConfig={pageConfig} />
 */

import React, { useMemo, useCallback, useState } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { FiCalendar, FiCheckCircle, FiClock, FiAlertCircle } from 'react-icons/fi';

const VALIDATION_RULES = {
  MIN_LEAVE_DAYS: 0.5,
  MAX_LEAVE_DAYS: 365,
  LEAVE_TYPES: ['Casual', 'Sick', 'Earned', 'Maternity', 'Paternity', 'Unpaid'],
};

/**
 * LeavesAttendance Component
 * Full-featured interface for managing leaves and attendance
 * 
 * @param {Object} props - Component props
 * @param {Object} props.user - Current user object
 * @param {Object} props.pageConfig - Page configuration
 * @param {Function} props.onUserUpdate - Callback for user updates
 * @returns {JSX.Element} Leaves and attendance management interface
 */
const LeavesAttendance = ({ user = {}, pageConfig = {}, onUserUpdate = () => {} }) => {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState('overview');

  // ============================================================================
  // MOCKED DATA
  // ============================================================================
  const leaveBalance = useMemo(
    () => [
      { type: 'Casual', total: 12, used: 3, available: 9, color: 'from-blue-500 to-cyan-500' },
      { type: 'Sick', total: 10, used: 2, available: 8, color: 'from-yellow-500 to-orange-500' },
      { type: 'Earned', total: 20, used: 5, available: 15, color: 'from-green-500 to-emerald-500' },
      { type: 'Maternity', total: 90, used: 0, available: 90, color: 'from-pink-500 to-rose-500' },
    ],
    []
  );

  const leaveRequests = useMemo(
    () => [
      {
        id: 1,
        employee: 'Rajesh Kumar',
        leaveType: 'Casual',
        from: '2024-03-15',
        to: '2024-03-17',
        days: 3,
        status: 'Pending',
        reason: 'Personal work',
      },
      {
        id: 2,
        employee: 'Priya Singh',
        leaveType: 'Sick',
        from: '2024-03-10',
        to: '2024-03-11',
        days: 2,
        status: 'Approved',
        reason: 'Medical appointment',
      },
      {
        id: 3,
        employee: 'Amit Patel',
        leaveType: 'Earned',
        from: '2024-03-20',
        to: '2024-03-24',
        days: 5,
        status: 'Pending',
        reason: 'Family trip',
      },
    ],
    []
  );

  const attendanceStats = useMemo(
    () => [
      { month: 'March', presentDays: 18, absentDays: 2, wfhDays: 5, attendance: 90 },
      { month: 'February', presentDays: 20, absentDays: 1, wfhDays: 4, attendance: 95 },
      { month: 'January', presentDays: 19, absentDays: 1, wfhDays: 5, attendance: 92 },
    ],
    []
  );

  // ============================================================================
  // VALIDATION FUNCTIONS
  // ============================================================================

  /**
   * Validate leave request data
   */
  const validateLeaveRequest = useCallback((leaveData) => {
    const errors = [];

    if (!leaveData.leaveType || !VALIDATION_RULES.LEAVE_TYPES.includes(leaveData.leaveType)) {
      errors.push('Invalid leave type selected');
    }

    if (leaveData.days < VALIDATION_RULES.MIN_LEAVE_DAYS) {
      errors.push('Minimum leave duration is 0.5 days');
    }

    if (leaveData.days > VALIDATION_RULES.MAX_LEAVE_DAYS) {
      errors.push('Leave duration cannot exceed 365 days');
    }

    if (!leaveData.reason || leaveData.reason.trim().length === 0) {
      errors.push('Please provide a reason for leave');
    }

    return { isValid: errors.length === 0, errors };
  }, []);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Handle leave approval
   */
  const handleApproveLeave = useCallback((requestId) => {
    console.log('Approving leave:', requestId);
    // TODO: Implement actual API call
  }, []);

  /**
   * Handle leave rejection
   */
  const handleRejectLeave = useCallback((requestId) => {
    console.log('Rejecting leave:', requestId);
    // TODO: Implement actual API call
  }, []);

  // ============================================================================
  // COMPONENT RENDER
  // ============================================================================

  return (
    <div className={`min-h-screen bg-gradient-to-br ${colors.gradient.primary} p-6 md:p-8`}>
      {/* Header */}
      <div className="mb-8">
        <h1 className={`text-4xl font-bold ${colors.text.primary} mb-2 flex items-center gap-3`}>
          📅 Leaves & Attendance
        </h1>
        <p className={colors.text.tertiary}>Manage leaves and track attendance records</p>
      </div>

      {/* Tab Navigation */}
      <div className={`bg-gradient-to-br ${colors.gradient.card} rounded-2xl border-2 ${colors.border.primary} mb-8 p-2 flex gap-2`}>
        {['overview', 'requests', 'attendance', 'balance'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2 rounded-lg font-semibold transition-all duration-300 ${
              activeTab === tab
                ? 'bg-blue-600 text-white'
                : `${colors.text.tertiary} hover:${colors.text.primary} hover:bg-slate-700/50`
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Total Leave Used', value: '10', icon: <FiCalendar />, color: 'from-blue-500 to-cyan-500' },
              { title: 'Pending Approvals', value: '2', icon: <FiClock />, color: 'from-yellow-500 to-orange-500' },
              { title: 'Approved Leaves', value: '25', icon: <FiCheckCircle />, color: 'from-green-500 to-emerald-500' },
              { title: 'Attendance Rate', value: '92%', icon: <FiAlertCircle />, color: 'from-purple-500 to-pink-500' },
            ].map((stat, idx) => (
              <div
                key={idx}
                className={`bg-gradient-to-br ${colors.gradient.card} rounded-2xl border-2 ${colors.border.primary} p-6`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} text-white`}>
                    {stat.icon}
                  </div>
                </div>
                <p className={`${colors.text.tertiary} text-sm font-medium mb-1`}>{stat.title}</p>
                <p className={`text-3xl font-bold ${colors.text.primary}`}>{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Requests Tab */}
      {activeTab === 'requests' && (
        <div className={`bg-gradient-to-br ${colors.gradient.card} rounded-2xl border-2 ${colors.border.primary} p-6`}>
          <h2 className={`text-2xl font-bold ${colors.text.primary} mb-6`}>Leave Requests</h2>
          <div className="space-y-4">
            {leaveRequests.map((req) => (
              <div
                key={req.id}
                className={`flex items-center justify-between p-4 ${colors.bg.tertiary}/30 border ${colors.border.secondary} rounded-xl hover:${colors.bg.tertiary}/50 transition-all`}
              >
                <div className="flex-1">
                  <p className={`${colors.text.primary} font-semibold`}>{req.employee}</p>
                  <p className={`${colors.text.tertiary} text-sm`}>
                    {req.leaveType} • {req.from} to {req.to} ({req.days} days)
                  </p>
                  <p className={`${colors.text.muted} text-xs mt-1`}>{req.reason}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded text-xs font-medium ${
                      req.status === 'Approved'
                        ? 'bg-green-600/20 text-green-300'
                        : req.status === 'Pending'
                        ? 'bg-yellow-600/20 text-yellow-300'
                        : 'bg-red-600/20 text-red-300'
                    }`}
                  >
                    {req.status}
                  </span>
                  {req.status === 'Pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveLeave(req.id)}
                        className="px-3 py-1 bg-green-600/20 text-green-300 hover:bg-green-600/40 rounded text-xs font-medium transition-all"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectLeave(req.id)}
                        className="px-3 py-1 bg-red-600/20 text-red-300 hover:bg-red-600/40 rounded text-xs font-medium transition-all"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attendance Tab */}
      {activeTab === 'attendance' && (
        <div className={`bg-gradient-to-br ${colors.gradient.card} rounded-2xl border-2 ${colors.border.primary} p-6`}>
          <h2 className={`text-2xl font-bold ${colors.text.primary} mb-6`}>Attendance Summary</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${colors.border.secondary}`}>
                  <th className={`text-left py-3 px-4 ${colors.text.tertiary} font-semibold text-sm`}>Month</th>
                  <th className={`text-left py-3 px-4 ${colors.text.tertiary} font-semibold text-sm`}>Present</th>
                  <th className={`text-left py-3 px-4 ${colors.text.tertiary} font-semibold text-sm`}>Absent</th>
                  <th className={`text-left py-3 px-4 ${colors.text.tertiary} font-semibold text-sm`}>WFH</th>
                  <th className={`text-left py-3 px-4 ${colors.text.tertiary} font-semibold text-sm`}>Rate</th>
                </tr>
              </thead>
              <tbody>
                {attendanceStats.map((stat) => (
                  <tr key={stat.month} className={`border-b ${colors.border.secondary}`}>
                    <td className={`py-3 px-4 ${colors.text.primary}`}>{stat.month}</td>
                    <td className={`py-3 px-4 text-green-400`}>{stat.presentDays}</td>
                    <td className={`py-3 px-4 text-red-400`}>{stat.absentDays}</td>
                    <td className={`py-3 px-4 text-blue-400`}>{stat.wfhDays}</td>
                    <td className={`py-3 px-4 ${colors.text.primary} font-semibold`}>{stat.attendance}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Balance Tab */}
      {activeTab === 'balance' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {leaveBalance.map((leave) => (
            <div
              key={leave.type}
              className={`bg-gradient-to-br ${colors.gradient.card} rounded-2xl border-2 ${colors.border.primary} p-6`}
            >
              <h3 className={`text-xl font-bold ${colors.text.primary} mb-4`}>{leave.type} Leave</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className={colors.text.tertiary}>Total Days:</span>
                  <span className={`${colors.text.primary} font-semibold`}>{leave.total}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={colors.text.tertiary}>Used:</span>
                  <span className="text-red-400 font-semibold">{leave.used}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={colors.text.tertiary}>Available:</span>
                  <span className="text-green-400 font-semibold">{leave.available}</span>
                </div>
                <div className="mt-4">
                  <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${leave.color}`}
                      style={{ width: `${(leave.used / leave.total) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LeavesAttendance;
