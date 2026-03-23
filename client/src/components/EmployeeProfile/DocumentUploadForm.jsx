import React, { useState } from 'react';

const DocumentUploadForm = ({ onUpload, onCancel }) => {
  const [file, setFile] = useState(null);
  const [documentType, setDocumentType] = useState('');
  const handleSubmit = e => {
    e.preventDefault();
    if (!file || !documentType) return;
    onUpload({ file, documentType });
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <input type="file" onChange={e => setFile(e.target.files[0])} className="input-modern" required />
      <input type="text" value={documentType} onChange={e => setDocumentType(e.target.value)} placeholder="Document Type" className="input-modern" required />
      <div className="flex gap-2 mt-2">
        <button type="submit" className="btn-primary">Upload</button>
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
};
export default DocumentUploadForm;
