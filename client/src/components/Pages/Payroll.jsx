/**
 * Payroll Page
 * Salary information and payslips
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FiDollarSign, FiDownload } from 'react-icons/fi';
import API from '../../api/client';
import { PAYROLL_ENDPOINTS } from '../../api/endpoints';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { canAccessPayrollRuns, normalizeRole } from '../../utils/roles';

const toPayload = (response) => response?.data || {};

const extractRows = (payload, key) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (key && Array.isArray(payload?.[key])) {
    return payload[key];
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
};

const toCurrency = (value) => {
  const numeric = Number(value || 0);
  if (Number.isNaN(numeric)) {
    return '0.00';
  }

  return numeric.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const Payroll = () => {
  const { colors } = useTheme();
  const { user = {} } = useAuth();
  const userRole = normalizeRole(user?.role);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payrollDetails, setPayrollDetails] = useState([]);
  const [payrollRuns, setPayrollRuns] = useState([]);
  const [downloadingSlipId, setDownloadingSlipId] = useState('');

  const loadPayrollData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      let details = [];
      let runs = [];

      try {
        const ownResponse = await API.get(PAYROLL_ENDPOINTS.own);
        details = extractRows(toPayload(ownResponse), 'details');
      } catch (ownError) {
        const isRoleAllowedToViewRuns = canAccessPayrollRuns(userRole);
        const isForbidden = ownError?.response?.status === 403;

        if (!(isRoleAllowedToViewRuns && isForbidden)) {
          throw ownError;
        }
      }

      if (canAccessPayrollRuns(userRole)) {
        const allResponse = await API.get(PAYROLL_ENDPOINTS.all);
        runs = extractRows(toPayload(allResponse), 'runs');
      }

      setPayrollDetails(details);
      setPayrollRuns(runs);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load payroll data');
      setPayrollDetails([]);
      setPayrollRuns([]);
    } finally {
      setLoading(false);
    }
  }, [userRole]);

  useEffect(() => {
    loadPayrollData();
  }, [loadPayrollData]);

  const sortedDetails = useMemo(() => {
    return [...payrollDetails].sort((left, right) => {
      const leftDate = new Date(left?.createdAt || left?.updatedAt || 0).getTime();
      const rightDate = new Date(right?.createdAt || right?.updatedAt || 0).getTime();
      return rightDate - leftDate;
    });
  }, [payrollDetails]);

  const latestDetail = sortedDetails[0] || null;

  const salary = useMemo(() => {
    return {
      gross: Number(latestDetail?.grossSalary || 0),
      deductions: Number(latestDetail?.totalDeductions || 0),
      net: Number(latestDetail?.netSalary || 0),
    };
  }, [latestDetail]);

  const earnings = useMemo(() => {
    if (!latestDetail) {
      return [];
    }

    const rows = [];

    if (latestDetail?.basicSalary !== undefined) {
      rows.push({ item: 'Basic Salary', amount: Number(latestDetail.basicSalary || 0) });
    }

    for (const earning of latestDetail?.earnings || []) {
      rows.push({
        item: earning?.type || 'Earning',
        amount: Number(earning?.amount || 0),
      });
    }

    for (const bonus of latestDetail?.bonuses || []) {
      const label = bonus?.type ? `Bonus (${bonus.type})` : 'Bonus';
      rows.push({
        item: label,
        amount: Number(bonus?.amount || 0),
      });
    }

    return rows;
  }, [latestDetail]);

  const deductions = useMemo(() => {
    if (!latestDetail) {
      return [];
    }

    const rows = [];

    for (const deduction of latestDetail?.deductions || []) {
      rows.push({
        item: deduction?.type || 'Deduction',
        amount: Number(deduction?.amount || 0),
      });
    }

    if (latestDetail?.tax !== undefined) {
      rows.push({ item: 'Tax', amount: Number(latestDetail.tax || 0) });
    }

    if (latestDetail?.pf !== undefined) {
      rows.push({ item: 'PF', amount: Number(latestDetail.pf || 0) });
    }

    if (latestDetail?.esi !== undefined) {
      rows.push({ item: 'ESI', amount: Number(latestDetail.esi || 0) });
    }

    return rows;
  }, [latestDetail]);

  const payslips = useMemo(() => {
    return sortedDetails.map((detail) => ({
      id: detail?._id,
      month: detail?.payrollRunId?.month || 'Payroll',
      amount: Number(detail?.netSalary || 0),
      date:
        detail?.payrollRunId?.approvedAt ||
        detail?.payrollRunId?.processedAt ||
        detail?.createdAt ||
        new Date().toISOString(),
    }));
  }, [sortedDetails]);

  const handleDownloadSlip = async (slipId, monthLabel) => {
    if (!slipId) {
      return;
    }

    setDownloadingSlipId(slipId);
    setError('');

    try {
      const response = await API.get(PAYROLL_ENDPOINTS.download(slipId), {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const safeMonth = String(monthLabel || 'payslip').replace(/[^a-zA-Z0-9_-]/g, '_');

      link.href = blobUrl;
      link.download = `${safeMonth}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to download payslip');
    } finally {
      setDownloadingSlipId('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 md:p-8">
      {/* Header */}
      <div>
        <h1 className={`text-4xl font-bold ${colors.text.primary} mb-2 flex items-center gap-3`}>
          <FiDollarSign className="w-10 h-10" /> Payroll
        </h1>
        <p className={`${colors.text.tertiary} mb-8`}>View your salary information and payslips</p>
      </div>

      {error && (
        <div className="glass rounded-2xl p-4 mb-6 border border-red-500/30 bg-red-500/10 text-red-300">
          {error}
        </div>
      )}

      {loading && (
        <div className="glass rounded-2xl p-8 mb-8 text-center text-slate-300">
          Loading payroll data...
        </div>
      )}

      {!loading && latestDetail && (
        <>
          {/* Salary Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border border-green-700/50 rounded-2xl p-6 hover:border-green-600/70 transition-all">
              <p className="text-green-400 text-sm font-medium mb-2">Gross Salary</p>
              <p className="text-3xl font-bold text-white">${toCurrency(salary.gross)}</p>
            </div>

            <div className="bg-gradient-to-br from-red-900/30 to-pink-900/30 border border-red-700/50 rounded-2xl p-6 hover:border-red-600/70 transition-all">
              <p className="text-red-400 text-sm font-medium mb-2">Deductions</p>
              <p className="text-3xl font-bold text-white">${toCurrency(salary.deductions)}</p>
            </div>

            <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border border-blue-700/50 rounded-2xl p-6 hover:border-blue-600/70 transition-all">
              <p className="text-blue-400 text-sm font-medium mb-2">Net Salary</p>
              <p className="text-3xl font-bold text-white">${toCurrency(salary.net)}</p>
            </div>
          </div>

          {/* Earnings & Deductions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Earnings */}
            <div className={`bg-gradient-to-br ${colors.gradient.card} rounded-2xl border ${colors.border.primary} p-6 hover:border-slate-600 transition-all`}>
              <h2 className={`text-2xl font-bold ${colors.text.primary} mb-6`}>Earnings Breakdown</h2>

              <div className="space-y-3">
                {earnings.map((earning, idx) => (
                  <div key={`${earning.item}-${idx}`} className="flex items-center justify-between p-3 bg-slate-700/30 border border-slate-700/50 rounded-lg">
                    <span className={colors.text.secondary}>{earning.item}</span>
                    <span className="text-green-400 font-semibold">${toCurrency(earning.amount)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Deductions */}
            <div className={`bg-gradient-to-br ${colors.gradient.card} rounded-2xl border ${colors.border.primary} p-6 hover:border-slate-600 transition-all`}>
              <h2 className={`text-2xl font-bold ${colors.text.primary} mb-6`}>Deductions</h2>

              <div className="space-y-3">
                {deductions.map((deduction, idx) => (
                  <div key={`${deduction.item}-${idx}`} className="flex items-center justify-between p-3 bg-slate-700/30 border border-slate-700/50 rounded-lg">
                    <span className={colors.text.secondary}>{deduction.item}</span>
                    <span className="text-red-400 font-semibold">${toCurrency(deduction.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Payslips */}
          <div className={`bg-gradient-to-br ${colors.gradient.card} rounded-2xl border ${colors.border.primary} p-6 hover:border-slate-600 transition-all`}>
            <h2 className={`text-2xl font-bold ${colors.text.primary} mb-6`}>Recent Payslips</h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${colors.border.primary} ${colors.text.tertiary} font-semibold`}>
                    <th className="text-left px-4 py-3">Month</th>
                    <th className="text-left px-4 py-3">Amount</th>
                    <th className="text-left px-4 py-3">Date</th>
                    <th className="text-center px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {payslips.map((payslip) => (
                    <tr key={payslip.id} className={`border-b ${colors.border.primary} hover:bg-slate-700/30 transition-colors`}>
                      <td className={`px-4 py-3 ${colors.text.primary} font-medium`}>{payslip.month}</td>
                      <td className="px-4 py-3 text-green-400 font-semibold">${toCurrency(payslip.amount)}</td>
                      <td className={`px-4 py-3 ${colors.text.tertiary}`}>{new Date(payslip.date).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleDownloadSlip(payslip.id, payslip.month)}
                          disabled={downloadingSlipId === payslip.id}
                          className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-all duration-300 transform hover:scale-110 active:scale-95 inline-flex"
                        >
                          <FiDownload size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!loading && !latestDetail && payrollRuns.length > 0 && (
        <div className={`bg-gradient-to-br ${colors.gradient.card} rounded-2xl border ${colors.border.primary} p-6 hover:border-slate-600 transition-all`}>
          <h2 className={`text-2xl font-bold ${colors.text.primary} mb-6`}>Payroll Runs</h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${colors.border.primary} ${colors.text.tertiary} font-semibold`}>
                  <th className="text-left px-4 py-3">Month</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Total Payout</th>
                </tr>
              </thead>
              <tbody>
                {payrollRuns.map((run) => (
                  <tr key={run?._id || run?.id} className={`border-b ${colors.border.primary} hover:bg-slate-700/30 transition-colors`}>
                    <td className={`px-4 py-3 ${colors.text.primary} font-medium`}>{run?.month || 'N/A'}</td>
                    <td className={`px-4 py-3 ${colors.text.secondary}`}>{run?.status || 'N/A'}</td>
                    <td className="px-4 py-3 text-green-400 font-semibold">${toCurrency(run?.totalPayout || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && !latestDetail && payrollRuns.length === 0 && !error && (
        <div className="glass rounded-2xl p-8 text-center text-slate-300">
          No payroll records found.
        </div>
      )}
    </div>
  );
};

export default Payroll;
