import React from 'react';
import { FiCircle } from 'react-icons/fi';

const DashboardHome = ({ heading, subtitle, widgets, pages, onNavigate, loading }) => {
  const quickPages = pages.filter((page) => page.id !== 'dashboard').slice(0, 6);

  // Accent color mapping for widgets and icons
  const accentColors = {
    attendance: 'bg-blue-100 text-blue-600',
    leaves: 'bg-amber-100 text-amber-600',
    holidays: 'bg-green-100 text-green-600',
    payslip: 'bg-purple-100 text-purple-600',
    payroll: 'bg-teal-100 text-teal-600',
    'team-attendance': 'bg-blue-100 text-blue-600',
    'leave-requests': 'bg-amber-100 text-amber-600',
    'team-performance': 'bg-teal-100 text-teal-600',
    'team-members': 'bg-purple-100 text-purple-600',
    'total-employees': 'bg-blue-100 text-blue-600',
    'new-joiners': 'bg-green-100 text-green-600',
    'pending-leaves': 'bg-amber-100 text-amber-600',
    'payroll-processing': 'bg-purple-100 text-purple-600',
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 md:p-8">
      {/* Banner section */}
      <div className="mb-8 rounded-2xl bg-gradient-to-r from-blue-50 via-white to-amber-50 p-6 md:p-8 shadow-sm flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold text-slate-800 mb-1 tracking-tight" style={{ fontFamily: 'Inter, Roboto, sans-serif' }}>{heading}</h1>
        <p className="text-base text-slate-500 font-medium">{subtitle}</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
        {widgets.map((widget) => {
          // Pick accent color by key
          const accent = accentColors[widget.key] || 'bg-slate-100 text-slate-400';
          return (
            <div
              key={widget.title}
              className="bg-white rounded-2xl shadow-xl px-7 py-6 flex flex-col items-start relative group transition-all hover:-translate-y-1 hover:shadow-2xl"
              style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
            >
              {/* Icon circle */}
              <div className={`w-11 h-11 flex items-center justify-center rounded-full mb-3 shadow-sm ${accent} text-xl`}>
                {/* Optionally, you can map widget.key to an icon here */}
                <span className="font-bold">{widget.title[0]}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-base font-semibold text-slate-500 mb-1 tracking-wide">{widget.title}</span>
                <span className="text-4xl font-extrabold text-slate-900 mb-1" style={{ fontFamily: 'Inter, Roboto, sans-serif' }}>{loading ? '—' : widget.value}</span>
                {/* Trend indicator placeholder (replace with real data if available) */}
                {/* <span className="text-xs text-green-500 font-semibold">↑ 2 from last week</span> */}
                <span className="text-xs text-slate-400 leading-relaxed line-clamp-2">{widget.note}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Access */}
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Quick Access</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {quickPages.map((page) => {
          const PageIcon = page.icon || FiCircle;
          // Assign accent color by id
          const accent = accentColors[page.id] || 'bg-slate-100 text-slate-400';
          return (
            <button
              key={page.id}
              onClick={() => onNavigate(page.id)}
              className="text-left p-5 bg-white rounded-2xl shadow-xl flex flex-col items-start border border-transparent hover:shadow-2xl hover:-translate-y-1 hover:bg-blue-50/40 transition-all group focus:outline-none"
              style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
            >
              <span className={`w-9 h-9 flex items-center justify-center rounded-full mb-2 ${accent} text-lg`}>
                <PageIcon size={20} />
              </span>
              <span className="text-base font-semibold text-slate-800 group-hover:text-blue-700 leading-tight mb-0.5">{page.label}</span>
              {page.description && (
                <span className="text-xs text-slate-400 mt-0.5 line-clamp-1">{page.description}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardHome;
