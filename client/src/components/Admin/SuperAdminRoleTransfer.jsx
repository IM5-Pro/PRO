/**
 * SuperAdminRoleTransfer Component
 * Allows a Super Admin to transfer all credentials and access to another person
 * After transfer: Current admin becomes normal employee, recipient becomes super admin
 * 
 * Features:
 * - Search and select recipient from employee list
 * - Review what will be transferred
 * - Multi-step confirmation with warnings
 * - Audit logging of transfer
 * - Roll-back capability (optional)
 * 
 * @component
 * @author Admin Team
 * @version 1.0.0
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  FiLock,
  FiArrowRight,
  FiAlertCircle,
  FiCheck,
  FiSearch,
  FiChevronRight,
  FiLoader,
} from 'react-icons/fi';
import { getEligibleRecipients, transferRole } from '../../services/superAdminTransferApi';

/**
 * Transfer Step Indicator
 */
const StepIndicator = ({ currentStep, totalSteps }) => {
  return (
    <div className="flex items-center gap-2 mb-6">
      {Array.from({ length: totalSteps }).map((_, idx) => (
        <React.Fragment key={idx}>
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
              idx < currentStep
                ? 'bg-green-600 text-white'
                : idx === currentStep
                ? 'bg-blue-600 text-white animate-pulse'
                : 'bg-slate-200 text-slate-600'
            }`}
          >
            {idx < currentStep ? <FiCheck size={20} /> : idx + 1}
          </div>
          {idx < totalSteps - 1 && (
            <div
              className={`h-1 flex-1 ${
                idx < currentStep ? 'bg-green-600' : 'bg-slate-200'
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

/**
 * Employee Search and Selection
 */
const EmployeeSelector = ({ onSelect, loading }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState('');

  const loadEmployees = useCallback(async (department = '') => {
    setFetching(true);
    setFetchError('');

    try {
      const result = await getEligibleRecipients(
        department && department !== 'all' ? { department } : {},
      );
      setEmployees(result.employees || []);
      setDepartments(result.departments || []);
      setDepartmentOptions(result.departmentOptions || []);
    } catch (error) {
      setFetchError(error.message || 'Failed to load employees');
      setEmployees([]);
      setDepartments([]);
      setDepartmentOptions([]);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (departmentFilter === 'all') {
      loadEmployees();
      return;
    }
    loadEmployees(departmentFilter);
  }, [departmentFilter, loadEmployees]);

  const matchesSearch = useCallback((emp, query) => {
    if (!query) return true;

    return (
      emp.name.toLowerCase().includes(query) ||
      emp.email.toLowerCase().includes(query) ||
      (emp.designation || '').toLowerCase().includes(query) ||
      (emp.department || '').toLowerCase().includes(query) ||
      (emp.role || '').toLowerCase().includes(query)
    );
  }, []);

  const filteredDepartments = departments
    .map((department) => ({
      ...department,
      employees: (department.employees || []).filter((emp) =>
        matchesSearch(emp, searchQuery.trim().toLowerCase()),
      ),
    }))
    .filter((department) => department.employees.length > 0);

  const filteredEmployees = employees.filter((emp) =>
    matchesSearch(emp, searchQuery.trim().toLowerCase()),
  );

  const handleSelect = (employee) => {
    if (!employee.canReceiveTransfer) return;
    setSelectedEmployee(employee);
    onSelect(employee);
  };

  const renderEmployeeRow = (emp) => {
    const isDisabled = loading || fetching || !emp.canReceiveTransfer;
    const statusLabel = !emp.hasUserAccount
      ? 'No login account'
      : emp.isCurrentUser
      ? 'Current super admin'
      : emp.role
      ? emp.role.replace(/_/g, ' ')
      : '';

    return (
      <button
        key={emp.employeeId || emp.id}
        type="button"
        onClick={() => handleSelect(emp)}
        disabled={isDisabled}
        className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
          selectedEmployee?.employeeId === emp.employeeId || selectedEmployee?.id === emp.id
            ? 'border-blue-600 bg-blue-50'
            : isDisabled
            ? 'border-slate-100 bg-slate-50 opacity-70 cursor-not-allowed'
            : 'border-slate-200 bg-white hover:border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold text-slate-900">{emp.name}</p>
            <p className="text-sm text-slate-600 truncate">{emp.email || 'No email available'}</p>
            <p className="text-xs text-slate-500 mt-1">
              {[emp.designation, statusLabel].filter(Boolean).join(' • ')}
            </p>
          </div>
          {(selectedEmployee?.employeeId === emp.employeeId || selectedEmployee?.id === emp.id) && (
            <FiCheck className="text-blue-600 flex-shrink-0" size={24} />
          )}
        </div>
      </button>
    );
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-slate-900 mb-4">
        Step 1: Select New Super Admin
      </h3>
      <p className="text-sm text-slate-600 mb-4">
        Choose an employee from any department to transfer all super admin credentials and access to:
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="relative">
          <FiSearch className="absolute left-3 top-3 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by name, email, role, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 bg-white"
        >
          <option value="all">All Departments</option>
          {departmentOptions.map((department) => (
            <option key={department.id} value={department.name}>
              {department.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-4 max-h-80 overflow-y-auto border border-slate-200 rounded-lg p-3">
        {fetching ? (
          <div className="flex items-center justify-center gap-2 py-8 text-slate-500">
            <FiLoader className="animate-spin" size={18} />
            <span>Loading employees by department...</span>
          </div>
        ) : fetchError ? (
          <p className="text-center text-red-600 py-8">{fetchError}</p>
        ) : filteredDepartments.length === 0 ? (
          <p className="text-center text-slate-500 py-8">No employees found</p>
        ) : (
          filteredDepartments.map((department) => (
            <div key={department.name}>
              <div className="sticky top-0 z-10 bg-slate-100 border border-slate-200 rounded-md px-3 py-2 mb-2">
                <p className="text-sm font-semibold text-slate-800">
                  {department.name}
                  <span className="ml-2 text-slate-500 font-normal">({department.employees.length})</span>
                </p>
              </div>
              <div className="space-y-2">
                {department.employees.map((emp) => renderEmployeeRow(emp))}
              </div>
            </div>
          ))
        )}
      </div>

      {!fetching && !fetchError && filteredEmployees.length > 0 && (
        <p className="mt-3 text-xs text-slate-500">
          Showing {filteredEmployees.length} employee{filteredEmployees.length === 1 ? '' : 's'} across{' '}
          {filteredDepartments.length} department{filteredDepartments.length === 1 ? '' : 's'}.
        </p>
      )}

      {selectedEmployee && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            Selected: <strong>{selectedEmployee.name}</strong> ({selectedEmployee.email}) from{' '}
            <strong>{selectedEmployee.department}</strong>
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * Transfer Review Step
 */
const TransferReview = ({ currentAdmin, recipient }) => {
  return (
    <div>
      <h3 className="text-lg font-semibold text-slate-900 mb-4">
        Step 2: Review Transfer Details
      </h3>

      {/* Current Admin Info */}
      <div className="mb-6">
        <p className="text-sm font-semibold text-slate-700 mb-2">Current Super Admin</p>
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
          <p className="font-semibold text-slate-900">{currentAdmin.name}</p>
          <p className="text-sm text-slate-600">{currentAdmin.email}</p>
          <p className="text-xs text-red-600 mt-2">Will be downgraded to: Normal Employee</p>
        </div>
      </div>

      {/* Arrow */}
      <div className="flex justify-center mb-6">
        <div className="p-3 bg-slate-100 rounded-full">
          <FiArrowRight className="text-slate-600" size={24} />
        </div>
      </div>

      {/* Recipient Info */}
      <div className="mb-6">
        <p className="text-sm font-semibold text-slate-700 mb-2">New Super Admin</p>
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="font-semibold text-slate-900">{recipient.name}</p>
          <p className="text-sm text-slate-600">{recipient.email}</p>
          <p className="text-xs text-blue-600 mt-2">Will be upgraded to: Super Admin</p>
        </div>
      </div>

      {/* What Gets Transferred */}
      <div>
        <p className="text-sm font-semibold text-slate-700 mb-2">Access & Permissions Being Transferred</p>
        <div className="space-y-2">
          {[
            '🔐 Full System Access',
            '👥 User Management Rights',
            '📊 Complete Admin Dashboard',
            '⚙️ System Settings Control',
            '📝 Audit Log Access',
            '🔔 Notification Settings',
            '💾 Database Management',
            '🛡️ Security Configuration',
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 p-2 bg-slate-50 rounded">
              <FiCheck className="text-green-600" size={18} />
              <span className="text-sm text-slate-700">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Confirmation & Warnings Step
 */
const TransferConfirmation = ({
  agreedToWarnings,
  onAgreed,
  confirmText,
  onConfirmTextChange,
}) => {
  return (
    <div>
      <h3 className="text-lg font-semibold text-slate-900 mb-4">
        Step 3: Confirm Transfer
      </h3>

      {/* Critical Warnings */}
      <div className="mb-6 space-y-3">
        <div className="p-4 bg-red-50 border-l-4 border-red-600 rounded">
          <div className="flex items-start gap-3">
            <FiAlertCircle className="text-red-600 flex-shrink-0 mt-1" size={20} />
            <div>
              <p className="font-semibold text-red-900">Action is Irreversible</p>
              <p className="text-sm text-red-800 mt-1">
                This action cannot be undone. Once transferred, you will lose all super admin access.
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-yellow-50 border-l-4 border-yellow-600 rounded">
          <div className="flex items-start gap-3">
            <FiAlertCircle className="text-yellow-600 flex-shrink-0 mt-1" size={20} />
            <div>
              <p className="font-semibold text-yellow-900">Complete Access Transfer</p>
              <p className="text-sm text-yellow-800 mt-1">
                All passwords, API keys, and system access will be transferred. The new admin will have complete control.
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-blue-50 border-l-4 border-blue-600 rounded">
          <div className="flex items-start gap-3">
            <FiAlertCircle className="text-blue-600 flex-shrink-0 mt-1" size={20} />
            <div>
              <p className="font-semibold text-blue-900">Audit Log</p>
              <p className="text-sm text-blue-800 mt-1">
                This transfer will be logged and timestamped for audit purposes.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Checkboxes */}
      <div className="mb-6 space-y-3">
        <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
          <input
            type="checkbox"
            checked={agreedToWarnings.understand}
            onChange={(e) =>
              onAgreed({ ...agreedToWarnings, understand: e.target.checked })
            }
            className="w-5 h-5 rounded border-slate-300"
          />
          <span className="text-sm text-slate-700">
            I understand this action is <strong>irreversible</strong>
          </span>
        </label>

        <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
          <input
            type="checkbox"
            checked={agreedToWarnings.loseAccess}
            onChange={(e) =>
              onAgreed({ ...agreedToWarnings, loseAccess: e.target.checked })
            }
            className="w-5 h-5 rounded border-slate-300"
          />
          <span className="text-sm text-slate-700">
            I agree to <strong>lose all super admin access</strong> after this transfer
          </span>
        </label>

        <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
          <input
            type="checkbox"
            checked={agreedToWarnings.trustRecipient}
            onChange={(e) =>
              onAgreed({ ...agreedToWarnings, trustRecipient: e.target.checked })
            }
            className="w-5 h-5 rounded border-slate-300"
          />
          <span className="text-sm text-slate-700">
            I <strong>trust this person</strong> with complete system access
          </span>
        </label>

        <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
          <input
            type="checkbox"
            checked={agreedToWarnings.acceptAudit}
            onChange={(e) =>
              onAgreed({ ...agreedToWarnings, acceptAudit: e.target.checked })
            }
            className="w-5 h-5 rounded border-slate-300"
          />
          <span className="text-sm text-slate-700">
            I accept this transfer will be <strong>logged and audited</strong>
          </span>
        </label>
      </div>

      {/* Type Admin Name Confirmation */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Type "TRANSFER" to confirm:
        </label>
        <input
          id="confirmText"
          type="text"
          value={confirmText}
          onChange={(e) => onConfirmTextChange(e.target.value)}
          placeholder="Type TRANSFER here"
          className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-red-600 font-mono"
        />
      </div>
    </div>
  );
};

/**
 * Success/Result Step
 */
const TransferSuccess = ({ recipient, timestamp }) => {
  return (
    <div className="text-center">
      <div className="mb-6 flex justify-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
          <FiCheck className="text-green-600" size={40} />
        </div>
      </div>

      <h3 className="text-2xl font-bold text-slate-900 mb-2">
        Transfer Successful! ✓
      </h3>

      <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-sm text-slate-700 mb-3">
          Super Admin credentials have been successfully transferred to:
        </p>
        <p className="font-bold text-lg text-slate-900">{recipient.name}</p>
        <p className="text-sm text-slate-600">{recipient.email}</p>
        <p className="text-xs text-slate-500 mt-3">
          Transfer Time: {timestamp}
        </p>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-left">
        <p className="text-sm font-semibold text-slate-700 mb-3">What happens next:</p>
        <ul className="space-y-2 text-sm text-slate-700">
          <li>✓ Your role has been changed to: <strong>Employee</strong></li>
          <li>✓ {recipient.name} can now access all admin features</li>
          <li>✓ This event has been logged in audit trail</li>
          <li>✓ All system rights have been transferred</li>
          <li>✓ You have been logged out and will be redirected to login</li>
        </ul>
      </div>
    </div>
  );
};

/**
 * Main SuperAdminRoleTransfer Component
 */
const SuperAdminRoleTransfer = ({ isOpen, onClose, currentAdmin = { name: 'Admin User', email: 'admin@company.com' } }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [transferComplete, setTransferComplete] = useState(false);
  const [transferTime, setTransferTime] = useState(null);
  const [agreedToWarnings, setAgreedToWarnings] = useState({
    understand: false,
    loseAccess: false,
    trustRecipient: false,
    acceptAudit: false,
  });
  const [confirmText, setConfirmText] = useState('');

  const allWarningsAccepted = Object.values(agreedToWarnings).every(Boolean);
  const isConfirmTextValid = confirmText.trim() === 'TRANSFER';
  const canCompleteTransfer =
    Boolean(selectedRecipient?.id && selectedRecipient?.canReceiveTransfer !== false) &&
    allWarningsAccepted &&
    isConfirmTextValid;

  const handleNext = useCallback(() => {
    if (currentStep === 1 && (!selectedRecipient || !selectedRecipient.canReceiveTransfer)) {
      alert('Please select a recipient with a login account');
      return;
    }
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep, selectedRecipient]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      if (currentStep === 3) {
        setConfirmText('');
      }
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const handleTransfer = useCallback(async () => {
    if (!isConfirmTextValid) {
      alert('Please type "TRANSFER" to confirm');
      return;
    }

    if (!allWarningsAccepted) {
      alert('Please agree to all conditions');
      return;
    }

    if (!selectedRecipient?.id) {
      alert('Please select a recipient with a login account');
      return;
    }

    setLoading(true);

    try {
      const result = await transferRole({
        recipientUserId: selectedRecipient.id,
        recipientEmail: selectedRecipient.email,
        reason: 'Manual role transfer',
      });

      setTransferComplete(true);
      setTransferTime(
        result.transferredAt
          ? new Date(result.transferredAt).toLocaleString()
          : new Date().toLocaleString(),
      );
    } catch (error) {
      alert(error.message || 'Failed to complete role transfer');
    } finally {
      setLoading(false);
    }
  }, [allWarningsAccepted, isConfirmTextValid, selectedRecipient]);

  const handleClose = useCallback(() => {
    if (transferComplete) {
      // After successful transfer, redirect to login
      window.location.href = '/login';
    } else {
      setCurrentStep(1);
      setSelectedRecipient(null);
      setAgreedToWarnings({
        understand: false,
        loseAccess: false,
        trustRecipient: false,
        acceptAudit: false,
      });
      setConfirmText('');
      onClose();
    }
  }, [transferComplete, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-red-600 to-orange-600 text-white px-6 py-8 border-b border-red-700">
          <div className="flex items-center gap-3 mb-4">
            <FiLock size={28} />
            <h2 className="text-2xl font-bold">Super Admin Role Transfer</h2>
          </div>
          <p className="text-red-100 text-sm">
            Permanently transfer all super admin credentials to another person
          </p>
        </div>

        {/* Content */}
        <div className="p-8">
          {!transferComplete ? (
            <>
              <StepIndicator currentStep={currentStep} totalSteps={3} />

              <div className="mt-8">
                {currentStep === 1 && (
                  <EmployeeSelector
                    onSelect={setSelectedRecipient}
                    loading={loading}
                  />
                )}

                {currentStep === 2 && selectedRecipient && (
                  <TransferReview
                    currentAdmin={currentAdmin}
                    recipient={selectedRecipient}
                  />
                )}

                {currentStep === 3 && (
                  <TransferConfirmation
                    agreedToWarnings={agreedToWarnings}
                    onAgreed={setAgreedToWarnings}
                    confirmText={confirmText}
                    onConfirmTextChange={setConfirmText}
                  />
                )}
              </div>

              {/* Footer */}
              <div className="mt-8 flex gap-3 justify-between border-t border-slate-200 pt-6">
                <button
                  onClick={handleClose}
                  disabled={loading}
                  className="px-6 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>

                <div className="flex gap-3">
                  {currentStep > 1 && (
                    <button
                      onClick={handleBack}
                      disabled={loading}
                      className="px-6 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      ← Back
                    </button>
                  )}

                  {currentStep < 3 ? (
                    <button
                      onClick={handleNext}
                      disabled={loading || (currentStep === 1 && !selectedRecipient)}
                      className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      Next <FiChevronRight size={18} />
                    </button>
                  ) : (
                    <button
                      onClick={handleTransfer}
                      disabled={loading || !canCompleteTransfer}
                      className="px-6 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 font-semibold"
                    >
                      {loading ? (
                        <>
                          <FiLoader className="animate-spin" size={18} />
                          Transferring...
                        </>
                      ) : (
                        <>
                          <FiLock size={18} />
                          Complete Transfer
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              <TransferSuccess recipient={selectedRecipient} timestamp={transferTime} />

              <div className="mt-8 border-t border-slate-200 pt-6 flex gap-3 justify-end">
                <button
                  onClick={handleClose}
                  className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors font-semibold"
                >
                  Proceed to Login
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminRoleTransfer;
