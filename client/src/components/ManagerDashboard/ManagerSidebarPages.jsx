import React from 'react';

const STATUS_STYLES = {
  active: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  blocked: 'bg-red-100 text-red-700',
  approved: 'bg-blue-100 text-blue-700',
  open: 'bg-violet-100 text-violet-700',
  default: 'bg-slate-100 text-slate-700',
};

const PAGE_DEFINITIONS = {
  users: {
    title: 'Users Management',
    subtitle: 'Track team structure, activity and access in one place.',
    stats: [
      { label: 'Total Members', value: '24' },
      { label: 'Online Now', value: '18' },
      { label: 'Pending Invites', value: '3' },
      { label: 'Open Requests', value: '5' },
    ],
    sections: [
      {
        type: 'table',
        span: 'full',
        title: 'Team Directory',
        columns: ['Name', 'Role', 'Department', 'Status'],
        rows: [
          ['Sarah Johnson', 'Product Manager', 'Product', 'active'],
          ['Mike Chen', 'Developer', 'Engineering', 'active'],
          ['Emma Davis', 'UI Designer', 'Design', 'pending'],
          ['David Wilson', 'QA Engineer', 'Engineering', 'blocked'],
        ],
      },
      {
        type: 'list',
        title: 'Access Requests',
        items: [
          { title: 'Project dashboard edit access', meta: 'Requested by Emma', status: 'pending' },
          { title: 'Payroll view access', meta: 'Requested by Mike', status: 'approved' },
          { title: 'Onboarding checklist permission', meta: 'Requested by Sarah', status: 'open' },
        ],
      },
      {
        type: 'actions',
        title: 'Quick Actions',
        items: ['Invite Member', 'Create Role Group', 'Export Users', 'Review Permissions'],
      },
    ],
  },
  checklist: {
    title: 'Team Checklist',
    subtitle: 'Follow up on ownership, due dates and completion status.',
    stats: [
      { label: 'Total Tasks', value: '32' },
      { label: 'Completed', value: '21' },
      { label: 'In Progress', value: '8' },
      { label: 'Overdue', value: '3' },
    ],
    sections: [
      {
        type: 'table',
        span: 'full',
        title: 'Sprint Task Board',
        columns: ['Task', 'Owner', 'Due Date', 'Status'],
        rows: [
          ['Finalize weekly report', 'Sarah', '13 Mar 2026', 'active'],
          ['Review leave approvals', 'Sourav', '12 Mar 2026', 'pending'],
          ['Update onboarding guide', 'Emma', '15 Mar 2026', 'open'],
          ['Close bug triage loop', 'Mike', '11 Mar 2026', 'blocked'],
        ],
      },
      {
        type: 'list',
        title: 'Priority Focus',
        items: [
          { title: 'Team OKR checkpoint', meta: 'Due in 1 day', status: 'pending' },
          { title: 'Performance sync notes', meta: 'Due in 2 days', status: 'open' },
          { title: 'Leave backlog cleanup', meta: 'Due today', status: 'blocked' },
        ],
      },
      {
        type: 'actions',
        title: 'Checklist Actions',
        items: ['Create Checklist', 'Assign Task', 'Mark Complete', 'Download Report'],
      },
    ],
  },
  leaves: {
    title: 'Leave Management',
    subtitle: 'Review leave balances, pending approvals and trends.',
    stats: [
      { label: 'Pending Requests', value: '7' },
      { label: 'Approved This Week', value: '12' },
      { label: 'Rejected', value: '2' },
      { label: 'Avg Approval Time', value: '6h' },
    ],
    sections: [
      {
        type: 'table',
        span: 'full',
        title: 'Recent Leave Requests',
        columns: ['Employee', 'Type', 'Dates', 'Status'],
        rows: [
          ['Emma Davis', 'Casual Leave', '12-13 Mar', 'pending'],
          ['Mike Chen', 'Sick Leave', '10 Mar', 'approved'],
          ['Sarah Johnson', 'Annual Leave', '20-22 Mar', 'open'],
          ['David Wilson', 'Work From Home', '11 Mar', 'approved'],
        ],
      },
      {
        type: 'list',
        title: 'Balance Alerts',
        items: [
          { title: '2 members below 20% leave balance', meta: 'Needs planning', status: 'pending' },
          { title: 'Quarter-end leave rush expected', meta: 'Forecast based', status: 'open' },
          { title: 'Comp-off approvals pending', meta: '3 requests', status: 'blocked' },
        ],
      },
      {
        type: 'actions',
        title: 'Leave Actions',
        items: ['Approve Batch', 'Create Leave Policy', 'Export Ledger', 'Set Team Calendar'],
      },
    ],
  },
  payroll: {
    title: 'Payroll',
    subtitle: 'Monitor payout readiness and payroll exceptions.',
    stats: [
      { label: 'Payroll Cycle', value: 'Mar-2026' },
      { label: 'Ready Records', value: '92%' },
      { label: 'Exceptions', value: '4' },
      { label: 'Net Pay Draft', value: '₹18.4L' },
    ],
    sections: [
      {
        type: 'table',
        span: 'full',
        title: 'Payroll Exceptions',
        columns: ['Employee', 'Issue', 'Owner', 'Status'],
        rows: [
          ['Arun K', 'Missing attendance sync', 'Sourav', 'pending'],
          ['Neha P', 'Bank detail mismatch', 'HR Ops', 'open'],
          ['Ravi T', 'Variable pay pending', 'Finance', 'blocked'],
          ['Mia R', 'Tax declaration review', 'Payroll', 'active'],
        ],
      },
      {
        type: 'list',
        title: 'Payroll Milestones',
        items: [
          { title: 'Attendance lock', meta: '12 Mar 2026', status: 'active' },
          { title: 'Validation window', meta: '13 Mar 2026', status: 'pending' },
          { title: 'Final release', meta: '15 Mar 2026', status: 'open' },
        ],
      },
      {
        type: 'actions',
        title: 'Payroll Actions',
        items: ['Run Validation', 'Review Exceptions', 'Download Paysheet', 'Notify Team'],
      },
    ],
  },
  recruit: {
    title: 'Recruitment',
    subtitle: 'Track open roles, candidate pipeline and interview flow.',
    stats: [
      { label: 'Open Roles', value: '9' },
      { label: 'Candidates', value: '46' },
      { label: 'Interviews Today', value: '5' },
      { label: 'Offer Stage', value: '4' },
    ],
    sections: [
      {
        type: 'table',
        span: 'full',
        title: 'Pipeline Overview',
        columns: ['Role', 'Candidates', 'Interviews', 'Status'],
        rows: [
          ['Frontend Developer', '12', '3', 'active'],
          ['QA Engineer', '8', '2', 'pending'],
          ['Product Analyst', '6', '1', 'open'],
          ['UI Designer', '10', '4', 'active'],
        ],
      },
      {
        type: 'list',
        title: 'Hiring Priorities',
        items: [
          { title: 'Close QA Engineer role', meta: 'Target this week', status: 'pending' },
          { title: 'Schedule design panel', meta: '4 candidates', status: 'open' },
          { title: 'Finalize offer budget', meta: 'Finance review', status: 'blocked' },
        ],
      },
      {
        type: 'actions',
        title: 'Recruitment Actions',
        items: ['Create Job Requisition', 'Schedule Interviews', 'Move Candidate Stage', 'Generate Hiring Report'],
      },
    ],
  },
  messages: {
    title: 'Messages',
    subtitle: 'Manage internal communication and pending discussions.',
    stats: [
      { label: 'Unread', value: '14' },
      { label: 'Channels', value: '6' },
      { label: 'Mentions', value: '3' },
      { label: 'Pending Replies', value: '5' },
    ],
    sections: [
      {
        type: 'list',
        span: 'full',
        title: 'Recent Conversations',
        items: [
          { title: 'Sprint Planning Channel', meta: 'Need approval on story split', status: 'open' },
          { title: 'Design Review Group', meta: 'New mock shared by Emma', status: 'active' },
          { title: 'HR Policy Thread', meta: 'Clarification requested', status: 'pending' },
          { title: 'Engineering Standup', meta: 'Blocked item highlighted', status: 'blocked' },
        ],
      },
      {
        type: 'actions',
        title: 'Messaging Actions',
        items: ['Start Broadcast', 'Pin Update', 'Create Channel', 'Archive Thread'],
      },
      {
        type: 'list',
        title: 'Follow Ups',
        items: [
          { title: 'Reply to policy query', meta: 'Due today', status: 'pending' },
          { title: 'Confirm release update', meta: 'Due in 2h', status: 'open' },
          { title: 'Post meeting summary', meta: 'After 5 PM', status: 'active' },
        ],
      },
    ],
  },
  help: {
    title: 'Help & Support',
    subtitle: 'Get help articles, support channels and troubleshooting steps.',
    stats: [
      { label: 'Open Tickets', value: '2' },
      { label: 'Resolved This Week', value: '11' },
      { label: 'Avg Response', value: '45m' },
      { label: 'Knowledge Articles', value: '37' },
    ],
    sections: [
      {
        type: 'list',
        span: 'full',
        title: 'Top Help Topics',
        items: [
          { title: 'How to approve team leaves?', meta: 'Step-by-step workflow', status: 'open' },
          { title: 'Payroll exception troubleshooting', meta: 'Validation checklist', status: 'active' },
          { title: 'Reset user access safely', meta: 'Role-based steps', status: 'pending' },
          { title: 'Interview panel scheduling', meta: 'Best practices', status: 'open' },
        ],
      },
      {
        type: 'actions',
        title: 'Support Actions',
        items: ['Create Support Ticket', 'Chat with Support', 'Open Documentation', 'Share Feedback'],
      },
      {
        type: 'list',
        title: 'Ticket Queue',
        items: [
          { title: 'Payroll export timeout', meta: 'Ticket #SUP-114', status: 'pending' },
          { title: 'Notification delay issue', meta: 'Ticket #SUP-109', status: 'active' },
        ],
      },
    ],
  },
  settings: {
    title: 'Settings',
    subtitle: 'Configure workspace preferences and team-level defaults.',
    stats: [
      { label: 'Active Integrations', value: '5' },
      { label: 'Security Score', value: 'A' },
      { label: 'Automation Rules', value: '9' },
      { label: 'Audit Flags', value: '1' },
    ],
    sections: [
      {
        type: 'list',
        span: 'full',
        title: 'Configuration Modules',
        items: [
          { title: 'Notifications', meta: 'Digest + instant alerts enabled', status: 'active' },
          { title: 'Approval Chains', meta: '2-step manager approvals', status: 'open' },
          { title: 'Attendance Rules', meta: 'Flex hours + grace period', status: 'active' },
          { title: 'Data Export Policy', meta: 'Weekly encrypted backup', status: 'pending' },
        ],
      },
      {
        type: 'actions',
        title: 'Settings Actions',
        items: ['Update Preferences', 'Manage Integrations', 'Review Audit Log', 'Reset Defaults'],
      },
      {
        type: 'list',
        title: 'Security Notices',
        items: [
          { title: 'New device login detected', meta: 'Today, 10:24 AM', status: 'pending' },
          { title: 'API token rotation due', meta: 'In 3 days', status: 'open' },
        ],
      },
    ],
  },
};

