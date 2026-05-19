import React from 'react';

const sectionTitle = 'font-semibold text-lg text-slate-800 border-b border-slate-100 pb-2 mb-3';

const JobTab = ({ profile, experience }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div className="bg-white rounded-xl shadow p-6 flex flex-col gap-4">
      <h3 className={sectionTitle}>Employment details</h3>
      <div className="flex flex-wrap gap-4 mt-2">
        <div className="flex flex-col"><span className="text-xs text-slate-400">Employee code</span><span>{profile.employeeCode || profile.employeeId || '—'}</span></div>
        <div className="flex flex-col"><span className="text-xs text-slate-400">Designation</span><span>{profile.designation}</span></div>
        <div className="flex flex-col"><span className="text-xs text-slate-400">Department</span><span>{profile.department}</span></div>
        <div className="flex flex-col"><span className="text-xs text-slate-400">Reporting manager</span><span>{profile.manager || '—'}</span></div>
        <div className="flex flex-col"><span className="text-xs text-slate-400">Base location</span><span>{profile.location}</span></div>
        <div className="flex flex-col"><span className="text-xs text-slate-400">Join date</span><span>{profile.joinDate}</span></div>
        <div className="flex flex-col"><span className="text-xs text-slate-400">Employment status</span><span>{profile.status}</span></div>
      </div>
    </div>
    <div className="bg-white rounded-xl shadow p-6 flex flex-col gap-4">
      <h3 className={sectionTitle}>Prior experience</h3>
      <ul className="divide-y divide-slate-100">
        {experience && experience.length > 0 ? experience.map((exp, idx) => (
          <li key={idx} className="py-2">
            <div className="font-medium text-slate-700">{exp.role} at {exp.company}</div>
            <div className="text-xs text-slate-400">{exp.from} — {exp.to || 'Present'}</div>
          </li>
        )) : <li className="text-slate-400 text-sm">No prior experience on file.</li>}
      </ul>
    </div>
  </div>
);

export default JobTab;
