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
      role: 'Manager',
      email: 'manager@company.com',
      password: 'password',
    },
    {
      role: 'Employee',
      email: 'employee@company.com',
      password: 'password',
    },
  ],
  title = '📝 Demo Credentials:',
  className = '',
}) => {
  return (
    <div
      className={`
        bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6
        ${className}
      `}
    >
      <p className="text-xs font-semibold text-blue-900 mb-3">
        {title}
      </p>

      <div className="space-y-2">
        {credentials.map((cred, idx) => (
          <div key={idx} className="text-xs text-blue-800">
            <p>
              <strong>{cred.role}:</strong>{' '}
              <code className="bg-blue-100 px-2 py-1 rounded">
                {cred.email}
              </code>
              {' / '}
              <code className="bg-blue-100 px-2 py-1 rounded">
                {cred.password}
              </code>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CredentialsInfo;