const StatusBadge = ({ status = 'default' }) => (
  <span className={`px-2 py-1 rounded-md text-xs font-semibold ${STATUS_STYLES[status] || STATUS_STYLES.default}`}>
    {status.charAt(0).toUpperCase() + status.slice(1)}
  </span>
);

const SectionCard = ({ title, children }) => (
  <div className="bg-white/10 backdrop-blur-3xl border border-white/30 ring-1 ring-white/20 rounded-2xl shadow-xl shadow-slate-900/10 p-5">
    <h3 className="text-lg font-bold text-slate-800 mb-4">{title}</h3>
    {children}
  </div>
);

const StatsGrid = ({ stats = [] }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
    {stats.map((stat) => (
      <div
        key={stat.label}
        className="bg-white/10 backdrop-blur-3xl border border-white/30 ring-1 ring-white/20 rounded-2xl shadow-xl shadow-slate-900/10 p-4"
      >
        <p className="text-xs text-slate-500 uppercase tracking-wide">{stat.label}</p>
        <p className="text-2xl font-bold text-slate-800 mt-1">{stat.value}</p>
      </div>
    ))}
  </div>
);

const ListSection = ({ items = [] }) => (
  <div className="space-y-3">
    {items.map((item) => (
      <div key={`${item.title}-${item.meta}`} className="flex items-start justify-between gap-3 p-3 rounded-xl bg-white/50 border border-white/60">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{item.title}</p>
          <p className="text-xs text-slate-600 mt-1">{item.meta}</p>
        </div>
        <StatusBadge status={item.status} />
      </div>
    ))}
  </div>
);

