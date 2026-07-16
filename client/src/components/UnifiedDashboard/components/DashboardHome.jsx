import React from 'react';
import {
  FiBriefcase,
  FiCalendar,
  FiCheckSquare,
  FiCircle,
  FiClock,
  FiFileText,
  FiGrid,
  FiSettings,
  FiTool,
  FiTrendingUp,
  FiUser,
  FiUsers,
} from 'react-icons/fi';
import RupeeIcon from '../../icons/RupeeIcon';

const WIDGET_ICONS = {
  attendance: FiCalendar,
  leaves: FiClock,
  holidays: FiCalendar,
  payslip: RupeeIcon,
  payroll: RupeeIcon,
  'team-attendance': FiUsers,
  'leave-requests': FiClock,
  'team-performance': FiTrendingUp,
  'team-members': FiUsers,
  'dept-attendance': FiCheckSquare,
  'dept-tools': FiTool,
  'dept-headcount': FiUsers,
  'dept-performance': FiTrendingUp,
  'total-employees': FiUsers,
  'new-joiners': FiUser,
  'pending-leaves': FiClock,
  'payroll-processing': RupeeIcon,
  'company-overview': FiBriefcase,
  'system-settings': FiSettings,
  'audit-logs': FiFileText,
  'department-stats': FiGrid,
};

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
    'dept-attendance': 'bg-blue-100 text-blue-600',
    'dept-tools': 'bg-teal-100 text-teal-600',
    'dept-headcount': 'bg-purple-100 text-purple-600',
    'dept-performance': 'bg-amber-100 text-amber-600',
    'total-employees': 'bg-blue-100 text-blue-600',
    'new-joiners': 'bg-green-100 text-green-600',
    'pending-leaves': 'bg-amber-100 text-amber-600',
    'payroll-processing': 'bg-purple-100 text-purple-600',
    'company-overview': 'bg-blue-100 text-blue-600',
    'system-settings': 'bg-slate-100 text-slate-600',
    'audit-logs': 'bg-amber-100 text-amber-600',
    'department-stats': 'bg-green-100 text-green-600',
  };

  return (
    <div className="min-h-screen bg-im5-page p-6 md:p-8">
      {/* Banner section */}
      <div className="mb-8 flex flex-col gap-1 rounded-2xl bg-im5-banner border border-im5-border-soft p-6 shadow-sm md:p-8">
        <h1 className="text-3xl font-extrabold text-slate-800 mb-1 tracking-tight" style={{ fontFamily: 'Inter, Roboto, sans-serif' }}>{heading}</h1>
        <p className="text-base text-slate-500 font-medium">{subtitle}</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
        {widgets.map((widget) => {
          const accent = accentColors[widget.key] || 'bg-slate-100 text-slate-400';
          const WidgetIcon = WIDGET_ICONS[widget.key] || FiCircle;
          return (
            <div
              key={widget.title}
              className="relative flex flex-col items-start rounded-2xl border border-im5-border-soft bg-im5-surface px-7 py-6 shadow-sm transition-all group hover:-translate-y-1 hover:shadow-md"
            >
              <div className={`w-11 h-11 flex items-center justify-center rounded-full mb-3 shadow-sm ${accent}`}>
                <WidgetIcon size={20} />
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
              className="group flex flex-col items-start rounded-2xl border border-im5-border-soft bg-im5-surface p-5 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-im5-border hover:bg-im5-accent-tint/40 hover:shadow-md focus:outline-none"
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
