

import React, { useEffect, useState, useCallback } from 'react';
import API from '../../api/client';
import { SYSTEM_ACCESS_ENDPOINTS } from '../../api/endpoints';
import SystemAccessForm from './SystemAccessForm';

const SystemAccessSection = ({ employeeId }) => {
  const [access, setAccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);


  const fetchAccess = useCallback(() => {
    if (!employeeId) return;
    setLoading(true);
    API.get(SYSTEM_ACCESS_ENDPOINTS.get(employeeId))
      .then(res => setAccess(res.data?.data || null))
      .catch(() => setError('Failed to load system access'))
      .finally(() => setLoading(false));
  }, [employeeId]);


  useEffect(() => {
    fetchAccess();
  }, [fetchAccess]);


  const handleEdit = useCallback(() => {
    setShowForm(true);
  }, []);

  const handleSave = useCallback((data) => {
    setActionLoading(true);
    API.put(SYSTEM_ACCESS_ENDPOINTS.update(employeeId), data)
      .then(() => {
        setShowForm(false);
        fetchAccess();
      })
      .catch(() => setError('Save failed'))
      .finally(() => setActionLoading(false));
  }, [employeeId, fetchAccess]);

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-2 flex items-center justify-between">
        <span>System Access</span>
        <button className="btn-secondary btn-xs" onClick={handleEdit} disabled={actionLoading || loading || !access} aria-label="Edit system access">Edit</button>
      </h2>
      {loading ? (
        <div className="flex items-center gap-3 text-slate-500" role="status" aria-live="polite">
          <span className="spinner" aria-hidden="true" />
          <span className="text-sm leading-none">Loading...</span>
        </div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : access ? (
        <div className="border p-3 rounded">
          <div><b>Official Email:</b> {access.officialEmail}</div>
          <div><b>Username:</b> {access.username}</div>
          <div><b>Role:</b> {access.role}</div>
          <div><b>Permissions:</b> {access.permissions?.join(', ')}</div>
          {access.updatedAt && <div className="text-xs text-gray-400 mt-2">Last updated: {new Date(access.updatedAt).toLocaleString()}</div>}
        </div>
      ) : (
        <div className="text-gray-400 flex flex-col items-center py-6">
          <span>No system access data.</span>
        </div>
      )}
      {showForm && (
        <div className="modal-bg" tabIndex={-1} aria-modal="true" role="dialog">
          <div className="modal-box">
            <SystemAccessForm
              initial={access}
              onSave={handleSave}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(SystemAccessSection);
