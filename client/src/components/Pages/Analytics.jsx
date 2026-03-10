/**
 * Analytics Dashboard Page
 * Comprehensive analytics and performance metrics
 */

import React, { useState } from 'react';
import { FiBarChart2, FiTrendingUp, FiUsers, FiTarget, FiCalendar, FiDownload, FiFilter } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';
import bgImage from '../../assets/Background.png';

const Analytics = () => {
  const { colors } = useTheme();
  const [period, setPeriod] = useState('monthly');

  const metrics = [
    {
      title: 'Total Employees',
      value: '124',
      change: '+12',
      icon: FiUsers,
      color: 'from-blue-500 to-cyan-500',
      percentage: '+10.8%'
    },
    {
      title: 'Attendance Rate',
      value: '94.5%',
      change: '+2.3%',
      icon: FiTarget,
      color: 'from-green-500 to-emerald-500',
      percentage: '+2.3%'
    },
    {
      title: 'Tasks Completed',
      value: '2,847',
      change: '+284',
      icon: FiBarChart2,
      color: 'from-purple-500 to-pink-500',
      percentage: '+11.1%'
    },
    {
      title: 'Avg Performance',
      value: '4.6/5',
      change: '+0.2',
      icon: FiTrendingUp,
      color: 'from-orange-500 to-red-500',
      percentage: '+4.5%'
    }
  ];

  const departmentData = [
    { name: 'Engineering', employees: 45, productivity: 92, color: 'from-blue-500 to-cyan-500' },
    { name: 'Marketing', employees: 28, productivity: 88, color: 'from-purple-500 to-pink-500' },
    { name: 'Design', employees: 18, productivity: 95, color: 'from-green-500 to-emerald-500' },
    { name: 'HR', employees: 12, productivity: 85, color: 'from-yellow-500 to-orange-500' },
    { name: 'Finance', employees: 15, productivity: 90, color: 'from-red-500 to-pink-500' },
    { name: 'Operations', employees: 6, productivity: 87, color: 'from-indigo-500 to-purple-500' }
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
            <FiBarChart2 className="w-10 h-10" /> Analytics
          </h1>
          <p className={colors.text.tertiary}>Company-wide performance metrics and insights</p>
        </div>

        <div className="flex gap-3">
          <div className={`flex items-center gap-2 glass rounded-xl px-4 py-3 hover:border-slate-600 transition-all duration-300`}>
            <FiFilter className="text-slate-400" size={20} />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-transparent text-white outline-none font-medium"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
            </select>
          </div>

          <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg flex items-center gap-2">
            <FiDownload size={20} /> Export
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric, idx) => {
          const Icon = metric.icon;
          return (
            <div
              key={idx}
              className={`group glass rounded-2xl border p-6 hover:border-slate-600 transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-1`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${metric.color} text-white`}>
                  <Icon size={24} />
                </div>
                <span className="text-green-400 text-sm font-semibold">{metric.percentage}</span>
              </div>

              <p className={`${colors.text.tertiary} text-sm font-medium mb-1`}>{metric.title}</p>
              <p className={`text-3xl font-bold ${colors.text.primary} mb-2`}>{metric.value}</p>
              <p className={`${colors.text.muted} text-xs`}>vs last period: {metric.change}</p>
            </div>
          );
        })}
      </div>

      {/* Department Analytics */}
      <div className={`glass rounded-2xl border p-6 mb-8 hover:border-slate-600 transition-all duration-300`}>
        <h2 className={`text-2xl font-bold ${colors.text.primary} mb-6`}>Department Performance</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {departmentData.map((dept, idx) => (
            <div key={idx} className="bg-slate-700/30 border border-slate-700/50 rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className={`${colors.text.primary} font-semibold text-lg`}>{dept.name}</h3>
                  <p className={`${colors.text.tertiary} text-sm`}>{dept.employees} employees</p>
                </div>
              </div>

              {/* Productivity Bar */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className={colors.text.tertiary}>Productivity</span>
                  <span className={`${colors.text.primary} font-semibold`}>{dept.productivity}%</span>
                </div>
                <div className={`w-full h-3 ${colors.bg.tertiary} rounded-full overflow-hidden`}>
                  <div
                    className={`h-full bg-gradient-to-r ${dept.color} rounded-full transition-all duration-500`}
                    style={{ width: `${dept.productivity}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trends & Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trends */}
        <div className={`glass rounded-2xl border p-6 hover:border-slate-600 transition-all duration-300`}>
          <h2 className={`text-xl font-bold ${colors.text.primary} mb-6 flex items-center gap-2`}>
            <FiTrendingUp className="text-blue-400" /> Attendance Trends
          </h2>

          <div className="space-y-4">
            {[
              { day: 'Mon', attendance: 96, color: 'from-blue-500 to-cyan-500' },
              { day: 'Tue', attendance: 94, color: 'from-green-500 to-emerald-500' },
              { day: 'Wed', attendance: 92, color: 'from-purple-500 to-pink-500' },
              { day: 'Thu', attendance: 95, color: 'from-yellow-500 to-orange-500' },
              { day: 'Fri', attendance: 89, color: 'from-red-500 to-pink-500' }
            ].map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-center mb-2">
                  <span className={`${colors.text.secondary} font-medium`}>{item.day}</span>
                  <span className={`${colors.text.primary} font-semibold`}>{item.attendance}%</span>
                </div>
                <div className={`w-full h-3 ${colors.bg.tertiary} rounded-full overflow-hidden`}>
                  <div
                    className={`h-full bg-gradient-to-r ${item.color} rounded-full`}
                    style={{ width: `${item.attendance}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performers */}
        <div className={`glass rounded-2xl border p-6 hover:border-slate-600 transition-all duration-300`}>
          <h2 className={`text-xl font-bold ${colors.text.primary} mb-6`}>Top Performers</h2>

          <div className="space-y-4">
            {[
              { rank: 1, name: 'Sarah Johnson', score: 98, icon: '👑' },
              { rank: 2, name: 'Mike Chen', score: 96, icon: '🥈' },
              { rank: 3, name: 'Emily Davis', score: 95, icon: '🥉' },
              { rank: 4, name: 'Alex Rodriguez', score: 93, icon: '⭐' },
              { rank: 5, name: 'Lisa Park', score: 91, icon: '💫' }
            ].map((performer) => (
              <div key={performer.rank} className="flex items-center justify-between p-3 bg-slate-700/30 border border-slate-700/50 rounded-lg hover:bg-slate-700/50 transition-colors duration-300">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{performer.icon}</span>
                  <div>
                    <p className="text-white font-semibold">{performer.name}</p>
                    <p className="text-slate-400 text-xs">#{performer.rank} Rank</p>
                  </div>
                </div>
                <span className="text-white font-bold">{performer.score}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
