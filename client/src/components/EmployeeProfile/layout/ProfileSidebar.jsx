import React from 'react';

const InfoRow = ({ label, value, onClick, interactive }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[11px] uppercase tracking-wide text-slate-400">{label}</span>
    <span
      className={`text-sm font-medium break-words ${
        interactive ? 'text-blue-600 cursor-pointer hover:underline' : 'text-slate-700'
      }`}
      onClick={interactive ? onClick : undefined}
      title={interactive ? 'View Manager Profile' : undefined}
    >
      {value || '—'}
    </span>
  </div>
);

const ProfileSidebar = ({
  avatar,
  name,
  designation,
  department,
  employeeId,
  email,
  phone,
  joinDate,
  experience,
  location,
  manager,
  onManagerClick,
}) => (
  <aside className="sticky top-20 flex flex-col bg-white rounded-2xl shadow-md w-full max-w-xs mx-auto mb-6 overflow-hidden">
    {/* Header */}
    <div className="flex flex-col items-center text-center px-6 pt-8 pb-6 bg-gradient-to-b from-slate-50 to-white">
      <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center text-4xl mb-4 border-4 border-white shadow">
        {avatar || '👤'}
      </div>
      <div className="text-lg font-bold text-slate-800 leading-tight">{name}</div>
      {designation && <div className="text-sm text-slate-500 mt-1">{designation}</div>}
      {department && (
        <span className="mt-3 inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-medium">
          {department}
        </span>
      )}
    </div>

    {/* Contact */}
    <div className="px-6 py-5 border-t border-slate-100 flex flex-col gap-4">
      <InfoRow label="Email" value={email} />
      <InfoRow label="Phone" value={phone} />
    </div>

    {/* Details */}
    <div className="px-6 py-5 border-t border-slate-100 flex flex-col gap-4">
      <InfoRow label="Employee ID" value={employeeId} />
      <InfoRow label="Joined" value={joinDate} />
      <InfoRow label="Experience" value={experience} />
      <InfoRow label="Location" value={location} />
      {manager && (
        <InfoRow label="Manager" value={manager} interactive onClick={onManagerClick} />
      )}
    </div>
  </aside>
);

export default ProfileSidebar;
