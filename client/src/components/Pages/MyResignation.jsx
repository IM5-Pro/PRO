/**
 * Employee Portal - My Resignation Component
 * Self-service resignation request management for employees
 * 
 * Features:
 * - Submit new resignation request
 * - View resignation history and status
 * - Cancel pending resignations
 * - Download resignation letter
 * - Track approval workflow
 * 
 * @component
 * @author HR Team
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import {
  FiAlertCircle,
  FiArrowLeft,
  FiCheck,
  FiChevronDown,
  FiFileText,
  FiLogOut,
  FiX,
  FiXCircle,
  FiRefreshCw,
} from 'react-icons/fi';
import resignationApi from '../../services/resignationApi';

const RESIGNATION_REASONS = resignationApi.getResignationReasons();

const MyResignation = ({ user = {}, pageConfig = {}, onUserUpdate = () => {} }) => {
  const [mode, setMode] = useState('list'); // 'list', 'form'
  const [resignations, setResignations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeResignation, setActiveResignation] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [editingResignationId, setEditingResignationId] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelResignationId, setCancelResignationId] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    reasonForLeaving: '',
    reasonDescription: '',
    requestedLastDayOfWork: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Load resignations on mount
  useEffect(() => {
    fetchResignations();
  }, []);

  const fetchResignations = async () => {
    setLoading(true);
    setErrorMessage('');
    const result = await resignationApi.getMyResignations();
    if (result.success) {
      setResignations(result.data || []);
      const active = result.data?.find(r => 
        !['CANCELLED', 'MANAGER_REJECTED', 'HR_REJECTED'].includes(r.status)
      );
      setActiveResignation(active || null);
    } else {
      console.error('Failed to fetch resignations:', result.error);
      setErrorMessage('Failed to load resignations: ' + result.error);
    }
    setLoading(false);
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.reasonForLeaving) {
      errors.reasonForLeaving = 'Please select a resignation reason';
    }

    if (!formData.requestedLastDayOfWork) {
      errors.requestedLastDayOfWork = 'Last day of work is required';
    } else {
      const selectedDate = new Date(formData.requestedLastDayOfWork);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      selectedDate.setHours(0, 0, 0, 0);

      const daysAhead = Math.ceil((selectedDate - today) / (1000 * 60 * 60 * 24));
      if (daysAhead < 60) {
        errors.requestedLastDayOfWork = 'Last day must be at least 60 days from today';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmitResignation = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    let result;
    
    if (editingResignationId) {
      // Update existing resignation
      result = await resignationApi.updateResignation(editingResignationId, {
        reasonForLeaving: formData.reasonForLeaving,
        reasonDescription: formData.reasonDescription,
        requestedLastDayOfWork: formData.requestedLastDayOfWork,
      });
    } else {
      // Create new resignation
      result = await resignationApi.createResignation({
        reasonForLeaving: formData.reasonForLeaving,
        reasonDescription: formData.reasonDescription,
        requestedLastDayOfWork: formData.requestedLastDayOfWork,
      });
    }

    setSubmitting(false);

    if (result.success) {
      const message = editingResignationId 
        ? '✓ Resignation updated successfully' 
        : '✓ Resignation submitted successfully. Your manager will review it.';
      setSuccessMessage(message);
      setFormData({
        reasonForLeaving: '',
        reasonDescription: '',
        requestedLastDayOfWork: '',
      });
      setEditingResignationId(null);
      await fetchResignations();
      setTimeout(() => {
        setMode('list');
        setSuccessMessage('');
        setErrorMessage('');
      }, 2000);
    } else {
      setErrorMessage(result.error || 'Failed to save resignation');
    }
  };

  const handleEditResignation = (resignation) => {
    setEditingResignationId(resignation._id);
    setFormData({
      reasonForLeaving: resignation.reasonForLeaving || '',
      reasonDescription: resignation.reasonDescription || '',
      requestedLastDayOfWork: resignation.requestedLastDayOfWork?.split('T')[0] || '',
    });
    setMode('form');
  };

  const handleOpenCancelModal = (resignationId) => {
    setCancelResignationId(resignationId);
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async () => {
    if (!cancelResignationId) return;

    const result = await resignationApi.cancelResignation(
      cancelResignationId,
      'Cancelled by employee'
    );

    if (result.success) {
      setSuccessMessage('✓ Resignation cancelled successfully');
      await fetchResignations();
      setShowCancelModal(false);
      setCancelResignationId(null);
      setTimeout(() => setSuccessMessage(''), 2000);
    } else {
      setErrorMessage(result.error || 'Failed to cancel resignation');
    }
  };

  const getStatusIcon = (status) => {
    const iconProps = 'w-5 h-5';
    switch (status) {
      case 'DRAFT':
        return <FiFileText className={`${iconProps} text-gray-500`} />;
      case 'SUBMITTED':
        return <FiAlertCircle className={`${iconProps} text-blue-500`} />;
      case 'MANAGER_APPROVED':
        return <FiCheck className={`${iconProps} text-blue-600`} />;
      case 'HR_APPROVED':
        return <FiCheck className={`${iconProps} text-green-600`} />;
      case 'MANAGER_REJECTED':
      case 'HR_REJECTED':
        return <FiXCircle className={`${iconProps} text-red-600`} />;
      case 'COMPLETED':
        return <FiCheck className={`${iconProps} text-green-700`} />;
      case 'CANCELLED':
        return <FiX className={`${iconProps} text-gray-500`} />;
      default:
        return <FiFileText className={`${iconProps} text-gray-400`} />;
    }
  };

  const getStatusBadgeColor = (status) => {
    const badgeClasses = {
      DRAFT: 'bg-gray-100 text-gray-700',
      SUBMITTED: 'bg-blue-100 text-blue-700',
      MANAGER_APPROVED: 'bg-blue-100 text-blue-700',
      HR_APPROVED: 'bg-green-100 text-green-700',
      MANAGER_REJECTED: 'bg-red-100 text-red-700',
      HR_REJECTED: 'bg-red-100 text-red-700',
      COMPLETED: 'bg-green-100 text-green-700',
      CANCELLED: 'bg-gray-100 text-gray-700',
    };
    return badgeClasses[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusLabel = (status) => resignationApi.getStatusLabel(status);

  const canSubmitNew = !activeResignation && mode === 'list';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-red-100 rounded-lg">
            <FiLogOut className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">My Resignation</h1>
            <p className="text-sm text-gray-600">Manage your resignation request and exit process</p>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <FiCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-800">{successMessage}</p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <FiAlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* MODE: LIST */}
      {mode === 'list' && (
        <>
          {/* Summary Card */}
          {activeResignation && (
            <div className="mb-6 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">
                    Active Resignation Request
                  </h3>
                  <p className="text-sm text-gray-600">
                    Submitted on {new Date(activeResignation.submittedAt).toLocaleDateString()}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(activeResignation.status)}`}>
                  {getStatusLabel(activeResignation.status)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Last Day of Work</p>
                  <p className="text-lg font-bold text-gray-800">
                    {new Date(activeResignation.requestedLastDayOfWork).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Reason</p>
                  <p className="text-sm font-semibold text-gray-700">
                    {activeResignation.reasonLabel}
                  </p>
                </div>
              </div>
              {activeResignation.daysUntilLastDay > 0 && (
                <p className="text-sm text-orange-700">
                  {activeResignation.daysUntilLastDay} days remaining
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="mb-6 flex gap-3">
            {canSubmitNew && (
              <button
                onClick={() => setMode('form')}
                className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <FiLogOut className="w-5 h-5" />
                Submit Resignation
              </button>
            )}
            {activeResignation && ['DRAFT', 'SUBMITTED'].includes(activeResignation.status) && (
              <div className="flex gap-3">
                <button
                  onClick={() => handleEditResignation(activeResignation)}
                  className="px-6 py-3 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-900 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleOpenCancelModal(activeResignation._id)}
                  className="px-6 py-3 text-red-600 border border-red-600 rounded-lg font-semibold hover:bg-red-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Resignation History */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Resignation History</h3>
              <button
                onClick={fetchResignations}
                disabled={loading}
                className="p-2 hover:bg-gray-200 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh resignation list"
              >
                <FiRefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {loading ? (
              <div className="p-8 text-center text-gray-500">
                <div className="inline-block">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
                </div>
              </div>
            ) : resignations.length === 0 ? (
              <div className="p-8 text-center">
                <FiFileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No resignation requests yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {resignations.map(resignation => (
                  <div key={resignation._id} className="hover:bg-gray-50 transition-colors">
                    <div
                      className="p-6 cursor-pointer flex items-center justify-between"
                      onClick={() => setExpandedId(expandedId === resignation._id ? null : resignation._id)}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        {getStatusIcon(resignation.status)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-800">{resignation.reasonLabel}</h4>
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadgeColor(resignation.status)}`}>
                              {getStatusLabel(resignation.status)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            Last Day: {new Date(resignation.requestedLastDayOfWork).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <FiChevronDown
                        className={`w-5 h-5 text-gray-400 transition-transform ${expandedId === resignation._id ? 'rotate-180' : ''}`}
                      />
                    </div>

                    {/* Expanded Details */}
                    {expandedId === resignation._id && (
                      <div className="px-6 pb-6 bg-gray-50 border-t border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Requested Last Day</p>
                            <p className="text-sm font-semibold text-gray-800">
                              {new Date(resignation.requestedLastDayOfWork).toLocaleDateString()}
                            </p>
                          </div>
                          {resignation.approvedLastDayOfWork && (
                            <div>
                              <p className="text-xs text-gray-600 mb-1">Approved Last Day</p>
                              <p className="text-sm font-semibold text-green-700">
                                {new Date(resignation.approvedLastDayOfWork).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Submitted</p>
                            <p className="text-sm text-gray-700">
                              {new Date(resignation.submittedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Notice Period</p>
                            <p className="text-sm text-gray-700">{resignation.noticePeriodDays} days</p>
                          </div>
                        </div>

                        {resignation.reasonDescription && (
                          <div className="mb-4">
                            <p className="text-xs text-gray-600 mb-1">Additional Details</p>
                            <p className="text-sm text-gray-700 bg-white p-3 rounded border border-gray-200">
                              {resignation.reasonDescription}
                            </p>
                          </div>
                        )}

                        {/* Approval Status */}
                        <div className="mb-4 space-y-3">
                          <div className="flex items-start gap-3 text-sm">
                            <div className={`mt-1 p-1 rounded ${resignation.status === 'MANAGER_APPROVED' || resignation.status === 'HR_APPROVED' ? 'bg-green-100' : 'bg-gray-200'}`}>
                              <FiCheck className={`w-4 h-4 ${resignation.status === 'MANAGER_APPROVED' || resignation.status === 'HR_APPROVED' ? 'text-green-600' : 'text-gray-400'}`} />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800">Manager Approval</p>
                              <p className="text-gray-600">
                                {['MANAGER_APPROVED', 'HR_APPROVED', 'COMPLETED'].includes(resignation.status)
                                  ? 'Approved'
                                  : resignation.status === 'MANAGER_REJECTED'
                                  ? 'Rejected'
                                  : 'Pending'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3 text-sm">
                            <div className={`mt-1 p-1 rounded ${resignation.status === 'HR_APPROVED' || resignation.status === 'COMPLETED' ? 'bg-green-100' : 'bg-gray-200'}`}>
                              <FiCheck className={`w-4 h-4 ${resignation.status === 'HR_APPROVED' || resignation.status === 'COMPLETED' ? 'text-green-600' : 'text-gray-400'}`} />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800">HR Approval</p>
                              <p className="text-gray-600">
                                {['HR_APPROVED', 'COMPLETED'].includes(resignation.status)
                                  ? 'Approved'
                                  : resignation.status === 'HR_REJECTED'
                                  ? 'Rejected'
                                  : 'Pending'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Notes Section */}
                        {resignation.managerApprovalNotes && (
                          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                            <p className="text-xs text-blue-600 font-semibold mb-1">Manager Notes</p>
                            <p className="text-sm text-blue-800">{resignation.managerApprovalNotes}</p>
                          </div>
                        )}

                        {resignation.hrApprovalNotes && (
                          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
                            <p className="text-xs text-green-600 font-semibold mb-1">HR Notes</p>
                            <p className="text-sm text-green-800">{resignation.hrApprovalNotes}</p>
                          </div>
                        )}

                        {/* Cancel Button */}
                        {['DRAFT', 'SUBMITTED'].includes(resignation.status) && (
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleEditResignation(resignation)}
                              className="flex-1 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900 transition-colors text-sm font-semibold"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleOpenCancelModal(resignation._id)}
                              className="flex-1 px-4 py-2 text-red-600 border border-red-300 rounded hover:bg-red-50 transition-colors text-sm font-semibold"
                            >
                              Cancel Resignation
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* MODE: FORM */}
      {mode === 'form' && (
        <div className="max-w-2xl">
          <button
            onClick={() => {
              setMode('list');
              setEditingResignationId(null);
              setFormData({
                reasonForLeaving: '',
                reasonDescription: '',
                requestedLastDayOfWork: '',
              });
            }}
            className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <FiArrowLeft className="w-5 h-5" />
            Back to Resignation List
          </button>

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-red-50 to-orange-50 border-b border-gray-200 px-6 py-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {editingResignationId ? 'Edit Resignation' : 'Submit Resignation'}
              </h2>
              <p className="text-sm text-gray-600">
                {editingResignationId 
                  ? 'Update your resignation details before submitting.'
                  : 'Important: This action will notify your manager and HR department. Please ensure all details are accurate.'
                }
              </p>
            </div>

            <form onSubmit={handleSubmitResignation} className="p-6 space-y-6">
              {/* Reason for Leaving */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Reason for Leaving <span className="text-red-500">*</span>
                </label>
                <select
                  name="reasonForLeaving"
                  value={formData.reasonForLeaving}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors ${
                    formErrors.reasonForLeaving ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select a reason...</option>
                  {RESIGNATION_REASONS.map(reason => (
                    <option key={reason.value} value={reason.value}>
                      {reason.label}
                    </option>
                  ))}
                </select>
                {formErrors.reasonForLeaving && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <FiAlertCircle className="w-4 h-4" />
                    {formErrors.reasonForLeaving}
                  </p>
                )}
              </div>

              {/* Additional Details */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Additional Details
                </label>
                <textarea
                  name="reasonDescription"
                  value={formData.reasonDescription}
                  onChange={handleInputChange}
                  placeholder="Provide any additional information (optional)"
                  rows="4"
                  maxLength="1000"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors resize-none"
                />
                <p className="mt-1 text-xs text-gray-500">
                  {formData.reasonDescription.length}/1000 characters
                </p>
              </div>

              {/* Last Day of Work */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Requested Last Day of Work <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="requestedLastDayOfWork"
                  value={formData.requestedLastDayOfWork}
                  onChange={handleInputChange}
                  min={new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                  className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors ${
                    formErrors.requestedLastDayOfWork ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <p className="mt-1 text-xs text-gray-500">Minimum notice period: 60 days</p>
                {formErrors.requestedLastDayOfWork && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <FiAlertCircle className="w-4 h-4" />
                    {formErrors.requestedLastDayOfWork}
                  </p>
                )}
              </div>

              {/* Info Box */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex gap-3">
                  <FiAlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-blue-900 mb-1">Important Information</p>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Your resignation will be submitted to your manager for review</li>
                      <li>• HR will review and approve your resignation</li>
                      <li>• You may be contacted for an exit interview</li>
                      <li>• Final settlement will be processed after your last day of work</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      {editingResignationId ? 'Updating...' : 'Submitting...'}
                    </>
                  ) : (
                    <>
                      <FiLogOut className="w-5 h-5" />
                      {editingResignationId ? 'Update & Submit' : 'Submit Resignation'}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('list');
                    setEditingResignationId(null);
                    setFormData({
                      reasonForLeaving: '',
                      reasonDescription: '',
                      requestedLastDayOfWork: '',
                    });
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Resignation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden">
            <div className="bg-red-50 border-b border-red-200 px-6 py-4">
              <div className="flex items-center gap-3">
                <FiAlertCircle className="w-6 h-6 text-red-600" />
                <h3 className="text-lg font-semibold text-gray-800">Cancel Resignation</h3>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to cancel your resignation request? This action cannot be undone.
              </p>
              <p className="text-sm text-gray-600">
                Your manager and HR department will be notified of this cancellation.
              </p>
            </div>
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition-colors font-semibold text-sm"
              >
                Keep Resignation
              </button>
              <button
                onClick={handleConfirmCancel}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors font-semibold text-sm"
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyResignation;
