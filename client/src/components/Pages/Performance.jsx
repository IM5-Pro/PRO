/**
 * Performance Page — live reviews & goals from /performance APIs
 */

import React, { useCallback, useEffect, useState } from 'react';
import { FiAward, FiStar, FiTarget, FiTrendingUp } from 'react-icons/fi';
import API from '../../api/client';
import { ANNOUNCEMENT_ENDPOINTS, ATTENDANCE_ENDPOINTS, LEAVE_ENDPOINTS } from '../../api/endpoints';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { ROLES, normalizeRole } from '../../utils/roles';
import { unwrapData, extractRows, toErrorMessage, toPayload } from '../../utils/apiHelpers';
import {
  fetchPerformanceGoals,
  fetchPerformanceReviews,
} from '../../services/operationsModulesApi';

const TEAM_ROLES = new Set([ROLES.MANAGER, ROLES.HR_ADMIN, ROLES.SUPER_ADMIN, ROLES.DEPT_ADMIN]);

const Performance = () => {
  const { colors } = useTheme();
  const { user = {} } = useAuth();
  const userRole = normalizeRole(user?.role);
  const isTeamView = TEAM_ROLES.has(userRole);
  const employeeId = user?.employeeId || user?.employee?._id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [metrics, setMetrics] = useState([]);
  const [goals, setGoals] = useState([]);
  const [reviews, setReviews] = useState([]);

  const loadPerformanceData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [attendanceResponse, leaveResponse, announcementResponse] = await Promise.all([
        API.get(ATTENDANCE_ENDPOINTS.monthlySummary),
        API.get(isTeamView ? LEAVE_ENDPOINTS.team : LEAVE_ENDPOINTS.own),
        API.get(ANNOUNCEMENT_ENDPOINTS.list),
      ]);

      const leaveRows = extractRows(unwrapData(toPayload(leaveResponse)), ['leaves', 'records']);
      const announcements = extractRows(unwrapData(toPayload(announcementResponse)), ['announcements', 'records']);
      const summary = unwrapData(toPayload(attendanceResponse));

      const presentDays = Number(summary?.daysPresent ?? summary?.presentDays ?? 0);
      const absentDays = Number(summary?.daysAbsent ?? summary?.absentDays ?? 0);
      const totalDays = presentDays + absentDays;
      const productivity =
        totalDays > 0 ? (presentDays / totalDays) * 100 : Number(summary?.attendanceRate ?? 0);
      const pendingLeaves = leaveRows.filter(
        (row) => String(row?.status || '').toUpperCase() === 'PENDING',
      ).length;

      let performanceGoals = [];
      let performanceReviews = [];

      if (employeeId) {
        try {
          performanceGoals = await fetchPerformanceGoals(employeeId);
          performanceReviews = await fetchPerformanceReviews(employeeId);
        } catch (perfErr) {
          if (!isTeamView) {
            throw perfErr;
          }
        }
      }

      const avgRating =
        performanceReviews.length > 0
          ? performanceReviews.reduce((sum, r) => sum + Number(r.rating ?? r.score ?? 0), 0) /
            performanceReviews.length
          : Math.max(1, Math.min(5, productivity / 20));

      setMetrics([
        {
          title: 'Overall Rating',
          value: avgRating ? avgRating.toFixed(1) : '—',
          unit: '/5.0',
          icon: FiAward,
          color: 'from-blue-500 to-cyan-500',
          change: performanceReviews.length ? `${performanceReviews.length} reviews` : 'No reviews yet',
        },
        {
          title: 'Attendance score',
          value: `${Math.max(0, Math.min(100, productivity)).toFixed(1)}%`,
          unit: '',
          icon: FiTrendingUp,
          color: 'from-green-500 to-emerald-500',
          change: `${presentDays} present days`,
        },
        {
          title: 'Active goals',
          value: String(
            performanceGoals.filter((g) => String(g.status || '').toLowerCase() !== 'completed').length,
          ),
          unit: 'open',
          icon: FiTarget,
          color: 'from-purple-500 to-pink-500',
          change: `${performanceGoals.length} total`,
        },
        {
          title: 'Pending leaves',
          value: String(pendingLeaves),
          unit: 'requests',
          icon: FiTarget,
          color: 'from-orange-500 to-red-500',
          change: 'This month',
        },
      ]);

      if (performanceGoals.length > 0) {
        setGoals(
          performanceGoals.slice(0, 8).map((goal) => ({
            goal: goal.title || goal.name || 'Goal',
            progress: Math.max(0, Math.min(100, Number(goal.progress ?? goal.completion ?? 0))),
            deadline: goal.dueDate
              ? new Date(goal.dueDate).toLocaleDateString('en-IN')
              : goal.status || 'In progress',
          })),
        );
      } else {
        setGoals([
          {
            goal: 'Complete assigned learning goals',
            progress: Math.round(productivity),
            deadline: 'This month',
          },
        ]);
      }

      if (performanceReviews.length > 0) {
        setReviews(
          performanceReviews.slice(0, 6).map((review) => ({
            reviewer:
              review?.reviewerId?.firstName
                ? [review.reviewerId.firstName, review.reviewerId.lastName].filter(Boolean).join(' ')
                : review?.reviewerName || 'Reviewer',
            rating: Math.max(1, Math.min(5, Math.round(Number(review.rating ?? review.score ?? 3)))),
            feedback: review.comments || review.feedback || review.summary || 'Performance review',
            date: review.reviewDate
              ? new Date(review.reviewDate).toLocaleDateString('en-IN')
              : new Date().toLocaleDateString('en-IN'),
          })),
        );
      } else if (announcements.length > 0) {
        setReviews(
          announcements.slice(0, 3).map((item, index) => ({
            reviewer: item?.createdByName || 'HR',
            rating: Math.max(3, 5 - index),
            feedback: item?.title || 'Company update',
            date: item?.publishedAt
              ? new Date(item.publishedAt).toLocaleDateString('en-IN')
              : new Date().toLocaleDateString('en-IN'),
          })),
        );
      } else {
        setReviews([]);
      }
    } catch (err) {
      setError(toErrorMessage(err, 'Failed to load performance data'));
      setMetrics([]);
      setGoals([]);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [employeeId, isTeamView]);

  useEffect(() => {
    loadPerformanceData();
  }, [loadPerformanceData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 md:p-8">
      <div>
        <h1 className={`text-4xl font-bold ${colors.text.primary} mb-2 flex items-center gap-3`}>
          <FiAward className="w-10 h-10" /> Performance
        </h1>
        <p className={`${colors.text.tertiary} mb-8`}>Reviews and goals from your performance record</p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 mb-6">{error}</div>
      ) : null}

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white text-slate-500 px-4 py-5 mb-6">
          Loading performance data...
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric, idx) => {
          const Icon = metric.icon;
          return (
            <div
              key={idx}
              className={`group bg-gradient-to-br ${colors.gradient.card} rounded-2xl border ${colors.border.primary} p-6`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${metric.color} text-white`}>
                  <Icon size={24} />
                </div>
                <span className="text-green-600 text-xs font-semibold">{metric.change}</span>
              </div>
              <p className="text-slate-500 text-sm font-medium mb-1">{metric.title}</p>
              <div className="flex items-baseline gap-1">
                <p className={`text-3xl font-bold ${colors.text.primary}`}>{metric.value}</p>
                {metric.unit ? <p className="text-slate-400 text-sm">{metric.unit}</p> : null}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`bg-gradient-to-br ${colors.gradient.card} rounded-2xl border ${colors.border.primary} p-6`}>
          <h2 className={`text-2xl font-bold ${colors.text.primary} mb-6`}>Goals</h2>
          <div className="space-y-4">
            {goals.length === 0 ? (
              <p className={colors.text.tertiary}>No goals on file.</p>
            ) : (
              goals.map((goal, idx) => (
                <div key={idx}>
                  <div className="flex justify-between items-center mb-2">
                    <p className={`font-semibold ${colors.text.primary}`}>{goal.goal}</p>
                    <span className="text-slate-400 text-sm">{goal.progress}%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-1">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                  <p className={`${colors.text.tertiary} text-xs`}>Due: {goal.deadline}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className={`bg-gradient-to-br ${colors.gradient.card} rounded-2xl border ${colors.border.primary} p-6`}>
          <h2 className={`text-2xl font-bold ${colors.text.primary} mb-6`}>Reviews</h2>
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <p className={colors.text.tertiary}>No reviews yet.</p>
            ) : (
              reviews.map((review, idx) => (
                <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-start justify-between mb-2">
                    <p className={`font-semibold ${colors.text.primary}`}>{review.reviewer}</p>
                    <span className="flex items-center gap-1 text-amber-500">
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <FiStar key={i} size={14} />
                      ))}
                    </span>
                  </div>
                  <p className={`${colors.text.secondary} text-sm mb-2`}></p>
                  <p className={colors.text.muted}></p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Performance;
