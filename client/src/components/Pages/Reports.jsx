/**
 * Reports Page
 * Generate and view reports
 */

import React, { useState } from 'react';
import { FiFileText, FiDownload, FiCalendar } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';
import bgImage from '../../assets/Background.png';

const Reports = () => {
  const { colors } = useTheme();
  const [period, setPeriod] = useState('monthly');

  const reports = [
    { name: 'Monthly Performance Report', type: 'Performance', period: 'November 2024', date: '2024-12-01', size: '2.4 MB' },
    { name: 'Attendance Summary', type: 'Attendance', period: 'November 2024', date: '2024-12-01', size: '1.8 MB' },
    { name: 'Leave Tracker', type: 'Leave', period: 'November 2024', date: '2024-12-01', size: '0.9 MB' },
    { name: 'Payroll Report', type: 'Payroll', period: 'November 2024', date: '2024-12-01', size: '3.2 MB' },
    { name: 'Project Completion Report', type: 'Projects', period: 'Q4 2024', date: '2024-11-30', size: '4.1 MB' }
  ];

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed p-6 md:p-8"
      style={{ backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.94), rgba(255, 255, 255, 0.94)), url(${bgImage})` }}
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
                    <button className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all duration-300 transform hover:scale-110 active:scale-95 inline-flex">
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
