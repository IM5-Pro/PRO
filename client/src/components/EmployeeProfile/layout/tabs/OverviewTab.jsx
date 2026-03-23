import React from 'react';

const OverviewTab = ({ profile, attendanceStats, leaveStats }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div className="bg-white rounded-xl shadow p-6 flex flex-col gap-4">
      <div className="flex items-center gap-3 mb-2">
        <span className="material-icons text-blue-500">info</span>
        <h3 className="font-semibold text-lg text-slate-800">About</h3>
      </div>
      <div className="text-slate-600 text-sm">{profile.bio}</div>
      <div className="flex flex-wrap gap-4 mt-2">
        <div className="flex flex-col"><span className="text-xs text-slate-400">DOB</span><span>{profile.dob || '-'}</span></div>
        <div className="flex flex-col"><span className="text-xs text-slate-400">Gender</span><span>{profile.gender || '-'}</span></div>
        <div className="flex flex-col"><span className="text-xs text-slate-400">Blood Group</span><span>{profile.bloodGroup || '-'}</span></div>
      </div>
    </div>
    <div className="bg-white rounded-xl shadow p-6 flex flex-col gap-4">
      <div className="flex items-center gap-3 mb-2">
        <span className="material-icons text-blue-500">work</span>
        <h3 className="font-semibold text-lg text-slate-800">Current Job Info</h3>
      </div>
      <div className="text-slate-600 text-sm">{profile.designation} in {profile.department}</div>
      <div className="flex flex-wrap gap-4 mt-2">
        <div className="flex flex-col"><span className="text-xs text-slate-400">Joined</span><span>{profile.joinDate || '-'}</span></div>
        <div className="flex flex-col"><span className="text-xs text-slate-400">Location</span><span>{profile.location || '-'}</span></div>
      </div>
    </div>
    <div className="bg-white rounded-xl shadow p-6 flex flex-col gap-4 md:col-span-2">
      <div className="flex items-center gap-3 mb-2">
        <span className="material-icons text-blue-500">history</span>
        <h3 className="font-semibold text-lg text-slate-800">Recent Activity</h3>
      </div>
      <div className="text-slate-600 text-sm">Last login: {profile.lastLogin || 'N/A'}</div>
      <div className="text-slate-600 text-sm">Last update: {profile.lastUpdate || 'N/A'}</div>
    </div>
    <div className="bg-white rounded-xl shadow p-6 flex flex-col gap-4 md:col-span-2">
      <div className="flex items-center gap-3 mb-2">
        <span className="material-icons text-blue-500">event_available</span>
        <h3 className="font-semibold text-lg text-slate-800">Attendance & Leave</h3>
      </div>
      <div className="flex flex-wrap gap-8">
        <div className="flex flex-col"><span className="text-xs text-slate-400">Present</span><span>{attendanceStats.present}</span></div>
        <div className="flex flex-col"><span className="text-xs text-slate-400">Absent</span><span>{attendanceStats.absent}</span></div>
        <div className="flex flex-col"><span className="text-xs text-slate-400">Late</span><span>{attendanceStats.late}</span></div>
        <div className="flex flex-col"><span className="text-xs text-slate-400">Attendance %</span><span>{attendanceStats.percentage}%</span></div>
        <div className="flex flex-col"><span className="text-xs text-slate-400">Total Leaves</span><span>{leaveStats.totalLeaves}</span></div>
        <div className="flex flex-col"><span className="text-xs text-slate-400">Used Leaves</span><span>{leaveStats.usedLeaves}</span></div>
      </div>
    </div>
  </div>
);

export default OverviewTab;
