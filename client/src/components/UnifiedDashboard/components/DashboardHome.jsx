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
    <div className="min-h-full bg-im5-page p-4 sm:p-5 md:p-6 lg:p-8 xl:p-10">
      <div className="mb-6 flex flex-col gap-1 rounded-xl border border-im5-border-soft bg-im5-banner p-4 shadow-sm sm:mb-8 sm:rounded-2xl sm:p-6 md:p-8">
        <h1 className="mb-1 text-xl font-bold tracking-tight text-slate-800 sm:text-2xl md:text-3xl lg:text-4xl">
          {heading}
        </h1>
        <p className="text-sm font-medium text-slate-500 sm:text-base">{subtitle}</p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-3 sm:mb-10 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-6 xl:grid-cols-4">
        {widgets.map((widget) => {
          const accent = accentColors[widget.key] || 'bg-slate-100 text-slate-400';
          const WidgetIcon = WIDGET_ICONS[widget.key] || FiCircle;
          return (
            <div
              key={widget.title}
              className="relative flex flex-col items-start rounded-xl border border-im5-border-soft bg-im5-surface px-4 py-4 shadow-sm transition-all group hover:-translate-y-1 hover:shadow-md sm:rounded-2xl sm:px-6 sm:py-5 md:px-7 md:py-6"
            >
              <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-full shadow-sm sm:mb-3 sm:h-11 sm:w-11 ${accent}`}>
                <WidgetIcon size={20} />
              </div>
              <div className="flex flex-col gap-1">
                <span className="mb-0.5 text-sm font-semibold tracking-wide text-slate-500 sm:mb-1 sm:text-base">
                  {widget.title}
                </span>
                <span className="mb-0.5 text-2xl font-bold text-slate-900 sm:text-3xl md:text-4xl">
                  {loading ? '—' : widget.value}
                </span>
                <span className="line-clamp-2 text-xs leading-relaxed text-slate-400">{widget.note}</span>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Quick Access</p>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
        {quickPages.map((page) => {
          const PageIcon = page.icon || FiCircle;
          const accent = accentColors[page.id] || 'bg-slate-100 text-slate-400';
          return (
            <button
              key={page.id}
              onClick={() => onNavigate(page.id)}
              className="group flex flex-col items-start rounded-xl border border-im5-border-soft bg-im5-surface p-3 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-im5-border hover:bg-im5-accent-tint/40 hover:shadow-md focus:outline-none sm:rounded-2xl sm:p-5"
            >
              <span className={`mb-2 flex h-8 w-8 items-center justify-center rounded-full text-lg sm:h-9 sm:w-9 ${accent}`}>
                <PageIcon size={18} />
              </span>
              <span className="mb-0.5 text-sm font-semibold leading-tight text-slate-800 group-hover:text-blue-700 sm:text-base">
                {page.label}
              </span>
              {page.description && (
                <span className="mt-0.5 line-clamp-1 hidden text-xs text-slate-400 sm:block">{page.description}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardHome;
