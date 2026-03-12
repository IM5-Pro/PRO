/**
 * Attendance Page
 * Calendar-based attendance tracking with theme support
 */

import React, { useState } from 'react';
import { FiClock, FiCheckCircle, FiXCircle, FiLogIn, FiLogOut } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';
import AttendanceSheet from '../AttendanceSheet/AttendanceSheet';

const Attendance = () => {
  const { colors, isDark } = useTheme();
  const [punchInTime, setPunchInTime] = useState(null);
  const [punchOutTime, setPunchOutTime] = useState(null);

  const stats = [
    { title: 'Days Present', value: '18', icon: FiCheckCircle, color: 'from-green-500 to-emerald-500' },
    { title: 'Days Absent', value: '2', icon: FiXCircle, color: 'from-red-500 to-pink-500' },
    { title: 'Total Hours', value: '144.5', icon: FiClock, color: 'from-blue-500 to-cyan-500' },
    { title: 'Avg Hours/Day', value: '8.5', icon: FiClock, color: 'from-purple-500 to-pink-500' }
  ];

  const handlePunchIn = () => {
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    setPunchInTime(time);
    setPunchOutTime(null);
  };

  const handlePunchOut = () => {
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    setPunchOutTime(time);
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 md:p-8"
    >
      {/* Header with Punch Status */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-6 animate-slideInDown">
        <div>
          <h1 className={`text-4xl font-bold mb-2 flex items-center gap-3 transition-colors duration-300 ${colors.text.primary}`}>
            <FiClock className="w-10 h-10" /> Attendance
          </h1>
          <p className={`transition-colors duration-300 ${colors.text.tertiary}`}>Track your work hours and attendance</p>
        </div>

        {/* Punch Status Card - Right Corner of Header */}
        <div className={`glass rounded-2xl border-white/30 p-6 transition-all duration-300 bg-gradient-to-br ${colors.gradient.card} w-full md:w-72 flex-shrink-0 animate-slideInRight backdrop-blur-xl hover:shadow-2xl hover:border-white/50 transform hover:-translate-y-1 ${colors.border.primary}`}>
          <p className={`text-sm font-medium mb-3 transition-colors duration-300 ${colors.text.tertiary}`}>Punch Status</p>
          
          {punchOutTime ? (
            <div className="animate-scaleUp">
              <p className={`text-lg font-semibold mb-2 transition-colors duration-300 ${colors.text.secondary}`}>Punched Out</p>
              <p className={`text-3xl font-bold transition-colors duration-300 ${colors.text.primary}`}>{punchOutTime}</p>
            </div>
          ) : punchInTime ? (
            <div className="animate-scaleUp">
              <p className={`text-lg font-semibold mb-2 transition-colors duration-300 ${colors.text.secondary}`}>Punched In</p>
              <p className={`text-3xl font-bold mb-4 transition-colors duration-300 ${colors.text.primary}`}>{punchInTime}</p>
              <button
                onClick={handlePunchOut}
                className="btn-danger w-full"
              >
                <FiLogOut size={18} /> Punch Out
              </button>
            </div>
          ) : (
            <button
              onClick={handlePunchIn}
              className="btn-success w-full animate-scaleUp"
            >
              <FiLogIn size={18} /> Punch In
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              style={{ animationDelay: `${idx * 0.08}s` }}
              className={`group stat-card animate-fadeInUp hover-lift`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`icon-box bg-gradient-to-br ${stat.color} text-white`}>
                  <Icon size={24} />
                </div>
              </div>
              <p className={`text-sm font-medium mb-2 transition-colors duration-300 ${colors.text.tertiary}`}>{stat.title}</p>
              <p className={`text-3xl font-bold transition-colors duration-300 ${colors.text.primary}`}>{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Attendance Sheet Calendar */}
      <div className="mt-8">
        <AttendanceSheet />
      </div>
    </div>
  );
};

export default Attendance;
