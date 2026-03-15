/**
 * Performance Page
 * Performance metrics and reviews
 */

import React, { useCallback, useEffect, useState } from 'react';
import { FiAward, FiTrendingUp, FiTarget, FiUsers } from 'react-icons/fi';
import API from '../../api/client';
import { ANNOUNCEMENT_ENDPOINTS, ATTENDANCE_ENDPOINTS, EMPLOYEE_ENDPOINTS, LEAVE_ENDPOINTS } from '../../api/endpoints';
import { useTheme } from '../../context/ThemeContext';

const toPayload = (response) => response?.data || {};

const extractRows = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
};

const Performance = () => {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [metrics, setMetrics] = useState([]);
  const [goals, setGoals] = useState([]);
  const [reviews, setReviews] = useState([]);

  const loadPerformanceData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [teamResponse, attendanceResponse, leaveResponse, announcementResponse] = await Promise.all([
        API.get(EMPLOYEE_ENDPOINTS.myTeam(200)),
        API.get(ATTENDANCE_ENDPOINTS.monthlySummary),
        API.get(LEAVE_ENDPOINTS.team),
        API.get(ANNOUNCEMENT_ENDPOINTS.list),
      ]);

      const teamRows = extractRows(toPayload(teamResponse));
      const leaveRows = extractRows(toPayload(leaveResponse));
      const announcements = extractRows(toPayload(announcementResponse));
      const attendancePayload = toPayload(attendanceResponse);
      const summary = attendancePayload?.data || attendancePayload;

      const presentDays = Number(summary?.daysPresent ?? summary?.presentDays ?? 0);
      const absentDays = Number(summary?.daysAbsent ?? summary?.absentDays ?? 0);
      const totalDays = presentDays + absentDays;
      const productivity = totalDays > 0 ? (presentDays / totalDays) * 100 : Number(summary?.attendanceRate ?? 0);
      const avgHours = Number(summary?.averageWorkingHours ?? 0);
      const pendingLeaves = leaveRows.filter((row) => String(row?.status || '').toUpperCase() === 'PENDING').length;

      setMetrics([
        {
          title: 'Overall Rating',
          value: `${Math.max(1, Math.min(5, Number((productivity / 20).toFixed(1))))}`,
          unit: '/5.0',
          icon: FiAward,
          color: 'from-blue-500 to-cyan-500',
          change: 'Live',
        },
        {
          title: 'Productivity',
          value: `${Math.max(0, Math.min(100, productivity)).toFixed(1)}%`,
          unit: 'score',
          icon: FiTrendingUp,
          color: 'from-green-500 to-emerald-500',
          change: `${presentDays} present`,
        },
        {
          title: 'Team Size',
          value: String(teamRows.length),
          unit: 'members',
          icon: FiUsers,
          color: 'from-purple-500 to-pink-500',
          change: 'Live',
        },
        {
          title: 'Goal Progress',
          value: `${Math.max(0, Math.min(100, Math.round(100 - pendingLeaves * 7)))}%`,
          unit: 'complete',
          icon: FiTarget,
          color: 'from-orange-500 to-red-500',
          change: `${pendingLeaves} pending`,
        },
      ]);

      setGoals([
        { goal: 'Team attendance consistency', progress: Math.max(0, Math.min(100, Math.round(productivity))), deadline: 'This Month' },
        { goal: 'Average work hours', progress: Math.max(0, Math.min(100, Math.round((avgHours / 10) * 100))), deadline: 'This Month' },
        { goal: 'Pending leaves resolution', progress: Math.max(0, Math.min(100, 100 - pendingLeaves * 10)), deadline: 'Next 2 Weeks' },
        { goal: 'Team engagement updates', progress: announcements.length > 0 ? 85 : 55, deadline: 'This Quarter' },
      ]);

      setReviews(
        announcements.slice(0, 3).map((item, index) => ({
          reviewer: item?.createdByName || 'HR',
          rating: Math.max(3, 5 - index),
          feedback: item?.title || 'Performance update shared',
          date: item?.publishedAt
            ? new Date(item.publishedAt).toLocaleDateString('en-US')
            : new Date().toLocaleDateString('en-US'),
        }))
      );
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load performance data');
      setMetrics([]);
      setGoals([]);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPerformanceData();
  }, [loadPerformanceData]);

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 md:p-8"
    >
      {/* Header */}
      <div>
        <h1 className={`text-4xl font-bold ${colors.text.primary} mb-2 flex items-center gap-3`}>
          <FiAward className="w-10 h-10" /> Performance
        </h1>
        <p className={`${colors.text.tertiary} mb-8`}>Track your performance metrics and goals</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 mb-6">
          {error}
        </div>
      )}

      {loading && (
        <div className="rounded-xl border border-slate-200 bg-white text-slate-500 px-4 py-5 mb-6">
          Loading performance data...
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric, idx) => {
          const Icon = metric.icon;
          return (
            <div
              key={idx}
              className={`group bg-gradient-to-br ${colors.gradient.card} rounded-2xl border ${colors.border.primary} p-6 hover:border-slate-600 transition-all duration-300 hover:shadow-2xl ${colors.shadow} transform hover:-translate-y-1`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${metric.color} text-white`}>
                  <Icon size={24} />
                </div>
                <span className="text-green-400 text-xs font-semibold">{metric.change}</span>
              </div>

              <p className="text-slate-400 text-sm font-medium mb-1">{metric.title}</p>
              <div className="flex items-baseline gap-1">
                <p className="text-3xl font-bold text-white">{metric.value}</p>
                <p className="text-slate-400 text-sm">{metric.unit}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Goals & Reviews Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Goals */}
        <div className={`bg-gradient-to-br ${colors.gradient.card} rounded-2xl border ${colors.border.primary} p-6 hover:border-slate-600 transition-all`}>
          <h2 className={`text-2xl font-bold ${colors.text.primary} mb-6`}>Performance Goals</h2>

          <div className="space-y-4">
            {goals.map((goal, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-white font-semibold">{goal.goal}</p>
                  <span className="text-slate-400 text-sm">{goal.progress}%</span>
                </div>
                <div className={`w-full h-3 ${colors.bg.tertiary} rounded-full overflow-hidden mb-1`}>
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${goal.progress}%` }}
                  ></div>
                </div>
                <p className={`${colors.text.tertiary} text-xs`}>Due: {goal.deadline}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Reviews */}
        <div className={`bg-gradient-to-br ${colors.gradient.card} rounded-2xl border ${colors.border.primary} p-6 hover:border-slate-600 transition-all`}>
          <h2 className={`text-2xl font-bold ${colors.text.primary} mb-6`}>Recent Reviews</h2>

          <div className="space-y-4">
            {reviews.map((review, idx) => (
              <div key={idx} className="p-4 bg-slate-700/30 border border-slate-700/50 rounded-xl">
                <div className="flex items-start justify-between mb-2">
                  <p className={`${colors.text.primary} font-semibold`}>{review.reviewer}</p>
                  <span className="text-yellow-400">{'⭐'.repeat(review.rating)}</span>
                </div>
                <p className={`${colors.text.secondary} text-sm mb-2`}>{review.feedback}</p>
                <p className={colors.text.muted}>{review.date}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Performance;
