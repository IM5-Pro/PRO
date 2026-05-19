import React, { useCallback, useEffect, useState } from 'react';
import { FiCheck, FiRefreshCw, FiUser, FiX } from 'react-icons/fi';
import {
  approveProfileChange,
  fetchPendingProfileChanges,
  rejectProfileChange,
} from '../../../services/profileChangeApi';
import ModulePageLayout from '../operations/ModulePageLayout';

const formatName = (emp) =>
  [emp?.firstName, emp?.middleName, emp?.lastName].filter(Boolean).join(' ') || '—';

const ProfileChangeApprovals = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  const load = useCallback(async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      setRows(await fetchPendingProfileChanges());
    } catch (err) {
      setMessage({
        type: 'error',
        text: err?.response?.data?.message || 'Failed to load pending profile changes',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleApprove = async (id) => {
    setBusy(`approve-${id}`);
    try {
      await approveProfileChange(id);
      setMessage({ type: 'success', text: 'Profile changes approved.' });
      await load();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err?.response?.data?.message || 'Approval failed',
      });
    } finally {
      setBusy('');
    }
  };

  const handleReject = async (id) => {
    const remarks = window.prompt('Rejection reason (optional):') || '';
    setBusy(`reject-${id}`);
    try {
      await rejectProfileChange(id, remarks);
      setMessage({ type: 'success', text: 'Profile changes rejected.' });
      await load();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err?.response?.data?.message || 'Rejection failed',
      });
    } finally {
      setBusy('');
    }
  };

  return (
    <ModulePageLayout
      title="Profile approvals"
      subtitle="Review employee profile updates and onboarding submissions"
      icon={FiUser}
      actions={
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border bg-white text-sm"
        >
          <FiRefreshCw className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      }
    >
      {message.text ? (
        <div
          className={`mb-4 rounded-lg px-4 py-2 text-sm ${
            message.type === 'error' ? 'bg-red-50 text-red-800' : 'bg-emerald-50 text-emerald-800'
          }`}
        >
          {message.text}
        </div>
      ) : null}

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r._id} className="border-t">
                <td className="px-4 py-3">
                  <div className="font-medium">{formatName(r.employee)}</div>
                  <div className="text-xs text-slate-500">{r.employee?.email}</div>
                </td>
                <td className="px-4 py-3">{r.employee?.department || '—'}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800">
                    {r.requestType === 'ONBOARDING' ? 'Onboarding' : 'Update'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {r.submittedAt
                    ? new Date(r.submittedAt).toLocaleString()
                    : new Date(r.updatedAt).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-emerald-600 font-medium"
                    disabled={!!busy}
                    onClick={() => handleApprove(r._id)}
                  >
                    <FiCheck /> Approve
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-red-600 font-medium"
                    disabled={!!busy}
                    onClick={() => handleReject(r._id)}
                  >
                    <FiX /> Reject
                  </button>
                </td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                  No profile changes awaiting approval
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </ModulePageLayout>
  );
};

export default ProfileChangeApprovals;
