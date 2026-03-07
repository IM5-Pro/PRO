/**
 * CredentialsInfo Component
 * Displays demo credentials in a formatted, reusable card
 * 
 * @component
 * @example
 * <CredentialsInfo 
 *   credentials={[
 *     { role: 'Manager', email: 'manager@company.com', password: 'password' }
 *   ]}
 * />
 */

import React from 'react';

/**
 * CredentialsInfo - Reusable credentials display
 * 
 * @param {Object} props - Component props
 * @param {Array<Object>} props.credentials - Array of credential objects
 * @param {string} props.credentials[].role - User role
 * @param {string} props.credentials[].email - User email
 * @param {string} props.credentials[].password - User password
 * @param {string} [props.title] - Card title
 * @param {string} [props.className] - Additional CSS classes
 * @returns {JSX.Element} - Credentials info card
 */
const CredentialsInfo = ({
  credentials = [
    {
      role: '👩‍💼 HR Admin',
      email: 'hr@company.com',
      password: 'password',
      dashboard: 'HR Dashboard',
    },
    {
      role: '👨‍💼 Manager',
      email: 'manager@company.com',
      password: 'password',
      dashboard: 'Manager Dashboard',
    },
    {
      role: '👤 Employee',
      email: 'employee@company.com',
      password: 'password',
      dashboard: 'Employee Dashboard',
    },
  ],
  title = '📝 Demo Credentials (Try any to access different dashboards):',
  className = '',
}) => {
  return (
    <div
      className={`
        bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-700 rounded-lg p-4 mt-6
        ${className}
      `}
    >
      <p className="text-xs font-semibold text-blue-900 dark:text-blue-300 mb-3">
        {title}
      </p>

      <div className="space-y-2">
        {credentials.map((cred, idx) => (
          <div key={idx} className="text-xs text-blue-800 dark:text-blue-200">
            <p>
              <strong>{cred.role}</strong>
              {' → '}
              <code className="bg-blue-100 dark:bg-slate-700 px-2 py-1 rounded text-blue-900 dark:text-blue-300">
                {cred.email}
              </code>
              {' / '}
              <code className="bg-blue-100 dark:bg-slate-700 px-2 py-1 rounded text-blue-900 dark:text-blue-300">
                {cred.password}
              </code>
              <span className="text-blue-600 dark:text-blue-400 ml-2">
                ({cred.dashboard})
              </span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CredentialsInfo;
