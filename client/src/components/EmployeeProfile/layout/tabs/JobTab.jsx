import React from 'react';

const JobTab = ({ profile, experience }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div className="bg-white rounded-xl shadow p-6 flex flex-col gap-4">
      <div className="flex items-center gap-3 mb-2">
        <span className="material-icons text-blue-500">badge</span>
        <h3 className="font-semibold text-lg text-slate-800">Job Details</h3>
      </div>
      <div className="flex flex-wrap gap-4 mt-2">
        <div className="flex flex-col"><span className="text-xs text-slate-400">Employee ID</span><span>{profile.employeeId}</span></div>
        <div className="flex flex-col"><span className="text-xs text-slate-400">Designation</span><span>{profile.designation}</span></div>
        <div className="flex flex-col"><span className="text-xs text-slate-400">Department</span><span>{profile.department}</span></div>
        <div className="flex flex-col"><span className="text-xs text-slate-400">Manager</span><span>{profile.manager}</span></div>
        <div className="flex flex-col"><span className="text-xs text-slate-400">Location</span><span>{profile.location}</span></div>
        <div className="flex flex-col"><span className="text-xs text-slate-400">Join Date</span><span>{profile.joinDate}</span></div>
        <div className="flex flex-col"><span className="text-xs text-slate-400">Status</span><span>{profile.status}</span></div>
      </div>
    </div>
    <div className="bg-white rounded-xl shadow p-6 flex flex-col gap-4">
      <div className="flex items-center gap-3 mb-2">
        <span className="material-icons text-blue-500">timeline</span>
        <h3 className="font-semibold text-lg text-slate-800">Experience Timeline</h3>
      </div>
      <ul className="divide-y divide-slate-100">
        {experience && experience.length > 0 ? experience.map((exp, idx) => (
          <li key={idx} className="py-2">
            <div className="font-medium text-slate-700">{exp.role} at {exp.company}</div>
            <div className="text-xs text-slate-400">{exp.from} - {exp.to || 'Present'}</div>
          </li>
        )) : <li className="text-slate-400 text-sm">No experience records.</li>}
      </ul>
    </div>
  </div>
);

export default JobTab;
