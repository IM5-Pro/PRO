import React from 'react';

const sectionTitle = 'font-semibold text-lg text-slate-800 border-b border-slate-100 pb-2 mb-3';

const DocumentsTab = ({ documents }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div className="bg-white rounded-xl shadow p-6 flex flex-col gap-4 md:col-span-2">
      <h3 className={sectionTitle}>Your documents</h3>
      <ul className="divide-y divide-slate-100">
        {documents && documents.length > 0 ? documents.map((doc, idx) => (
          <li key={idx} className="py-2 flex justify-between items-center">
            <span>{doc.name}</span>
            <a href={doc.url} className="text-blue-500 hover:underline text-xs" target="_blank" rel="noopener noreferrer">Open</a>
          </li>
        )) : <li className="text-slate-400 text-sm">No documents uploaded.</li>}
      </ul>
    </div>
  </div>
);

export default DocumentsTab;
