/**
 * Leaves Management Page
 * Modern leave request and balance management interface
 */

import React, { useState } from 'react';
import { FiCalendar, FiPlus, FiCheck, FiX, FiClock, FiAlert, FiTrendingDown } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';
import bgImage from '../../assets/Background.png';

const Leaves = () => {
  const { colors } = useTheme();
  const [showModal, setShowModal] = useState(false);

  const leaveBalance = [
    {
      type: 'Annual Leave',
      total: 20,
      used: 8,
      available: 12,
      color: 'from-blue-500 to-cyan-500',
      icon: 'annual'
    },
    {
      type: 'Sick Leave',
      total: 12,
      used: 2,
      available: 10,
      color: 'from-red-500 to-pink-500',
      icon: 'sick'
    },
    {
      type: 'Casual Leave',
      total: 8,
      used: 3,
      available: 5,
      color: 'from-yellow-500 to-orange-500',
      icon: 'casual'
    },
    {
      type: 'Maternity Leave',
      total: 90,
      used: 0,
      available: 90,
      color: 'from-purple-500 to-pink-500',
      icon: 'maternity'
    }
  ];

  const leaveRequests = [
    {
      id: 1,
      type: 'Annual Leave',
      startDate: '2026-03-15',
      endDate: '2026-03-20',
      days: 6,
      reason: 'Family vacation',
      status: 'approved',
      approvedBy: 'John Manager'
    },
    {
      id: 2,
      type: 'Casual Leave',
      startDate: '2026-03-10',
      endDate: '2026-03-10',
      days: 1,
      reason: 'Personal work',
      status: 'pending',
      approvedBy: '-'
    },
    {
      id: 3,
      type: 'Sick Leave',
      startDate: '2026-02-28',
      endDate: '2026-02-28',
      days: 1,
      reason: 'Medical appointment',
      status: 'approved',
      approvedBy: 'John Manager'
    }
  ];

  const statusColors = {
    approved: 'from-green-500 to-emerald-500',
    pending: 'from-yellow-500 to-orange-500',
    rejected: 'from-red-500 to-pink-500'
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed p-6 md:p-8"
      style={{ backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.94), rgba(255, 255, 255, 0.94)), url(${bgImage})` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className={`text-4xl font-bold ${colors.text.primary} mb-2 flex items-center gap-3`}>
            <FiCalendar className="w-10 h-10" /> Leaves
          </h1>
          <p className={colors.text.tertiary}>Manage your leave requests and balance</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg flex items-center gap-2"
        >
          <FiPlus size={20} /> Request Leave
        </button>
      </div>

      {/* Leave Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {leaveBalance.map((leave, idx) => {
          const percentage = (leave.used / leave.total) * 100;
          return (
            <div
              key={idx}
              className={`group glass rounded-2xl border p-6 hover:border-slate-600 transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-1`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className={`${colors.text.secondary} font-semibold text-sm`}>{leave.type}</h3>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className={`w-full h-3 ${colors.bg.tertiary} rounded-full overflow-hidden mb-2`}>
                  <div
                    className={`h-full bg-gradient-to-r ${leave.color} rounded-full transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <p className={`${colors.text.tertiary} text-xs`}>
                  {leave.used} of {leave.total} used
                </p>
              </div>

              {/* Available Days */}
              <div className="bg-slate-700/30 border border-slate-700/50 rounded-lg p-3">
                <p className={`${colors.text.tertiary} text-xs mb-1`}>Available</p>
                <p className={`text-2xl font-bold bg-gradient-to-r ${leave.color} bg-clip-text text-transparent`}>
                  {leave.available}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Leave Requests Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 mb-8">
        <div className={`glass rounded-2xl border p-8 max-w-md w-full shadow-2xl`}>
            <h2 className={`text-2xl font-bold ${colors.text.primary} mb-6`}>Request Leave</h2>

            <form className="space-y-4">
              <div>
                <label className={`block ${colors.text.primary} font-medium mb-2 text-sm`}>Leave Type</label>
                <select className={`w-full px-4 py-3 bg-slate-700/50 border ${colors.border.secondary} rounded-lg ${colors.text.primary} focus:outline-none focus:border-blue-500 transition-all duration-300`}>
                  <option className="bg-slate-800">Select leave type</option>
                  <option className="bg-slate-800">Annual Leave</option>
                  <option className="bg-slate-800">Sick Leave</option>
                  <option className="bg-slate-800">Casual Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block ${colors.text.primary} font-medium mb-2 text-sm`}>Start Date</label>
                  <input type="date" className={`w-full px-4 py-3 bg-slate-700/50 border ${colors.border.secondary} rounded-lg ${colors.text.primary} focus:outline-none focus:border-blue-500`} />
                </div>
                <div>
                  <label className={`block ${colors.text.primary} font-medium mb-2 text-sm`}>End Date</label>
                  <input type="date" className={`w-full px-4 py-3 bg-slate-700/50 border ${colors.border.secondary} rounded-lg ${colors.text.primary} focus:outline-none focus:border-blue-500`} />
                </div>
              </div>

              <div>
                <label className={`block ${colors.text.primary} font-medium mb-2 text-sm`}>Reason</label>
                <textarea rows="3" className={`w-full px-4 py-3 bg-slate-700/50 border ${colors.border.secondary} rounded-lg ${colors.text.primary} focus:outline-none focus:border-blue-500`} placeholder="Enter reason..."></textarea>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors duration-300 font-medium">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all duration-300 font-medium">
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Leave Requests */}
      <div className={`glass rounded-2xl border p-6 hover:border-slate-600 transition-all duration-300`}>
        <h2 className={`text-2xl font-bold ${colors.text.primary} mb-6`}>Leave Requests</h2>

        <div className="space-y-4">
          {leaveRequests.map((request) => (
            <div
              key={request.id}
              className="bg-slate-700/30 border border-slate-700/50 rounded-xl p-5 hover:bg-slate-700/50 transition-colors duration-300"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className={`${colors.text.primary} font-semibold`}>{request.type}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${statusColors[request.status]} ${colors.text.primary}`}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                  </div>
                  <p className={`${colors.text.tertiary} text-sm mb-2`}>{request.reason}</p>
                  <div className={`flex items-center gap-4 ${colors.text.tertiary} text-xs`}>
                    <span className="flex items-center gap-1">
                      <FiCalendar size={14} />
                      {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <FiClock size={14} />
                      {request.days} day{request.days > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>

              {request.status === 'pending' && (
                <div className="flex gap-2 pt-3 border-t border-slate-700/50">
                  <button className="flex-1 py-2 px-3 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors duration-300 text-sm font-medium flex items-center justify-center gap-2">
                    <FiCheck size={16} /> Approve
                  </button>
                  <button className="flex-1 py-2 px-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors duration-300 text-sm font-medium flex items-center justify-center gap-2">
                    <FiX size={16} /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Leaves;
