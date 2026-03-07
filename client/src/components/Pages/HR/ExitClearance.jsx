/**
 * ExitClearance Component
 * Exit clearance management and employee separation process
 * Features: Exit requests, clearance checklists, final settlement, compliance
 * 
 * @component
 * @author HR Team
 * @version 2.0.0
 */

import React, { useMemo, useState } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { FiCheckCircle, FiClock, FiAlertCircle } from 'react-icons/fi';

const ExitClearance = ({ user = {}, pageConfig = {}, onUserUpdate = () => {} }) => {
  const { colors } = useTheme();
  const [selectedStatus, setSelectedStatus] = useState('all');

  const exitRequests = useMemo(
    () => [
      {
        id: 1,
        employee: 'John Doe',
        department: 'IT',
        exitDate: '2024-04-15',
        status: 'Pending',
        reason: 'Career change',
        checklist: { it: true, finance: false, hr: true, admin: false },
      },
      {
        id: 2,
        employee: 'Jane Smith',
        department: 'HR',
        exitDate: '2024-03-30',
        status: 'Completed',
        reason: 'Higher education',
        checklist: { it: true, finance: true, hr: true, admin: true },
      },
      {
        id: 3,
        employee: 'Mike Johnson',
        department: 'Finance',
        exitDate: '2024-04-20',
        status: 'In Progress',
        reason: 'Relocation',
        checklist: { it: true, finance: true, hr: false, admin: false },
      },
    ],
    []
  );

  const filteredRequests = useMemo(
    () =>
      selectedStatus === 'all'
        ? exitRequests
        : exitRequests.filter((req) => req.status.toLowerCase() === selectedStatus.toLowerCase()),
    [exitRequests, selectedStatus]
  );

  return (
    <div className={`min-h-screen bg-gradient-to-br ${colors.gradient.primary} p-6 md:p-8`}>
      {/* Header */}
      <div className="mb-8">
        <h1 className={`text-4xl font-bold ${colors.text.primary} mb-2 flex items-center gap-3`}>
          🚪 Exit Clearance Department
        </h1>
        <p className={colors.text.tertiary}>Manage employee separation and exit clearance</p>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { label: 'Pending', value: exitRequests.filter((r) => r.status === 'Pending').length, icon: <FiClock />, color: 'from-yellow-500 to-orange-500' },
          { label: 'In Progress', value: exitRequests.filter((r) => r.status === 'In Progress').length, icon: <FiAlertCircle />, color: 'from-blue-500 to-cyan-500' },
          { label: 'Completed', value: exitRequests.filter((r) => r.status === 'Completed').length, icon: <FiCheckCircle />, color: 'from-green-500 to-emerald-500' },
        ].map((stat, idx) => (
          <div key={idx} className={`bg-gradient-to-br ${colors.gradient.card} rounded-2xl border-2 ${colors.border.primary} p-6`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${colors.text.tertiary} text-sm`}>{stat.label}</p>
                <p className={`${colors.text.primary} text-3xl font-bold mt-2`}>{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} text-white`}>{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className={`bg-gradient-to-br ${colors.gradient.card} rounded-2xl border-2 ${colors.border.primary} mb-8 p-2 flex gap-2`}>
        {['all', 'pending', 'in progress', 'completed'].map((status) => (
          <button
            key={status}
            onClick={() => setSelectedStatus(status)}
            className={`px-6 py-2 rounded-lg font-semibold transition-all duration-300 capitalize ${
              selectedStatus === status
                ? 'bg-blue-600 text-white'
                : `${colors.text.tertiary} hover:${colors.text.primary} hover:bg-slate-700/50`
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Exit Requests */}
      <div className="space-y-4">
        {filteredRequests.map((req) => (
          <div key={req.id} className={`bg-gradient-to-br ${colors.gradient.card} rounded-2xl border-2 ${colors.border.primary} p-6`}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className={`text-xl font-bold ${colors.text.primary}`}>{req.employee}</h3>
                <p className={`${colors.text.tertiary} text-sm`}>{req.department} • Exit Date: {req.exitDate}</p>
                <p className={`${colors.text.muted} text-sm mt-1`}>Reason: {req.reason}</p>
              </div>
              <span
                className={`px-3 py-1 rounded text-xs font-medium ${
                  req.status === 'Completed'
                    ? 'bg-green-600/20 text-green-300'
                    : req.status === 'In Progress'
                    ? 'bg-blue-600/20 text-blue-300'
                    : 'bg-yellow-600/20 text-yellow-300'
                }`}
              >
                {req.status}
              </span>
            </div>

            {/* Clearance Checklist */}
            <div className="mt-4 pt-4 border-t border-slate-700">
              <p className={`${colors.text.tertiary} text-sm font-semibold mb-3`}>Clearance Checklist:</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { dept: 'IT', key: 'it' },
                  { dept: 'Finance', key: 'finance' },
                  { dept: 'HR', key: 'hr' },
                  { dept: 'Admin', key: 'admin' },
                ].map((item) => (
                  <div
                    key={item.key}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                      req.checklist[item.key]
                        ? 'bg-green-600/20 text-green-300'
                        : 'bg-slate-700/50 text-slate-400'
                    }`}
                  >
                    <span className="text-sm">{req.checklist[item.key] ? '[✓]' : '[  ]'}</span>
                    <span className="text-sm">{item.dept}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 flex gap-2">
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-all">
                View Details
              </button>
              <button className="px-4 py-2 border border-slate-600 hover:border-slate-500 text-slate-300 rounded-lg text-sm font-semibold transition-all">
                Download Report
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExitClearance;
