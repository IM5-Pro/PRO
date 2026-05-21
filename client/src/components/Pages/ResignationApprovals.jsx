/**
 * Manager Portal - Resignation Approvals Component
 * Manage team member resignation requests and approvals
 * 
 * Features:
 * - Review team resignations
 * - Approve/Reject resignations
 * - Add approval notes
 * - Track team exits
 * - Filter by status
 * 
 * @component
 * @author HR Team
 * @version 1.0.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FiAlertCircle,
  FiCheck,
  FiChevronDown,
  FiLogOut,
  FiSearch,
  FiX,
  FiXCircle,
} from 'react-icons/fi';
import resignationApi from '../../services/resignationApi';

const ResignationApprovals = ({ user = {}, pageConfig = {}, onUserUpdate = () => {} }) => {

  const [resignations, setResignations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('SUBMITTED');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [actioningId, setActioningId] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState(null); // 'approve' or 'reject'
  const [selectedResignation, setSelectedResignation] = useState(null);
  const [notes, setNotes] = useState('');

  const fetchResignations = useCallback(async () => {
    setLoading(true);
    const result = await resignationApi.getTeamResignations({
      status: selectedFilter === 'ALL' ? undefined : selectedFilter,
      limit: 100,
    });
    if (result.success) {
      setResignations(result.data || []);
    }
    setLoading(false);
  }, [selectedFilter]);

  useEffect(() => {
    fetchResignations();
  }, [fetchResignations]);

  const filteredResignations = useMemo(() => {
    return resignations.filter(r =>
      r.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.employeeCode?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [resignations, searchTerm]);

  const stats = useMemo(() => ({
    total: resignations.length,
    pending: resignations.filter(r => r.status === 'SUBMITTED').length,
    approved: resignations.filter(r => r.status === 'MANAGER_APPROVED').length,
    rejected: resignations.filter(r => r.status === 'MANAGER_REJECTED').length,
  }), [resignations]);

  const handleApproveClick = (resignation) => {
    setSelectedResignation(resignation);
    setModalMode('approve');
    setNotes('');
    setModalOpen(true);
  };

  const handleRejectClick = (resignation) => {
    setSelectedResignation(resignation);
    setModalMode('reject');
    setNotes('');
    setModalOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedResignation) return;

    setActioningId(selectedResignation._id);
    let result;

    if (modalMode === 'approve') {
      result = await resignationApi.approveResignation(selectedResignation._id, {
        approvalNotes: notes,
      });
    } else if (modalMode === 'reject') {
      result = await resignationApi.rejectResignation(selectedResignation._id, notes);
    }

    setActioningId(null);

    if (result.success) {
      setSuccessMessage(`Resignation ${modalMode === 'approve' ? 'approved' : 'rejected'} successfully`);
      setModalOpen(false);
      setNotes('');
      setSelectedResignation(null);
      await fetchResignations();
      setTimeout(() => setSuccessMessage(''), 3000);
    } else {
      setErrorMessage(result.error || `Failed to ${modalMode} resignation`);
    }
  };

  const getStatusIcon = (status) => {
    const iconProps = 'w-5 h-5';
    switch (status) {
      case 'SUBMITTED':
        return <FiAlertCircle className={`${iconProps} text-blue-500`} />;
      case 'MANAGER_APPROVED':
        return <FiCheck className={`${iconProps} text-green-600`} />;
      case 'MANAGER_REJECTED':
        return <FiXCircle className={`${iconProps} text-red-600`} />;
      default:
        return <FiLogOut className={`${iconProps} text-gray-400`} />;
    }
  };

  const getStatusBadgeColor = (status) => {
    const badgeClasses = {
      SUBMITTED: 'bg-blue-100 text-blue-700',
      MANAGER_APPROVED: 'bg-green-100 text-green-700',
      MANAGER_REJECTED: 'bg-red-100 text-red-700',
    };
    return badgeClasses[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusLabel = (status) => resignationApi.getStatusLabel(status);

  return (
    <div className="min-h-screen bg-im5-page p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-orange-100 rounded-lg">
            <FiLogOut className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Team Resignations</h1>
            <p className="text-sm text-gray-600">Review and approve team member resignations</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-xs text-gray-600 mb-1">Total</p>
            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-blue-200 bg-blue-50">
            <p className="text-xs text-gray-600 mb-1">Pending</p>
            <p className="text-2xl font-bold text-blue-600">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-green-200 bg-green-50">
            <p className="text-xs text-gray-600 mb-1">Approved</p>
            <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-red-200 bg-red-50">
            <p className="text-xs text-gray-600 mb-1">Rejected</p>
            <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <FiCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-green-800">{successMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <FiAlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-red-800">{errorMessage}</p>
        </div>
      )}

      {/* Filters and Search */}
      <div className="mb-6 flex gap-4 flex-col md:flex-row">
        <div className="flex-1">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name or employee code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>
        <select
          value={selectedFilter}
          onChange={(e) => setSelectedFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="ALL">All Statuses</option>
          <option value="SUBMITTED">Pending Review</option>
          <option value="MANAGER_APPROVED">Approved</option>
          <option value="MANAGER_REJECTED">Rejected</option>
        </select>
      </div>

      {/* Resignations List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
          <h3 className="font-semibold text-gray-800">
            {selectedFilter === 'ALL' ? 'All Resignations' : `${getStatusLabel(selectedFilter)} Resignations`}
          </h3>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <div className="inline-block">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
            </div>
          </div>
        ) : filteredResignations.length === 0 ? (
          <div className="p-8 text-center">
            <FiLogOut className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No resignations found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredResignations.map(resignation => (
              <div key={resignation._id} className="hover:bg-gray-50 transition-colors">
                <div
                  className="p-6 cursor-pointer flex items-center justify-between"
                  onClick={() => setExpandedId(expandedId === resignation._id ? null : resignation._id)}
                >
                  <div className="flex items-center gap-4 flex-1">
                    {getStatusIcon(resignation.status)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-800">{resignation.employeeName}</h4>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadgeColor(resignation.status)}`}>
                          {getStatusLabel(resignation.status)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {resignation.employeeCode} • {resignation.department}
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Reason for Leaving</p>
                        <p className="text-sm font-semibold text-gray-800">{resignation.reasonLabel}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Requested Last Day</p>
                        <p className="text-sm font-semibold text-gray-800">
                          {new Date(resignation.requestedLastDayOfWork).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Submitted Date</p>
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
                      <div className="mb-6">
                        <p className="text-xs text-gray-600 mb-2">Additional Details</p>
                        <div className="p-3 bg-white rounded border border-gray-300 text-sm text-gray-700">
                          {resignation.reasonDescription}
                        </div>
                      </div>
                    )}

                    {/* Existing Notes */}
                    {resignation.managerApprovalNotes && (
                      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
                        <p className="text-xs text-blue-600 font-semibold mb-2">Your Previous Notes</p>
                        <p className="text-sm text-blue-800">{resignation.managerApprovalNotes}</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {resignation.status === 'SUBMITTED' && (
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleApproveClick(resignation)}
                          disabled={actioningId === resignation._id}
                          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {actioningId === resignation._id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Processing...
                            </>
                          ) : (
                            <>
                              <FiCheck className="w-5 h-5" />
                              Approve
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleRejectClick(resignation)}
                          disabled={actioningId === resignation._id}
                          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {actioningId === resignation._id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Processing...
                            </>
                          ) : (
                            <>
                              <FiX className="w-5 h-5" />
                              Reject
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {resignation.status === 'MANAGER_APPROVED' && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded">
                        <p className="text-sm text-green-700">✓ Approved on {new Date(resignation.managerApprovalAt).toLocaleDateString()}</p>
                      </div>
                    )}

                    {resignation.status === 'MANAGER_REJECTED' && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded">
                        <p className="text-sm text-red-700">✗ Rejected on {new Date(resignation.managerApprovalAt).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal for Approval/Rejection */}
      {modalOpen && selectedResignation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className={`bg-gradient-to-r px-6 py-4 border-b border-gray-200 ${
              modalMode === 'approve'
                ? 'from-green-50 to-green-100'
                : 'from-red-50 to-red-100'
            }`}>
              <h2 className={`text-xl font-bold ${
                modalMode === 'approve' ? 'text-green-900' : 'text-red-900'
              }`}>
                {modalMode === 'approve' ? 'Approve Resignation' : 'Reject Resignation'}
              </h2>
              <p className={`text-sm ${
                modalMode === 'approve' ? 'text-green-700' : 'text-red-700'
              }`}>
                {selectedResignation.employeeName}
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Notes {modalMode === 'approve' ? '(Optional)' : '(Required)'}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={modalMode === 'approve' 
                    ? 'Add any approval notes...'
                    : 'Please explain the reason for rejection...'}
                  rows="4"
                  maxLength="500"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                />
                <p className="mt-1 text-xs text-gray-500">{notes.length}/500 characters</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleConfirmAction}
                  disabled={actioningId || (modalMode === 'reject' && !notes)}
                  className={`flex-1 px-4 py-2 text-white rounded-lg font-semibold transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed ${
                    modalMode === 'approve'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {actioningId ? 'Processing...' : (modalMode === 'approve' ? 'Approve' : 'Reject')}
                </button>
                <button
                  onClick={() => {
                    setModalOpen(false);
                    setNotes('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResignationApprovals;
