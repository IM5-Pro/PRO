/**
 * Payroll Page
 * Salary information and payslips
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FiDownload, FiMinusCircle, FiPlusCircle, FiFileText } from 'react-icons/fi';
import RupeeIcon from '../icons/RupeeIcon';
import API from '../../api/client';
import { EMPLOYEE_ENDPOINTS, PAYROLL_ENDPOINTS } from '../../api/endpoints';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { canAccessPayrollRuns, normalizeRole } from '../../utils/roles';
import { formatINR } from '../../utils/currency';
import { downloadPayslipPdf } from '../../utils/downloadPayslip';
import {
  filterPayrollDetailsByEmploymentStart,
  formatPayrollMonthLabel,
  pickPayrollDetailForDisplay,
  sortPayrollDetailsByPeriodDesc,
  sortPayrollRunsByPeriodDesc,
} from '../../utils/payrollPeriod';

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

const Payroll = () => {
  const { colors } = useTheme();
  const { user = {} } = useAuth();
  const userRole = normalizeRole(user?.role);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payrollDetails, setPayrollDetails] = useState([]);
  const [payrollRuns, setPayrollRuns] = useState([]);
  const [employeeProfile, setEmployeeProfile] = useState(null);
  const [downloadingSlipId, setDownloadingSlipId] = useState('');

  const loadPayrollData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      let details = [];
      let runs = [];

      try {
        const [ownResponse, profileResponse] = await Promise.all([
          API.get(PAYROLL_ENDPOINTS.own),
          API.get(EMPLOYEE_ENDPOINTS.myProfile).catch(() => null),
        ]);
        details = extractRows(toPayload(ownResponse), 'details');
        setEmployeeProfile(profileResponse?.data?.data || null);
      } catch (ownError) {
        setEmployeeProfile(null);
        const isRoleAllowedToViewRuns = canAccessPayrollRuns(userRole);
        const isForbidden = ownError?.response?.status === 403;

        if (!(isRoleAllowedToViewRuns && isForbidden)) {
          throw ownError;
        }
      }

      if (canAccessPayrollRuns(userRole)) {
        const allResponse = await API.get(PAYROLL_ENDPOINTS.all);
        runs = sortPayrollRunsByPeriodDesc(extractRows(toPayload(allResponse), 'runs'));
      }

      setPayrollDetails(details);
      setPayrollRuns(runs);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load payroll data');
      setPayrollDetails([]);
      setPayrollRuns([]);
      setEmployeeProfile(null);
    } finally {
      setLoading(false);
    }
  }, [userRole]);

  useEffect(() => {
    loadPayrollData();
  }, [loadPayrollData]);

  const sortedDetails = useMemo(() => {
    const eligible = filterPayrollDetailsByEmploymentStart(payrollDetails, employeeProfile);
    return sortPayrollDetailsByPeriodDesc(eligible);
  }, [payrollDetails, employeeProfile]);

  const { detail: latestDetail, isProjected: isProjectedCompensation } = useMemo(
    () => pickPayrollDetailForDisplay(sortedDetails, employeeProfile),
    [sortedDetails, employeeProfile],
  );

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
      month: formatPayrollMonthLabel(detail),
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
      await downloadPayslipPdf(slipId, monthLabel);
    } catch (err) {
      setError(err?.message || 'Failed to download payslip');
    } finally {
      setDownloadingSlipId('');
    }
  };

  const summaryCards = [
    {
      title: 'Gross Salary',
      value: formatINR(salary.gross),
      icon: FiPlusCircle,
      color: 'from-emerald-500 to-green-600',
      valueClass: 'text-emerald-700',
    },
    {
      title: 'Deductions',
      value: formatINR(salary.deductions),
      icon: FiMinusCircle,
      color: 'from-rose-500 to-red-600',
      valueClass: 'text-rose-700',
    },
    {
      title: 'Net Salary',
      value: formatINR(salary.net),
      icon: RupeeIcon,
      color: 'from-blue-500 to-indigo-600',
      valueClass: 'text-blue-700',
    },
  ];

  const renderLineItems = (rows, tone) =>
    rows.length > 0 ? (
      rows.map((row, idx) => (
        <div
          key={`${row.item}-${idx}`}
          className="flex items-center justify-between gap-3 rounded-xl border border-im5-border-soft bg-slate-50/80 px-4 py-3 transition-colors hover:bg-white"
        >
          <span className={`text-sm font-medium ${colors.text.secondary}`}>{row.item}</span>
          <span className={`text-sm font-semibold tabular-nums ${tone}`}>{formatINR(row.amount)}</span>
        </div>
      ))
    ) : (
      <p className={`rounded-xl border border-dashed border-im5-border-soft bg-slate-50 px-4 py-6 text-center text-sm ${colors.text.tertiary}`}>
        No items to display.
      </p>
    );

  return (
    <div className="min-h-screen bg-im5-page p-6 md:p-8">
      <div className="glass mb-8 animate-slideInDown backdrop-blur-xl">
        <h1 className={`mb-2 flex items-center gap-3 text-4xl font-bold ${colors.text.primary}`}>
          <RupeeIcon className="h-10 w-10 text-blue-600" /> Payroll
        </h1>
        <p className={colors.text.tertiary}>View your salary breakdown and download payslips</p>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span className="font-medium">{error}</span>
        </div>
      )}

      {loading && (
        <div className={`card mb-8 flex items-center justify-center gap-3 py-12 ${colors.text.tertiary}`}>
          <span className="spinner" aria-hidden />
          <span>Loading payroll data...</span>
        </div>
      )}

      {!loading && latestDetail && (
        <>
          {isProjectedCompensation && (
            <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Showing this month&apos;s <span className="font-semibold">estimated</span> salary from your
              compensation settings. Official payslips appear in history after HR processes payroll.
            </div>
          )}

          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {summaryCards.map((card, idx) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  style={{ animationDelay: `${idx * 0.08}s` }}
                  className="group stat-card animate-fadeInUp hover-lift"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className={`icon-box bg-gradient-to-br ${card.color} text-white`}>
                      <Icon size={22} />
                    </div>
                    {isProjectedCompensation && card.title === 'Net Salary' && (
                      <span className="badge badge-warning">Estimated</span>
                    )}
                  </div>
                  <p className={`mb-2 text-sm font-medium ${colors.text.tertiary}`}>{card.title}</p>
                  <p className={`text-3xl font-bold tabular-nums ${card.valueClass}`}>{card.value}</p>
                </div>
              );
            })}
          </div>

          <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="card animate-fadeInUp">
              <h2 className={`mb-5 flex items-center gap-2 text-xl font-bold ${colors.text.primary}`}>
                <FiPlusCircle className="text-emerald-600" size={20} />
                Earnings Breakdown
              </h2>
              <div className="space-y-3">{renderLineItems(earnings, 'text-emerald-700')}</div>
            </div>

            <div className="card animate-fadeInUp" style={{ animationDelay: '0.08s' }}>
              <h2 className={`mb-5 flex items-center gap-2 text-xl font-bold ${colors.text.primary}`}>
                <FiMinusCircle className="text-rose-600" size={20} />
                Deductions
              </h2>
              <div className="space-y-3">{renderLineItems(deductions, 'text-rose-700')}</div>
            </div>
          </div>

          {payslips.length > 0 && (
            <div className="glass animate-fadeInUp">
              <h2 className={`mb-6 flex items-center gap-2 text-xl font-bold ${colors.text.primary}`}>
                <FiFileText className="text-blue-600" size={20} />
                Recent Payslips
              </h2>

              <div className="overflow-x-auto rounded-xl border border-im5-border-soft">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-im5-border bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <th className="px-4 py-3">Month</th>
                      <th className="px-4 py-3">Net amount</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3 text-center">Download</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-im5-border-soft bg-white">
                    {payslips.map((payslip) => (
                      <tr key={payslip.id} className="transition-colors hover:bg-slate-50">
                        <td className={`px-4 py-3 font-medium ${colors.text.primary}`}>{payslip.month}</td>
                        <td className="px-4 py-3 font-semibold tabular-nums text-emerald-700">
                          {formatINR(payslip.amount)}
                        </td>
                        <td className={`px-4 py-3 ${colors.text.tertiary}`}>
                          {new Date(payslip.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleDownloadSlip(payslip.id, payslip.month)}
                            disabled={!payslip.id || downloadingSlipId === payslip.id}
                            className="btn-primary inline-flex items-center gap-2 px-3 py-2 text-sm disabled:opacity-60"
                            aria-label={`Download payslip for ${payslip.month}`}
                          >
                            <FiDownload size={16} />
                            {downloadingSlipId === payslip.id ? 'Downloading…' : 'PDF'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {!loading && !latestDetail && payrollRuns.length > 0 && (
        <div className="glass animate-fadeInUp">
          <h2 className={`mb-6 text-xl font-bold ${colors.text.primary}`}>Payroll Runs</h2>

          <div className="overflow-x-auto rounded-xl border border-im5-border-soft">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-im5-border bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Month</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Total payout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-im5-border-soft bg-white">
                {payrollRuns.map((run) => (
                  <tr key={run?._id || run?.id} className="transition-colors hover:bg-slate-50">
                    <td className={`px-4 py-3 font-medium ${colors.text.primary}`}>{run?.month || 'N/A'}</td>
                    <td className="px-4 py-3">
                      <span className="badge badge-info">{run?.status || 'N/A'}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold tabular-nums text-emerald-700">
                      {formatINR(run?.totalPayout || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && !latestDetail && payrollRuns.length === 0 && !error && (
        <div className={`card py-12 text-center ${colors.text.tertiary}`}>
          <RupeeIcon className="mx-auto mb-4 h-12 w-12 text-slate-300" />
          <p className="font-medium text-slate-600">No payroll records found</p>
          <p className="mt-1 text-sm">Payslips will appear here after HR processes payroll.</p>
        </div>
      )}
    </div>
  );
};

export default Payroll;
