import React, { useState } from 'react';
import { FiDownload } from 'react-icons/fi';
import { formatINR } from '../../../../utils/currency';
import { downloadPayslipPdf } from '../../../../utils/downloadPayslip';

const sectionTitle = 'font-semibold text-lg text-slate-800 border-b border-slate-100 pb-2 mb-3';

const PayrollTab = ({ payroll }) => {
  const [downloadingId, setDownloadingId] = useState('');
  const [downloadError, setDownloadError] = useState('');

  const handleDownload = async (slip) => {
    if (!slip?.id) {
      return;
    }

    setDownloadingId(slip.id);
    setDownloadError('');

    try {
      await downloadPayslipPdf(slip.id, slip.month);
    } catch (err) {
      setDownloadError(err?.message || 'Failed to download payslip');
    } finally {
      setDownloadingId('');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl shadow p-6 flex flex-col gap-4">
        <h3 className={sectionTitle}>Compensation snapshot</h3>
        {payroll.isProjected && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Estimated from your compensation settings until HR publishes an official payslip.
          </p>
        )}
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div className="flex flex-col">
            <span className="text-xs text-slate-400">Gross salary</span>
            <span className="font-medium">{payroll.grossSalary}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-slate-400">Deductions</span>
            <span className="font-medium">{payroll.deductionsTotal}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-slate-400">Net pay</span>
            <span className="font-medium">{formatINR(payroll.salary, { fallback: payroll.salary })}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-slate-400">Bank</span>
            <span>{payroll.bankName}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-slate-400">Account number</span>
            <span>{payroll.accountNumber}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-slate-400">IFSC</span>
            <span>{payroll.ifsc}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-slate-400">PAN</span>
            <span>{payroll.pan}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-slate-400">PF (latest run)</span>
            <span>{payroll.pfNumber}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-slate-400">ESI (latest run)</span>
            <span>{payroll.esiNumber}</span>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow p-6 flex flex-col gap-4">
        <h3 className={sectionTitle}>Payslip history</h3>
        {downloadError && (
          <p className="text-sm text-red-600">{downloadError}</p>
        )}
        <ul className="divide-y divide-slate-100">
          {payroll.payslips && payroll.payslips.length > 0 ? (
            payroll.payslips.map((slip) => (
              <li key={slip.id || slip.month} className="py-2 flex justify-between items-center gap-3">
                <span>
                  {slip.month} {slip.year}
                </span>
                <button
                  type="button"
                  onClick={() => handleDownload(slip)}
                  disabled={!slip.id || downloadingId === slip.id}
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 disabled:text-slate-400 text-xs"
                >
                  <FiDownload size={14} aria-hidden />
                  {downloadingId === slip.id ? 'Downloading...' : 'Download'}
                </button>
              </li>
            ))
          ) : (
            <li className="text-slate-400 text-sm">No payslips available.</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default PayrollTab;
