import React from 'react';

const TabbedContent = ({ tabs, activeTab, onTabChange, children }) => (
  <div className="w-full">
    <div className="flex gap-2 border-b mb-4 bg-white rounded-t-xl px-2 pt-2">
      {tabs.map((tab, idx) => (
        <button
          key={tab.key}
          type="button"
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-t-lg font-semibold text-sm transition-all duration-150 ${
            activeTab === tab.key
              ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-600'
              : 'text-slate-500 hover:text-blue-600'
          }`}
          onClick={() => onTabChange(tab.key)}
          aria-selected={activeTab === tab.key}
          aria-controls={`tabpanel-${tab.key}`}
          role="tab"
        >
          {tab.icon ? <span className="shrink-0 flex items-center" aria-hidden>{tab.icon}</span> : null}
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
    <div className="bg-white rounded-b-xl shadow p-6 min-h-[300px]" role="tabpanel" id={`tabpanel-${activeTab}`}>
      {children}
    </div>
  </div>
);

export default TabbedContent;
