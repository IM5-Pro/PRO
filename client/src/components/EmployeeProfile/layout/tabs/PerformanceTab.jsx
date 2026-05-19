import React from 'react';

const sectionTitle = 'font-semibold text-lg text-slate-800 border-b border-slate-100 pb-2 mb-3';

const PerformanceTab = ({ performance }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div className="bg-white rounded-xl shadow p-6 flex flex-col gap-4 md:col-span-2">
      <h3 className={sectionTitle}>Summary</h3>
      <div className="flex flex-wrap gap-8">
        <div className="flex flex-col"><span className="text-xs text-slate-400">Rating</span><span>{performance.rating}</span></div>
        <div className="flex flex-col"><span className="text-xs text-slate-400">Last review</span><span>{performance.lastReview}</span></div>
        <div className="flex flex-col"><span className="text-xs text-slate-400">Goals met</span><span>{performance.goalsMet}</span></div>
        <div className="flex flex-col"><span className="text-xs text-slate-400">Feedback</span><span>{performance.feedback}</span></div>
      </div>
    </div>
    <div className="bg-white rounded-xl shadow p-6 flex flex-col gap-4 md:col-span-2">
      <h3 className={sectionTitle}>Timeline</h3>
      <ul className="divide-y divide-slate-100">
        {performance.timeline && performance.timeline.length > 0 ? performance.timeline.map((item, idx) => (
          <li key={idx} className="py-2 flex flex-col md:flex-row md:justify-between md:items-center">
            <span className="font-medium text-slate-700">{item.event}</span>
            <span className="text-xs text-slate-400">{item.date}</span>
          </li>
        )) : <li className="text-slate-400 text-sm">No performance events on file.</li>}
      </ul>
    </div>
  </div>
);

export default PerformanceTab;
