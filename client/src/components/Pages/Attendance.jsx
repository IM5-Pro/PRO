/**
 * Attendance Page
 * Calendar-based attendance tracking with live clock, geolocation, and backend integration
 */

import React, { useState, useEffect, useCallback } from 'react';
import { FiClock, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';
import AttendanceSheet from '../AttendanceSheet/AttendanceSheet';
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

  // Monthly stats (local to this page)
  const [statsLoading, setStatsLoading] = useState(true);
  const [monthlySummary, setMonthlySummary] = useState({ present: 0, absent: 0, totalHours: 0, avgHours: 0 });

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

  const stats = [
    { title: 'Days Present', value: statsLoading ? '...' : monthlySummary.present, icon: FiCheckCircle, color: 'from-green-500 to-emerald-500' },
    { title: 'Days Absent', value: statsLoading ? '...' : monthlySummary.absent, icon: FiXCircle, color: 'from-red-500 to-pink-500' },
    { title: 'Total Hours', value: statsLoading ? '...' : monthlySummary.totalHours, icon: FiClock, color: 'from-blue-500 to-cyan-500' },
    { title: 'Avg Hours/Day', value: statsLoading ? '...' : monthlySummary.avgHours, icon: FiClock, color: 'from-purple-500 to-pink-500' },
  ];

  return (
    <div
      className="min-h-screen bg-im5-page p-0"
    >
      {/* Header */}
      <div className="flex flex-col 2xl:flex-row 2xl:items-center justify-between mb-6 gap-4 animate-slideInDown">
        <div className="shrink-0">
          <h1 className={`text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3 transition-colors duration-300 ${colors.text.primary}`}>
            <FiClock className="w-10 h-10" /> Attendance
          </h1>
          <p className={`transition-colors duration-300 ${colors.text.tertiary}`}>Track your work hours and attendance</p>
        </div>
        <div className="w-full 2xl:flex-1 2xl:max-w-5xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
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
        </div>
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
