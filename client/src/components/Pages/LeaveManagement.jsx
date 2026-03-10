/**
 * LeaveManagement Page
 * Manage and track leave requests
 */

import React, { useState } from 'react';
import { FiCalendar, FiPlus, FiX } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';
import bgImage from '../../assets/Background.png';

const LeaveManagement = () => {
  const { colors } = useTheme();
  const [showModal, setShowModal] = useState(false);
  const [leaveType, setLeaveType] = useState('annual');

  const leaveBalance = [
    { type: 'Annual Leave', total: 20, used: 8, available: 12, color: 'from-blue-500 to-cyan-500' },
    { type: 'Sick Leave', total: 10, used: 2, available: 8, color: 'from-red-500 to-pink-500' },
    { type: 'Casual Leave', total: 5, used: 3, available: 2, color: 'from-yellow-500 to-orange-500' },
    { type: 'Maternity Leave', total: 90, used: 0, available: 90, color: 'from-purple-500 to-pink-500' }
  ];

  const leaveRequests = [
    { id: 1, type: 'Annual Leave', reason: 'Vacation', start: '2024-12-20', end: '2024-12-25', days: 6, status: 'Approved', icon: '✅' },
    { id: 2, type: 'Sick Leave', reason: 'Medical checkup', start: '2024-12-10', end: '2024-12-10', days: 1, status: 'Pending', icon: '⏳' },
    { id: 3, type: 'Casual Leave', reason: 'Personal work', start: '2024-12-15', end: '2024-12-15', days: 1, status: 'Approved', icon: '✅' }
  ];

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed p-6 md:p-8"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className={`text-4xl font-bold ${colors.text.primary} mb-2 flex items-center gap-3`}>
            <FiCalendar className="w-10 h-10" /> Leave Management
          </h1>
          <p className={colors.text.tertiary}>Request and track your leave</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center gap-2"
        >
          <FiPlus size={20} /> Request Leave
        </button>
      </div>

      {/* Leave Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {leaveBalance.map((leave, idx) => (
          <div
            key={idx}
            className={`group bg-gradient-to-br ${colors.gradient.card} rounded-2xl border ${colors.border.primary} p-6 hover:border-slate-600 transition-all duration-300 hover:shadow-2xl ${colors.shadow} transform hover:-translate-y-1`}
          >
            <p className={`${colors.text.tertiary} text-sm font-medium mb-4`}>{leave.type}</p>

            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <span className={`${colors.text.primary} font-semibold`}>{leave.used} used</span>
                <span className="text-green-400 font-semibold">{leave.available} available</span>
              </div>
              <div className={`w-full h-3 ${colors.bg.tertiary} rounded-full overflow-hidden`}>
                <div
                  className={`h-full bg-gradient-to-r ${leave.color} rounded-full`}
                  style={{ width: `${(leave.used / leave.total) * 100}%` }}
                ></div>
              </div>
            </div>

            <p className={`${colors.text.tertiary} text-xs`}>Total: {leave.total} days</p>
          </div>
        ))}
      </div>

      {/* Leave Requests */}
      <div className={`bg-gradient-to-br ${colors.gradient.card} rounded-2xl border ${colors.border.primary} p-6 hover:border-slate-600 transition-all`}>
        <h2 className={`text-2xl font-bold ${colors.text.primary} mb-6`}>Leave Requests</h2>

        <div className="space-y-4">
          {leaveRequests.map((request) => (
            <div
              key={request.id}
              className="flex items-center justify-between p-4 bg-slate-700/30 border border-slate-700/50 rounded-xl hover:border-slate-600 hover:bg-slate-700/50 transition-all"
            >
              <div className="flex items-center gap-4 flex-1">
                <span className="text-2xl">{request.icon}</span>
                <div className="flex-1">
                  <p className={`${colors.text.primary} font-semibold`}>{request.type}</p>
                  <p className={`${colors.text.tertiary} text-sm`}>{request.reason}</p>
                  <p className={`${colors.text.muted} text-xs mt-1`}>{request.start} to {request.end} • {request.days} day(s)</p>
                </div>
              </div>

              <span className={`px-4 py-2 rounded-lg font-semibold text-sm ${
                request.status === 'Approved'
                  ? 'bg-green-500/20 text-green-400'
                  : request.status === 'Pending'
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {request.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`bg-gradient-to-br ${colors.gradient.card} rounded-2xl border ${colors.border.primary} p-8 max-w-md w-full`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-2xl font-bold ${colors.text.primary}`}>Request Leave</h3>
              <button onClick={() => setShowModal(false)} className={`${colors.text.tertiary} hover:${colors.text.primary} transition-colors`}>
                <FiX size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block ${colors.text.secondary} text-sm font-medium mb-2`}>Leave Type</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className={`w-full px-4 py-2 bg-slate-700/50 border ${colors.border.secondary} ${colors.text.primary} rounded-lg focus:border-blue-500 focus:outline-none transition-colors`}
                >
                  <option value="annual">Annual Leave</option>
                  <option value="sick">Sick Leave</option>
                  <option value="casual">Casual Leave</option>
                </select>
              </div>

              <div>
                <label className={`block ${colors.text.secondary} text-sm font-medium mb-2`}>Start Date</label>
                <input type="date" className={`w-full px-4 py-2 bg-slate-700/50 border ${colors.border.secondary} ${colors.text.primary} rounded-lg focus:border-blue-500 focus:outline-none transition-colors`} />
              </div>

              <div>
                <label className={`block ${colors.text.secondary} text-sm font-medium mb-2`}>End Date</label>
                <input type="date" className={`w-full px-4 py-2 bg-slate-700/50 border ${colors.border.secondary} ${colors.text.primary} rounded-lg focus:border-blue-500 focus:outline-none transition-colors`} />
              </div>

              <div>
                <label className={`block ${colors.text.secondary} text-sm font-medium mb-2`}>Reason</label>
                <textarea
                  placeholder="Enter reason for leave"
                  className={`w-full px-4 py-2 bg-slate-700/50 border ${colors.border.secondary} ${colors.text.primary} rounded-lg focus:border-blue-500 focus:outline-none transition-colors resize-none`}
                  rows="3"
                ></textarea>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className={`flex-1 px-4 py-2 bg-slate-700/50 border ${colors.border.secondary} ${colors.text.primary} rounded-lg hover:bg-slate-700 transition-colors font-medium`}
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all transform hover:scale-105 active:scale-95 font-medium"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveManagement;
