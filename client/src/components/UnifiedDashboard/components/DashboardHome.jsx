import React from 'react';
import { FiCircle } from 'react-icons/fi';

const DashboardHome = ({ heading, subtitle, widgets, pages, onNavigate, loading }) => {
  const quickPages = pages.filter((page) => page.id !== 'dashboard').slice(0, 6);

  return (
    <div className="min-h-screen bg-transparent p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-1">{heading}</h1>
        <p className="text-sm text-slate-500">{subtitle}</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {widgets.map((widget) => (
          <div
            key={widget.title}
            className="bg-white rounded-xl border border-slate-200 px-5 py-4"
            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
          >
            <p className="text-xs font-medium text-slate-500 mb-2">{widget.title}</p>
            <p className="text-3xl font-bold text-slate-800 mb-1">{loading ? '—' : widget.value}</p>
            <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{widget.note}</p>
          </div>
        ))}
      </div>

      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Quick Access</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {quickPages.map((page) => {
          const PageIcon = page.icon || FiCircle;
          return (
            <button
              key={page.id}
              onClick={() => onNavigate(page.id)}
              className="text-left p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition-all group"
              style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
            >
              <span className="text-xl block mb-2 text-slate-700">
                <PageIcon size={20} />
              </span>
              <p className="text-sm font-semibold text-slate-800 group-hover:text-blue-700 leading-tight">{page.label}</p>
              {page.description && (
                <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{page.description}</p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardHome;