const TableSection = ({ columns = [], rows = [] }) => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-[620px]">
      <thead>
        <tr className="border-b border-white/50">
          {columns.map((col) => (
            <th key={col} className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={`${row[0]}-${index}`} className="border-b border-white/40 hover:bg-white/40 transition-colors">
            {row.map((cell, cellIndex) => (
              <td key={`${cell}-${cellIndex}`} className="py-3 px-3 text-sm text-slate-700">
                {cellIndex === row.length - 1 ? <StatusBadge status={cell} /> : cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const ActionSection = ({ items = [], onAction = () => {} }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
    {items.map((item) => (
      <button
        key={item}
        onClick={() => onAction(item)}
        className="px-4 py-3 rounded-xl bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-colors text-sm font-semibold text-left"
      >
        {item}
      </button>
    ))}
  </div>
);

const renderSection = (section, onAction) => {
  switch (section.type) {
    case 'table':
      return <TableSection columns={section.columns} rows={section.rows} />;
    case 'actions':
      return <ActionSection items={section.items} onAction={onAction} />;
    case 'list':
    default:
      return <ListSection items={section.items} />;
  }
};

const ManagerSidebarPageContent = ({ pageId, onAction = () => {} }) => {
  const definition = PAGE_DEFINITIONS[pageId];

  if (!definition) {
    return (
      <div className="w-full bg-transparent p-6 md:p-8">
        <div className="bg-white/10 backdrop-blur-3xl border border-white/30 ring-1 ring-white/20 rounded-2xl shadow-xl shadow-slate-900/10 p-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Page Not Found</h2>
          <p className="text-slate-600">The requested page does not exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-transparent p-6 md:p-8 space-y-6">
      <div className="bg-white/10 backdrop-blur-3xl border border-white/30 ring-1 ring-white/20 rounded-2xl shadow-xl shadow-slate-900/10 p-6">
        <h2 className="text-3xl font-bold text-slate-800">{definition.title}</h2>
        <p className="text-slate-600 mt-2">{definition.subtitle}</p>
      </div>

      <StatsGrid stats={definition.stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {definition.sections.map((section) => (
          <div
            key={`${definition.title}-${section.title}`}
            className={section.span === 'full' ? 'lg:col-span-2' : ''}
          >
            <SectionCard title={section.title}>
              {renderSection(section, onAction)}
            </SectionCard>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ManagerSidebarPageContent;
