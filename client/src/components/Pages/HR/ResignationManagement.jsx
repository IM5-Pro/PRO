/**
 * HR Portal - Resignation Management Component
 * Comprehensive resignation lifecycle management for HR department
 * 
 * Features:
 * - Review all resignations
 * - Final approval workflow
 * - Set approved last day of work
 * - Generate exit clearance
 * - Track settlement status
 * - Analytics and reporting
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
  FiTrendingDown,
  FiX,
  FiXCircle,
} from 'react-icons/fi';
import resignationApi from '../../../services/resignationApi';

const ResignationManagement = ({ user = {}, pageConfig = {}, onUserUpdate = () => {} }) => {

  const [resignations, setResignations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [expandedId, setExpandedId] = useState(null);
  const [actioningId, setActioningId] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState(null); // 'approve' or 'reject'
  const [selectedResignation, setSelectedResignation] = useState(null);
  const [approvalData, setApprovalData] = useState({
    notes: '',
    approvedLastDay: '',
  });

  // Stats state
  const [stats, setStats] = useState(null);

  const fetchStats = useCallback(async () => {
    const result = await resignationApi.getResignationStats();
    if (result.success) {
      setStats(result.stats);
    }
  }, []);

  const fetchResignations = useCallback(async () => {
    setLoading(true);
    const filterValue = selectedFilter === 'ALL' ? undefined : selectedFilter;
    const result = await resignationApi.getAllResignations({
      status: filterValue,
      limit: 100,
    });
    if (result.success) {
      setResignations(result.data || []);
    }
    setLoading(false);
  }, [selectedFilter]);

  useEffect(() => {
    fetchResignations();
    fetchStats();
  }, [fetchResignations, fetchStats]);

  const filteredResignations = useMemo(() => {
    return resignations.filter(r =>
      r.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.employeeCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.department?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [resignations, searchTerm]);

  const handleApproveClick = (resignation) => {
    setSelectedResignation(resignation);
    setModalMode('approve');
    setApprovalData({
      notes: '',
      approvedLastDay: resignation.requestedLastDayOfWork,
    });
    setModalOpen(true);
  };

  const handleRejectClick = (resignation) => {
    setSelectedResignation(resignation);
    setModalMode('reject');
    setApprovalData({
      notes: '',
      approvedLastDay: '',
    });
    setModalOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedResignation) return;

    setActioningId(selectedResignation._id);
    let result;

    if (modalMode === 'approve') {
      result = await resignationApi.approveResignation(selectedResignation._id, {
        approvalNotes: approvalData.notes,
        approvedLastDayOfWork: approvalData.approvedLastDay,
      });
    } else if (modalMode === 'reject') {
      result = await resignationApi.rejectResignation(
        selectedResignation._id,
        approvalData.notes
      );
    }

    setActioningId(null);

    if (result.success) {
      setSuccessMessage(`Resignation ${modalMode === 'approve' ? 'approved' : 'rejected'} successfully`);
      setModalOpen(false);
      setApprovalData({ notes: '', approvedLastDay: '' });
      setSelectedResignation(null);
      await fetchResignations();
      await fetchStats();
      setTimeout(() => setSuccessMessage(''), 3000);
    } else {
      setErrorMessage(result.error || `Failed to ${modalMode} resignation`);
    }
  };

  const getStatusIcon = (status) => {
    const iconProps = 'w-5 h-5';
    switch (status) {
      case 'SUBMITTED':
        return <FiAlertCircle className={`${iconProps} text-yellow-500`} />;
      case 'MANAGER_APPROVED':
        return <FiCheck className={`${iconProps} text-blue-600`} />;
      case 'HR_APPROVED':
        return <FiCheck className={`${iconProps} text-green-600`} />;
      case 'MANAGER_REJECTED':
      case 'HR_REJECTED':
        return <FiXCircle className={`${iconProps} text-red-600`} />;
      case 'COMPLETED':
        return <FiCheck className={`${iconProps} text-green-700`} />;
      default:
        return <FiLogOut className={`${iconProps} text-gray-400`} />;
    }
  };

  const getStatusBadgeColor = (status) => {
    const badgeClasses = {
      SUBMITTED: 'bg-yellow-100 text-yellow-700',
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-red-100 rounded-lg">
            <FiLogOut className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Resignation Management</h1>
            <p className="text-sm text-gray-600">Comprehensive resignation lifecycle and exit processing</p>
          </div>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Total Resignations</p>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-yellow-200 bg-yellow-50">
              <p className="text-xs text-gray-600 mb-1">Pending Review</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-green-200 bg-green-50">
              <p className="text-xs text-gray-600 mb-1">Approved</p>
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-red-200 bg-red-50">
              <p className="text-xs text-gray-600 mb-1">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-purple-200 bg-purple-50">
              <p className="text-xs text-gray-600 mb-1">Completed</p>
              <p className="text-2xl font-bold text-purple-600">{stats.completed || 0}</p>
            </div>
          </div>
        )}
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
              placeholder="Search by name, code, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>
        <select
          value={selectedFilter}
          onChange={(e) => setSelectedFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="ALL">All Resignations</option>
          <option value="SUBMITTED">Pending Manager Approval</option>
          <option value="MANAGER_APPROVED">Pending HR Approval</option>
          <option value="HR_APPROVED">HR Approved</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      {/* Resignations Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <FiTrendingDown className="w-5 h-5" />
            Resignations
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
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="font-semibold text-gray-800">{resignation.employeeName}</h4>
                        <span className={`px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ${getStatusBadgeColor(resignation.status)}`}>
                          {getStatusLabel(resignation.status)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 space-x-2">
                        <span>{resignation.employeeCode}</span>
                        <span>•</span>
                        <span>{resignation.department}</span>
                        <span>•</span>
                        <span>{resignation.designation}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right mr-4">
                    <p className="text-xs text-gray-600 mb-1">Last Day</p>
                    <p className="text-sm font-semibold text-gray-800">
                      {new Date(resignation.requestedLastDayOfWork).toLocaleDateString()}
                    </p>
                  </div>
                  <FiChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${expandedId === resignation._id ? 'rotate-180' : ''}`}
                  />
                </div>

                {/* Expanded Details */}
                {expandedId === resignation._id && (
                  <div className="px-6 pb-6 bg-gray-50 border-t border-gray-200">
                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Reason for Leaving</p>
                        <p className="text-sm font-semibold text-gray-800">{resignation.reasonLabel}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Manager</p>
                        <p className="text-sm font-semibold text-gray-800">
                          {resignation.manager?.firstName} {resignation.manager?.lastName}
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

                    {/* Approval Status */}
                    <div className="mb-6 space-y-3">
                      <div className="flex items-start gap-3 text-sm">
                        <div className={`mt-1 p-1 rounded ${['MANAGER_APPROVED', 'HR_APPROVED', 'COMPLETED'].includes(resignation.status) ? 'bg-green-100' : 'bg-gray-200'}`}>
                          <FiCheck className={`w-4 h-4 ${['MANAGER_APPROVED', 'HR_APPROVED', 'COMPLETED'].includes(resignation.status) ? 'text-green-600' : 'text-gray-400'}`} />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">Manager Approval</p>
                          <p className="text-gray-600">
                            {['MANAGER_APPROVED', 'HR_APPROVED', 'COMPLETED'].includes(resignation.status)
                              ? `Approved on ${new Date(resignation.managerApprovalAt).toLocaleDateString()}`
                              : resignation.status === 'MANAGER_REJECTED'
                              ? 'Rejected'
                              : 'Pending'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 text-sm">
                        <div className={`mt-1 p-1 rounded ${['HR_APPROVED', 'COMPLETED'].includes(resignation.status) ? 'bg-green-100' : 'bg-gray-200'}`}>
                          <FiCheck className={`w-4 h-4 ${['HR_APPROVED', 'COMPLETED'].includes(resignation.status) ? 'text-green-600' : 'text-gray-400'}`} />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">HR Approval</p>
                          <p className="text-gray-600">
                            {['HR_APPROVED', 'COMPLETED'].includes(resignation.status)
                              ? `Approved on ${new Date(resignation.hrApprovalAt).toLocaleDateString()}`
                              : resignation.status === 'HR_REJECTED'
                              ? 'Rejected'
                              : 'Pending'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Notes Display */}
                    {resignation.managerApprovalNotes && (
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                        <p className="text-xs text-blue-600 font-semibold mb-1">Manager Notes</p>
                        <p className="text-sm text-blue-800">{resignation.managerApprovalNotes}</p>
                      </div>
                    )}

                    {resignation.hrApprovalNotes && (
                      <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
                        <p className="text-xs text-green-600 font-semibold mb-1">HR Approval Notes</p>
                        <p className="text-sm text-green-800">{resignation.hrApprovalNotes}</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {resignation.status === 'MANAGER_APPROVED' && (
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleApproveClick(resignation)}
                          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                        >
                          <FiCheck className="w-5 h-5" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectClick(resignation)}
                          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                        >
                          <FiX className="w-5 h-5" />
                          Reject
                        </button>
                      </div>
                    )}

                    {resignation.status === 'HR_APPROVED' && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded text-center">
                        <p className="text-sm font-semibold text-green-700">
                          ✓ Approved - Awaiting exit clearance completion
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal for HR Approval/Rejection */}
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
              {modalMode === 'approve' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Approved Last Day of Work
                  </label>
                  <input
                    type="date"
                    value={approvalData.approvedLastDay}
                    onChange={(e) => setApprovalData(prev => ({
                      ...prev,
                      approvedLastDay: e.target.value,
                    }))}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Notes {modalMode === 'approve' ? '(Optional)' : '(Required)'}
                </label>
                <textarea
                  value={approvalData.notes}
                  onChange={(e) => setApprovalData(prev => ({
                    ...prev,
                    notes: e.target.value,
                  }))}
                  placeholder={modalMode === 'approve' 
                    ? 'Add approval notes...'
                    : 'Explain reason for rejection...'}
                  rows="4"
                  maxLength="500"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                />
                <p className="mt-1 text-xs text-gray-500">{approvalData.notes.length}/500</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleConfirmAction}
                  disabled={actioningId || (modalMode === 'reject' && !approvalData.notes)}
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
                    setApprovalData({ notes: '', approvedLastDay: '' });
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

export default ResignationManagement;
