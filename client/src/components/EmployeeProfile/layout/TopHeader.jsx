import React from 'react';

const statusColors = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-red-100 text-red-700',
};

const TopHeader = ({ name, role, status = 'active', onEdit, onDownload, onMore }) => (
  <header className="sticky top-0 z-30 bg-white shadow-sm flex items-center justify-between px-6 py-3 border-b">
    <div className="flex items-center gap-4">
      <div className="text-xl font-bold text-slate-800">{name}</div>
      {/* <div className="text-base text-slate-500 font-medium">{role}</div> */}
      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[status] || statusColors.active}`}>
        {status === 'active' ? 'Active' : 'Inactive'}
      </span>
    </div>
    <div className="flex items-center gap-2">
      <button type="button" className="btn-secondary btn-xs" onClick={onEdit} title="Edit profile">Edit profile</button>
      <button type="button" className="btn-secondary btn-xs" onClick={onDownload} title="Download profile">Download</button>
      <button type="button" className="btn-secondary btn-xs" onClick={onMore} title="More actions">More</button>
    </div>
  </header>
);

export default TopHeader;
