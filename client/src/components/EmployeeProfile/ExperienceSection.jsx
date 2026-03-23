

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import API from '../../api/client';
import { EXPERIENCE_ENDPOINTS } from '../../api/endpoints';
import ExperienceForm from './ExperienceForm';

const showToast = (msg, type = 'success') => {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerText = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
};

const ExperienceSection = ({ employeeId }) => {
  const [experience, setExperience] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showDeleteId, setShowDeleteId] = useState(null);
  const [search, setSearch] = useState('');


  const fetchExperience = useCallback(() => {
    if (!employeeId) return;
    setLoading(true);
    API.get(EXPERIENCE_ENDPOINTS.list(employeeId))
      .then(res => setExperience(res.data?.data || []))
      .catch(() => setError('Failed to load experience'))
      .finally(() => setLoading(false));
  }, [employeeId]);


  useEffect(() => {
    fetchExperience();
    // eslint-disable-next-line
  }, [fetchExperience]);


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
    API.delete(EXPERIENCE_ENDPOINTS.delete(id))
      .then(() => {
        showToast('Deleted successfully');
        fetchExperience();
      })
      .catch(() => setError('Delete failed'))
      .finally(() => {
        setActionLoading(false);
        setShowDeleteId(null);
      });
  }, [fetchExperience]);

  const handleSave = useCallback((data) => {
    setActionLoading(true);
    const req = editItem
      ? API.put(EXPERIENCE_ENDPOINTS.update(editItem._id), data)
      : API.post(EXPERIENCE_ENDPOINTS.add(employeeId), data);
    req.then(() => {
      setShowForm(false);
      showToast(editItem ? 'Updated successfully' : 'Added successfully');
      fetchExperience();
    })
      .catch(() => setError('Save failed'))
      .finally(() => setActionLoading(false));
  }, [editItem, employeeId, fetchExperience]);

  // Filtered experience list
  const filteredExperience = useMemo(() => {
    if (!search) return experience;
    return experience.filter(e =>
      (e.companyName || '').toLowerCase().includes(search.toLowerCase()) ||
      (e.jobTitle || '').toLowerCase().includes(search.toLowerCase())
    );
  }, [experience, search]);

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-2 flex items-center justify-between">
        <span>Work Experience</span>
        <button className="btn-primary btn-xs" onClick={handleAdd} disabled={actionLoading} aria-label="Add experience">Add</button>
      </h2>
      <input
        className="input-modern w-full mb-2"
        placeholder="Search experience..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        aria-label="Search experience"
      />
      {loading ? (
        <div className="flex items-center gap-2"><span className="spinner" /> Loading...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : filteredExperience.length === 0 ? (
        <div className="text-gray-400 flex flex-col items-center py-6">
          <span className="material-icons text-4xl mb-2">work</span>
          <span>No experience records found.</span>
        </div>
      ) : (
        <ul className="space-y-2">
          {filteredExperience.map((exp) => (
            <li key={exp._id} className="border p-2 rounded flex justify-between items-center">
              <div>
                <div className="font-medium">{exp.companyName} - {exp.jobTitle}</div>
                <div className="text-sm text-gray-600">{exp.from?.slice(0,10)} to {exp.to?.slice(0,10) || 'Present'}</div>
                {exp.skills?.length > 0 && <div className="text-xs text-blue-700">Skills: {exp.skills.join(', ')}</div>}
                {exp.updatedAt && <div className="text-xs text-gray-400">Last updated: {new Date(exp.updatedAt).toLocaleString()}</div>}
              </div>
              <div className="flex gap-2">
                <button className="btn-secondary btn-xs" onClick={() => handleEdit(exp)} disabled={actionLoading} aria-label="Edit experience">Edit</button>
                <button className="btn-danger btn-xs" onClick={() => handleDelete(exp._id)} disabled={actionLoading} aria-label="Delete experience">Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {showForm && (
        <div className="modal-bg" tabIndex={-1} aria-modal="true" role="dialog">
          <div className="modal-box">
            <ExperienceForm
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
            <div className="mb-4">Are you sure you want to delete this experience entry?</div>
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

export default React.memo(ExperienceSection);
