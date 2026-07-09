/**
 * Dashboard Page
 * Main employee dashboard with overview cards and activity feed
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { usePunch } from '../../context/PunchContext';
import {
  FiAlertCircle,
  FiArrowRight,
  FiBarChart2,
  FiCalendar,
  FiCheck,
  FiCheckCircle,
  FiClipboard,
  FiClock,
  FiHome,
  FiLogIn,
  FiLogOut,
  FiMapPin,
  FiPhoneCall,
  FiStar,
} from 'react-icons/fi';

const Dashboard = () => {
  const { colors } = useTheme();
  const navigate = useNavigate();
  const {
    canPunch, punchStatus, punchInTime, punchOutTime,
    punchInLocation, punchOutLocation, workingHours,
    attendanceStatus, loading: punchLoading, locationLabel,
  } = usePunch();

  const statsCards = [
    {
      title: 'Total Hours',
      value: '156.5',
      unit: 'hrs',
      icon: FiClock,
      color: 'from-blue-500 to-cyan-500',
      change: '+2.3%'
    },
    {
      title: 'Tasks Done',
      value: '24',
      unit: 'tasks',
      icon: FiCheckCircle,
      color: 'from-green-500 to-emerald-500',
      change: '+5 new'
    },
    {
      title: 'Leave Balance',
      value: '8.5',
      unit: 'days',
      icon: FiCalendar,
      color: 'from-purple-500 to-pink-500',
      change: '3 pending'
    },
    {
      title: 'Performance',
      value: '4.6',
      unit: '/5',
      icon: FiAlertCircle,
      color: 'from-orange-500 to-red-500',
      change: '+0.2 pts'
    }
  ];

  const recentActivity = [
    { title: 'Leave Request Approved', desc: 'Your leave for Dec 20-25 has been approved', time: '2 hours ago', icon: FiCheckCircle, path: '/leaves' },
    { title: 'New Task Assigned', desc: 'UI Redesign Phase 2 assigned by Sarah', time: '4 hours ago', icon: FiClipboard, path: '/team' },
    { title: 'Performance Review', desc: 'Q4 performance review completed', time: '1 day ago', icon: FiStar, path: '/performance' },
    { title: 'Team Meeting', desc: 'Sprint planning meeting at 2:00 PM', time: '1 day ago', icon: FiPhoneCall, path: '/team' }
  ];

  const quickActions = [
    { label: 'Check In', icon: FiClock, path: '/attendance' },
    { label: 'Request Leave', icon: FiCalendar, path: '/leaves' },
    { label: 'Book Meeting', icon: FiPhoneCall, path: '/team' },
    { label: 'View Report', icon: FiBarChart2, path: '/reports' },
    { label: 'Submit Attendance', icon: FiCheck, path: '/attendance' }
  ];

  return (
    <div
      className="min-h-screen bg-im5-page p-6 md:p-8"
    >
      {/* Header */}
      <div className="glass rounded-2xl p-6 mb-8 backdrop-blur-xl animate-slideInDown">
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-4xl font-bold ${colors.text.primary} mb-2 flex items-center gap-3`}>
              <FiHome className="w-10 h-10" /> Welcome Back!
            </h1>
            <p className={colors.text.tertiary}>Here's your dashboard overview for today</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <p className={`${colors.text.tertiary} text-sm`}>Today</p>
              <p className={`${colors.text.primary} font-semibold`}>{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </div>
            {/* Punch In/Out Widget */}
            {canPunch && (
              <div className={`rounded-xl border p-4 min-w-[220px] ${punchStatus === 'in' ? 'bg-green-50 border-green-200' : punchStatus === 'out' ? 'bg-slate-50 border-slate-200' : 'bg-blue-50 border-blue-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Today's Attendance</p>
                  {attendanceStatus && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">{attendanceStatus}</span>
                  )}
                </div>

                {punchInTime && (
                  <div className="mb-1">
                    <p className="text-xs text-slate-500">In: <span className="font-semibold text-green-700">{punchInTime}</span></p>
                    {punchInLocation && <p className="text-xs text-slate-400 flex items-center gap-1"><FiMapPin size={10} />{punchInLocation}</p>}
                  </div>
                )}
                {punchOutTime && (
                  <div className="mb-1">
                    <p className="text-xs text-slate-500">Out: <span className="font-semibold text-red-600">{punchOutTime}</span></p>
                    {punchOutLocation && <p className="text-xs text-slate-400 flex items-center gap-1"><FiMapPin size={10} />{punchOutLocation}</p>}
                    {workingHours != null && <p className="text-xs font-semibold text-blue-600">{workingHours}h worked</p>}
                  </div>
                )}

                <div className="mt-2">
                  <button
                    onClick={() => navigate('/punch')}
                    disabled={punchLoading}
                    title={
                      punchStatus === 'in'
                        ? `Punched in · ${locationLabel}`
                        : punchStatus === 'out'
                          ? `Punched out · ${locationLabel}`
                          : `Not punched in · ${locationLabel}`
                    }
                    aria-label="Open attendance page"
                    className={`flex items-center justify-center p-2 rounded-lg text-white transition-all disabled:opacity-60 ${
                      punchStatus === 'in'
                        ? 'bg-green-600 hover:bg-green-700'
                        : punchStatus === 'out'
                          ? 'bg-red-600 hover:bg-red-700'
                          : 'bg-slate-500 hover:bg-slate-600'
                    }`}
                  >
                    {punchStatus === 'out' ? <FiLogOut size={16} /> : <FiLogIn size={16} />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              style={{ animationDelay: `${idx * 0.1}s` }}
              className={`group stat-card animate-fadeInUp hover-lift`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`icon-box bg-gradient-to-br ${card.color} text-white`}>
                  <Icon size={24} />
                </div>
                <span className="badge badge-success">{card.change}</span>
              </div>

              <p className={`${colors.text.tertiary} text-sm font-medium mb-2`}>{card.title}</p>
              <div className="flex items-baseline gap-2">
                <p className={`text-3xl font-bold ${colors.text.primary}`}>{card.value}</p>
                <p className={colors.text.tertiary}>{card.unit}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className={`glass rounded-2xl p-6 hover:border-slate-600 transition-all duration-300`}>
            <h2 className={`text-2xl font-bold ${colors.text.primary} mb-6`}>Recent Activity</h2>

            <div className="space-y-4">
              {recentActivity.map((activity, idx) => {
                const ActivityIcon = activity.icon;

                return (
                  <div
                    key={idx}
                    onClick={() => navigate(activity.path)}
                    className={`flex items-start gap-4 p-4 bg-white/10 border border-white/20 rounded-xl hover:border-white/40 transition-all duration-300 group/item cursor-pointer`}
                  >
                    <div className="mt-1 text-slate-200">
                      <ActivityIcon size={24} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className={`${colors.text.primary} font-semibold group-hover/item:text-blue-400 transition-colors`}>{activity.title}</p>
                          <p className={`${colors.text.tertiary} text-sm mt-1`}>{activity.desc}</p>
                        </div>
                        <FiArrowRight className={`${colors.text.muted} group-hover/item:text-blue-400 transition-colors mt-1 flex-shrink-0`} />
                      </div>
                      <p className={`${colors.text.muted} text-xs mt-2`}>{activity.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => navigate('/announcements')}
              className="w-full mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95"
            >
              View All Activity
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <div className={`glass rounded-2xl p-6 hover:border-slate-600 transition-all duration-300 h-full`}>
            <h2 className={`text-2xl font-bold ${colors.text.primary} mb-6`}>Quick Actions</h2>

            <div className="space-y-3">
              {quickActions.map((action, idx) => {
                const ActionIcon = action.icon;

                return (
                  <button
                    key={idx}
                    onClick={() => navigate(action.path)}
                    className={`w-full flex items-center gap-3 px-4 py-3 ${colors.bg.tertiary}/30 border ${colors.border.secondary} rounded-xl ${colors.text.tertiary} hover:${colors.text.primary} hover:bg-slate-200/50 hover:border-slate-400 transition-all duration-300 font-medium`}
                  >
                    <ActionIcon size={18} />
                    <span>{action.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
