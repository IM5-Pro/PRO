import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FiCheckCircle, FiDownload, FiLock, FiRefreshCw, FiUnlock, FiXCircle } from 'react-icons/fi';
import RupeeIcon from '../../icons/RupeeIcon';
import {
  createPayrollRun,
  fetchPayrollRuns,
  fetchPayrollSlips,
  lockPayrollRun,
  processPayrollRun,
  toErrorMessage,
  unlockPayrollRun,
} from '../../../services/adminOperationsApi';
import { downloadPayslipPdf } from '../../../utils/downloadPayslip';
import { formatINR } from '../../../utils/currency';
import {
  formatSalarySnapshotSummary,
  getSalaryBasis,
  getSalarySnapshotLines,
} from '../../../utils/salarySnapshotDisplay';

const HRPayroll = () => {
  const [runs, setRuns] = useState([]);
  const [selectedRunId, setSelectedRunId] = useState('');
  const [slips, setSlips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slipsLoading, setSlipsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState('');
  const [banner, setBanner] = useState({ type: '', text: '' });
  const [newRunMonth, setNewRunMonth] = useState('');
  const [downloadingSlipId, setDownloadingSlipId] = useState('');

  const handleDownloadSlip = async (slipId, monthLabel) => {
    if (!slipId) {
      return;
    }

    setDownloadingSlipId(slipId);
    try {
      await downloadPayslipPdf(slipId, monthLabel);
    } catch (error) {
      setBanner({
        type: 'error',
        text: toErrorMessage(error, 'Failed to download payslip'),
      });
    } finally {
      setDownloadingSlipId('');
    }
  };

  const loadRuns = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await fetchPayrollRuns();
      setRuns(rows);

      if (!selectedRunId && rows.length > 0) {
        const latestRun = rows[0];
        const latestId = latestRun?._id || latestRun?.id;
        if (latestId) {
          setSelectedRunId(latestId);
        }
      }
    } catch (error) {
      setBanner({ type: 'error', text: toErrorMessage(error, 'Failed to load payroll runs') });
      setRuns([]);
    } finally {
      setLoading(false);
    }
  }, [selectedRunId]);

  const loadSlips = useCallback(async (runId) => {
    if (!runId) {
      setSlips([]);
      return;
    }

    setSlipsLoading(true);
    try {
      const rows = await fetchPayrollSlips(runId);
      setSlips(rows);
    } catch (error) {
      setSlips([]);
      setBanner({ type: 'error', text: toErrorMessage(error, 'Failed to load payroll slips') });
    } finally {
      setSlipsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRuns();
  }, [loadRuns]);

  useEffect(() => {
    if (!selectedRunId) {
      return;
    }
    loadSlips(selectedRunId);
  }, [selectedRunId, loadSlips]);

  const selectedRun = useMemo(() => {
    return runs.find((run) => String(run?._id || run?.id) === String(selectedRunId)) || null;
  }, [runs, selectedRunId]);

  const payrollSummary = useMemo(() => {
    const employeeCount = slips.length;
    const grossTotal = slips.reduce((sum, slip) => sum + Number(slip?.grossSalary || 0), 0);
    const deductionsTotal = slips.reduce((sum, slip) => sum + Number(slip?.totalDeductions || 0), 0);
    const netTotal = slips.reduce((sum, slip) => sum + Number(slip?.netSalary || 0), 0);

    return {
      employeeCount,
      grossTotal,
      deductionsTotal,
      netTotal,
    };
  }, [slips]);

  const runOperation = async (operationKey, operation) => {
    setActionLoading(operationKey);
    setBanner({ type: '', text: '' });

    try {
      const message = await operation();
      setBanner({ type: 'success', text: message });
      await loadRuns();
      if (selectedRunId) {
        await loadSlips(selectedRunId);
      }
    } catch (error) {
      setBanner({ type: 'error', text: toErrorMessage(error, 'Payroll action failed') });
    } finally {
      setActionLoading('');
    }
  };

  const handleCreateRun = async (event) => {
    event.preventDefault();
    if (!newRunMonth) {
      setBanner({ type: 'error', text: 'Please choose a month before creating payroll run.' });
      return;
    }

    await runOperation('create-run', async () => {
      await createPayrollRun(newRunMonth);
      setNewRunMonth('');
      return `Payroll run created for ${newRunMonth}.`;
    });
  };

  const handleProcessRun = async () => {
    if (!selectedRunId) {
      return;
    }

    await runOperation('process-run', async () => {
      await processPayrollRun(selectedRunId);
      return 'Payroll processing completed successfully.';
    });
  };

  const handleToggleLock = async () => {
    if (!selectedRunId || !selectedRun) {
      return;
    }

    const isLocked = String(selectedRun.status || '').toUpperCase() === 'LOCKED';
    await runOperation('toggle-lock', async () => {
      if (isLocked) {
        await unlockPayrollRun(selectedRunId);
        return 'Payroll run unlocked successfully.';
      }

      await lockPayrollRun(selectedRunId);
      return 'Payroll run locked successfully.';
    });
  };

  const handleRegenerateSlips = async () => {
    if (!selectedRunId) {
      return;
    }

    await runOperation('generate-slips', async () => {
      await loadSlips(selectedRunId);
      return 'Payslips refreshed successfully.';
    });
  };

  return (
    <div className="min-h-screen bg-transparent p-6 md:p-8">
      <div className="rounded-2xl bg-white border border-slate-200 p-6 mb-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
              <RupeeIcon size={30} /> Payroll Management
            </h1>
            <p className="text-slate-600 mt-1">Run monthly payroll, process, and generate payslips</p>
          </div>

          <button
            onClick={loadRuns}
            disabled={loading}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <span className="inline-flex items-center gap-2">
              <FiRefreshCw size={15} /> Refresh
            </span>
          </button>
        </div>
      </div>

      {banner.text && (
        <div
          className={`mb-6 rounded-lg border px-4 py-3 text-sm inline-flex items-center gap-2 ${
            banner.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          {banner.type === 'success' ? <FiCheckCircle size={16} /> : <FiXCircle size={16} />}
          {banner.text}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <div className="xl:col-span-2 rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Payroll Runs</h2>

          <form onSubmit={handleCreateRun} className="flex flex-wrap items-center gap-3 mb-4">
            <input
              type="month"
              value={newRunMonth}
              onChange={(event) => setNewRunMonth(event.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={actionLoading === 'create-run'}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-50"
            >
              {actionLoading === 'create-run' ? 'Creating...' : 'Create Run'}
            </button>
          </form>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left py-3 px-3 text-slate-600">Month</th>
                  <th className="text-left py-3 px-3 text-slate-600">Status</th>
                  <th className="text-left py-3 px-3 text-slate-600">Total Payout</th>
                  <th className="text-left py-3 px-3 text-slate-600">Created</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="py-6 px-3 text-center text-slate-500" colSpan={4}>Loading payroll runs...</td>
                  </tr>
                ) : runs.length === 0 ? (
                  <tr>
                    <td className="py-6 px-3 text-center text-slate-500" colSpan={4}>No payroll runs found</td>
                  </tr>
                ) : (
                  runs.map((run) => {
                    const runId = run?._id || run?.id;
                    const isSelected = String(runId) === String(selectedRunId);
                    return (
                      <tr
                        key={runId}
                        onClick={() => setSelectedRunId(runId)}
                        className={`border-b border-slate-100 cursor-pointer ${isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                      >
                        <td className="py-3 px-3 text-slate-800 font-medium">{run?.month || '-'}</td>
                        <td className="py-3 px-3 text-slate-700">{run?.status || '-'}</td>
                        <td className="py-3 px-3 text-slate-700">{formatINR(run?.totalPayout || 0)}</td>
                        <td className="py-3 px-3 text-slate-700">{run?.createdAt ? new Date(run.createdAt).toLocaleDateString() : '-'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Run Actions</h2>
          <p className="text-sm text-slate-500 mb-4">
            Selected: <span className="font-semibold text-slate-700">{selectedRun?.month || 'None'}</span>
          </p>
          <div className="space-y-2">
            <button
              onClick={handleProcessRun}
              disabled={!selectedRunId || actionLoading === 'process-run'}
              className="w-full px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold disabled:opacity-50"
            >
              {actionLoading === 'process-run' ? 'Processing...' : 'Process Payroll'}
            </button>
            <button
              onClick={handleToggleLock}
              disabled={!selectedRunId || actionLoading === 'toggle-lock'}
              className="w-full px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-800 text-white font-semibold disabled:opacity-50"
            >
              <span className="inline-flex items-center gap-2">
                {String(selectedRun?.status || '').toUpperCase() === 'LOCKED' ? <FiUnlock size={15} /> : <FiLock size={15} />}
                {String(selectedRun?.status || '').toUpperCase() === 'LOCKED' ? 'Unlock Run' : 'Lock Run'}
              </span>
            </button>
            <button
              onClick={handleRegenerateSlips}
              disabled={!selectedRunId || actionLoading === 'generate-slips'}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold disabled:opacity-50"
            >
              Refresh Slips
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl bg-white border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Employees</p>
          <p className="text-2xl font-bold text-slate-800">{payrollSummary.employeeCount}</p>
        </div>
        <div className="rounded-xl bg-white border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Gross</p>
          <p className="text-2xl font-bold text-slate-800">{formatINR(payrollSummary.grossTotal)}</p>
        </div>
        <div className="rounded-xl bg-white border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Deductions</p>
          <p className="text-2xl font-bold text-slate-800">{formatINR(payrollSummary.deductionsTotal)}</p>
        </div>
        <div className="rounded-xl bg-white border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Net Payout</p>
          <p className="text-2xl font-bold text-slate-800">{formatINR(payrollSummary.netTotal)}</p>
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-1">Payslip Details</h2>
        <p className="mb-4 text-xs text-slate-500">
          <span className="font-medium text-slate-600">Compensation snapshot</span> shows salary values
          frozen when this run was processed. If amounts differ across months, compare profile vs template
          basis here — not the employee&apos;s current profile.
        </p>
        {slipsLoading ? (
          <p className="text-slate-500">Loading payslips...</p>
        ) : slips.length === 0 ? (
          <p className="text-slate-500">No payslips found for selected run.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left py-3 px-3 text-slate-600">Employee</th>
                  <th className="min-w-[220px] text-left py-3 px-3 text-slate-600">Compensation snapshot</th>
                  <th className="text-left py-3 px-3 text-slate-600">Gross</th>
                  <th className="text-left py-3 px-3 text-slate-600">Deductions</th>
                  <th className="text-left py-3 px-3 text-slate-600">Net</th>
                  <th className="text-left py-3 px-3 text-slate-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {slips.map((slip) => {
                  const employeeName = [slip?.employeeId?.firstName, slip?.employeeId?.lastName]
                    .filter(Boolean)
                    .join(' ')
                    .trim() || slip?.employeeId?.email || 'Employee';
                  const basis = getSalaryBasis(slip);
                  const snapshotLines = getSalarySnapshotLines(slip);
                  const snapshotSummary = formatSalarySnapshotSummary(slip);

                  return (
                    <tr key={slip?._id || slip?.id} className="border-b border-slate-100 align-top">
                      <td className="py-3 px-3 text-slate-800 font-medium">{employeeName}</td>
                      <td className="py-3 px-3 text-slate-700">
                        <div className="space-y-1.5">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                              basis.key === 'profile'
                                ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200'
                                : basis.key === 'template'
                                  ? 'bg-amber-50 text-amber-900 ring-1 ring-amber-200'
                                  : 'bg-slate-100 text-slate-700 ring-1 ring-slate-200'
                            }`}
                          >
                            {basis.label}
                          </span>
                          <p className="text-xs font-medium text-slate-800" title={snapshotSummary}>
                            {snapshotSummary}
                          </p>
                          <ul className="space-y-0.5 text-[11px] leading-snug text-slate-500">
                            {snapshotLines.slice(1).map((line) => (
                              <li key={`${slip?._id || slip?.id}-${line.label}`}>
                                <span className="text-slate-400">{line.label}: </span>
                                <span className={line.muted ? 'text-slate-400' : 'text-slate-600'}>
                                  {line.value}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-700">{formatINR(slip?.grossSalary || 0)}</td>
                      <td className="py-3 px-3 text-slate-700">{formatINR(slip?.totalDeductions || 0)}</td>
                      <td className="py-3 px-3 text-slate-700">{formatINR(slip?.netSalary || 0)}</td>
                      <td className="py-3 px-3">
                        <button
                          type="button"
                          onClick={() =>
                            handleDownloadSlip(
                              slip?._id || slip?.id,
                              slip?.payrollRunId?.month || 'payslip',
                            )
                          }
                          disabled={downloadingSlipId === (slip?._id || slip?.id)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                        >
                          <FiDownload size={13} /> PDF
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default HRPayroll;
