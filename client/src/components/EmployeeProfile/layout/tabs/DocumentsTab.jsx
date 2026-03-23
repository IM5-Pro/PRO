import React from 'react';

const DocumentsTab = ({ documents }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div className="bg-white rounded-xl shadow p-6 flex flex-col gap-4 md:col-span-2">
      <div className="flex items-center gap-3 mb-2">
        <span className="material-icons text-blue-500">folder</span>
        <h3 className="font-semibold text-lg text-slate-800">Documents</h3>
      </div>
      <ul className="divide-y divide-slate-100">
        {documents && documents.length > 0 ? documents.map((doc, idx) => (
          <li key={idx} className="py-2 flex justify-between items-center">
            <span>{doc.name}</span>
            <a href={doc.url} className="text-blue-500 hover:underline text-xs" target="_blank" rel="noopener noreferrer">View</a>
          </li>
        )) : <li className="text-slate-400 text-sm">No documents uploaded.</li>}
      </ul>
    </div>
  </div>
);

export default DocumentsTab;
