/**
 * Payroll Component
 * Payroll management and salary processing interface
 * Features: Salary structure, payroll runs, salary slips, deductions, compliance
 * 
 * @component
 * @author HR Team
 * @version 2.0.0
 */

import React, { useMemo, useState } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { FiCheckCircle, FiDollarSign, FiDownload, FiEye, FiTrendingDown, FiUsers } from 'react-icons/fi';

const HRPayroll = ({ user = {}, pageConfig = {}, onUserUpdate = () => {} }) => {
  const { colors } = useTheme();
  const [selectedMonth, setSelectedMonth] = useState('march');

  const payrollSummary = useMemo(
    () => ({
      totalSalary: 2450000,
      totalDeductions: 245000,
      netPayable: 2205000,
      employees: 1250,
      processed: 1200,
      pending: 50,
    }),
    []
  );

  const payrollRuns = useMemo(
    () => [
      { id: 1, month: 'March 2024', status: 'Completed', processed: 1200, date: '2024-03-31', amount: '2,205,000' },
      { id: 2, month: 'February 2024', status: 'Completed', processed: 1200, date: '2024-02-29', amount: '2,195,000' },
      { id: 3, month: 'January 2024', status: 'Completed', processed: 1200, date: '2024-01-31', amount: '2,180,000' },
    ],
    []
  );

  const employeeSalaries = useMemo(
    () => [
      { id: 1, name: 'Rajesh Kumar', designation: 'Software Engineer', salary: 75000, deductions: 7500, net: 67500 },
      { id: 2, name: 'Priya Singh', designation: 'HR Manager', salary: 65000, deductions: 6500, net: 58500 },
      { id: 3, name: 'Amit Patel', designation: 'Finance Analyst', salary: 55000, deductions: 5500, net: 49500 },
      { id: 4, name: 'Sneha Verma', designation: 'Operations Lead', salary: 70000, deductions: 7000, net: 63000 },
    ],
    []
  );

  return (
    <div className="min-h-screen bg-transparent p-6 md:p-8">
      {/* Header */}
      <div className="rounded-2xl p-6 mb-8 bg-white/10 backdrop-blur-3xl border border-white/30 ring-1 ring-white/20 shadow-xl shadow-slate-900/10 animate-slideInDown">
        <h1 className="text-4xl font-bold text-slate-800 mb-2 flex items-center gap-3">
          <FiDollarSign size={36} /> Payroll Management
        </h1>
        <p className="text-slate-600">Manage salary structures and payroll processing</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total Salary', value: `₹${payrollSummary.totalSalary.toLocaleString()}`, icon: FiDollarSign, color: 'from-green-500 to-emerald-500' },
          { label: 'Deductions', value: `₹${payrollSummary.totalDeductions.toLocaleString()}`, icon: FiTrendingDown, color: 'from-red-500 to-orange-500' },
          { label: 'Net Payable', value: `₹${payrollSummary.netPayable.toLocaleString()}`, icon: FiCheckCircle, color: 'from-blue-500 to-cyan-500' },
          { label: 'Employees', value: payrollSummary.employees, icon: FiUsers, color: 'from-purple-500 to-pink-500' },
        ].map((card, idx) => {
          const CardIcon = card.icon;

          return (
            <div key={idx} className="stat-card animate-fadeInUp hover-lift" style={{ animationDelay: `${idx * 0.1}s` }}>
              <div className={`icon-box bg-gradient-to-br ${card.color} text-white`}>
                <CardIcon size={22} />
              </div>
              <div>
                <p className="text-sm text-gray-600">{card.label}</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{card.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Payroll Runs */}
      <div className="card animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Recent Payroll Runs</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-4 text-gray-600 font-semibold text-sm">Month</th>
                <th className="text-left py-3 px-4 text-gray-600 font-semibold text-sm">Status</th>
                <th className="text-left py-3 px-4 text-gray-600 font-semibold text-sm">Processed</th>
                <th className="text-left py-3 px-4 text-gray-600 font-semibold text-sm">Amount</th>
                <th className="text-left py-3 px-4 text-gray-600 font-semibold text-sm">Date</th>
                <th className="text-left py-3 px-4 text-gray-600 font-semibold text-sm">Action</th>
              </tr>
            </thead>
            <tbody>
              {payrollRuns.map((run) => (
                <tr key={run.id} className="border-b border-gray-100 hover:bg-blue-50 transition-colors duration-200">
                  <td className="py-3 px-4 text-gray-800 font-medium">{run.month}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">{run.status}</span>
                  </td>
                  <td className={`py-3 px-4 ${colors.text.secondary}`}>{run.processed}</td>
                  <td className={`py-3 px-4 ${colors.text.secondary} font-semibold`}>₹{run.amount}</td>
                  <td className={`py-3 px-4 ${colors.text.secondary}`}>{run.date}</td>
                  <td className={`py-3 px-4`}>
                    <button className="p-2 hover:bg-slate-700 rounded transition-colors">
                      <FiDownload size={16} className={colors.text.secondary} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Employee Salaries */}
      <div className={`bg-gradient-to-br ${colors.gradient.card} rounded-2xl border-2 ${colors.border.primary} p-6`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-2xl font-bold ${colors.text.primary}`}>Employee Salaries (March 2024)</h2>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all">
            Generate Slips
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${colors.border.secondary}`}>
                <th className={`text-left py-3 px-4 ${colors.text.tertiary} font-semibold text-sm`}>Employee</th>
                <th className={`text-left py-3 px-4 ${colors.text.tertiary} font-semibold text-sm`}>Designation</th>
                <th className={`text-left py-3 px-4 ${colors.text.tertiary} font-semibold text-sm`}>Salary</th>
                <th className={`text-left py-3 px-4 ${colors.text.tertiary} font-semibold text-sm`}>Deductions</th>
                <th className={`text-left py-3 px-4 ${colors.text.tertiary} font-semibold text-sm`}>Net</th>
                <th className={`text-left py-3 px-4 ${colors.text.tertiary} font-semibold text-sm`}>Action</th>
              </tr>
            </thead>
            <tbody>
              {employeeSalaries.map((emp) => (
                <tr key={emp.id} className={`border-b ${colors.border.secondary} hover:bg-slate-700/50`}>
                  <td className={`py-3 px-4 ${colors.text.primary} font-medium`}>{emp.name}</td>
                  <td className={`py-3 px-4 ${colors.text.secondary}`}>{emp.designation}</td>
                  <td className={`py-3 px-4 ${colors.text.secondary}`}>₹{emp.salary.toLocaleString()}</td>
                  <td className={`py-3 px-4 text-red-400`}>₹{emp.deductions.toLocaleString()}</td>
                  <td className={`py-3 px-4 ${colors.text.primary} font-semibold`}>₹{emp.net.toLocaleString()}</td>
                  <td className={`py-3 px-4`}>
                    <button className="p-2 hover:bg-slate-700 rounded transition-colors">
                      <FiEye size={16} className={colors.text.secondary} />
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

export default HRPayroll;
