import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FiCheck, FiEdit2, FiPlus, FiRefreshCw, FiSave, FiShield, FiTrash2, FiX } from 'react-icons/fi';
import {
  approveInsuranceSubmission,
  fetchPendingInsuranceSubmissions,
  formatInr,
  formatNomineeDob,
  INSURANCE_RELATION_OPTIONS,
  nomineesToFormRows,
  rejectInsuranceSubmission,
  updateInsuranceSubmissionByHr,
} from '../../../services/insuranceApi';
import ModulePageLayout from '../operations/ModulePageLayout';

const RELATION_LABELS = Object.fromEntries(
  INSURANCE_RELATION_OPTIONS.map((o) => [o.value, o.label]),
);

const formatName = (emp) =>
  [emp?.firstName, emp?.middleName, emp?.lastName].filter(Boolean).join(' ') || '—';

const HrNomineeEditor = ({ addons, editRows, setEditRows, editAddons, setEditAddons }) => {
  const usedRelations = useMemo(
    () => new Set(editRows.map((r) => r.relation).filter(Boolean)),
    [editRows],
  );

  const updateRow = (index, field, value) => {
    setEditRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  };

  const addRow = () => {
    if (editRows.length >= 5) return;
    const next =
      INSURANCE_RELATION_OPTIONS.find((o) => !usedRelations.has(o.value))?.value || 'FATHER';
    setEditRows((prev) => [...prev, { name: '', dateOfBirth: '', relation: next }]);
  };

  const removeRow = (index) => {
    if (editRows.length <= 1) return;
    setEditRows((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleAddon = (id) => {
    const sid = String(id);
    setEditAddons((prev) =>
      prev.includes(sid) ? prev.filter((x) => x !== sid) : [...prev, sid],
    );
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-600">
        Correct nominee names, dates, or relations before approving. Changes are saved when you
        click Save or Save &amp; approve.
      </p>
      {editRows.map((r, index) => (
        <div
          key={`nominee-${index}`}
          className="grid gap-2 md:grid-cols-4 items-end border-b border-slate-200 pb-3 last:border-0"
        >
          <input
            type="text"
            placeholder="Name"
            value={r.name}
            onChange={(e) => updateRow(index, 'name', e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
          />
          <input
            type="date"
            value={r.dateOfBirth}
            onChange={(e) => updateRow(index, 'dateOfBirth', e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
          />
          <select
            value={r.relation}
            onChange={(e) => updateRow(index, 'relation', e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
          >
            {INSURANCE_RELATION_OPTIONS.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
                disabled={usedRelations.has(opt.value) && r.relation !== opt.value}
              >
                {opt.label}
              </option>
            ))}
          </select>
          {editRows.length > 1 ? (
            <button
              type="button"
              onClick={() => removeRow(index)}
              className="text-red-600 p-2"
              aria-label="Remove nominee"
            >
              <FiTrash2 />
            </button>
          ) : (
            <span />
          )}
        </div>
      ))}
      {editRows.length < 5 ? (
        <button type="button" onClick={addRow} className="text-sm text-blue-600 inline-flex gap-1">
          <FiPlus /> Add nominee
        </button>
      ) : null}
      {addons?.length > 0 ? (
        <div>
          <p className="text-xs font-medium text-slate-600 mb-2">Add-ons</p>
          <ul className="space-y-1">
            {addons.map((a) => (
              <li key={a._id} className="text-sm flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editAddons.includes(String(a._id))}
                  onChange={() => toggleAddon(a._id)}
                />
                <span>
                  {a.label} — {formatInr(a.amount)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
};

const InsuranceApprovals = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [editingSubmission, setEditingSubmission] = useState(null);
  const [editRows, setEditRows] = useState([]);
  const [editAddons, setEditAddons] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      setRows(await fetchPendingInsuranceSubmissions());
    } catch (err) {
      setMessage({
        type: 'error',
        text: err?.response?.data?.message || 'Failed to load pending insurance submissions',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const closeReviewModal = useCallback(() => {
  if (busy) return;
  setEditingSubmission(null);
  setEditRows([]);
  setEditAddons([]);
}, [busy]);

  useEffect(() => {
    if (!editingSubmission) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && !busy) closeReviewModal();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [editingSubmission, closeReviewModal, busy]);



  const openReviewModal = (row) => {
    setEditingSubmission(row);
    setEditRows(nomineesToFormRows(row.nominees, INSURANCE_RELATION_OPTIONS));
    setEditAddons((row.selectedAddonIds || []).map((id) => String(id)));
  };

  const buildHrPayload = () => ({
    nominees: editRows
      .filter((r) => r.name?.trim())
      .map((r) => ({
        name: r.name.trim(),
        dateOfBirth: r.dateOfBirth,
        relation: r.relation,
      })),
    selectedAddonIds: editAddons,
  });

  const handleSaveEdits = async (id) => {
    setBusy(`save-${id}`);
    try {
      await updateInsuranceSubmissionByHr(id, buildHrPayload());
      setMessage({ type: 'success', text: 'Nominee details updated.' });
      const list = await fetchPendingInsuranceSubmissions();
      setRows(list);
      const updated = list.find((r) => r._id === id);
      if (updated) {
        setEditingSubmission(updated);
        setEditRows(nomineesToFormRows(updated.nominees, INSURANCE_RELATION_OPTIONS));
        setEditAddons((updated.selectedAddonIds || []).map((sid) => String(sid)));
      } else {
        closeReviewModal();
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err?.response?.data?.message || err.message || 'Save failed',
      });
    } finally {
      setBusy('');
    }
  };

  const handleApprove = async (id, { fromModal = false } = {}) => {
    setBusy(`approve-${id}`);
    try {
      if (fromModal || editingSubmission?._id === id) {
        await updateInsuranceSubmissionByHr(id, buildHrPayload());
      }
      await approveInsuranceSubmission(id);
      setMessage({ type: 'success', text: 'Insurance details approved.' });
      closeReviewModal();
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
    const remarks = window.prompt('Rejection reason (optional):');
    if (remarks === null) return;

    setBusy(`reject-${id}`);
    try {
      await rejectInsuranceSubmission(id, remarks || '');
      setMessage({ type: 'success', text: 'Insurance submission rejected. Employee can resubmit.' });
      closeReviewModal();
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

  const isBusy = Boolean(busy);

  return (
    <ModulePageLayout
      title="Insurance approvals"
      subtitle="Review submissions, correct small errors, then approve or reject"
      icon={FiShield}
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
              <th className="px-4 py-3">Cycle</th>
              <th className="px-4 py-3">Nominees</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && !loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No pending insurance submissions.
                </td>
              </tr>
            ) : null}
            {rows.map((r) => (
              <tr key={r._id} className="border-t">
                <td className="px-4 py-3">
                  <div className="font-medium">{formatName(r.employee)}</div>
                  <div className="text-xs text-slate-500">{r.employee?.email}</div>
                </td>
                <td className="px-4 py-3">
                  <div>{r.cycle?.title || '—'}</div>
                  <div className="text-xs text-slate-500">
                    Base {formatInr(r.cycle?.baseCoverageAmount || 300000)}
                  </div>
                </td>
                <td className="px-4 py-3">{r.nominees?.length || 0}</td>
                <td className="px-4 py-3">
                  {r.submittedAt ? new Date(r.submittedAt).toLocaleString('en-IN') : '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => openReviewModal(r)}
                      className="text-blue-600 text-xs hover:underline inline-flex items-center gap-0.5"
                    >
                      <FiEdit2 className="h-3 w-3" /> Review
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleApprove(r._id)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-600 text-white text-xs"
                    >
                      <FiCheck /> Approve
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleReject(r._id)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded border text-red-700 text-xs"
                    >
                      <FiX /> Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingSubmission ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="review-submission-title"
          onClick={closeReviewModal}
        >
          <div
            className="w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 shrink-0">
              <div>
                <h2 id="review-submission-title" className="text-lg font-semibold text-slate-900">
                  Review insurance submission
                </h2>
                <p className="text-sm text-slate-700 mt-1 font-medium">
                  {formatName(editingSubmission.employee)}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editingSubmission.employee?.email} · {editingSubmission.cycle?.title || '—'} ·
                  Base {formatInr(editingSubmission.cycle?.baseCoverageAmount || 300000)}
                </p>
              </div>
              <button
                type="button"
                onClick={closeReviewModal}
                disabled={isBusy}
                className="h-8 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                aria-label="Close"
              >
                Close
              </button>
            </div>

            <div className="overflow-y-auto px-5 py-4 flex-1">
              <HrNomineeEditor
                addons={editingSubmission.cycle?.addons}
                editRows={editRows}
                setEditRows={setEditRows}
                editAddons={editAddons}
                setEditAddons={setEditAddons}
              />

              <div className="mt-4 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
                <p className="text-xs font-medium text-slate-600 mb-2">Submitted as</p>
                <ul className="text-xs text-slate-600 space-y-1">
                  {(editingSubmission.nominees || []).map((n, i) => (
                    <li key={i}>
                      {n.name} — {RELATION_LABELS[n.relation] || n.relation}, DOB{' '}
                      {formatNomineeDob(n.dateOfBirth) || '—'}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 border-t border-slate-200 px-5 py-4 shrink-0 bg-slate-50">
              <button
                type="button"
                disabled={isBusy}
                onClick={() => handleSaveEdits(editingSubmission._id)}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border bg-white text-sm"
              >
                <FiSave /> Save changes
              </button>
              <button
                type="button"
                disabled={isBusy}
                onClick={() => handleApprove(editingSubmission._id, { fromModal: true })}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm"
              >
                <FiCheck /> Save &amp; approve
              </button>
              <button
                type="button"
                disabled={isBusy}
                onClick={() => handleReject(editingSubmission._id)}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border text-red-700 text-sm bg-white"
              >
                <FiX /> Reject
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </ModulePageLayout>
  );
};

export default InsuranceApprovals;
