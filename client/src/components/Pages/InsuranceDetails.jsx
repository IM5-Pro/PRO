import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FiAlertCircle, FiCheck, FiPlus, FiRefreshCw, FiShield, FiTrash2 } from 'react-icons/fi';
import {
  fetchMyInsuranceContext,
  formatInr,
  nomineesToFormRows,
  saveMyInsuranceSubmission,
} from '../../services/insuranceApi';

const MAX_NOMINEES = 5;

const statusBadge = (status) => {
  const map = {
    DRAFT: 'bg-slate-100 text-slate-700',
    PENDING: 'bg-amber-100 text-amber-800',
    APPROVED: 'bg-emerald-100 text-emerald-800',
    REJECTED: 'bg-red-100 text-red-800',
  };
  return map[status] || 'bg-slate-100 text-slate-700';
};

const InsuranceDetails = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [context, setContext] = useState(null);
  const [rows, setRows] = useState([{ name: '', dateOfBirth: '', relation: 'FATHER' }]);
  const [selectedAddonIds, setSelectedAddonIds] = useState([]);

  const relationOptions = context?.relationOptions || [];
  const cycle = context?.cycle;
  const submission = context?.submission;
  const lastApproved = context?.lastApproved;
  const canEdit = Boolean(context?.canEdit);
  const lockReason = context?.lockReason;

  const baseCoverage = cycle?.baseCoverageAmount ?? context?.baseCoverageDefault ?? 300000;

  const selectedAddons = useMemo(() => {
    const addons = cycle?.addons || [];
    const idSet = new Set((selectedAddonIds || []).map(String));
    return addons.filter((a) => idSet.has(String(a._id)));
  }, [cycle?.addons, selectedAddonIds]);

  const totalCoverage = useMemo(() => {
    const addonSum = selectedAddons.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
    return baseCoverage + addonSum;
  }, [baseCoverage, selectedAddons]);

  const applyContextToForm = useCallback((ctx, submissionOverride) => {
    if (!ctx) return;
    setContext(ctx);
    const sub = submissionOverride || ctx.submission;
    const activeSubmission =
      sub && ['DRAFT', 'PENDING', 'REJECTED'].includes(sub.status) ? sub : sub || ctx.lastApproved;
    setRows(nomineesToFormRows(activeSubmission?.nominees, ctx.relationOptions));
    setSelectedAddonIds((activeSubmission?.selectedAddonIds || []).map((id) => String(id)));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const ctx = await fetchMyInsuranceContext();
      applyContextToForm(ctx);
    } catch (err) {
      setMessage({
        type: 'error',
        text: err?.response?.data?.message || err.message || 'Failed to load insurance details',
      });
    } finally {
      setLoading(false);
    }
  }, [applyContextToForm]);

  useEffect(() => {
    load();
  }, [load]);

  const usedRelations = useMemo(() => new Set(rows.map((r) => r.relation).filter(Boolean)), [rows]);

  const addRow = () => {
    if (rows.length >= MAX_NOMINEES) return;
    const nextRelation =
      relationOptions.find((o) => !usedRelations.has(o.value))?.value ||
      relationOptions[0]?.value ||
      '';
    setRows([...rows, { name: '', dateOfBirth: '', relation: nextRelation }]);
  };

  const removeRow = (index) => {
    if (rows.length <= 1) return;
    setRows(rows.filter((_, i) => i !== index));
  };

  const updateRow = (index, field, value) => {
    setRows(rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };

  const toggleAddon = (addonId) => {
    const id = String(addonId);
    setSelectedAddonIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const buildPayload = () => ({
    nominees: rows
      .filter((r) => r.name?.trim())
      .map((r) => ({
        name: r.name.trim(),
        dateOfBirth: r.dateOfBirth,
        relation: r.relation,
      })),
    selectedAddonIds,
  });

  const handleSaveDraft = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const { submission } = await saveMyInsuranceSubmission(buildPayload(), {
        submitForApproval: false,
      });
      setMessage({ type: 'success', text: 'Draft saved.' });
      if (submission) {
        const ctx = await fetchMyInsuranceContext();
        applyContextToForm(ctx, submission);
      } else {
        await load();
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err?.response?.data?.message || err.message || 'Failed to save draft',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    const filled = rows.filter((r) => r.name?.trim());
    if (filled.length === 0) {
      setMessage({ type: 'error', text: 'Add at least one nominee before submitting.' });
      return;
    }
    if (
      !window.confirm(
        'Submit nominee details for HR approval? You cannot change them after approval until HR opens an update cycle.',
      )
    ) {
      return;
    }
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const { submission: saved } = await saveMyInsuranceSubmission(buildPayload(), {
        submitForApproval: true,
      });
      setMessage({
        type: 'success',
        text: 'Submitted for HR approval. Your details are locked until HR reviews them.',
      });
      const ctx = await fetchMyInsuranceContext();
      applyContextToForm(ctx, saved);
    } catch (err) {
      setMessage({
        type: 'error',
        text: err?.response?.data?.message || err.message || 'Submission failed',
      });
    } finally {
      setSaving(false);
    }
  };

  const displayStatus =
    submission?.status ||
    (lastApproved && !submission ? 'APPROVED' : null);
  const showNomineeSection =
    canEdit ||
    (submission?.nominees?.length > 0) ||
    (lastApproved?.nominees?.length > 0);
  const readOnly = !canEdit;

  return (
    <div className="min-h-full bg-im5-page p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <FiShield className="h-8 w-8 text-blue-600" aria-hidden />
          Insurance details
        </h1>
        <p className="text-slate-600 mt-1 text-sm">
          Nominate up to 5 family members (parents, in-laws, spouse, child 1 &amp; child 2). Base
          cover {formatInr(300000)} plus optional add-ons selected below.
        </p>
      </div>

      {message.text ? (
        <div
          className={`mb-4 rounded-lg px-4 py-2 text-sm ${
            message.type === 'error' ? 'bg-red-50 text-red-800' : 'bg-emerald-50 text-emerald-800'
          }`}
        >
          {message.text}
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border bg-white text-sm"
        >
          <FiRefreshCw className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <div className="bg-white rounded-xl border p-4">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Base cover</p>
              <p className="text-xl font-semibold text-slate-900 mt-1">{formatInr(baseCoverage)}</p>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Add-ons selected</p>
              <p className="text-xl font-semibold text-slate-900 mt-1">
                {formatInr(totalCoverage - baseCoverage)}
              </p>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Total indicative cover</p>
              <p className="text-xl font-semibold text-blue-700 mt-1">{formatInr(totalCoverage)}</p>
            </div>
          </div>

          {cycle ? (
            <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
              <strong>{cycle.title}</strong>
              <span className="ml-2 text-blue-700">
                ({cycle.cycleType === 'UPDATE' ? 'Update window' : 'Initial enrollment'})
              </span>
              {cycle.description ? <p className="mt-1 text-blue-800">{cycle.description}</p> : null}
            </div>
          ) : (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <FiAlertCircle className="shrink-0 mt-0.5" />
              <span>
                No enrollment window is open. Contact HR when they announce the next insurance
                cycle.
              </span>
            </div>
          )}

          {displayStatus === 'PENDING' ? (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <FiAlertCircle className="shrink-0 mt-0.5" />
              <span>
                Submitted and awaiting HR approval. You cannot edit until HR approves or rejects.
              </span>
            </div>
          ) : null}

          {lockReason && !canEdit && displayStatus !== 'PENDING' ? (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <FiAlertCircle className="shrink-0 mt-0.5" />
              <span>{lockReason}</span>
            </div>
          ) : null}

          {displayStatus ? (
            <div className="mb-4">
              <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge(displayStatus)}`}>
                {displayStatus}
              </span>
              {submission?.reviewRemarks && submission.status === 'REJECTED' ? (
                <p className="mt-2 text-sm text-red-700">HR remarks: {submission.reviewRemarks}</p>
              ) : null}
            </div>
          ) : null}

          {showNomineeSection ? (
            <div className="bg-white rounded-xl border overflow-hidden">
              <div className="px-4 py-3 border-b bg-slate-50 flex items-center justify-between">
                <h2 className="font-semibold text-slate-900">Nominees</h2>
                {canEdit && rows.length < MAX_NOMINEES ? (
                  <button
                    type="button"
                    onClick={addRow}
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                  >
                    <FiPlus /> Add member
                  </button>
                ) : null}
              </div>

              <div className="p-4 space-y-4">
                {rows.map((row, index) => (
                  <div
                    key={`nominee-${index}`}
                    className="grid gap-3 md:grid-cols-4 items-end border-b border-slate-100 pb-4 last:border-0 last:pb-0"
                  >
                    <div className="md:col-span-1">
                      <label className="block text-xs font-medium text-slate-600 mb-1">Name</label>
                      <input
                        type="text"
                        value={row.name}
                        disabled={readOnly}
                        onChange={(e) => updateRow(index, 'name', e.target.value)}
                        className="w-full rounded-lg border px-3 py-2 text-sm disabled:bg-slate-50"
                        placeholder="Full name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Date of birth
                      </label>
                      <input
                        type="date"
                        value={row.dateOfBirth}
                        disabled={readOnly}
                        onChange={(e) => updateRow(index, 'dateOfBirth', e.target.value)}
                        className="w-full rounded-lg border px-3 py-2 text-sm disabled:bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Relation
                      </label>
                      <select
                        value={row.relation}
                        disabled={readOnly}
                        onChange={(e) => updateRow(index, 'relation', e.target.value)}
                        className="w-full rounded-lg border px-3 py-2 text-sm disabled:bg-slate-50"
                      >
                        {relationOptions.map((opt) => (
                          <option
                            key={opt.value}
                            value={opt.value}
                            disabled={
                              usedRelations.has(opt.value) && row.relation !== opt.value
                            }
                          >
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex justify-end">
                      {canEdit && rows.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => removeRow(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          aria-label="Remove nominee"
                        >
                          <FiTrash2 />
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {cycle?.addons?.length > 0 && showNomineeSection ? (
            <div className="mt-6 bg-white rounded-xl border p-4">
              <h2 className="font-semibold text-slate-900 mb-3">Optional add-ons</h2>
              <ul className="space-y-2">
                {cycle.addons.map((addon) => (
                  <li key={addon._id} className="flex items-start gap-3 text-sm">
                    <input
                      type="checkbox"
                      id={`addon-${addon._id}`}
                      checked={selectedAddonIds.includes(String(addon._id))}
                      disabled={readOnly}
                      onChange={() => toggleAddon(addon._id)}
                      className="mt-1"
                    />
                    <label htmlFor={`addon-${addon._id}`} className="flex-1 cursor-pointer">
                      <span className="font-medium text-slate-900">{addon.label}</span>
                      <span className="text-blue-700 ml-2">{formatInr(addon.amount)}</span>
                      {addon.description ? (
                        <span className="block text-slate-500">{addon.description}</span>
                      ) : null}
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {canEdit ? (
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={saving}
                className="px-4 py-2 rounded-lg border bg-white text-sm font-medium"
              >
                Save draft
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
              >
                <FiCheck /> Submit for HR approval
              </button>
            </div>
          ) : null}

          {readOnly && lastApproved?.nominees?.length && displayStatus === 'APPROVED' ? (
            <p className="mt-4 text-xs text-slate-500">
              Last approved on{' '}
              {lastApproved.reviewedAt
                ? new Date(lastApproved.reviewedAt).toLocaleDateString('en-IN')
                : '—'}
              {lastApproved.cycle?.title ? ` (${lastApproved.cycle.title})` : ''}
            </p>
          ) : null}
        </>
      )}
    </div>
  );
};

export default InsuranceDetails;
