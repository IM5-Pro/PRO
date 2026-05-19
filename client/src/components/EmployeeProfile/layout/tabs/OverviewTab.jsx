import React from 'react';

const sectionTitle = 'font-semibold text-lg text-slate-800 border-b border-slate-100 pb-2 mb-3';

const OverviewTab = ({ profile, attendanceStats, leaveStats }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div className="bg-white rounded-xl shadow p-6 flex flex-col gap-4">
      <h3 className={sectionTitle}>About you</h3>
      <div className="text-slate-600 text-sm">{profile.bio}</div>
      <div className="flex flex-wrap gap-4 mt-2">
        <div className="flex flex-col"><span className="text-xs text-slate-400">Date of birth</span><span>{profile.dob || '—'}</span></div>
        <div className="flex flex-col"><span className="text-xs text-slate-400">Gender</span><span>{profile.gender || '—'}</span></div>
        <div className="flex flex-col"><span className="text-xs text-slate-400">Blood group</span><span>{profile.bloodGroup || '—'}</span></div>
      </div>
    </div>
    <div className="bg-white rounded-xl shadow p-6 flex flex-col gap-4">
      <h3 className={sectionTitle}>Role & workplace</h3>
      <div className="text-slate-600 text-sm">{profile.designation} in {profile.department}</div>
      <div className="flex flex-wrap gap-4 mt-2">
        <div className="flex flex-col"><span className="text-xs text-slate-400">Joined</span><span>{profile.joinDate || '—'}</span></div>
        <div className="flex flex-col"><span className="text-xs text-slate-400">Location</span><span>{profile.location || '—'}</span></div>
      </div>
    </div>
    <div className="bg-white rounded-xl shadow p-6 flex flex-col gap-4 md:col-span-2">
      <h3 className={sectionTitle}>Account activity</h3>
      <div className="text-slate-600 text-sm">Last login: {profile.lastLogin || '—'}</div>
      <div className="text-slate-600 text-sm">Last profile update: {profile.lastUpdate || '—'}</div>
    </div>
    <div className="bg-white rounded-xl shadow p-6 flex flex-col gap-4 md:col-span-2">
      <h3 className={sectionTitle}>Attendance & leave</h3>
      <div className="flex flex-wrap gap-8">
        <div className="flex flex-col"><span className="text-xs text-slate-400">Present</span><span>{attendanceStats.present}</span></div>
        <div className="flex flex-col"><span className="text-xs text-slate-400">Absent</span><span>{attendanceStats.absent}</span></div>
        <div className="flex flex-col"><span className="text-xs text-slate-400">Late</span><span>{attendanceStats.late}</span></div>
        <div className="flex flex-col"><span className="text-xs text-slate-400">Attendance %</span><span>{attendanceStats.percentage}%</span></div>
        <div className="flex flex-col"><span className="text-xs text-slate-400">Total leave (allocated)</span><span>{leaveStats.totalLeaves}</span></div>
        <div className="flex flex-col"><span className="text-xs text-slate-400">Leave used</span><span>{leaveStats.usedLeaves}</span></div>
      </div>
    </div>
  </div>
);

export default OverviewTab;
