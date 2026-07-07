

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import API from '../../api/client';
import { EDUCATION_ENDPOINTS } from '../../api/endpoints';
import EducationForm from './EducationForm';

const EducationSection = ({ employeeId }) => {
  const [education, setEducation] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showDeleteId, setShowDeleteId] = useState(null);
  const [search, setSearch] = useState('');


  const fetchEducation = useCallback(() => {
    if (!employeeId) return;
    setLoading(true);
    API.get(EDUCATION_ENDPOINTS.list(employeeId))
      .then(res => setEducation(res.data?.data || []))
      .catch(() => setError('Failed to load education'))
      .finally(() => setLoading(false));
  }, [employeeId]);


  useEffect(() => {
    fetchEducation();
  }, [fetchEducation]);


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
    API.delete(EDUCATION_ENDPOINTS.delete(id))
      .then(() => {
        fetchEducation();
      })
      .catch(() => setError('Delete failed'))
      .finally(() => {
        setActionLoading(false);
        setShowDeleteId(null);
      });
  }, [fetchEducation]);

  const handleSave = useCallback((data) => {
    setActionLoading(true);
    const req = editItem
      ? API.put(EDUCATION_ENDPOINTS.update(editItem._id), data)
      : API.post(EDUCATION_ENDPOINTS.add(employeeId), data);
    req.then(() => {
      setShowForm(false);
      fetchEducation();
    })
      .catch(() => setError('Save failed'))
      .finally(() => setActionLoading(false));
  }, [editItem, employeeId, fetchEducation]);

  // Filtered education list
  const filteredEducation = useMemo(() => {
    if (!search) return education;
    return education.filter(e =>
      (e.qualification || '').toLowerCase().includes(search.toLowerCase()) ||
      (e.degree || '').toLowerCase().includes(search.toLowerCase()) ||
      (e.university || '').toLowerCase().includes(search.toLowerCase())
    );
  }, [education, search]);

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-2 flex items-center justify-between">
        <span>Education</span>
        <button className="btn-primary btn-xs" onClick={handleAdd} disabled={actionLoading} aria-label="Add education">Add</button>
      </h2>
      <input
        className="input-modern w-full mb-2"
        placeholder="Search education..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        aria-label="Search education"
      />
      {loading ? (
        <div className="flex items-center gap-2"><span className="spinner" /> Loading...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : filteredEducation.length === 0 ? (
        <div className="text-gray-400 flex flex-col items-center py-6">
          <span>No education records found.</span>
        </div>
      ) : (
        <ul className="space-y-2">
          {filteredEducation.map((edu) => (
            <li key={edu._id} className="border p-2 rounded flex justify-between items-center">
              <div>
                <div className="font-medium">{edu.qualification} {edu.degree && `- ${edu.degree}`}</div>
                <div className="text-sm text-gray-600">{edu.university} ({edu.yearOfPassing})</div>
                {edu.certifications?.length > 0 && <div className="text-xs text-blue-700">Certifications: {edu.certifications.join(', ')}</div>}
                {edu.updatedAt && <div className="text-xs text-gray-400">Last updated: {new Date(edu.updatedAt).toLocaleString()}</div>}
              </div>
              <div className="flex gap-2">
                <button className="btn-secondary btn-xs" onClick={() => handleEdit(edu)} disabled={actionLoading} aria-label="Edit education">Edit</button>
                <button className="btn-danger btn-xs" onClick={() => handleDelete(edu._id)} disabled={actionLoading} aria-label="Delete education">Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {showForm && (
        <div className="modal-bg" tabIndex={-1} aria-modal="true" role="dialog">
          <div className="modal-box">
            <EducationForm
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
            <div className="mb-4">Are you sure you want to delete this education entry?</div>
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

export default React.memo(EducationSection);
