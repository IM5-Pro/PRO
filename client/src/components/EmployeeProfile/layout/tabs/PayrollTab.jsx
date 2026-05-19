import React from 'react';
import { formatINR } from '../../../../utils/currency';

const sectionTitle = 'font-semibold text-lg text-slate-800 border-b border-slate-100 pb-2 mb-3';

const PayrollTab = ({ payroll }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div className="bg-white rounded-xl shadow p-6 flex flex-col gap-4">
      <h3 className={sectionTitle}>Compensation snapshot</h3>
      <div className="flex flex-wrap gap-4 mt-2">
        <div className="flex flex-col"><span className="text-xs text-slate-400">Latest net pay</span><span>{formatINR(payroll.salary, { fallback: payroll.salary })}</span></div>
        <div className="flex flex-col"><span className="text-xs text-slate-400">Bank</span><span>{payroll.bankName}</span></div>
        <div className="flex flex-col"><span className="text-xs text-slate-400">Account number</span><span>{payroll.accountNumber}</span></div>
        <div className="flex flex-col"><span className="text-xs text-slate-400">IFSC</span><span>{payroll.ifsc}</span></div>
        <div className="flex flex-col"><span className="text-xs text-slate-400">PAN</span><span>{payroll.pan}</span></div>
        <div className="flex flex-col"><span className="text-xs text-slate-400">PF (latest run)</span><span>{payroll.pfNumber}</span></div>
        <div className="flex flex-col"><span className="text-xs text-slate-400">ESI (latest run)</span><span>{payroll.esiNumber}</span></div>
      </div>
    </div>
    <div className="bg-white rounded-xl shadow p-6 flex flex-col gap-4">
      <h3 className={sectionTitle}>Payslip history</h3>
      <ul className="divide-y divide-slate-100">
        {payroll.payslips && payroll.payslips.length > 0 ? payroll.payslips.map((slip, idx) => (
          <li key={idx} className="py-2 flex justify-between items-center">
            <span>{slip.month} {slip.year}</span>
            <a href={slip.url} className="text-blue-500 hover:underline text-xs" target="_blank" rel="noopener noreferrer">Download</a>
          </li>
        )) : <li className="text-slate-400 text-sm">No payslips available.</li>}
      </ul>
    </div>
  </div>
);

export default PayrollTab;
