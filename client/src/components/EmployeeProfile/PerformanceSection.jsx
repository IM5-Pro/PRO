

import React, { useEffect, useState, useCallback } from 'react';
import API from '../../api/client';
import { PERFORMANCE_ENDPOINTS } from '../../api/endpoints';
import PerformanceForm from './PerformanceForm';

const showToast = (msg, type = 'success') => {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerText = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
};

const PerformanceSection = ({ employeeId }) => {
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);


  const fetchPerformance = useCallback(() => {
    if (!employeeId) return;
    setLoading(true);
    API.get(PERFORMANCE_ENDPOINTS.get(employeeId))
      .then(res => setPerformance(res.data?.data || null))
      .catch(() => setError('Failed to load performance'))
      .finally(() => setLoading(false));
  }, [employeeId]);


  useEffect(() => {
    fetchPerformance();
  }, [fetchPerformance]);


  const handleEdit = useCallback(() => {
    setShowForm(true);
  }, []);

  const handleSave = useCallback((data) => {
    setActionLoading(true);
    API.put(PERFORMANCE_ENDPOINTS.update(employeeId), data)
      .then(() => {
        setShowForm(false);
        showToast('Performance updated successfully');
        fetchPerformance();
      })
      .catch(() => setError('Save failed'))
      .finally(() => setActionLoading(false));
  }, [employeeId, fetchPerformance]);

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-2 flex items-center justify-between">
        <span>Performance & Reviews</span>
        <button className="btn-secondary btn-xs" onClick={handleEdit} disabled={actionLoading || loading || !performance} aria-label="Edit performance">Edit</button>
      </h2>
      {loading ? (
        <div className="flex items-center gap-2"><span className="spinner" /> Loading...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : performance ? (
        <div className="border p-3 rounded">
          <div><b>KPIs:</b> {performance.kpis?.join(', ')}</div>
          <div><b>Goals:</b> {performance.goals?.join(', ')}</div>
          <div><b>Ratings:</b> {performance.ratings?.map(r => `${r.year}: ${r.rating}`).join(', ')}</div>
          <div><b>Appraisals:</b> {performance.appraisalHistory?.map(a => `${a.year}: ${a.details}`).join(', ')}</div>
          <div><b>Manager Feedback:</b> {performance.managerFeedback?.map(f => f.feedback).join(' | ')}</div>
          {performance.updatedAt && <div className="text-xs text-gray-400 mt-2">Last updated: {new Date(performance.updatedAt).toLocaleString()}</div>}
        </div>
      ) : (
        <div className="text-gray-400 flex flex-col items-center py-6 text-sm">
          <span>No performance data.</span>
        </div>
      )}
      {showForm && (
        <div className="modal-bg" tabIndex={-1} aria-modal="true" role="dialog">
          <div className="modal-box">
            <PerformanceForm
              initial={performance}
              onSave={handleSave}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(PerformanceSection);
