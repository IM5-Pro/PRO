import React, { useCallback, useEffect, useState } from 'react';
import { FiAward, FiPlus, FiRefreshCw } from 'react-icons/fi';
import ModulePageLayout from './ModulePageLayout';
import {
  approvePerformanceReview,
  createPerformanceGoal,
  createPerformanceReview,
  fetchEmployeesForSelect,
  fetchPerformanceGoals,
  fetchPerformanceReviews,
  toErrorMessage,
} from '../../../services/operationsModulesApi';

const PerformanceManagement = () => {
  const [tab, setTab] = useState('reviews');
  const [reviews, setReviews] = useState([]);
  const [goals, setGoals] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [reviewForm, setReviewForm] = useState({
    employeeId: '',
    reviewerId: '',
    rating: 4,
    comments: '',
  });
  const [goalForm, setGoalForm] = useState({
    employeeId: '',
    title: '',
    description: '',
    goalType: 'PERFORMANCE',
    startDate: '',
    endDate: '',
  });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState({ type: '', text: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, g, e] = await Promise.all([
        fetchPerformanceReviews(),
        fetchPerformanceGoals(),
        fetchEmployeesForSelect(),
      ]);
      setReviews(r);
      setGoals(g);
      setEmployees(e);
    } catch (err) {
      setBanner({ type: 'error', text: toErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const empName = (e) => (e ? [e.firstName, e.lastName].filter(Boolean).join(' ') : '—');

  const handleCreateReview = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await createPerformanceReview({
        ...reviewForm,
        rating: Number(reviewForm.rating),
        reviewDate: new Date().toISOString(),
      });
      setBanner({ type: 'success', text: 'Review created.' });
      await load();
    } catch (err) {
      setBanner({ type: 'error', text: toErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await approvePerformanceReview(id);
      setBanner({ type: 'success', text: 'Review approved.' });
      await load();
    } catch (err) {
      setBanner({ type: 'error', text: toErrorMessage(err) });
    }
  };

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await createPerformanceGoal(goalForm);
      setBanner({ type: 'success', text: 'Goal created.' });
      await load();
    } catch (err) {
      setBanner({ type: 'error', text: toErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModulePageLayout
      title="Performance management"
      subtitle="Reviews and goals tied to live performance APIs"
      icon={FiAward}
      actions={
        <button type="button" onClick={load} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border bg-white text-sm">
          <FiRefreshCw className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      }
    >
      {banner.text ? (
        <div className={`mb-4 rounded-lg px-4 py-2 text-sm ${banner.type === 'error' ? 'bg-red-50 text-red-800' : 'bg-emerald-50 text-emerald-800'}`}>
          {banner.text}
        </div>
      ) : null}

      <div className="flex gap-2 mb-6">
        {['reviews', 'goals'].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
              tab === t ? 'bg-blue-600 text-white' : 'bg-white border text-slate-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'reviews' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <form onSubmit={handleCreateReview} className="bg-white rounded-xl border p-6 space-y-3">
            <h2 className="font-semibold flex items-center gap-2">
              <FiPlus /> New review
            </h2>
            <select required className="w-full border rounded-lg px-3 py-2 text-sm" value={reviewForm.employeeId} onChange={(e) => setReviewForm((p) => ({ ...p, employeeId: e.target.value }))}>
              <option value="">Employee</option>
              {employees.map((e) => (
                <option key={e._id} value={e._id}>
                  {empName(e)}
                </option>
              ))}
            </select>
            <select required className="w-full border rounded-lg px-3 py-2 text-sm" value={reviewForm.reviewerId} onChange={(e) => setReviewForm((p) => ({ ...p, reviewerId: e.target.value }))}>
              <option value="">Reviewer</option>
              {employees.map((e) => (
                <option key={e._id} value={e._id}>
                  {empName(e)}
                </option>
              ))}
            </select>
            <input type="number" min={1} max={5} className="w-full border rounded-lg px-3 py-2 text-sm" value={reviewForm.rating} onChange={(e) => setReviewForm((p) => ({ ...p, rating: e.target.value }))} />
            <textarea placeholder="Comments" rows={3} className="w-full border rounded-lg px-3 py-2 text-sm" value={reviewForm.comments} onChange={(e) => setReviewForm((p) => ({ ...p, comments: e.target.value }))} />
            <button type="submit" disabled={busy} className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium">
              Save review
            </button>
          </form>
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-4 py-3">Employee</th>
                  <th className="text-left px-4 py-3">Rating</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((r) => (
                  <tr key={r._id} className="border-t">
                    <td className="px-4 py-3">{empName(r.employeeId)}</td>
                    <td className="px-4 py-3">{r.rating}</td>
                    <td className="px-4 py-3">{r.status || 'DRAFT'}</td>
                    <td className="px-4 py-3 text-right">
                      {r.status !== 'APPROVED' ? (
                        <button type="button" className="text-blue-600 text-xs font-medium" onClick={() => handleApprove(r._id)}>
                          Approve
                        </button>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'goals' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <form onSubmit={handleCreateGoal} className="bg-white rounded-xl border p-6 space-y-3">
            <h2 className="font-semibold flex items-center gap-2">
              <FiPlus /> New goal
            </h2>
            <select required className="w-full border rounded-lg px-3 py-2 text-sm" value={goalForm.employeeId} onChange={(e) => setGoalForm((p) => ({ ...p, employeeId: e.target.value }))}>
              <option value="">Employee</option>
              {employees.map((e) => (
                <option key={e._id} value={e._id}>
                  {empName(e)}
                </option>
              ))}
            </select>
            <input required placeholder="Title" className="w-full border rounded-lg px-3 py-2 text-sm" value={goalForm.title} onChange={(e) => setGoalForm((p) => ({ ...p, title: e.target.value }))} />
            <textarea placeholder="Description" rows={2} className="w-full border rounded-lg px-3 py-2 text-sm" value={goalForm.description} onChange={(e) => setGoalForm((p) => ({ ...p, description: e.target.value }))} />
            <div className="grid grid-cols-2 gap-2">
              <input type="date" required className="border rounded-lg px-3 py-2 text-sm" value={goalForm.startDate} onChange={(e) => setGoalForm((p) => ({ ...p, startDate: e.target.value }))} />
              <input type="date" required className="border rounded-lg px-3 py-2 text-sm" value={goalForm.endDate} onChange={(e) => setGoalForm((p) => ({ ...p, endDate: e.target.value }))} />
            </div>
            <button type="submit" disabled={busy} className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium">
              Save goal
            </button>
          </form>
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-4 py-3">Employee</th>
                  <th className="text-left px-4 py-3">Goal</th>
                  <th className="text-left px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {goals.map((g) => (
                  <tr key={g._id} className="border-t">
                    <td className="px-4 py-3">{empName(g.employeeId)}</td>
                    <td className="px-4 py-3">{g.title}</td>
                    <td className="px-4 py-3">{g.status || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </ModulePageLayout>
  );
};

export default PerformanceManagement;
