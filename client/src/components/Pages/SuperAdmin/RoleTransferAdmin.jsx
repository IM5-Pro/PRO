/**
 * RoleTransferAdmin Page
 * Super Admin Role Transfer Management Page
 * Allows the current super admin to transfer all credentials to another person
 * 
 * @component
 * @author Admin Team
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { FiShield, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '../../../context/AuthContext';
import SuperAdminRoleTransfer from '../../Admin/SuperAdminRoleTransfer';

/**
 * RoleTransferAdmin Component
 * Page wrapper for the super admin role transfer feature
 * Displays information about the role transfer process and provides access to the transfer modal
 * 
 * @returns {JSX.Element} Role transfer admin page
 */
const RoleTransferAdmin = () => {
  const { user } = useAuth();
  const [showTransferModal, setShowTransferModal] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <FiShield className="text-red-600" size={32} />
            <h1 className="text-4xl font-bold text-slate-900">Role Transfer</h1>
          </div>
          <p className="text-lg text-slate-600">
            Transfer all super admin credentials and access to another trusted employee
          </p>
        </div>

        {/* Current Admin Info Card */}
        <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Current Super Admin</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-slate-600 font-semibold">Name</p>
              <p className="text-xl font-bold text-slate-900 mt-1">{user?.name || 'Admin User'}</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-slate-600 font-semibold">Email</p>
              <p className="text-lg font-bold text-slate-900 mt-1 break-all">{user?.email || 'admin@company.com'}</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-slate-600 font-semibold">Current Role</p>
              <p className="text-lg font-bold text-slate-900 mt-1">
                <span className="inline-block px-3 py-1 bg-blue-600 text-white rounded-full text-sm">
                  Super Admin
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Information Section */}
        <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">What is Role Transfer?</h2>
          <p className="text-slate-700 mb-4">
            Role Transfer allows you to permanently transfer all super admin credentials, permissions, and access rights to another trusted employee. This is useful for planned succession scenarios or organizational changes.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* What You Lose */}
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <h3 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                <span className="text-lg">❌</span> You Will Lose
              </h3>
              <ul className="space-y-2 text-sm text-red-800">
                <li>✓ All system access</li>
                <li>✓ Admin dashboard access</li>
                <li>✓ User management permissions</li>
                <li>✓ System configuration rights</li>
                <li>✓ All API keys and credentials</li>
                <li>✓ Current active sessions (auto-logout)</li>
              </ul>
            </div>

            {/* What They Gain */}
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                <span className="text-lg">✅</span> They Will Gain
              </h3>
              <ul className="space-y-2 text-sm text-green-800">
                <li>✓ Full system access</li>
                <li>✓ Admin dashboard access</li>
                <li>✓ User management permissions</li>
                <li>✓ System configuration control</li>
                <li>✓ All API keys and credentials</li>
                <li>✓ Access to audit logs</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Safety Warnings */}
        <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <FiAlertCircle className="text-orange-600" size={24} />
            Important Safety Information
          </h2>

          <div className="space-y-4">
            <div className="p-4 bg-red-50 border-l-4 border-red-600 rounded">
              <p className="font-semibold text-red-900 mb-1">🔴 Action is Irreversible</p>
              <p className="text-sm text-red-800">
                Once you transfer your super admin role, you cannot undo this action. The new admin would have to transfer it back to you.
              </p>
            </div>

            <div className="p-4 bg-yellow-50 border-l-4 border-yellow-600 rounded">
              <p className="font-semibold text-yellow-900 mb-1">🟡 Complete Access Transfer</p>
              <p className="text-sm text-yellow-800">
                The recipient will have COMPLETE control of the system including all API keys, passwords, and configurations. Choose someone you absolutely trust.
              </p>
            </div>

            <div className="p-4 bg-blue-50 border-l-4 border-blue-600 rounded">
              <p className="font-semibold text-blue-900 mb-1">🔵 Full Audit Logging</p>
              <p className="text-sm text-blue-800">
                This transfer will be fully logged with timestamp, user IDs, and reason. All actions are traceable for compliance and security purposes.
              </p>
            </div>

            <div className="p-4 bg-purple-50 border-l-4 border-purple-600 rounded">
              <p className="font-semibold text-purple-900 mb-1">🟣 Automatic Backup</p>
              <p className="text-sm text-purple-800">
                The system will create an encrypted backup of your current settings before the transfer is executed.
              </p>
            </div>
          </div>
        </div>

        {/* Eligibility Requirements */}
        <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Who Can Receive This Role?</h2>
          <p className="text-slate-700 mb-4">Not all employees are eligible to receive the super admin role. The recipient must meet these criteria:</p>

          <div className="bg-slate-50 p-4 rounded-lg">
            <ul className="space-y-2 text-slate-700">
              <li className="flex items-start gap-3">
                <span className="text-green-600 font-bold mt-0.5">✓</span>
                <span>Must be an active employee with full account verification</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600 font-bold mt-0.5">✓</span>
                <span>Must have minimum 6 months tenure in the organization</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600 font-bold mt-0.5">✓</span>
                <span>Must have passed background verification and security clearance</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600 font-bold mt-0.5">✓</span>
                <span>Must not already have super admin or HR admin role</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600 font-bold mt-0.5">✓</span>
                <span>Must have a valid email address registered in the system</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Process Overview */}
        <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Transfer Process</h2>
          <p className="text-slate-700 mb-6">
            The role transfer follows a secure 4-step process to prevent accidental transfers:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mb-3">
                1
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Select</h3>
              <p className="text-sm text-slate-600">Search and select the employee who will receive the role</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 mx-auto bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mb-3">
                2
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Review</h3>
              <p className="text-sm text-slate-600">Review all the access levels and permissions being transferred</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 mx-auto bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mb-3">
                3
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Confirm</h3>
              <p className="text-sm text-slate-600">Accept all conditions and type confirmation phrase</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 mx-auto bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mb-3">
                4
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Complete</h3>
              <p className="text-sm text-slate-600">Transfer executed and you are logged out automatically</p>
            </div>
          </div>
        </div>

        {/* Start Transfer Button */}
        <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg shadow-md border border-red-200 p-8 text-center">
          <h2 className="text-2xl font-bold text-red-900 mb-2">Ready to Transfer?</h2>
          <p className="text-red-800 mb-6">
            Click the button below to start the super admin role transfer process. Remember: this action is irreversible.
          </p>

          <button
            onClick={() => setShowTransferModal(true)}
            className="inline-flex items-center gap-2 px-8 py-4 bg-red-600 text-white hover:bg-red-700 rounded-lg font-bold text-lg transition-colors shadow-lg hover:shadow-xl"
          >
            <FiShield size={24} />
            Start Role Transfer
          </button>
        </div>

        {/* Transfer Modal */}
        <SuperAdminRoleTransfer
          isOpen={showTransferModal}
          onClose={() => setShowTransferModal(false)}
          currentAdmin={{
            name: user?.name || 'Admin User',
            email: user?.email || 'admin@company.com'
          }}
        />
      </div>
    </div>
  );
};

export default RoleTransferAdmin;
