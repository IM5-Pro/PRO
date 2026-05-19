/**
 * AttendanceEditModal Component
 * Allows HR/Admin to edit attendance records (check-in/out times, working hours, status)
 * Features: Time selection, status dropdown, remarks, validation
 */

import React, { useState, useEffect } from 'react';
import { FiX, FiClock, FiAlertCircle, FiCheck } from 'react-icons/fi';
import API from '../../api/client';
import { ATTENDANCE_ENDPOINTS } from '../../api/endpoints';

const ATTENDANCE_STATUSES = [
  'Present',
  'Absent',
  'Late',
  'LateCheckout',
  'EarlyCheckout',
  'HalfDay',
  'Leave',
  'OnLeave',
  'WFH',
];

const AttendanceEditModal = ({ isOpen, onClose, attendanceRecord, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    status: '',
    checkInTime: '',
    checkOutTime: '',
    workingHours: '',
    remarks: '',
    assignedShiftStart: '',
    assignedShiftEnd: '',
  });

  // Initialize form with existing data
  useEffect(() => {
    if (attendanceRecord) {
      setFormData({
        status: attendanceRecord.status || '',
        checkInTime: attendanceRecord.checkInTime ? formatTimeForInput(attendanceRecord.checkInTime) : '',
        checkOutTime: attendanceRecord.checkOutTime ? formatTimeForInput(attendanceRecord.checkOutTime) : '',
        workingHours: attendanceRecord.workingHours || '',
        remarks: attendanceRecord.remarks || '',
        assignedShiftStart: attendanceRecord.assignedShiftStart || '',
        assignedShiftEnd: attendanceRecord.assignedShiftEnd || '',
      });
      setError(null);
    }
  }, [attendanceRecord, isOpen]);

  const formatTimeForInput = (timeStr) => {
    if (!timeStr) return '';
    // Handle ISO format or HH:MM format
    if (timeStr.includes('T')) {
      const date = new Date(timeStr);
      return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    return timeStr;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  };

  const validateForm = () => {
    if (!formData.status) {
      setError('Status is required');
      return false;
    }

    // Validate time format HH:MM
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (formData.checkInTime && !timeRegex.test(formData.checkInTime)) {
      setError('Check-in time must be in HH:MM format (24-hour)');
      return false;
    }
    if (formData.checkOutTime && !timeRegex.test(formData.checkOutTime)) {
      setError('Check-out time must be in HH:MM format (24-hour)');
      return false;
    }

    // Validate working hours
    if (formData.workingHours) {
      const hours = parseFloat(formData.workingHours);
      if (isNaN(hours) || hours < 0 || hours > 24) {
        setError('Working hours must be between 0 and 24');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm() || !attendanceRecord?._id) {
      return;
    }

    setLoading(true);
    try {
      const payload = {
        status: formData.status,
        ...(formData.checkInTime && { checkInTime: formData.checkInTime }),
        ...(formData.checkOutTime && { checkOutTime: formData.checkOutTime }),
        ...(formData.workingHours && { workingHours: parseFloat(formData.workingHours) }),
        ...(formData.remarks && { remarks: formData.remarks }),
        ...(formData.assignedShiftStart && { assignedShiftStart: formData.assignedShiftStart }),
        ...(formData.assignedShiftEnd && { assignedShiftEnd: formData.assignedShiftEnd }),
      };

      await API.put(ATTENDANCE_ENDPOINTS.update(attendanceRecord._id), payload);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update attendance record');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !attendanceRecord) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">Edit Attendance</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Close"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <FiAlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date Info */}
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-500 font-medium">Date</p>
            <p className="text-sm font-semibold text-slate-900">
              {new Date(attendanceRecord.attendanceDate).toLocaleDateString('en-GB', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          {/* Employee Info */}
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-500 font-medium">Employee</p>
            <p className="text-sm font-semibold text-slate-900">
              {attendanceRecord.employee?.firstName} {attendanceRecord.employee?.lastName}
            </p>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Status *
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Select Status</option>
              {ATTENDANCE_STATUSES.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          {/* Check-in Time */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              <FiClock className="inline mr-1" size={16} />
              Check-in Time (HH:MM)
            </label>
            <input
              type="text"
              name="checkInTime"
              placeholder="09:00"
              value={formData.checkInTime}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Check-out Time */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              <FiClock className="inline mr-1" size={16} />
              Check-out Time (HH:MM)
            </label>
            <input
              type="text"
              name="checkOutTime"
              placeholder="17:00"
              value={formData.checkOutTime}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Working Hours */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Working Hours (0-24)
            </label>
            <input
              type="number"
              name="workingHours"
              placeholder="8.5"
              value={formData.workingHours}
              onChange={handleInputChange}
              step="0.5"
              min="0"
              max="24"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Remarks
            </label>
            <textarea
              name="remarks"
              value={formData.remarks}
              onChange={handleInputChange}
              placeholder="Add any remarks..."
              rows="3"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <FiCheck size={18} />
                  Update Record
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AttendanceEditModal;
