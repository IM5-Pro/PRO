import React from 'react';

const ModulePageLayout = ({ title, subtitle, icon: Icon, children, actions }) => (
  <div className="min-h-full bg-gradient-to-br from-slate-50 to-slate-100 p-6 md:p-8">
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          {Icon ? <Icon className="h-8 w-8 text-blue-600" aria-hidden /> : null}
          {title}
        </h1>
        {subtitle ? <p className="text-slate-600 mt-1 text-sm">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
    {children}
  </div>
);

export default ModulePageLayout;
