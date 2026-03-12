import React, { useMemo } from 'react';
import { useTheme } from '../../../context/ThemeContext';

const DashboardOverview = ({ user = {}, onNavigate = () => {} }) => {
  const { colors } = useTheme();

  const overviewCards = useMemo(
    () => [
      {
        id: 'employees',
        title: 'Total Employees',
        value: '1,250',
        subtitle: 'Across all departments',
        accent: 'from-blue-500 to-cyan-500',
      },
      {
        id: 'leave-requests',
        title: 'Pending Leave Requests',
        value: '18',
        subtitle: 'Need HR review',
        accent: 'from-amber-500 to-orange-500',
      },
      {
        id: 'new-joiners',
        title: 'New Joiners This Month',
        value: '32',
        subtitle: 'Onboarding in progress',
        accent: 'from-emerald-500 to-teal-500',
      },
      {
        id: 'payroll-status',
        title: 'Payroll Cycle',
        value: '86%',
        subtitle: 'Current month completion',
        accent: 'from-fuchsia-500 to-pink-500',
      },
    ],
    []
  );

  const activityFeed = useMemo(
    () => [
      '5 leave approvals pending final verification',
      '2 new departments requested for setup',
      'Quarterly appraisal cycle starts next week',
      'Payroll lock date is scheduled for Friday',
    ],
    []
  );

  const quickAccessItems = useMemo(
    () => [
      { id: 'manpower', label: 'Manpower Planning' },
      { id: 'users', label: 'User Management' },
      { id: 'leaves', label: 'Leaves and Attendance' },
      { id: 'payroll', label: 'Payroll' },
    ],
    []
  );

  return (
    <div className="min-h-screen bg-transparent p-6 md:p-8">
      <div
        className="mb-8 rounded-2xl p-6 bg-white/10 backdrop-blur-3xl border border-white/30 ring-1 ring-white/20"
        style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}
      >
        <h1 className={`text-4xl font-bold ${colors.text.primary} mb-2`}>
          HR Dashboard
        </h1>
        <p className={colors.text.tertiary}>
          Welcome back, {user?.name || 'HR Administrator'}. Here is the high-level HR snapshot for today.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {overviewCards.map((card) => (
          <div
            key={card.id}
            className={`bg-gradient-to-br ${colors.gradient.card} rounded-2xl border-2 ${colors.border.primary} p-6 hover:border-slate-400 transition-all duration-300`}
            style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}
          >
            <div className={`w-12 h-1 rounded-full bg-gradient-to-r ${card.accent} mb-5`} />
            <p className={`${colors.text.tertiary} text-sm font-medium mb-2`}>{card.title}</p>
            <p className={`text-3xl font-bold ${colors.text.primary} mb-1`}>{card.value}</p>
            <p className={`text-sm ${colors.text.secondary}`}>{card.subtitle}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white/10 backdrop-blur-2xl border border-white/30 rounded-2xl p-6">
          <h2 className={`text-2xl font-bold ${colors.text.primary} mb-4`}>Today Highlights</h2>
          <div className="space-y-3">
            {activityFeed.map((item) => (
              <div
                key={item}
                className="px-4 py-3 rounded-xl bg-white/20 border border-white/30 text-slate-800"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-2xl border border-white/30 rounded-2xl p-6">
          <h2 className={`text-2xl font-bold ${colors.text.primary} mb-4`}>Quick Access</h2>
          <div className="space-y-3">
            {quickAccessItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className="w-full text-left px-4 py-3 rounded-xl bg-slate-100/30 border border-slate-300/60 text-slate-800 font-medium hover:bg-slate-200/60 hover:border-slate-400 transition-all duration-200"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
