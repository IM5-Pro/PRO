import React from 'react';

const ModulePageLayout = ({ title, subtitle, icon: Icon, children, actions }) => (
  <div className="min-h-full bg-im5-page p-4 sm:p-5 md:p-6 lg:p-8 xl:p-10">
    <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900 sm:gap-3 sm:text-2xl lg:text-3xl">
          {Icon ? (
            <Icon className="h-6 w-6 shrink-0 text-blue-600 sm:h-7 sm:w-7 lg:h-8 lg:w-8" aria-hidden />
          ) : null}
          <span className="min-w-0 break-words">{title}</span>
        </h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-slate-600 sm:text-base">{subtitle}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">{actions}</div>
      ) : null}
    </div>
    <div className="module-page-body min-w-0 space-y-4 sm:space-y-6">
      {children}
    </div>
  </div>
);

export default ModulePageLayout;
