import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FiCheck, FiRefreshCw, FiTool, FiX } from 'react-icons/fi';
import ModulePageLayout from './ModulePageLayout';
import { useAuth } from '../../../context/AuthContext';
import {
  approveToolProvisioningTicket,
  fetchToolProvisioningTickets,
  rejectToolProvisioningTicket,
  toErrorMessage,
} from '../../../services/operationsModulesApi';
import { normalizeRole, ROLES } from '../../../utils/roles';

const formatName = (emp) =>
  emp ? [emp.firstName, emp.middleName, emp.lastName].filter(Boolean).join(' ') : '—';

const APPROVER_ROLES = new Set([
  ROLES.MANAGER,
  ROLES.HR_ADMIN,
  ROLES.DEPT_ADMIN,
  ROLES.SUPER_ADMIN,
]);

const ToolProvisioningPage = () => {
  const { user } = useAuth();
  const canApprove = useMemo(
    () => APPROVER_ROLES.has(normalizeRole(user?.role)),
    [user?.role],
  );

  const [tickets, setTickets] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [banner, setBanner] = useState({ type: '', text: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await fetchToolProvisioningTickets(statusFilter || undefined);
      setTickets(rows);
    } catch (err) {
      setBanner({ type: 'error', text: toErrorMessage(err, 'Failed to load tickets') });
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleApprove = async (id) => {
    setBusy(id);
    try {
      await approveToolProvisioningTicket(id);
      setBanner({ type: 'success', text: 'Ticket approved.' });
      await load();
    } catch (err) {
      setBanner({ type: 'error', text: toErrorMessage(err) });
    } finally {
      setBusy('');
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Rejection reason:') || '';
    if (!reason.trim()) return;
    setBusy(`r-${id}`);
    try {
      await rejectToolProvisioningTicket(id, reason);
      setBanner({ type: 'success', text: 'Ticket rejected.' });
      await load();
    } catch (err) {
      setBanner({ type: 'error', text: toErrorMessage(err) });
    } finally {
      setBusy('');
    }
  };

  return (
    <ModulePageLayout
      title="Tool provisioning"
      subtitle="Review and approve access / tool requests for new hires"
      icon={FiTool}
      actions={
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm"
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

      <div className="mb-4 flex flex-wrap gap-2 items-center">
        <label className="text-sm text-slate-600">Status</label>
        <select
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All</option>
          <option value="PENDING_MANAGER_APPROVAL">Pending manager</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="PENDING_IT_INSTALL">Pending IT</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Project</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((t) => (
              <tr key={t._id} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  <div className="font-medium">{formatName(t.employeeId)}</div>
                  <div className="text-xs text-slate-500">{t.employeeId?.email}</div>
                </td>
                <td className="px-4 py-3">
                  {t.projectId?.name || '—'}
                  {t.projectId?.code ? (
                    <span className="text-xs text-slate-400 ml-1">({t.projectId.code})</span>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-xs font-medium">
                    {t.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '—'}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  {t.status === 'PENDING_MANAGER_APPROVAL' && canApprove ? (
                    <>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-emerald-600 font-medium mr-3"
                        onClick={() => handleApprove(t._id)}
                        disabled={busy === t._id}
                      >
                        <FiCheck /> Approve
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-red-600 font-medium"
                        onClick={() => handleReject(t._id)}
                        disabled={busy === `r-${t._id}`}
                      >
                        <FiX /> Reject
                      </button>
                    </>
                  ) : (
                    <span className="text-slate-400 text-xs">—</span>
                  )}
                </td>
              </tr>
            ))}
            {!loading && tickets.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                  No tickets found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </ModulePageLayout>
  );
};

export default ToolProvisioningPage;
