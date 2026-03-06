/**
 * Attendance Page
 * Calendar-based attendance tracking with theme support
 */

import React, { useState } from 'react';
import { FiClock, FiCheckCircle, FiXCircle, FiLogIn, FiLogOut, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';

const Attendance = () => {
  const { colors, isDark } = useTheme();
  const [checkedIn, setCheckedIn] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date(2024, 11, 5)); // December 5, 2024

  // Generate calendar days
  const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const stats = [
    { title: 'Days Present', value: '18', icon: FiCheckCircle, color: 'from-green-500 to-emerald-500' },
    { title: 'Days Absent', value: '2', icon: FiXCircle, color: 'from-red-500 to-pink-500' },
    { title: 'Total Hours', value: '144.5', icon: FiClock, color: 'from-blue-500 to-cyan-500' },
    { title: 'Avg Hours/Day', value: '8.5', icon: FiClock, color: 'from-purple-500 to-pink-500' }
  ];

  const attendanceData = {
    1: { status: 'present', checkIn: '09:00', checkOut: '05:30' },
    2: { status: 'present', checkIn: '09:15', checkOut: '05:00' },
    3: { status: 'present', checkIn: '08:45', checkOut: '06:00' },
    5: { status: 'present', checkIn: '09:00', checkOut: '05:30' },
    6: { status: 'weekend' },
    7: { status: 'weekend' },
    8: { status: 'present', checkIn: '09:20', checkOut: '05:15' },
    12: { status: 'absent' },
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days = [];

  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const getAttendanceColor = (day) => {
    const data = attendanceData[day];
    if (!data) return isDark ? 'bg-slate-600/30' : 'bg-slate-200';
    if (data.status === 'present') return 'bg-green-500/20 border-green-500/50';
    if (data.status === 'absent') return 'bg-red-500/20 border-red-500/50';
    if (data.status === 'weekend') return isDark ? 'bg-slate-700/20' : 'bg-slate-100';
  };

  const getStatusIcon = (day) => {
    const data = attendanceData[day];
    if (!data) return null;
    if (data.status === 'present') return '✓';
    if (data.status === 'absent') return '✗';
    if (data.status === 'weekend') return '—';
  };

  return (
    <div className={`min-h-screen p-6 md:p-8 transition-colors duration-300 bg-gradient-to-br ${colors.gradient.primary}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className={`text-4xl font-bold mb-2 flex items-center gap-3 transition-colors duration-300 ${colors.text.primary}`}>
            <FiClock className="w-10 h-10" /> Attendance
          </h1>
          <p className={`transition-colors duration-300 ${colors.text.tertiary}`}>Track your work hours and attendance</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className={`group rounded-2xl border-2 p-6 transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-1 bg-gradient-to-br ${colors.gradient.card} ${colors.border.primary}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} text-white`}>
                  <Icon size={24} />
                </div>
              </div>
              <p className={`text-sm font-medium mb-1 transition-colors duration-300 ${colors.text.tertiary}`}>{stat.title}</p>
              <p className={`text-3xl font-bold transition-colors duration-300 ${colors.text.primary}`}>{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Check In/Out Section */}
      <div className={`rounded-2xl border-2 p-8 mb-8 text-center transition-all duration-300 bg-gradient-to-br ${colors.gradient.card} ${colors.border.primary}`}>
        <p className={`text-sm font-medium mb-4 transition-colors duration-300 ${colors.text.tertiary}`}>Current Status</p>
        <p className={`text-4xl font-bold mb-6 transition-colors duration-300 ${colors.text.primary}`}>
          {checkedIn ? '09:00 AM - Currently Checked In' : 'Not Checked In'}
        </p>

        <div className="flex gap-4 justify-center">
          <button
            onClick={() => setCheckedIn(true)}
            className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            <FiLogIn size={20} /> Check In
          </button>

          <button
            onClick={() => setCheckedIn(false)}
            className="px-8 py-4 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            <FiLogOut size={20} /> Check Out
          </button>
        </div>
      </div>

      {/* Calendar Section */}
      <div className={`rounded-2xl border-2 p-6 transition-all duration-300 bg-gradient-to-br ${colors.gradient.card} ${colors.border.primary}`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-2xl font-bold transition-colors duration-300 ${colors.text.primary}`}>
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={previousMonth}
              className={`p-2 rounded-lg transition-all duration-300 ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'} ${colors.text.primary}`}
            >
              <FiChevronLeft size={24} />
            </button>
            <button
              onClick={nextMonth}
              className={`p-2 rounded-lg transition-all duration-300 ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'} ${colors.text.primary}`}
            >
              <FiChevronRight size={24} />
            </button>
          </div>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {dayNames.map((day) => (
            <div
              key={day}
              className={`text-center font-semibold py-2 rounded-lg transition-colors duration-300 ${colors.text.secondary}`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, idx) => (
            <div key={idx}>
              {day ? (
                <div
                  className={`p-4 rounded-lg text-center cursor-pointer transition-all duration-300 border-2 ${getAttendanceColor(
                    day
                  )} hover:shadow-lg`}
                >
                  <div className={`font-semibold transition-colors duration-300 ${colors.text.primary}`}>{day}</div>
                  <div className={`text-sm transition-colors duration-300 ${colors.text.secondary}`}>
                    {getStatusIcon(day)}
                  </div>
                  {attendanceData[day]?.checkIn && (
                    <div className={`text-xs transition-colors duration-300 ${colors.text.tertiary}`}>
                      {attendanceData[day].checkIn}
                    </div>
                  )}
                </div>
              ) : (
                <div></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className={`mt-6 p-4 rounded-lg transition-colors duration-300 bg-gradient-to-r ${colors.gradient.card}`}>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500/20 border-2 border-green-500/50"></div>
            <span className={colors.text.secondary}>Present</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500/20 border-2 border-red-500/50"></div>
            <span className={colors.text.secondary}>Absent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded ${isDark ? 'bg-slate-700/20' : 'bg-slate-100'}`}></div>
            <span className={colors.text.secondary}>Weekend</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
