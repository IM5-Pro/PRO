import React, { useCallback, useEffect, useState } from 'react';
import { FiBriefcase, FiPlus, FiRefreshCw, FiUserPlus } from 'react-icons/fi';
import ModulePageLayout from './ModulePageLayout';
import {
  createRecruitmentJob,
  fetchRecruitmentCandidates,
  fetchRecruitmentInterviews,
  fetchRecruitmentJobs,
  hireRecruitmentCandidate,
  rejectRecruitmentCandidate,
  scheduleRecruitmentInterview,
  toErrorMessage,
} from '../../../services/operationsModulesApi';

const emptyJob = {
  title: '',
  description: '',
  department: '',
  location: '',
  jobType: 'FULL_TIME',
  vacancies: 1,
  salaryMin: '',
  salaryMax: '',
};

const RecruitmentManagement = () => {
  const [tab, setTab] = useState('jobs');
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [jobForm, setJobForm] = useState(emptyJob);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [banner, setBanner] = useState({ type: '', text: '' });

  const loadJobs = useCallback(async () => {
    const rows = await fetchRecruitmentJobs();
    setJobs(rows);
    if (!selectedJobId && rows[0]?._id) setSelectedJobId(rows[0]._id);
  }, [selectedJobId]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setBanner({ type: '', text: '' });
    try {
      const rows = await fetchRecruitmentJobs();
      setJobs(rows);
      const jobFilter =
        rows.find((j) => j._id === selectedJobId)?._id || rows[0]?._id || '';
      if (jobFilter && jobFilter !== selectedJobId) {
        setSelectedJobId(jobFilter);
      }
      const [cand, ints] = await Promise.all([
        fetchRecruitmentCandidates(jobFilter || undefined),
        fetchRecruitmentInterviews(jobFilter ? { jobId: jobFilter } : {}),
      ]);
      setCandidates(cand);
      setInterviews(ints);
    } catch (err) {
      setBanner({ type: 'error', text: toErrorMessage(err, 'Failed to load recruitment data') });
    } finally {
      setLoading(false);
    }
  }, [selectedJobId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (!selectedJobId) return;
    (async () => {
      try {
        setCandidates(await fetchRecruitmentCandidates(selectedJobId));
        setInterviews(await fetchRecruitmentInterviews({ jobId: selectedJobId }));
      } catch {
        /* ignore */
      }
    })();
  }, [selectedJobId]);

  const handleCreateJob = async (e) => {
    e.preventDefault();
    setBusy('job');
    try {
      const salaryMin = Number(jobForm.salaryMin);
      const salaryMax = Number(jobForm.salaryMax);
      await createRecruitmentJob({
        title: jobForm.title.trim(),
        description: jobForm.description.trim(),
        department: jobForm.department.trim(),
        location: jobForm.location.trim(),
        jobType: jobForm.jobType,
        vacancies: Number(jobForm.vacancies) || 1,
        salaryRange: {
          min: Number.isFinite(salaryMin) ? salaryMin : 0,
          max: Number.isFinite(salaryMax) ? salaryMax : 0,
        },
      });
      setJobForm(emptyJob);
      setBanner({ type: 'success', text: 'Job posted successfully.' });
      await loadAll();
    } catch (err) {
      setBanner({ type: 'error', text: toErrorMessage(err, 'Failed to create job') });
    } finally {
      setBusy('');
    }
  };

  const handleHire = async (id) => {
    setBusy(`hire-${id}`);
    try {
      await hireRecruitmentCandidate(id);
      setBanner({ type: 'success', text: 'Candidate marked as hired.' });
      await loadAll();
    } catch (err) {
      setBanner({ type: 'error', text: toErrorMessage(err) });
    } finally {
      setBusy('');
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Rejection reason (optional):') || '';
    setBusy(`reject-${id}`);
    try {
      await rejectRecruitmentCandidate(id, reason);
      setBanner({ type: 'success', text: 'Candidate rejected.' });
      await loadAll();
    } catch (err) {
      setBanner({ type: 'error', text: toErrorMessage(err) });
    } finally {
      setBusy('');
    }
  };

  const handleScheduleInterview = async (candidateId) => {
    if (!selectedJobId) return;
    const scheduledDate = window.prompt('Interview date (YYYY-MM-DD):', new Date().toISOString().slice(0, 10));
    if (!scheduledDate) return;
    const scheduledTime = window.prompt('Time (HH:MM):', '10:00') || '10:00';
    setBusy(`int-${candidateId}`);
    try {
      await scheduleRecruitmentInterview({
        candidateId,
        jobId: selectedJobId,
        interviewType: 'TECHNICAL',
        scheduledDate,
        scheduledTime,
      });
      setBanner({ type: 'success', text: 'Interview scheduled.' });
      await loadAll();
    } catch (err) {
      setBanner({ type: 'error', text: toErrorMessage(err) });
    } finally {
      setBusy('');
    }
  };

  const tabBtn = (id, label) => (
    <button
      type="button"
      key={id}
      onClick={() => setTab(id)}
      className={`px-4 py-2 rounded-lg text-sm font-medium ${
        tab === id ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
      }`}
    >
      {label}
    </button>
  );

  return (
    <ModulePageLayout
      title="Recruitment"
      subtitle="Manage job postings, candidates, and interviews"
      icon={FiUserPlus}
      actions={
        <button
          type="button"
          onClick={loadAll}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium"
        >
          <FiRefreshCw className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      }
    >
      {banner.text ? (
        <div
          className={`mb-4 rounded-lg px-4 py-2 text-sm ${
            banner.type === 'error' ? 'bg-red-50 text-red-800' : 'bg-emerald-50 text-emerald-800'
          }`}
        >
          {banner.text}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2 mb-6">
        {tabBtn('jobs', 'Jobs')}
        {tabBtn('candidates', 'Candidates')}
        {tabBtn('interviews', 'Interviews')}
      </div>

      {tab === 'jobs' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <form onSubmit={handleCreateJob} className="bg-white rounded-xl border border-slate-200 p-6 space-y-3">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <FiPlus /> Post new job
            </h2>
            <input
              required
              placeholder="Job title"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              value={jobForm.title}
              onChange={(e) => setJobForm((p) => ({ ...p, title: e.target.value }))}
            />
            <textarea
              required
              placeholder="Description"
              rows={3}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              value={jobForm.description}
              onChange={(e) => setJobForm((p) => ({ ...p, description: e.target.value }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                required
                placeholder="Department"
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
                value={jobForm.department}
                onChange={(e) => setJobForm((p) => ({ ...p, department: e.target.value }))}
              />
              <input
                required
                placeholder="Location"
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
                value={jobForm.location}
                onChange={(e) => setJobForm((p) => ({ ...p, location: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                min="0"
                placeholder="Salary min (₹)"
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
                value={jobForm.salaryMin}
                onChange={(e) => setJobForm((p) => ({ ...p, salaryMin: e.target.value }))}
              />
              <input
                type="number"
                min="0"
                placeholder="Salary max (₹)"
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
                value={jobForm.salaryMax}
                onChange={(e) => setJobForm((p) => ({ ...p, salaryMax: e.target.value }))}
              />
            </div>
            <button
              type="submit"
              disabled={busy === 'job'}
              className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-60"
            >
              {busy === 'job' ? 'Saving…' : 'Create job'}
            </button>
          </form>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left">
                <tr>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((j) => (
                  <tr
                    key={j._id}
                    className={`border-t border-slate-100 cursor-pointer hover:bg-slate-50 ${
                      selectedJobId === j._id ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedJobId(j._id)}
                  >
                    <td className="px-4 py-3 font-medium">{j.title}</td>
                    <td className="px-4 py-3">{j.department || '—'}</td>
                    <td className="px-4 py-3">{j.status || 'OPEN'}</td>
                  </tr>
                ))}
                {!loading && jobs.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                      No jobs yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'candidates' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center gap-3">
            <FiBriefcase className="text-slate-400" />
            <select
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
            >
              <option value="">All jobs</option>
              {jobs.map((j) => (
                <option key={j._id} value={j._id}>
                  {j.title}
                </option>
              ))}
            </select>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((c) => (
                <tr key={c._id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    {c.firstName} {c.lastName}
                  </td>
                  <td className="px-4 py-3">{c.email}</td>
                  <td className="px-4 py-3">{c.status}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      type="button"
                      className="text-blue-600 text-xs font-medium"
                      onClick={() => handleScheduleInterview(c._id)}
                      disabled={!!busy}
                    >
                      Schedule
                    </button>
                    <button
                      type="button"
                      className="text-emerald-600 text-xs font-medium"
                      onClick={() => handleHire(c._id)}
                      disabled={busy === `hire-${c._id}`}
                    >
                      Hire
                    </button>
                    <button
                      type="button"
                      className="text-red-600 text-xs font-medium"
                      onClick={() => handleReject(c._id)}
                      disabled={busy === `reject-${c._id}`}
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && candidates.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    No candidates
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'interviews' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-4 py-3">Candidate</th>
                <th className="px-4 py-3">Job</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Type</th>
              </tr>
            </thead>
            <tbody>
              {interviews.map((i) => (
                <tr key={i._id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    {i.candidateId?.firstName} {i.candidateId?.lastName}
                  </td>
                  <td className="px-4 py-3">{i.jobId?.title || '—'}</td>
                  <td className="px-4 py-3">
                    {i.scheduledDate
                      ? new Date(i.scheduledDate).toLocaleDateString()
                      : '—'}{' '}
                    {i.scheduledTime || ''}
                  </td>
                  <td className="px-4 py-3">{i.interviewType || '—'}</td>
                </tr>
              ))}
              {!loading && interviews.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    No interviews scheduled
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </ModulePageLayout>
  );
};

export default RecruitmentManagement;
