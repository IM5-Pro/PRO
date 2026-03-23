import React from 'react';

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
  onMessage,
  onViewTeam,
  onManagerClick,
}) => (
  <aside className="sticky top-20 flex flex-col items-center bg-white rounded-2xl shadow-md p-6 w-full max-w-xs mx-auto mb-6">
    <div className="w-28 h-28 rounded-full bg-slate-100 flex items-center justify-center text-5xl mb-3 border-4 border-white shadow">
      {avatar || '👤'}
    </div>
    <div className="text-lg font-bold text-slate-800 mb-1">{name}</div>
    <div className="text-sm text-slate-500 mb-1">{designation}</div>
    <div className="text-xs text-slate-400 mb-2">{department}</div>
    <div className="text-xs text-slate-400 mb-2">ID: {employeeId}</div>
    <div className="text-xs text-slate-400 mb-2">{email}</div>
    <div className="text-xs text-slate-400 mb-4">{phone}</div>
    <div className="flex flex-col gap-1 w-full text-xs text-slate-600 mb-4">
      <div>📅 Joined: {joinDate}</div>
      <div>🕒 Experience: {experience}</div>
      <div>📍 {location}</div>
    </div>
    {manager && (
      <div className="mb-3 text-xs text-blue-600 cursor-pointer" onClick={onManagerClick} title="View Manager Profile">
        Manager: <span className="underline">{manager}</span>
      </div>
    )}
    <div className="flex gap-2 w-full">
      <button className="btn-primary btn-xs flex-1" onClick={onMessage}>Message</button>
      <button className="btn-secondary btn-xs flex-1" onClick={onViewTeam}>View Team</button>
    </div>
  </aside>
);

export default ProfileSidebar;
