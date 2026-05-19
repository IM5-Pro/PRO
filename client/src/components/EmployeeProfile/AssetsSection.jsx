

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import API from '../../api/client';
import { ASSET_ENDPOINTS } from '../../api/endpoints';
import AssetForm from './AssetForm';

const showToast = (msg, type = 'success') => {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerText = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
};

const AssetsSection = ({ employeeId }) => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showDeleteId, setShowDeleteId] = useState(null);
  const [search, setSearch] = useState('');


  const fetchAssets = useCallback(() => {
    if (!employeeId) return;
    setLoading(true);
    API.get(ASSET_ENDPOINTS.list(employeeId))
      .then(res => setAssets(res.data?.data || []))
      .catch(() => setError('Failed to load assets'))
      .finally(() => setLoading(false));
  }, [employeeId]);


  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);


  const handleAdd = useCallback(() => {
    setEditItem(null);
    setShowForm(true);
  }, []);

  const handleEdit = useCallback((item) => {
    setEditItem(item);
    setShowForm(true);
  }, []);

  const handleDelete = useCallback((id) => {
    setShowDeleteId(id);
  }, []);

  const confirmDelete = useCallback((id) => {
    setActionLoading(true);
    API.delete(ASSET_ENDPOINTS.delete(id))
      .then(() => {
        showToast('Deleted successfully');
        fetchAssets();
      })
      .catch(() => setError('Delete failed'))
      .finally(() => {
        setActionLoading(false);
        setShowDeleteId(null);
      });
  }, [fetchAssets]);

  const handleSave = useCallback((data) => {
    setActionLoading(true);
    const req = editItem
      ? API.put(ASSET_ENDPOINTS.update(editItem._id), data)
      : API.post(ASSET_ENDPOINTS.add(employeeId), data);
    req.then(() => {
      setShowForm(false);
      showToast(editItem ? 'Updated successfully' : 'Added successfully');
      fetchAssets();
    })
      .catch(() => setError('Save failed'))
      .finally(() => setActionLoading(false));
  }, [editItem, employeeId, fetchAssets]);

  // Filtered assets list
  const filteredAssets = useMemo(() => {
    if (!search) return assets;
    return assets.filter(a =>
      (a.assetType || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.assetTag || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.description || '').toLowerCase().includes(search.toLowerCase())
    );
  }, [assets, search]);

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-2 flex items-center justify-between">
        <span>Assets</span>
        <button className="btn-primary btn-xs" onClick={handleAdd} disabled={actionLoading} aria-label="Add asset">Add</button>
      </h2>
      <input
        className="input-modern w-full mb-2"
        placeholder="Search assets..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        aria-label="Search assets"
      />
      {loading ? (
        <div className="flex items-center gap-2"><span className="spinner" /> Loading...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : filteredAssets.length === 0 ? (
        <div className="text-gray-400 flex flex-col items-center py-6">
          <span>No assets found.</span>
        </div>
      ) : (
        <ul className="space-y-2">
          {filteredAssets.map((asset) => (
            <li key={asset._id} className="border p-2 rounded flex justify-between items-center">
              <div>
                <div className="font-medium">{asset.assetType} {asset.assetTag && `- ${asset.assetTag}`}</div>
                <div className="text-sm text-gray-600">{asset.description}</div>
                <div className="text-xs text-gray-500">Assigned: {asset.assignedDate?.slice(0,10)} | Status: {asset.status}</div>
                {asset.updatedAt && <div className="text-xs text-gray-400">Last updated: {new Date(asset.updatedAt).toLocaleString()}</div>}
              </div>
              <div className="flex gap-2">
                <button className="btn-secondary btn-xs" onClick={() => handleEdit(asset)} disabled={actionLoading} aria-label="Edit asset">Edit</button>
                <button className="btn-danger btn-xs" onClick={() => handleDelete(asset._id)} disabled={actionLoading} aria-label="Delete asset">Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {showForm && (
        <div className="modal-bg" tabIndex={-1} aria-modal="true" role="dialog">
          <div className="modal-box">
            <AssetForm
              initial={editItem}
              onSave={handleSave}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}
      {showDeleteId && (
        <div className="modal-bg" tabIndex={-1} aria-modal="true" role="dialog">
          <div className="modal-box max-w-xs">
            <div className="mb-4">Are you sure you want to delete this asset?</div>
            <div className="flex gap-2 justify-end">
              <button className="btn-secondary btn-xs" onClick={() => setShowDeleteId(null)} disabled={actionLoading}>Cancel</button>
              <button className="btn-danger btn-xs" onClick={() => confirmDelete(showDeleteId)} disabled={actionLoading}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(AssetsSection);
