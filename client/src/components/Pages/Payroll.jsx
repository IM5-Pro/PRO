/**
 * Payroll Page
 * Salary information and payslips
 */

import React from 'react';
import { FiDollarSign, FiDownload } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';
import bgImage from '../../assets/Background.png';

const Payroll = () => {
  const { colors } = useTheme();
  const salary = {
    gross: 75000,
    deductions: 12500,
    net: 62500
  };

  const earnings = [
    { item: 'Basic Salary', amount: 50000 },
    { item: 'House Allowance', amount: 10000 },
    { item: 'Travel Allowance', amount: 5000 },
    { item: 'Performance Bonus', amount: 10000 },
    { item: 'Other Benefits', amount: 0 }
  ];

  const deductions = [
    { item: 'Income Tax', amount: 8000 },
    { item: 'Insurance', amount: 3000 },
    { item: 'Professional Fees', amount: 1500 }
  ];

  const benefits = [
    { name: 'Health Insurance', status: 'Active', icon: '🏥' },
    { name: 'Life Insurance', status: 'Active', icon: '🛡️' },
    { name: '401(k) Plan', status: 'Active', icon: '📈' },
    { name: 'Wellness Program', status: 'Active', icon: '💪' }
  ];

  const payslips = [
    { month: 'November 2024', amount: 62500, date: '2024-12-01' },
    { month: 'October 2024', amount: 62500, date: '2024-11-01' },
    { month: 'September 2024', amount: 62500, date: '2024-10-01' },
    { month: 'August 2024', amount: 62500, date: '2024-09-01' }
  ];

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed p-6 md:p-8"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      {/* Header */}
      <div>
        <h1 className={`text-4xl font-bold ${colors.text.primary} mb-2 flex items-center gap-3`}>
          <FiDollarSign className="w-10 h-10" /> Payroll
        </h1>
        <p className={`${colors.text.tertiary} mb-8`}>View your salary information and payslips</p>
      </div>

      {/* Salary Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border border-green-700/50 rounded-2xl p-6 hover:border-green-600/70 transition-all">
          <p className="text-green-400 text-sm font-medium mb-2">Gross Salary</p>
          <p className="text-3xl font-bold text-white">${salary.gross.toLocaleString()}</p>
        </div>

        <div className="bg-gradient-to-br from-red-900/30 to-pink-900/30 border border-red-700/50 rounded-2xl p-6 hover:border-red-600/70 transition-all">
          <p className="text-red-400 text-sm font-medium mb-2">Deductions</p>
          <p className="text-3xl font-bold text-white">${salary.deductions.toLocaleString()}</p>
        </div>

        <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border border-blue-700/50 rounded-2xl p-6 hover:border-blue-600/70 transition-all">
          <p className="text-blue-400 text-sm font-medium mb-2">Net Salary</p>
          <p className="text-3xl font-bold text-white">${salary.net.toLocaleString()}</p>
        </div>
      </div>

      {/* Earnings & Deductions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Earnings */}
        <div className={`bg-gradient-to-br ${colors.gradient.card} rounded-2xl border ${colors.border.primary} p-6 hover:border-slate-600 transition-all`}>
          <h2 className={`text-2xl font-bold ${colors.text.primary} mb-6`}>Earnings Breakdown</h2>

          <div className="space-y-3">
            {earnings.map((earning, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-700/30 border border-slate-700/50 rounded-lg">
                <span className={colors.text.secondary}>{earning.item}</span>
                <span className="text-green-400 font-semibold">${earning.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Deductions */}
        <div className={`bg-gradient-to-br ${colors.gradient.card} rounded-2xl border ${colors.border.primary} p-6 hover:border-slate-600 transition-all`}>
          <h2 className={`text-2xl font-bold ${colors.text.primary} mb-6`}>Deductions</h2>

          <div className="space-y-3">
            {deductions.map((deduction, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-700/30 border border-slate-700/50 rounded-lg">
                <span className={colors.text.secondary}>{deduction.item}</span>
                <span className="text-red-400 font-semibold">${deduction.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className={`bg-gradient-to-br ${colors.gradient.card} rounded-2xl border ${colors.border.primary} p-6 hover:border-slate-600 transition-all mb-8`}>
        <h2 className={`text-2xl font-bold ${colors.text.primary} mb-6`}>Benefits Overview</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {benefits.map((benefit, idx) => (
            <div key={idx} className="p-4 bg-slate-700/30 border border-slate-700/50 rounded-xl text-center hover:border-slate-600 hover:bg-slate-700/50 transition-all">
              <p className="text-3xl mb-2">{benefit.icon}</p>
              <p className={`${colors.text.primary} font-semibold text-sm mb-1`}>{benefit.name}</p>
              <p className="text-green-400 text-xs font-semibold">{benefit.status}</p>
            </div>
          ))}
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
              {payslips.map((payslip, idx) => (
                <tr key={idx} className={`border-b ${colors.border.primary} hover:bg-slate-700/30 transition-colors`}>
                  <td className={`px-4 py-3 ${colors.text.primary} font-medium`}>{payslip.month}</td>
                  <td className="px-4 py-3 text-green-400 font-semibold">${payslip.amount.toLocaleString()}</td>
                  <td className={`px-4 py-3 ${colors.text.tertiary}`}>{payslip.date}</td>
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

export default Payroll;
