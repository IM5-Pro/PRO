import React, { useCallback, useEffect, useState } from 'react';
import { FiDownload, FiEdit2, FiPlus, FiRefreshCw, FiShield, FiX } from 'react-icons/fi';
import {
  closeInsuranceCycle,
  createInsuranceCycle,
  cycleToFormState,
  downloadInsuranceCycleExport,
  fetchInsuranceCycleSummary,
  fetchInsuranceCycles,
  formToCyclePayload,
  formatInr,
  updateInsuranceCycle,
} from '../../../services/insuranceApi';
import ModulePageLayout from '../operations/ModulePageLayout';

const emptyAddon = () => ({ key: '', label: '', amount: '', description: '' });

const emptyCycleForm = () => ({
  title: '',
  description: '',
  cycleType: 'INITIAL',
  baseCoverageAmount: 300000,
  addons: [emptyAddon()],
});

const CycleFormFields = ({
  formMode,
  form,
  setForm,
  busy,
  updateAddon,
  addAddonRow,
  removeAddonRow,
  onSubmit,
  onCancel,
}) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Title</label>
        <input
          required
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full rounded-lg border px-3 py-2 text-sm"
          placeholder="FY 2026 group mediclaim"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Cycle type</label>
        {formMode === 'edit' ? (
          <p className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            {form.cycleType === 'UPDATE' ? 'Update' : 'Initial enrollment'}
          </p>
        ) : (
          <select
            value={form.cycleType}
            onChange={(e) => setForm({ ...form, cycleType: e.target.value })}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          >
            <option value="INITIAL">Initial enrollment (all without approved insurance)</option>
            <option value="UPDATE">Update (employees with approved insurance only)</option>
          </select>
        )}
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Base cover (₹)</label>
        <input
          type="number"
          min={0}
          value={form.baseCoverageAmount}
          onChange={(e) => setForm({ ...form, baseCoverageAmount: e.target.value })}
          className="w-full rounded-lg border px-3 py-2 text-sm"
        />
      </div>
      <div className="md:col-span-2">
        <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full rounded-lg border px-3 py-2 text-sm"
          rows={2}
        />
      </div>
    </div>

    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-slate-800">Optional add-ons for employees</h3>
        <button type="button" onClick={addAddonRow} className="text-sm text-blue-600">
          + Add-on
        </button>
      </div>
      {form.addons.map((addon, index) => (
        <div key={addon._id || `addon-${index}`} className="grid gap-2 md:grid-cols-4 mb-2 items-end">
          <input
            placeholder="Label"
            value={addon.label}
            onChange={(e) => updateAddon(index, 'label', e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
          />
          <input
            type="number"
            placeholder="Amount ₹"
            value={addon.amount}
            onChange={(e) => updateAddon(index, 'amount', e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
          />
          <input
            placeholder="Description"
            value={addon.description}
            onChange={(e) => updateAddon(index, 'description', e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm md:col-span-2"
          />
          {form.addons.length > 1 ? (
            <button type="button" onClick={() => removeAddonRow(index)} className="text-red-600">
              <FiX />
            </button>
          ) : null}
        </div>
      ))}
    </div>

    <div className="flex flex-wrap gap-2 pt-1">
      <button
        type="submit"
        disabled={busy}
        className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium disabled:opacity-60"
      >
        {formMode === 'edit' ? 'Save changes' : 'Open cycle'}
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={onCancel}
        className="px-4 py-2 rounded-lg border bg-white text-sm"
      >
        Cancel
      </button>
    </div>
  </form>
);

const STATUS_STYLES = {
  NOT_STARTED: 'bg-slate-100 text-slate-700',
  DRAFT: 'bg-slate-200 text-slate-800',
  PENDING: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-emerald-100 text-emerald-800',
  REJECTED: 'bg-red-100 text-red-800',
};

const formatEmployeeName = (emp) =>
  [emp?.firstName, emp?.middleName, emp?.lastName].filter(Boolean).join(' ') || '—';

/** Submitted for HR review (excludes not started and draft-only saves). */
const isSubmittedForReview = (status) =>
  ['PENDING', 'APPROVED', 'REJECTED'].includes(status);

/** Still need to fill or resubmit. */
const isNotSubmittedEmployee = (status) =>
  ['NOT_STARTED', 'DRAFT', 'REJECTED'].includes(status);

const ROSTER_VIEWS = [
  {
    id: 'approval_pending',
    label: 'Approval pending',
    description: 'Submitted and awaiting HR approval',
    filter: (row) => row.submissionStatus === 'PENDING',
    emptyMessage: 'No submissions awaiting HR approval.',
  },
  {
    id: 'not_submitted',
    label: 'Not submitted',
    description: 'Not started, draft only, or rejected — employee must submit',
    filter: (row) => isNotSubmittedEmployee(row.submissionStatus),
    emptyMessage: 'All employees have submitted for this cycle.',
  },
  {
    id: 'approved',
    label: 'Approved',
    description: 'HR approved — ready for insurer export',
    filter: (row) => row.submissionStatus === 'APPROVED',
    emptyMessage: 'No approved submissions yet.',
  },
  {
    id: 'all',
    label: 'All employees',
    description: 'Full active employee roster for this cycle',
    filter: () => true,
    emptyMessage: 'No employees found.',
  },
];

const ParticipationPanel = ({ summary, cycleId, onRefresh, exporting, onExport }) => {
  const [rosterView, setRosterView] = useState('approval_pending');
  const stats = summary?.stats || {};
  const roster = summary?.roster || [];
  const total = stats.totalActiveEmployees || 0;
  const submitted = roster.filter((r) => isSubmittedForReview(r.submissionStatus)).length;
  const pct = total > 0 ? Math.round((submitted / total) * 100) : 0;

  const activeView = ROSTER_VIEWS.find((v) => v.id === rosterView) || ROSTER_VIEWS[0];
  const tableRows = roster.filter(activeView.filter);
  const viewCounts = Object.fromEntries(
    ROSTER_VIEWS.map((v) => [v.id, roster.filter(v.filter).length]),
  );

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-semibold text-slate-900">Enrollment monitoring</h3>
          <p className="text-sm text-slate-600 mt-0.5">
            <strong>
              {submitted} of {total}
            </strong>{' '}
            employees submitted ({pct}%)
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {stats.approved ?? 0} approved · {stats.pending ?? 0} awaiting HR ·{' '}
            {stats.notStarted ?? 0} not started
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={exporting}
            onClick={() => onExport(cycleId, { status: 'APPROVED', scope: 'nominees' })}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm disabled:opacity-60"
          >
            <FiDownload /> Export for insurer (approved)
          </button>
          <button
            type="button"
            disabled={exporting}
            onClick={() => onExport(cycleId, { status: 'ALL', scope: 'employees' })}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border bg-white text-sm disabled:opacity-60"
          >
            <FiDownload /> Export all employees
          </button>
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border bg-white text-sm"
          >
            <FiRefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>
      </div>

      <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full bg-blue-600 transition-all"
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total active', value: total, note: 'Eligible employees' },
          { label: 'Submitted', value: submitted, note: 'Any status' },
          { label: 'Approved', value: stats.approved ?? 0, note: 'Ready for insurer' },
          { label: 'Pending HR', value: stats.pending ?? 0, note: 'Awaiting approval' },
          { label: 'Draft', value: stats.draft ?? 0, note: 'Not submitted' },
          { label: 'Not started', value: stats.notStarted ?? 0, note: 'No record yet' },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-xl border p-3">
            <p className="text-xs text-slate-500">{item.label}</p>
            <p className="text-2xl font-semibold text-slate-900">{item.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{item.note}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-4 py-3 border-b bg-slate-50 space-y-3">
          <div>
            <h4 className="text-sm font-medium text-slate-800">
              {activeView.label} ({tableRows.length})
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">{activeView.description}</p>
          </div>
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Roster view">
            {ROSTER_VIEWS.map((view) => {
              const active = rosterView === view.id;
              const count = viewCounts[view.id] ?? 0;
              return (
                <button
                  key={view.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setRosterView(view.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    active
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {view.label}
                  <span
                    className={`min-w-[1.25rem] px-1.5 py-0.5 rounded-full text-[10px] ${
                      active ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Nominees</th>
              <th className="px-4 py-3">Submitted</th>
            </tr>
          </thead>
          <tbody>
            {tableRows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                  {activeView.emptyMessage}
                </td>
              </tr>
            ) : null}
            {tableRows.map((row) => (
              <tr key={row.employee?._id || row.employee?.employeeCode} className="border-t">
                <td className="px-4 py-3">
                  <div className="font-medium">{formatEmployeeName(row.employee)}</div>
                  <div className="text-xs text-slate-500">{row.employee?.employeeCode}</div>
                </td>
                <td className="px-4 py-3">{row.employee?.department || '—'}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      STATUS_STYLES[row.submissionStatus] || STATUS_STYLES.NOT_STARTED
                    }`}
                  >
                    {row.submissionStatus.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-4 py-3">{row.nomineeCount || '—'}</td>
                <td className="px-4 py-3 text-slate-600">
                  {row.submittedAt
                    ? new Date(row.submittedAt).toLocaleDateString('en-IN')
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const InsuranceCycles = () => {
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formMode, setFormMode] = useState(null);
  const [editingCycleId, setEditingCycleId] = useState(null);
  const [monitorCycleId, setMonitorCycleId] = useState(null);
  const [summary, setSummary] = useState(null);

  const [form, setForm] = useState(emptyCycleForm);

  const cancelCycleForm = () => {
    setFormMode(null);
    setEditingCycleId(null);
    setForm(emptyCycleForm());
  };

  const openCreateForm = () => {
    setFormMode('create');
    setEditingCycleId(null);
    setForm(emptyCycleForm());
  };

  const openEditForm = (cycle) => {
    setFormMode('edit');
    setEditingCycleId(cycle._id);
    setForm(cycleToFormState(cycle));
  };

  const loadSummary = useCallback(async (cycleId) => {
    if (!cycleId) return;
    setMonitorCycleId(cycleId);
    try {
      setSummary(await fetchInsuranceCycleSummary(cycleId));
    } catch (err) {
      setMessage({
        type: 'error',
        text: err?.response?.data?.message || 'Failed to load enrollment data',
      });
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const list = await fetchInsuranceCycles();
      setCycles(list);
      const open = list.find((c) => c.status === 'OPEN');
      if (open) {
        await loadSummary(open._id);
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err?.response?.data?.message || 'Failed to load insurance cycles',
      });
    } finally {
      setLoading(false);
    }
  }, [loadSummary]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (formMode !== 'edit') return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && !busy) cancelCycleForm();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [formMode, busy]);

  const handleExport = async (cycleId, options) => {
    setExporting(true);
    setMessage({ type: '', text: '' });
    try {
      await downloadInsuranceCycleExport(cycleId, options);
      setMessage({ type: 'success', text: 'CSV downloaded.' });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err?.response?.data?.message || err.message || 'Export failed',
      });
    } finally {
      setExporting(false);
    }
  };

  const updateAddon = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      addons: prev.addons.map((a, i) => (i === index ? { ...a, [field]: value } : a)),
    }));
  };

  const addAddonRow = () => {
    setForm((prev) => ({ ...prev, addons: [...prev.addons, emptyAddon()] }));
  };

  const removeAddonRow = (index) => {
    setForm((prev) => ({
      ...prev,
      addons: prev.addons.filter((_, i) => i !== index),
    }));
  };

  const handleCycleFormSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMessage({ type: '', text: '' });
    const payload = formToCyclePayload(form);

    try {
      if (formMode === 'edit' && editingCycleId) {
        const { title, description, baseCoverageAmount, addons } = payload;
        const result = await updateInsuranceCycle(editingCycleId, {
          title,
          description,
          baseCoverageAmount,
          addons,
        });
        setMessage({ type: 'success', text: 'Insurance cycle updated.' });
        cancelCycleForm();
        await load();
        if (monitorCycleId === editingCycleId) {
          await loadSummary(editingCycleId);
        }
        if (result?.cycle?._id === monitorCycleId) {
          setSummary((prev) => (prev ? { ...prev, cycle: result.cycle } : prev));
        }
      } else {
        const result = await createInsuranceCycle(payload);
        setMessage({ type: 'success', text: 'Insurance cycle opened. Employees can submit nominees.' });
        cancelCycleForm();
        await load();
        const cycle = result?.cycle;
        if (cycle?._id) await loadSummary(cycle._id);
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text:
          err?.response?.data?.message ||
          err.message ||
          (formMode === 'edit' ? 'Failed to update cycle' : 'Failed to create cycle'),
      });
    } finally {
      setBusy(false);
    }
  };

  const handleClose = async (cycleId, title) => {
    if (!window.confirm(`Close enrollment window "${title}"? Employees will no longer be able to submit.`)) {
      return;
    }
    setBusy(true);
    try {
      await closeInsuranceCycle(cycleId);
      setMessage({ type: 'success', text: 'Cycle closed.' });
      await load();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err?.response?.data?.message || 'Failed to close cycle',
      });
    } finally {
      setBusy(false);
    }
  };

  const openCycle = cycles.find((c) => c.status === 'OPEN');

  return (
    <ModulePageLayout
      title="Insurance Enrollment Cycles"
      subtitle="Monitor participation, export approved data for the insurance company, and manage enrollment windows."
      icon={FiShield}
      actions={
        <>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border bg-white text-sm"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          {!openCycle && !formMode ? (
            <button
              type="button"
              onClick={openCreateForm}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm"
            >
              <FiPlus /> New cycle
            </button>
          ) : null}
        </>
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

      {openCycle ? (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <div className="flex flex-wrap items-center gap-2">
            <span>
              Active: <strong>{openCycle.title}</strong> ({openCycle.cycleType}) — base{' '}
              {formatInr(openCycle.baseCoverageAmount)}
            </span>
            {summary?.stats && summary?.roster ? (
              <span className="text-emerald-800">
                ·{' '}
                {
                  summary.roster.filter((r) =>
                    ['PENDING', 'APPROVED', 'REJECTED'].includes(r.submissionStatus),
                  ).length
                }
                /{summary.stats.totalActiveEmployees} submitted
              </span>
            ) : null}
            <button
              type="button"
              disabled={busy}
              onClick={() => openEditForm(openCycle)}
              className="inline-flex items-center gap-1 text-blue-800 underline text-xs"
            >
              <FiEdit2 className="h-3 w-3" /> Edit cycle
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => handleClose(openCycle._id, openCycle.title)}
              className="text-red-700 underline text-xs"
            >
              Close cycle
            </button>
          </div>
        </div>
      ) : null}

      {monitorCycleId && summary ? (
        <ParticipationPanel
          key={monitorCycleId}
          summary={summary}
          cycleId={monitorCycleId}
          onRefresh={() => loadSummary(monitorCycleId)}
          exporting={exporting}
          onExport={handleExport}
        />
      ) : null}

      {formMode === 'create' && !openCycle ? (
        <div className="mb-6 bg-white rounded-xl border p-4">
          <h2 className="font-semibold text-slate-900 mb-4">Start new cycle</h2>
          <CycleFormFields
            formMode="create"
            form={form}
            setForm={setForm}
            busy={busy}
            updateAddon={updateAddon}
            addAddonRow={addAddonRow}
            removeAddonRow={removeAddonRow}
            onSubmit={handleCycleFormSubmit}
            onCancel={cancelCycleForm}
          />
        </div>
      ) : null}

      {formMode === 'edit' ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-cycle-title"
          onClick={cancelCycleForm}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 shrink-0">
              <div>
                <h2 id="edit-cycle-title" className="text-lg font-semibold text-slate-900">
                  Edit insurance cycle
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Cycle type cannot be changed. Add-on IDs are preserved when the key matches.
                </p>
              </div>
              <button
                type="button"
                onClick={cancelCycleForm}
                disabled={busy}
                className="h-8 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                aria-label="Close"
              >
                Close
              </button>
            </div>
            <div className="overflow-y-auto px-5 py-4">
              <CycleFormFields
                formMode="edit"
                form={form}
                setForm={setForm}
                busy={busy}
                updateAddon={updateAddon}
                addAddonRow={addAddonRow}
                removeAddonRow={removeAddonRow}
                onSubmit={handleCycleFormSubmit}
                onCancel={cancelCycleForm}
              />
            </div>
          </div>
        </div>
      ) : null}

      <div className="bg-white rounded-xl border overflow-hidden mt-6">
        <h3 className="px-4 py-3 font-semibold text-slate-900 border-b bg-slate-50">Past cycles</h3>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Base</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {cycles.map((c) => (
              <tr key={c._id} className="border-t">
                <td className="px-4 py-3 font-medium">{c.title}</td>
                <td className="px-4 py-3">{c.cycleType}</td>
                <td className="px-4 py-3">{formatInr(c.baseCoverageAmount)}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs ${
                      c.status === 'OPEN' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100'
                    }`}
                  >
                    {c.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => openEditForm(c)}
                      className="text-blue-600 text-xs hover:underline inline-flex items-center gap-0.5"
                    >
                      <FiEdit2 className="h-3 w-3" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => loadSummary(c._id)}
                      className="text-blue-600 text-xs hover:underline"
                    >
                      Monitor
                    </button>
                    <button
                      type="button"
                      disabled={exporting}
                      onClick={() => handleExport(c._id, { status: 'APPROVED', scope: 'nominees' })}
                      className="text-blue-600 text-xs hover:underline disabled:opacity-50"
                    >
                      Export
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ModulePageLayout>
  );
};

export default InsuranceCycles;
