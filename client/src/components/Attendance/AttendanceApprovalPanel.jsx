/**
 * AttendanceApprovalPanel Component
 * Allows managers/HR to approve or reject attendance records
 * Features: Approval workflow, remarks, bulk actions, approval history
 */

import React, { useState } from 'react';
import { FiCheck, FiX, FiAlertCircle, FiMessageSquare, FiClock } from 'react-icons/fi';
import API from '../../api/client';
import { ATTENDANCE_ENDPOINTS } from '../../api/endpoints';
import {
  formatAttendanceRecordDate,
  getAttendanceEmployeeLabel,
} from '../../utils/attendanceDisplay';

const AttendanceApprovalPanel = ({ attendanceRecord, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [action, setAction] = useState(null); // 'approve' or 'reject'
  const [remarks, setRemarks] = useState('');

  const handleApprove = async () => {
    setAction('approve');
    await submitAction('approve');
  };

  const handleReject = async () => {
    setAction('reject');
    await submitAction('reject');
  };

  const submitAction = async (approvalAction) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const endpoint = approvalAction === 'approve'
        ? ATTENDANCE_ENDPOINTS.approve(attendanceRecord._id)
        : ATTENDANCE_ENDPOINTS.reject(attendanceRecord._id);

      const payload = {
        approvalStatus: approvalAction === 'approve' ? 'Approved' : 'Rejected',
        ...(remarks && { approvalRemarks: remarks }),
      };

      await API.post(endpoint, payload);
      setSuccess(true);
      onSuccess?.();
      
      // Auto-close after 2 seconds
      setTimeout(() => {
        onClose?.();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${approvalAction} attendance record`);
    } finally {
      setLoading(false);
      setAction(null);
    }
  };

  if (!attendanceRecord) return null;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-900">Attendance Approval</h3>
        {attendanceRecord.approvalStatus && (
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            attendanceRecord.approvalStatus === 'Approved'
              ? 'bg-green-100 text-green-700'
              : attendanceRecord.approvalStatus === 'Rejected'
              ? 'bg-red-100 text-red-700'
              : 'bg-yellow-100 text-yellow-700'
          }`}>
            {attendanceRecord.approvalStatus}
          </span>
        )}
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <FiCheck className="text-green-600" size={18} />
          <p className="text-sm text-green-700 font-medium">
            Attendance record {action === 'approve' ? 'approved' : 'rejected'} successfully
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <FiAlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Record Details */}
      <div className="space-y-3 mb-6 pb-6 border-b border-slate-200">
        {/* Date */}
        <div className="flex justify-between items-start">
          <p className="text-sm text-slate-600">Date</p>
          <p className="text-sm font-semibold text-slate-900">
            {formatAttendanceRecordDate(attendanceRecord, 'en-GB', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </p>
        </div>

        {/* Employee */}
        <div className="flex justify-between items-start">
          <p className="text-sm text-slate-600">Employee</p>
          <p className="text-sm font-semibold text-slate-900">
            {getAttendanceEmployeeLabel(attendanceRecord)}
          </p>
        </div>

        {/* Status */}
        <div className="flex justify-between items-start">
          <p className="text-sm text-slate-600">Attendance Status</p>
          <span className={`px-2 py-1 rounded text-xs font-semibold ${
            attendanceRecord.status === 'Present'
              ? 'bg-green-100 text-green-700'
              : attendanceRecord.status === 'Absent'
              ? 'bg-red-100 text-red-700'
              : 'bg-blue-100 text-blue-700'
          }`}>
            {attendanceRecord.status}
          </span>
        </div>

        {/* Check-in/out Times */}
        {attendanceRecord.checkInTime && (
          <div className="flex justify-between items-start">
            <p className="text-sm text-slate-600 flex items-center gap-1">
              <FiClock size={14} />
              Check-in
            </p>
            <p className="text-sm font-semibold text-slate-900">
              {new Date(attendanceRecord.checkInTime).toLocaleTimeString('en-GB', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        )}

        {attendanceRecord.checkOutTime && (
          <div className="flex justify-between items-start">
            <p className="text-sm text-slate-600 flex items-center gap-1">
              <FiClock size={14} />
              Check-out
            </p>
            <p className="text-sm font-semibold text-slate-900">
              {new Date(attendanceRecord.checkOutTime).toLocaleTimeString('en-GB', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        )}

        {/* Working Hours */}
        {attendanceRecord.workingHours && (
          <div className="flex justify-between items-start">
            <p className="text-sm text-slate-600">Working Hours</p>
            <p className="text-sm font-semibold text-slate-900">{attendanceRecord.workingHours} hrs</p>
          </div>
        )}
      </div>

      {/* Existing Remarks */}
      {attendanceRecord.remarks && (
        <div className="mb-6 p-3 bg-slate-50 rounded-lg">
          <p className="text-xs text-slate-600 font-medium mb-1">Existing Remarks</p>
          <p className="text-sm text-slate-700">{attendanceRecord.remarks}</p>
        </div>
      )}

      {/* Approval Remarks Input */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          <FiMessageSquare className="inline mr-1" size={16} />
          Approval Remarks (Optional)
        </label>
        <textarea
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="Add remarks for this approval..."
          rows="3"
          disabled={loading || success}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:bg-slate-50 disabled:text-slate-500"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleReject}
          disabled={loading || success}
          className="flex-1 px-4 py-3 rounded-lg border-2 border-red-200 text-red-700 font-semibold hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading && action === 'reject' ? (
            <>
              <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
              Rejecting...
            </>
          ) : (
            <>
              <FiX size={18} />
              Reject
            </>
          )}
        </button>
        <button
          onClick={handleApprove}
          disabled={loading || success}
          className="flex-1 px-4 py-3 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading && action === 'approve' ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Approving...
            </>
          ) : (
            <>
              <FiCheck size={18} />
              Approve
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AttendanceApprovalPanel;
