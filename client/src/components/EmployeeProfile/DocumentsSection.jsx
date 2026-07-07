

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import API from '../../api/client';
import { DOCUMENT_ENDPOINTS } from '../../api/endpoints';
import DocumentUploadForm from './DocumentUploadForm';

const DocumentsSection = ({ employeeId }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showDeleteId, setShowDeleteId] = useState(null);
  const [search, setSearch] = useState('');
  const [dragActive, setDragActive] = useState(false);


  const fetchDocuments = useCallback(() => {
    if (!employeeId) return;
    setLoading(true);
    API.get(DOCUMENT_ENDPOINTS.list(employeeId))
      .then(res => setDocuments(res.data?.data || []))
      .catch(() => setError('Failed to load documents'))
      .finally(() => setLoading(false));
  }, [employeeId]);


  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);


  const handleUpload = useCallback(({ file, documentType }) => {
    setActionLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    API.post(DOCUMENT_ENDPOINTS.upload(employeeId), formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
      .then(() => {
        setShowForm(false);
        fetchDocuments();
      })
      .catch(() => setError('Upload failed'))
      .finally(() => setActionLoading(false));
  }, [employeeId, fetchDocuments]);


  const handleDelete = useCallback((id) => {
    setShowDeleteId(id);
  }, []);

  const confirmDelete = useCallback((id) => {
    setActionLoading(true);
    API.delete(DOCUMENT_ENDPOINTS.upload(id))
      .then(() => {
        fetchDocuments();
      })
      .catch(() => setError('Delete failed'))
      .finally(() => {
        setActionLoading(false);
        setShowDeleteId(null);
      });
  }, [fetchDocuments]);

  // Filtered documents list
  const filteredDocuments = useMemo(() => {
    if (!search) return documents;
    return documents.filter(d =>
      (d.documentType || '').toLowerCase().includes(search.toLowerCase()) ||
      (d.fileName || '').toLowerCase().includes(search.toLowerCase())
    );
  }, [documents, search]);

  // Drag-and-drop handlers
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setShowForm(true);
      // Optionally, pass file to form
    }
  }, []);

  return (
    <div className="mb-6" onDragEnter={handleDrag}>
      <h2 className="text-lg font-semibold mb-2 flex items-center justify-between">
        <span>Documents</span>
        <button className="btn-primary btn-xs" onClick={() => setShowForm(true)} disabled={actionLoading} aria-label="Upload document">Upload</button>
      </h2>
      <input
        className="input-modern w-full mb-2"
        placeholder="Search documents..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        aria-label="Search documents"
      />
      <div
        className={`border-2 border-dashed rounded p-4 mb-2 text-center transition ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        tabIndex={0}
        aria-label="Drag and drop files here"
      >
        Drag & drop files here to upload
      </div>
      {loading ? (
        <div className="flex items-center gap-2"><span className="spinner" /> Loading...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : filteredDocuments.length === 0 ? (
        <div className="text-gray-400 flex flex-col items-center py-6">
          <span>No documents found.</span>
        </div>
      ) : (
        <ul className="space-y-2">
          {filteredDocuments.map((doc) => (
            <li key={doc._id} className="border p-2 rounded flex justify-between items-center">
              <div>
                <div className="font-medium">{doc.documentType}</div>
                <div className="text-sm text-gray-600">{doc.fileName}</div>
                <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-xs">Download</a>
                {doc.updatedAt && <div className="text-xs text-gray-400">Last updated: {new Date(doc.updatedAt).toLocaleString()}</div>}
              </div>
              <button className="btn-danger btn-xs" onClick={() => handleDelete(doc._id)} disabled={actionLoading} aria-label="Delete document">Delete</button>
            </li>
          ))}
        </ul>
      )}
      {showForm && (
        <div className="modal-bg" tabIndex={-1} aria-modal="true" role="dialog">
          <div className="modal-box">
            <DocumentUploadForm
              onUpload={handleUpload}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}
      {showDeleteId && (
        <div className="modal-bg" tabIndex={-1} aria-modal="true" role="dialog">
          <div className="modal-box max-w-xs">
            <div className="mb-4">Are you sure you want to delete this document?</div>
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

export default React.memo(DocumentsSection);
