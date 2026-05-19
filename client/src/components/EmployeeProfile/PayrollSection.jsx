

import React, { useEffect, useState, useCallback } from 'react';
import API from '../../api/client';
import { PAYROLL_DETAIL_ENDPOINTS } from '../../api/endpoints';
import PayrollForm from './PayrollForm';
import { formatINR } from '../../utils/currency';

const showToast = (msg, type = 'success') => {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerText = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
};

const PayrollSection = ({ employeeId }) => {
  const [payroll, setPayroll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);


  const fetchPayroll = useCallback(() => {
    if (!employeeId) return;
    setLoading(true);
    API.get(PAYROLL_DETAIL_ENDPOINTS.get(employeeId))
      .then(res => setPayroll(res.data?.data || null))
      .catch(() => setError('Failed to load payroll'))
      .finally(() => setLoading(false));
  }, [employeeId]);


  useEffect(() => {
    fetchPayroll();
  }, [fetchPayroll]);


  const handleEdit = useCallback(() => {
    setShowForm(true);
  }, []);

  const handleSave = useCallback((data) => {
    setActionLoading(true);
    API.put(PAYROLL_DETAIL_ENDPOINTS.update(employeeId), data)
      .then(() => {
        setShowForm(false);
        showToast('Payroll updated successfully');
        fetchPayroll();
      })
      .catch(() => setError('Save failed'))
      .finally(() => setActionLoading(false));
  }, [employeeId, fetchPayroll]);

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-2 flex items-center justify-between">
        <span>Payroll & Compensation</span>
        <button className="btn-secondary btn-xs" onClick={handleEdit} disabled={actionLoading || loading || !payroll} aria-label="Edit payroll">Edit</button>
      </h2>
      {loading ? (
        <div className="flex items-center gap-3 text-slate-500" role="status" aria-live="polite">
          <span className="spinner" aria-hidden="true" />
          <span className="text-sm leading-none">Loading...</span>
        </div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : payroll ? (
        <div className="border p-3 rounded">
          <div><b>CTC:</b> {formatINR(payroll.ctc, { fallback: payroll.ctc || '—' })}</div>
          <div><b>Basic:</b> {formatINR(payroll.basic, { fallback: payroll.basic || '—' })}</div>
          <div><b>HRA:</b> {formatINR(payroll.hra, { fallback: payroll.hra || '—' })}</div>
          <div><b>Bank:</b> {payroll.bankName} ({payroll.bankAccountNumber})</div>
          <div><b>IFSC:</b> {payroll.ifscCode}</div>
          <div><b>PF No:</b> {payroll.pfNumber}</div>
          <div><b>UAN:</b> {payroll.uan}</div>
          <div><b>ESI:</b> {payroll.esiDetails}</div>
          <div><b>Tax Info:</b> {payroll.taxInfo}</div>
          {payroll.updatedAt && <div className="text-xs text-gray-400 mt-2">Last updated: {new Date(payroll.updatedAt).toLocaleString()}</div>}
        </div>
      ) : (
        <div className="text-gray-400 flex flex-col items-center py-6">
          <span>No payroll data.</span>
        </div>
      )}
      {showForm && (
        <div className="modal-bg" tabIndex={-1} aria-modal="true" role="dialog">
          <div className="modal-box">
            <PayrollForm
              initial={payroll}
              onSave={handleSave}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(PayrollSection);
