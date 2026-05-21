/**
 * Reports Page
 * Generate and view reports
 */

import React, { useCallback, useEffect, useState } from 'react';
import { FiFileText, FiDownload, FiCalendar } from 'react-icons/fi';
import API from '../../api/client';
import { ATTENDANCE_ENDPOINTS, EMPLOYEE_ENDPOINTS, LEAVE_ENDPOINTS, PAYROLL_ENDPOINTS } from '../../api/endpoints';
import { useTheme } from '../../context/ThemeContext';

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

const Reports = () => {
  const { colors } = useTheme();
  const [period, setPeriod] = useState('monthly');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reports, setReports] = useState([]);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [teamResponse, attendanceResponse, leaveResponse, payrollResponse] = await Promise.all([
        API.get(EMPLOYEE_ENDPOINTS.myTeam(200)),
        API.get(ATTENDANCE_ENDPOINTS.team(200)),
        API.get(LEAVE_ENDPOINTS.team),
        API.get(PAYROLL_ENDPOINTS.own).catch(() => ({ data: { data: [] } })),
      ]);

      const teamRows = extractRows(toPayload(teamResponse));
      const attendanceRows = extractRows(toPayload(attendanceResponse));
      const leaveRows = extractRows(toPayload(leaveResponse));
      const payrollRows = extractRows(toPayload(payrollResponse), 'details');

      const currentLabel = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const currentDate = new Date().toISOString().slice(0, 10);

      const liveReports = [
        {
          name: 'Team Attendance Report',
          type: 'Attendance',
          period: currentLabel,
          date: currentDate,
          size: `${Math.max(1, Math.ceil(attendanceRows.length / 12))}.${attendanceRows.length % 10} MB`,
          records: attendanceRows.length,
        },
        {
          name: 'Leave Request Report',
          type: 'Leave',
          period: currentLabel,
          date: currentDate,
          size: `${Math.max(1, Math.ceil(leaveRows.length / 10))}.${leaveRows.length % 10} MB`,
          records: leaveRows.length,
        },
        {
          name: 'Team Directory Snapshot',
          type: 'Team',
          period: currentLabel,
          date: currentDate,
          size: `${Math.max(1, Math.ceil(teamRows.length / 10))}.${teamRows.length % 10} MB`,
          records: teamRows.length,
        },
        {
          name: 'Payroll Summary',
          type: 'Payroll',
          period: currentLabel,
          date: currentDate,
          size: `${Math.max(1, Math.ceil(payrollRows.length / 8))}.${payrollRows.length % 10} MB`,
          records: payrollRows.length,
        },
      ];

      setReports(liveReports);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load reports');
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleDownload = (report) => {
    const fileContent = [
      `Report: ${report.name}`,
      `Type: ${report.type}`,
      `Period: ${report.period}`,
      `Generated: ${report.date}`,
      `File Size: ${report.size}`,
      `Records: ${report.records || 0}`
    ].join('\n');

    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${report.name.toLowerCase().replace(/\s+/g, '-')}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="min-h-screen bg-im5-page p-6 md:p-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className={`text-4xl font-bold ${colors.text.primary} mb-2 flex items-center gap-3`}>
            <FiFileText className="w-10 h-10" /> Reports
          </h1>
          <p className={colors.text.tertiary}>Download and view your reports</p>
        </div>

        <div className={`flex items-center gap-2 bg-gradient-to-br ${colors.gradient.card} border ${colors.border.primary} rounded-xl px-4 py-3`}>
          <FiCalendar className="text-slate-400" size={20} />
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="bg-transparent text-white outline-none font-medium"
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 mb-6">
          {error}
        </div>
      )}

      {loading && (
        <div className="rounded-xl border border-slate-200 bg-white text-slate-500 px-4 py-5 mb-6">
          Loading reports...
        </div>
      )}

      {/* Reports Table */}
      <div className={`bg-gradient-to-br ${colors.gradient.card} rounded-2xl border ${colors.border.primary} p-6 hover:border-slate-600 transition-all`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${colors.border.primary} ${colors.text.tertiary} font-semibold`}>
                <th className="text-left px-4 py-3">Report Name</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-left px-4 py-3">Period</th>
                <th className="text-left px-4 py-3">Generated Date</th>
                <th className="text-left px-4 py-3">Size</th>
                <th className="text-center px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report, idx) => (
                <tr key={idx} className={`border-b ${colors.border.primary} hover:bg-slate-700/30 transition-colors`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FiFileText className="text-blue-400" />
                      <span className={`${colors.text.primary} font-medium`}>{report.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400">
                      {report.type}
                    </span>
                  </td>
                  <td className={`px-4 py-3 ${colors.text.secondary}`}>{report.period}</td>
                  <td className={`px-4 py-3 ${colors.text.tertiary}`}>{report.date}</td>
                  <td className={`px-4 py-3 ${colors.text.tertiary}`}>{report.size}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleDownload(report)}
                      className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-300 transform hover:scale-110 active:scale-95 inline-flex"
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
    </div>
  );
};

export default Reports;
