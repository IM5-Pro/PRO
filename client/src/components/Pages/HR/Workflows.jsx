/**
 * Workflows Component
 * HR workflow and approval process management
 * Features: Workflow templates, approval chains, status tracking
 * 
 * @component
 * @author HR Team
 * @version 2.0.0
 */

import React, { useMemo, useState } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { FiPlus, FiEdit2, FiEye, FiCheckCircle, FiClock } from 'react-icons/fi';

const Workflows = ({ user = {}, pageConfig = {}, onUserUpdate = () => {} }) => {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState('templates');

  const workflowTemplates = useMemo(
    () => [
      {
        id: 1,
        name: 'Leave Request',
        process: 'Request → Manager Approval → HR Approval',
        status: 'Active',
        usageCount: 234,
      },
      {
        id: 2,
        name: 'Promotion',
        process: 'Request → Department Head → HR → CEO Approval',
        status: 'Active',
        usageCount: 45,
      },
      {
        id: 3,
        name: 'Reimbursement',
        process: 'Request → Finance Review → Approval',
        status: 'Active',
        usageCount: 156,
      },
      {
        id: 4,
        name: 'Travel Request',
        process: 'Request → Manager Approval → Finance → Approval',
        status: 'Inactive',
        usageCount: 67,
      },
    ],
    []
  );

  const activeWorkflows = useMemo(
    () => [
      {
        id: 1,
        type: 'Leave Request',
        requester: 'Rajesh Kumar',
        status: 'Awaiting Manager',
        date: '2024-03-07',
        progress: 25,
      },
      {
        id: 2,
        type: 'Promotion',
        requester: 'Priya Singh',
        status: 'Awaiting HR',
        date: '2024-03-05',
        progress: 60,
      },
      {
        id: 3,
        type: 'Reimbursement',
        requester: 'Amit Patel',
        status: 'Approved',
        date: '2024-03-04',
        progress: 100,
      },
    ],
    []
  );

  return (
    <div className="min-h-screen bg-transparent p-6 md:p-8">
      {/* Header */}
      <div className="rounded-2xl p-6 mb-8 bg-white/10 backdrop-blur-3xl border border-white/30 ring-1 ring-white/20 shadow-xl shadow-slate-900/10 animate-slideInDown">
        <h1 className="text-4xl font-bold text-slate-800 mb-2 flex items-center gap-3">
          🔄 Workflows & Approvals
        </h1>
        <p className="text-slate-600">Manage workflow templates and approval processes</p>
      </div>

      {/* Tab Navigation */}
      <div className="card mb-8 p-2 flex gap-2 animate-slideInRight" style={{ animationDelay: '0.1s' }}>
        {['templates', 'active'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2 rounded-lg font-semibold transition-all duration-300 ${
              activeTab === tab
                ? 'bg-blue-600 text-white'
                : `${colors.text.tertiary} hover:${colors.text.primary} hover:bg-slate-700/50`
            }`}
          >
            {tab === 'templates' ? 'Templates' : 'Active Workflows'}
          </button>
        ))}
      </div>

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 gap-6">
          {workflowTemplates.map((template) => (
            <div
              key={template.id}
              className={`bg-gradient-to-br ${colors.gradient.card} rounded-2xl border-2 ${colors.border.primary} p-6`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className={`text-xl font-bold ${colors.text.primary}`}>{template.name}</h3>
                  <p className={`${colors.text.tertiary} text-sm mt-2`}>{template.process}</p>
                  <div className="flex items-center gap-4 mt-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        template.status === 'Active'
                          ? 'bg-green-600/20 text-green-300'
                          : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      {template.status}
                    </span>
                    <span className={`${colors.text.muted} text-xs`}>Used {template.usageCount} times</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                    <FiEye size={18} className={colors.text.secondary} />
                  </button>
                  <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                    <FiEdit2 size={18} className={colors.text.secondary} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Active Workflows Tab */}
      {activeTab === 'active' && (
        <div className="space-y-4">
          {activeWorkflows.map((workflow) => (
            <div
              key={workflow.id}
              className={`bg-gradient-to-br ${colors.gradient.card} rounded-2xl border-2 ${colors.border.primary} p-6`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className={`text-lg font-bold ${colors.text.primary}`}>{workflow.type}</h3>
                  <p className={`${colors.text.tertiary} text-sm`}>Requester: {workflow.requester}</p>
                  <p className={`${colors.text.muted} text-xs mt-1`}>Submitted: {workflow.date}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded text-xs font-medium ${
                    workflow.status === 'Approved'
                      ? 'bg-green-600/20 text-green-300'
                      : workflow.status.includes('Awaiting')
                      ? 'bg-blue-600/20 text-blue-300'
                      : 'bg-yellow-600/20 text-yellow-300'
                  }`}
                >
                  {workflow.status}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className={`${colors.text.tertiary} text-xs font-semibold`}>Progress</span>
                  <span className={`${colors.text.secondary} text-xs`}>{workflow.progress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                    style={{ width: `${workflow.progress}%` }}
                  />
                </div>
              </div>

              <button className={`px-4 py-2 border ${colors.border.secondary} text-slate-300 hover:text-slate-100 rounded-lg text-sm font-semibold transition-all`}>
                View Details
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Workflows;
