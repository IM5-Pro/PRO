/**
 * Performance Page — live reviews & goals from /performance APIs
 */

import React, { useCallback, useEffect, useState } from 'react';
import { FiAward, FiCalendar, FiInfo, FiStar, FiTarget, FiTrendingUp } from 'react-icons/fi';
import API from '../../api/client';
import { ATTENDANCE_ENDPOINTS, LEAVE_ENDPOINTS } from '../../api/endpoints';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { ROLES, normalizeRole } from '../../utils/roles';
import { unwrapData, extractRows, toErrorMessage, toPayload } from '../../utils/apiHelpers';
import {
  fetchPerformanceGoals,
  fetchPerformanceReviews,
} from '../../services/operationsModulesApi';

const TEAM_ROLES = new Set([ROLES.MANAGER, ROLES.HR_ADMIN, ROLES.SUPER_ADMIN, ROLES.DEPT_ADMIN]);

/** Indian financial year label, e.g. "2025-26" (April–March). */
const getFinancialYearLabel = (date = new Date()) => {
  const month = date.getMonth();
  const year = date.getFullYear();
  const startYear = month >= 3 ? year : year - 1;
  const endYearShort = String(startYear + 1).slice(-2);
  return `${startYear}-${endYearShort}`;
};

const Performance = () => {
  const { colors } = useTheme();
  const { user = {} } = useAuth();
  const userRole = normalizeRole(user?.role);
  const isTeamView = TEAM_ROLES.has(userRole);
  const employeeId = user?.employeeId || user?.employee?._id;
  const financialYear = getFinancialYearLabel();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasPerformanceReview, setHasPerformanceReview] = useState(false);
  const [metrics, setMetrics] = useState([]);
  const [goals, setGoals] = useState([]);
  const [reviews, setReviews] = useState([]);

  const loadPerformanceData = useCallback(async () => {
    setLoading(true);
    setError('');
    setHasPerformanceReview(false);
    setMetrics([]);
    setGoals([]);
    setReviews([]);

    try {
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

      if (performanceReviews.length === 0) {
        return;
      }

      setHasPerformanceReview(true);

      const [attendanceResponse, leaveResponse] = await Promise.all([
        API.get(ATTENDANCE_ENDPOINTS.monthlySummary),
        API.get(isTeamView ? LEAVE_ENDPOINTS.team : LEAVE_ENDPOINTS.own),
      ]);

      const leaveRows = extractRows(unwrapData(toPayload(leaveResponse)), ['leaves', 'records']);
      const summary = unwrapData(toPayload(attendanceResponse));

      const presentDays = Number(summary?.daysPresent ?? summary?.presentDays ?? 0);
      const absentDays = Number(summary?.daysAbsent ?? summary?.absentDays ?? 0);
      const totalDays = presentDays + absentDays;
      const productivity =
        totalDays > 0 ? (presentDays / totalDays) * 100 : Number(summary?.attendanceRate ?? 0);
      const pendingLeaves = leaveRows.filter(
        (row) => String(row?.status || '').toUpperCase() === 'PENDING',
      ).length;

      const avgRating =
        performanceReviews.reduce((sum, r) => sum + Number(r.rating ?? r.score ?? 0), 0) /
        performanceReviews.length;

      setMetrics([
        {
          title: 'Overall Rating',
          value: avgRating ? avgRating.toFixed(1) : '—',
          unit: '/5.0',
          icon: FiAward,
          color: 'from-blue-500 to-indigo-600',
          badgeClass: 'badge-info',
          change: `${performanceReviews.length} review${performanceReviews.length === 1 ? '' : 's'}`,
        },
        {
          title: 'Attendance Score',
          value: `${Math.max(0, Math.min(100, productivity)).toFixed(1)}%`,
          unit: '',
          icon: FiTrendingUp,
          color: 'from-emerald-500 to-green-600',
          badgeClass: 'badge-success',
          change: `${presentDays} present days`,
        },
        {
          title: 'Active Goals',
          value: String(
            performanceGoals.filter((g) => String(g.status || '').toLowerCase() !== 'completed').length,
          ),
          unit: 'open',
          icon: FiTarget,
          color: 'from-violet-500 to-purple-600',
          badgeClass: 'badge-warning',
          change: `${performanceGoals.length} total`,
        },
        {
          title: 'Pending Leaves',
          value: String(pendingLeaves),
          unit: 'requests',
          icon: FiCalendar,
          color: 'from-amber-500 to-orange-600',
          badgeClass: 'badge-warning',
          change: 'This month',
        },
      ]);

      setGoals(
        performanceGoals.slice(0, 8).map((goal) => ({
          goal: goal.title || goal.name || 'Goal',
          progress: Math.max(0, Math.min(100, Number(goal.progress ?? goal.completion ?? 0))),
          deadline: goal.dueDate
            ? new Date(goal.dueDate).toLocaleDateString('en-IN')
            : goal.status || 'In progress',
        })),
      );

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
    } catch (err) {
      setError(toErrorMessage(err, 'Failed to load performance data'));
      setHasPerformanceReview(false);
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

  const renderStars = (rating) => (
    <span className="inline-flex items-center gap-0.5 text-amber-500" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <FiStar
          key={index}
          size={14}
          className={index < rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}
        />
      ))}
    </span>
  );

  const progressBarClass = (progress) => {
    if (progress >= 75) return 'from-emerald-500 to-green-500';
    if (progress >= 40) return 'from-blue-500 to-indigo-500';
    return 'from-amber-400 to-orange-500';
  };

  return (
    <div className="min-h-screen bg-im5-page p-6 md:p-8">
      <div className="glass mb-8 animate-slideInDown backdrop-blur-xl">
        <h1 className={`mb-2 flex items-center gap-3 text-4xl font-bold ${colors.text.primary}`}>
          <FiAward className="h-10 w-10 text-indigo-600" aria-hidden />
          Performance
        </h1>
        <p className={colors.text.tertiary}>
          {hasPerformanceReview
            ? isTeamView
              ? 'Team performance insights, goals, and review summaries'
              : 'Track your goals, ratings, and performance reviews'
            : `Financial year ${financialYear}`}
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <div className={`card mb-8 flex items-center justify-center gap-3 py-12 ${colors.text.tertiary}`}>
          <span className="spinner" aria-hidden />
          <span>Loading performance data...</span>
        </div>
      )}

      {!loading && !error && !hasPerformanceReview && (
        <div className="card mx-auto max-w-2xl animate-fadeInUp py-14 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <FiInfo size={32} aria-hidden />
          </div>
          <h2 className={`mb-3 text-xl font-bold ${colors.text.primary}`}>Performance not released</h2>
          <p className={`mx-auto max-w-md text-sm leading-relaxed ${colors.text.secondary}`}>
            Performance for financial year {financialYear} has not been released yet. You will see your
            ratings, goals, and review details here once HR publishes your review.
          </p>
          <p className={`mt-4 text-xs ${colors.text.tertiary}`}>
            If you believe this is an error, please contact your HR team.
          </p>
        </div>
      )}

      {!loading && hasPerformanceReview && (
        <>
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric, idx) => {
              const Icon = metric.icon;
              return (
                <div
                  key={metric.title}
                  style={{ animationDelay: `${idx * 0.08}s` }}
                  className="group stat-card animate-fadeInUp hover-lift"
                >
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <div className={`icon-box bg-gradient-to-br ${metric.color} text-white`}>
                      <Icon size={22} />
                    </div>
                    <span className={`badge ${metric.badgeClass} shrink-0`}>{metric.change}</span>
                  </div>
                  <p className={`mb-2 text-sm font-medium ${colors.text.tertiary}`}>{metric.title}</p>
                  <div className="flex items-baseline gap-1">
                    <p className={`text-3xl font-bold tabular-nums ${colors.text.primary}`}>{metric.value}</p>
                    {metric.unit ? (
                      <p className={`text-sm ${colors.text.tertiary}`}>{metric.unit}</p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="card animate-fadeInUp">
              <h2 className={`mb-5 flex items-center gap-2 text-xl font-bold ${colors.text.primary}`}>
                <FiTarget className="text-violet-600" size={20} aria-hidden />
                Goals
              </h2>
              <div className="space-y-5">
                {goals.length === 0 ? (
                  <p
                    className={`rounded-xl border border-dashed border-im5-border-soft bg-slate-50 px-4 py-8 text-center text-sm ${colors.text.tertiary}`}
                  >
                    No goals on file for this review period.
                  </p>
                ) : (
                  goals.map((goal, idx) => (
                    <div
                      key={`${goal.goal}-${idx}`}
                      className="rounded-xl border border-im5-border-soft bg-slate-50/80 px-4 py-3 transition-colors hover:bg-white"
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <p className={`font-semibold ${colors.text.primary}`}>{goal.goal}</p>
                        <span className="text-sm font-semibold tabular-nums text-indigo-700">
                          {goal.progress}%
                        </span>
                      </div>
                      <div className="mb-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${progressBarClass(goal.progress)} transition-all duration-500`}
                          style={{ width: `${goal.progress}%` }}
                        />
                      </div>
                      <p className={`text-xs ${colors.text.tertiary}`}>Due: {goal.deadline}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="card animate-fadeInUp" style={{ animationDelay: '0.08s' }}>
              <h2 className={`mb-5 flex items-center gap-2 text-xl font-bold ${colors.text.primary}`}>
                <FiStar className="text-amber-500" size={20} aria-hidden />
                Reviews
              </h2>
              <div className="space-y-4">
                {reviews.map((review, idx) => (
                  <div
                    key={`${review.reviewer}-${idx}`}
                    className="rounded-xl border border-im5-border-soft bg-white px-4 py-3 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <p className={`font-semibold ${colors.text.primary}`}>{review.reviewer}</p>
                      {renderStars(review.rating)}
                    </div>
                    <p className={`mb-2 text-sm leading-relaxed ${colors.text.secondary}`}>{review.feedback}</p>
                    <p className={`text-xs ${colors.text.tertiary}`}>{review.date}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Performance;
