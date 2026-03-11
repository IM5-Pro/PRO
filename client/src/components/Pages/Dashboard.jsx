/**
 * Dashboard Page
 * Main employee dashboard with overview cards and activity feed
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { FiHome, FiClock, FiCheckCircle, FiAlertCircle, FiArrowRight, FiCalendar, FiSquare, FiPlay } from 'react-icons/fi';
import bgImage from '../../assets/ispace-bg.png';

const Dashboard = () => {
  const { colors } = useTheme();
  const navigate = useNavigate();
  const [isPunchingOut, setIsPunchingOut] = useState(false);

  // Check punch status
  const isPunchedIn = localStorage.getItem('isPunchedIn') === 'true';

  /**
   * Handle punch action - navigate to punch page
   */
  const handlePunchAction = () => {
    navigate('/punch');
  };

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
    { title: 'Leave Request Approved', desc: 'Your leave for Dec 20-25 has been approved', time: '2 hours ago', icon: '✅' },
    { title: 'New Task Assigned', desc: 'UI Redesign Phase 2 assigned by Sarah', time: '4 hours ago', icon: '📋' },
    { title: 'Performance Review', desc: 'Q4 performance review completed', time: '1 day ago', icon: '⭐' },
    { title: 'Team Meeting', desc: 'Sprint planning meeting at 2:00 PM', time: '1 day ago', icon: '📞' }
  ];

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed p-6 md:p-8"
      style={{ backgroundImage: `url(${bgImage})` }}
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
            {/* Punch Button */}
            <button
              onClick={handlePunchAction}
              disabled={isPunchingOut}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                isPunchedIn
                  ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white'
                  : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'
              }`}
              title={isPunchedIn ? 'Click to punch out for the day' : 'Click to punch in for the day'}
            >
              {isPunchedIn ? (
                <>
                  <FiSquare size={18} />
                  <span className="text-sm font-semibold hidden sm:inline">Punch Out</span>
                </>
              ) : (
                <>
                  <FiPlay size={18} />
                  <span className="text-sm font-semibold hidden sm:inline">Punch In</span>
                </>
              )}
            </button>
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
              {recentActivity.map((activity, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-4 p-4 bg-white/10 border border-white/20 rounded-xl hover:border-white/40 transition-all duration-300 group/item cursor-pointer`}
                >
                  <div className="text-3xl mt-1">{activity.icon}</div>

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
              ))}
            </div>

            <button className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95">
              View All Activity
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <div className={`glass rounded-2xl p-6 hover:border-slate-600 transition-all duration-300 h-full`}>
            <h2 className={`text-2xl font-bold ${colors.text.primary} mb-6`}>Quick Actions</h2>

            <div className="space-y-3">
              {[
                { label: 'Check In', icon: '⏱️' },
                { label: 'Request Leave', icon: '📅' },
                { label: 'Book Meeting', icon: '📞' },
                { label: 'View Report', icon: '📊' },
                { label: 'Submit Attendance', icon: '✅' }
              ].map((action, idx) => (
                <button
                  key={idx}
                  className={`w-full flex items-center gap-3 px-4 py-3 ${colors.bg.tertiary}/30 border ${colors.border.secondary} rounded-xl ${colors.text.tertiary} hover:${colors.text.primary} hover:bg-gradient-to-r hover:from-blue-600/20 hover:to-purple-600/20 hover:border-blue-500/50 transition-all duration-300 font-medium`}
                >
                  <span className="text-lg">{action.icon}</span>
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
