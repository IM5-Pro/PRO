import React from 'react';
import { FiCheckCircle, FiAlertTriangle, FiClock, FiArrowRight } from 'react-icons/fi';

const PENDING_APPROVALS = [
  { id: 1, title: 'Leave request - Emma Davis', type: 'Leave', age: '2h ago' },
  { id: 2, title: 'WFH request - Mike Chen', type: 'Attendance', age: '4h ago' },
  { id: 3, title: 'Expense claim - Sarah Johnson', type: 'Finance', age: 'Today' },
];

const URGENT_ITEMS = [
  { id: 1, title: '2 overdue checklist tasks', level: 'high' },
  { id: 2, title: 'Payroll exception review pending', level: 'medium' },
  { id: 3, title: 'Interview panel confirmation needed', level: 'medium' },
];

const QUICK_ACTIONS = ['Approve Leaves', 'Open Checklist', 'Review Attendance', 'View Team Report'];

const APPROVAL_PAGE_MAP = {
  Leave: 'leaves',
  Attendance: 'checklist',
  Finance: 'payroll',
};

const QUICK_ACTION_PAGE_MAP = {
  'Approve Leaves': 'leaves',
  'Open Checklist': 'checklist',
  'Review Attendance': 'checklist',
  'View Team Report': 'users',
};

const ManagerActionCenter = ({ onNavigate = () => {} }) => {
  const handleApprovalClick = (item) => {
    const targetPage = APPROVAL_PAGE_MAP[item.type] || 'dashboard';
    onNavigate(targetPage);
  };

  const handleQuickActionClick = (action) => {
    const targetPage = QUICK_ACTION_PAGE_MAP[action] || 'dashboard';
    onNavigate(targetPage);
  };

  return (
    <div className="card w-full h-full flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-gray-800">Action Center</h2>
        <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded-md">
          Manager
        </span>
      </div>

      <div className="space-y-5">
        <section>
          <div className="flex items-center gap-2 mb-3">
            <FiClock className="text-amber-600" size={16} />
            <p className="text-sm font-semibold text-gray-700">Pending Approvals</p>
          </div>
          <div className="space-y-2">
            {PENDING_APPROVALS.map((item) => (
              <button
                key={item.id}
                onClick={() => handleApprovalClick(item)}
                className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <p className="text-sm font-semibold text-gray-800">{item.title}</p>
                <p className="text-xs text-gray-600 mt-1">{item.type} • {item.age}</p>
              </button>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-3">
            <FiAlertTriangle className="text-red-600" size={16} />
            <p className="text-sm font-semibold text-gray-700">Urgent Attention</p>
          </div>
          <div className="space-y-2">
            {URGENT_ITEMS.map((item) => (
              <div key={item.id} className="p-3 rounded-lg border border-gray-200 bg-white">
                <p className="text-sm text-gray-800">{item.title}</p>
                <p className={`text-xs mt-1 font-semibold ${item.level === 'high' ? 'text-red-600' : 'text-amber-600'}`}>
                  {item.level === 'high' ? 'High Priority' : 'Medium Priority'}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-3">
            <FiCheckCircle className="text-green-600" size={16} />
            <p className="text-sm font-semibold text-gray-700">Quick Actions</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action}
                onClick={() => handleQuickActionClick(action)}
                className="flex items-center justify-between px-3 py-2 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-sm font-semibold text-gray-700 transition-colors"
              >
                <span>{action}</span>
                <FiArrowRight size={14} />
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ManagerActionCenter;
