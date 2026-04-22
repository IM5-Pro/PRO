/**
 * Super Admin Portal - Resignation Admin View
 * System-wide resignation monitoring and administrative controls
 * 
 * Features:
 * - View all resignations across the organization
 * - Export resignation reports
 * - Override approvals if needed
 * - Detailed analytics and trends
 * - Compliance and audit trails
 * 
 * @component
 * @author HR Team
 * @version 1.0.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FiAlertCircle,
  FiBarChart2,
  FiBox,
  FiCheck,
  FiDownload,
  FiEye,
  FiLogOut,
  FiSearch,
  FiTrendingDown,
  FiUsers,
  FiXCircle,
} from 'react-icons/fi';
import resignationApi from '../../../services/resignationApi';

const ResignationAdminView = ({ user = {}, pageConfig = {}, onUserUpdate = () => {} }) => {

  const [resignations, setResignations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [expandedId, setExpandedId] = useState(null);
  const [actioningId, setActioningId] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'analytics'

  // Modal state
  const [modalOpen, setModalOpen] = useState(null);
  const [selectedResignation, setSelectedResignation] = useState(null);
  const [actionData, setActionData] = useState({
    notes: '',
    approvedLastDay: '',
  });

  // Stats state
  const [stats, setStats] = useState(null);
  const [departmentStats, setDepartmentStats] = useState({});

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
      limit: 200,
    });
    if (result.success) {
      setResignations(result.data || []);
      // Calculate department stats
      const deptStats = {};
      (result.data || []).forEach(r => {
        if (!deptStats[r.department]) {
          deptStats[r.department] = { count: 0, approved: 0 };
        }
        deptStats[r.department].count++;
        if (r.status === 'HR_APPROVED') {
          deptStats[r.department].approved++;
        }
      });
      setDepartmentStats(deptStats);
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

  const handleOverrideApproval = (resignation) => {
    setSelectedResignation(resignation);
    setModalOpen('override');
    setActionData({
      notes: 'System override by Super Admin',
      approvedLastDay: resignation.requestedLastDayOfWork,
    });
  };

  const handleConfirmOverride = async () => {
    if (!selectedResignation) return;

    setActioningId(selectedResignation._id);
    const result = await resignationApi.approveResignation(selectedResignation._id, {
      approvalNotes: actionData.notes,
      approvedLastDayOfWork: actionData.approvedLastDay,
    });

    setActioningId(null);

    if (result.success) {
      setSuccessMessage('Resignation approved successfully (System Override)');
      setModalOpen(null);
      setActionData({ notes: '', approvedLastDay: '' });
      setSelectedResignation(null);
      await fetchResignations();
      await fetchStats();
      setTimeout(() => setSuccessMessage(''), 3000);
    } else {
      setErrorMessage(result.error || 'Failed to approve resignation');
    }
  };

  const handleExport = () => {
    const data = filteredResignations.map(r => ({
      'Employee Name': r.employeeName,
      'Employee Code': r.employeeCode,
      'Department': r.department,
      'Designation': r.designation,
      'Reason': r.reasonLabel,
      'Requested Last Day': new Date(r.requestedLastDayOfWork).toLocaleDateString(),
      'Status': resignationApi.getStatusLabel(r.status),
      'Submitted Date': new Date(r.submittedAt).toLocaleDateString(),
      'Notice Period': `${r.noticePeriodDays} days`,
    }));

    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).map(v => `"${v}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resignations-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getStatusIcon = (status) => {
    const iconProps = 'w-4 h-4';
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
      DRAFT: 'bg-gray-100 text-gray-700',
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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <FiLogOut className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Resignation Administration</h1>
              <p className="text-sm text-gray-600">System-wide resignation monitoring and controls</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode(viewMode === 'table' ? 'analytics' : 'table')}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <FiBarChart2 className="w-4 h-4" />
              {viewMode === 'table' ? 'Analytics' : 'Table View'}
            </button>
            {viewMode === 'table' && (
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <FiDownload className="w-4 h-4" />
                Export CSV
              </button>
            )}
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
              <p className="text-xs text-gray-600 mb-1">Pending</p>
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

      {viewMode === 'table' && (
        <>
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
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="ALL">All Resignations</option>
              <option value="SUBMITTED">Pending Manager</option>
              <option value="MANAGER_APPROVED">Pending HR</option>
              <option value="HR_APPROVED">Approved</option>
              <option value="MANAGER_REJECTED">Manager Rejected</option>
              <option value="HR_REJECTED">HR Rejected</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          {/* Resignations Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <FiBox className="w-5 h-5" />
                Resignations ({filteredResignations.length})
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
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Employee</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Department</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Reason</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Last Day</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredResignations.map(resignation => (
                      <tr key={resignation._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm">
                          <div>
                            <p className="font-semibold text-gray-800">{resignation.employeeName}</p>
                            <p className="text-xs text-gray-600">{resignation.employeeCode}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">{resignation.department}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{resignation.reasonLabel}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 w-fit ${getStatusBadgeColor(resignation.status)}`}>
                            {getStatusIcon(resignation.status)}
                            {getStatusLabel(resignation.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {new Date(resignation.requestedLastDayOfWork).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={() => setExpandedId(expandedId === resignation._id ? null : resignation._id)}
                              className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                            >
                              <FiEye className="w-4 h-4" />
                            </button>
                            {(resignation.status === 'MANAGER_APPROVED' || resignation.status === 'SUBMITTED') && (
                              <button
                                type="button"
                                onClick={() => handleOverrideApproval(resignation)}
                                className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded hover:bg-purple-200"
                              >
                                Override
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {viewMode === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Department-wise Breakdown */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FiUsers className="w-5 h-5" />
              Department-wise Resignations
            </h3>
            <div className="space-y-4">
              {Object.entries(departmentStats).length === 0 ? (
                <p className="text-gray-500">No data available</p>
              ) : (
                Object.entries(departmentStats).map(([dept, data]) => (
                  <div key={dept}>
                    <div className="flex justify-between mb-1">
                      <p className="text-sm font-semibold text-gray-700">{dept}</p>
                      <p className="text-xs text-gray-600">{data.count} total</p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${(data.approved / data.count) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{data.approved} approved</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Monthly Trend */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FiTrendingDown className="w-5 h-5" />
              Status Distribution
            </h3>
            {stats && (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <p className="text-sm text-gray-700">Pending Review</p>
                    <p className="text-sm font-semibold text-gray-800">{stats.pending}</p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-500 h-2 rounded-full"
                      style={{ width: `${(stats.pending / stats.total) * 100 || 0}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <p className="text-sm text-gray-700">Approved</p>
                    <p className="text-sm font-semibold text-gray-800">{stats.approved}</p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${(stats.approved / stats.total) * 100 || 0}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <p className="text-sm text-gray-700">Rejected</p>
                    <p className="text-sm font-semibold text-gray-800">{stats.rejected}</p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-600 h-2 rounded-full"
                      style={{ width: `${(stats.rejected / stats.total) * 100 || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal for Override */}
      {modalOpen === 'override' && selectedResignation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-purple-900">System Override - Approve</h2>
              <p className="text-sm text-purple-700">{selectedResignation.employeeName}</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Approved Last Day of Work
                </label>
                <input
                  type="date"
                  value={actionData.approvedLastDay}
                  onChange={(e) => setActionData(prev => ({
                    ...prev,
                    approvedLastDay: e.target.value,
                  }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded text-sm">
                <p className="text-amber-900">
                  ⚠️ This is a system override action. Ensure proper authorization before proceeding.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleConfirmOverride}
                  disabled={actioningId}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {actioningId ? 'Processing...' : 'Confirm Override'}
                </button>
                <button
                  onClick={() => {
                    setModalOpen(null);
                    setActionData({ notes: '', approvedLastDay: '' });
                    setSelectedResignation(null);
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

export default ResignationAdminView;
