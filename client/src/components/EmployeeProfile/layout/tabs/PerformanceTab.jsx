import React from 'react';

const PerformanceTab = ({ performance }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div className="bg-white rounded-xl shadow p-6 flex flex-col gap-4 md:col-span-2">
      <div className="flex items-center gap-3 mb-2">
        <span className="material-icons text-blue-500">trending_up</span>
        <h3 className="font-semibold text-lg text-slate-800">Performance Summary</h3>
      </div>
      <div className="flex flex-wrap gap-8">
        <div className="flex flex-col"><span className="text-xs text-slate-400">Rating</span><span>{performance.rating}</span></div>
        <div className="flex flex-col"><span className="text-xs text-slate-400">Last Review</span><span>{performance.lastReview}</span></div>
        <div className="flex flex-col"><span className="text-xs text-slate-400">Goals Met</span><span>{performance.goalsMet}</span></div>
        <div className="flex flex-col"><span className="text-xs text-slate-400">Feedback</span><span>{performance.feedback}</span></div>
      </div>
    </div>
    <div className="bg-white rounded-xl shadow p-6 flex flex-col gap-4 md:col-span-2">
      <div className="flex items-center gap-3 mb-2">
        <span className="material-icons text-blue-500">timeline</span>
        <h3 className="font-semibold text-lg text-slate-800">Performance Timeline</h3>
      </div>
      <ul className="divide-y divide-slate-100">
        {performance.timeline && performance.timeline.length > 0 ? performance.timeline.map((item, idx) => (
          <li key={idx} className="py-2 flex flex-col md:flex-row md:justify-between md:items-center">
            <span className="font-medium text-slate-700">{item.event}</span>
            <span className="text-xs text-slate-400">{item.date}</span>
          </li>
        )) : <li className="text-slate-400 text-sm">No performance events.</li>}
      </ul>
    </div>
  </div>
);

export default PerformanceTab;
