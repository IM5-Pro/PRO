/**
 * Attendance Page
 * Calendar-based attendance tracking with live clock, geolocation, and backend integration
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FiClock, FiCheckCircle, FiXCircle, FiLogIn, FiLogOut, FiMapPin, FiAlertCircle } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';
import AttendanceSheet from '../AttendanceSheet/AttendanceSheet';
import { usePunch } from '../../context/PunchContext';
import { useAuth } from '../../context/AuthContext';
import { normalizeRole, ROLES } from '../../utils/roles';
import API from '../../api/client';
import { ATTENDANCE_ENDPOINTS } from '../../api/endpoints';
import { getMonthDateRangeParams } from '../../utils/monthDateRange';

const APPROVAL_ROLES = new Set([ROLES.MANAGER, ROLES.HR_ADMIN, ROLES.DEPT_ADMIN, ROLES.SUPER_ADMIN]);

const Attendance = () => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const userRole = normalizeRole(user?.role);
  const showApprovalsLink = APPROVAL_ROLES.has(userRole);

  // Shared punch state from context
  const {
    punchInTime, punchOutTime, punchInLocation, punchOutLocation,
    workingHours, attendanceStatus, loading, locationLabel, locationLoading,
    punchIn, punchOut,
  } = usePunch();

  // Live clock
  const [currentTime, setCurrentTime] = useState(new Date());
  const tickRef = useRef(null);

  // Monthly stats (local to this page)
  const [statsLoading, setStatsLoading] = useState(true);
  const [monthlySummary, setMonthlySummary] = useState({ present: 0, absent: 0, totalHours: 0, avgHours: 0 });
  const [apiError, setApiError] = useState(null);
  const locationError = !locationLabel && !locationLoading ? 'Location unknown' : null;
  

  // Live clock tick
  useEffect(() => {
    tickRef.current = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(tickRef.current);
  }, []);

  // Load monthly summary stats
  const loadMonthlySummary = useCallback(async () => {
    setStatsLoading(true);
    try {
      const now = new Date();
      const { startDate, endDate } = getMonthDateRangeParams(now.getFullYear(), now.getMonth());
      const res = await API.get(ATTENDANCE_ENDPOINTS.own(), {
        params: {
          startDate,
          endDate,
          limit: 62,
          page: 1,
        },
      });
      const attendanceArr = res.data?.attendance || [];
      let present = 0, absent = 0, totalHours = 0;
      attendanceArr.forEach((record) => {
        if (record.status === 'Present' || record.status === 'Late' || record.status === 'EarlyCheckout' || record.status === 'HalfDay') {
          present++;
        }
        if (record.status === 'Absent') absent++;
        if (record.workingHours) totalHours += record.workingHours;
      });
      setMonthlySummary({
        present,
        absent,
        totalHours: totalHours.toFixed(1),
        avgHours: present ? (totalHours / present).toFixed(1) : '0.0',
      });
    } catch {
      // keep defaults
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => { loadMonthlySummary(); }, [loadMonthlySummary]);

  const formatLocalTime = (date) =>
    date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

  const handlePunchIn = async () => {
    setApiError(null);
    try { await punchIn(); } catch (err) {
      setApiError(err?.response?.data?.message || 'Failed to punch in.');
    }
  };

  const handlePunchOut = async () => {
    setApiError(null);
    try { await punchOut(); } catch (err) {
      setApiError(err?.response?.data?.message || 'Failed to punch out.');
    }
  };

  const stats = [
    { title: 'Days Present', value: statsLoading ? '...' : monthlySummary.present, icon: FiCheckCircle, color: 'from-green-500 to-emerald-500' },
    { title: 'Days Absent', value: statsLoading ? '...' : monthlySummary.absent, icon: FiXCircle, color: 'from-red-500 to-pink-500' },
    { title: 'Total Hours', value: statsLoading ? '...' : monthlySummary.totalHours, icon: FiClock, color: 'from-blue-500 to-cyan-500' },
    { title: 'Avg Hours/Day', value: statsLoading ? '...' : monthlySummary.avgHours, icon: FiClock, color: 'from-purple-500 to-pink-500' },
  ];

  return (
    <div
      className="min-h-screen bg-im5-page p-6 md:p-8"
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
        <div className={`glass rounded-2xl border-white/30 p-6 transition-all duration-300 bg-gradient-to-br ${colors.gradient.card} w-full md:w-80 flex-shrink-0 animate-slideInRight backdrop-blur-xl hover:shadow-2xl hover:border-white/50 transform hover:-translate-y-1 ${colors.border.primary}`}>
          {/* Live clock */}
          <div className="flex items-center justify-between mb-1">
            <p className={`text-xs font-medium transition-colors duration-300 ${colors.text.tertiary}`}>Local Time</p>
            {attendanceStatus && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">{attendanceStatus}</span>
            )}
          </div>
          <p className={`text-2xl font-bold mb-1 tabular-nums transition-colors duration-300 ${colors.text.primary}`}>
            {formatLocalTime(currentTime)}
          </p>
          {/* Location line */}
          <div className={`flex items-center gap-1 text-xs mb-4 transition-colors duration-300 ${colors.text.tertiary}`}>
            <FiMapPin size={11} />
            {locationLoading ? 'Detecting location…' : locationError ? locationError : (locationLabel || 'Location unknown')}
          </div>

          {/* Error message */}
          {apiError && (
            <div className="flex items-start gap-2 mb-3 p-2 rounded-lg bg-red-50 border border-red-200">
              <FiAlertCircle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-red-600">{apiError}</p>
            </div>
          )}

          {/* Punch status */}
          <p className={`text-xs font-medium mb-2 transition-colors duration-300 ${colors.text.tertiary}`}>Punch Status</p>

          {punchOutTime ? (
            <div className="animate-scaleUp">
              <div className="flex justify-between items-start mb-1">
                <p className={`text-sm font-semibold transition-colors duration-300 ${colors.text.secondary}`}>Punched Out</p>
                <p className={`text-base font-bold transition-colors duration-300 ${colors.text.primary}`}>{punchOutTime}</p>
              </div>
              {punchOutLocation && (
                <p className={`text-xs flex items-center gap-1 mb-1 ${colors.text.tertiary}`}><FiMapPin size={10} />{punchOutLocation}</p>
              )}
              {workingHours != null && (
                <p className={`text-xs font-medium text-green-600`}>Total: {workingHours}h worked</p>
              )}
              <p className={`text-xs mt-1 ${colors.text.tertiary}`}>In: {punchInTime}{punchInLocation ? ` · ${punchInLocation}` : ''}</p>
            </div>
          ) : punchInTime ? (
            <div className="animate-scaleUp">
              <div className="flex justify-between items-start mb-1">
                <p className={`text-sm font-semibold transition-colors duration-300 ${colors.text.secondary}`}>Punched In</p>
                <p className={`text-base font-bold transition-colors duration-300 ${colors.text.primary}`}>{punchInTime}</p>
              </div>
              {punchInLocation && (
                <p className={`text-xs flex items-center gap-1 mb-3 ${colors.text.tertiary}`}><FiMapPin size={10} />{punchInLocation}</p>
              )}
              {workingHours != null && (
                <p className="text-xs font-medium text-blue-600 mb-3">Synced: {workingHours}h worked so far</p>
              )}
              <button
                onClick={handlePunchOut}
                disabled={loading}
                className="btn-danger w-full"
              >
                <FiLogOut size={18} /> {loading ? 'Recording…' : 'Punch Out'}
              </button>
            </div>
          ) : (
            <button
              onClick={handlePunchIn}
              disabled={loading || locationLoading}
              className="btn-success w-full animate-scaleUp"
            >
              <FiLogIn size={18} /> {loading ? 'Recording…' : 'Punch In'}
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

      {showApprovalsLink ? (
        <div className={`mb-8 rounded-2xl border ${colors.border.primary} bg-white/80 p-5`}>
          <p className={`text-sm font-semibold ${colors.text.primary} mb-1`}>Team attendance corrections</p>
          <p className={`text-sm ${colors.text.tertiary} mb-3`}>
            Review and approve pending attendance records from the approvals workspace.
          </p>
          <button
            type="button"
            onClick={() => {
              window.location.assign('/dashboard?page=attendance-approvals');
            }}
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            Open attendance approvals
          </button>
        </div>
      ) : null}

      {/* Attendance Sheet Calendar */}
      <div className="mt-8">
        <AttendanceSheet />
      </div>
    </div>
  );
};

export default Attendance;
