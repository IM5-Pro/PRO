/**
 * BreakTrackingPanel Component
 * Allows employees to start and end breaks during work hours
 * Features: Start/end break buttons, break duration tracking, break history, validation
 */

import React, { useState, useEffect } from 'react';
import { FiPlay, FiSquare, FiClock, FiAlertCircle, FiCheck } from 'react-icons/fi';
import API from '../../api/client';
import { ATTENDANCE_ENDPOINTS } from '../../api/endpoints';

const BreakTrackingPanel = ({ currentAttendance, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [breakStatus, setBreakStatus] = useState(null); // null, 'active', or 'completed'
  const [breakStartTime, setBreakStartTime] = useState(null);
  const [breakDuration, setBreakDuration] = useState(0);
  const [breakHistory, setBreakHistory] = useState([]);

  // Update break duration every second when break is active
  useEffect(() => {
    if (breakStatus === 'active' && breakStartTime) {
      const interval = setInterval(() => {
        const now = new Date();
        const duration = Math.floor((now - new Date(breakStartTime)) / 1000 / 60); // in minutes
        setBreakDuration(duration);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [breakStatus, breakStartTime]);

  // Initialize break status from current attendance
  useEffect(() => {
    if (currentAttendance) {
      // Check if there's an active break
      if (currentAttendance.breakStartTime && !currentAttendance.breakEndTime) {
        setBreakStatus('active');
        setBreakStartTime(currentAttendance.breakStartTime);
      } else if (currentAttendance.breakHistory && currentAttendance.breakHistory.length > 0) {
        setBreakHistory(currentAttendance.breakHistory);
        if (currentAttendance.breakDurationMinutes) {
          setBreakDuration(currentAttendance.breakDurationMinutes);
          setBreakStatus('completed');
        }
      }
    }
  }, [currentAttendance]);

  const canStartBreak = () => {
    // Can start break if checked in and no active break
    return currentAttendance?.checkInTime && !currentAttendance?.checkOutTime && breakStatus !== 'active';
  };

  const canEndBreak = () => {
    return breakStatus === 'active';
  };

  const handleStartBreak = async () => {
    if (!canStartBreak()) {
      setError('You must check in before starting a break');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await API.post(ATTENDANCE_ENDPOINTS.breakStart, {});
      
      setBreakStartTime(response.data?.breakStartTime || new Date());
      setBreakStatus('active');
      setBreakDuration(0);
      setSuccess(true);
      
      onSuccess?.();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start break');
    } finally {
      setLoading(false);
    }
  };

  const handleEndBreak = async () => {
    if (!canEndBreak()) {
      setError('No active break to end');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await API.post(ATTENDANCE_ENDPOINTS.breakEnd, {});
      
      setBreakStatus('completed');
      setBreakDuration(response.data?.durationMinutes || breakDuration);
      
      // Add to break history
      if (response.data?.breakRecord) {
        setBreakHistory([...breakHistory, response.data.breakRecord]);
      }
      
      setSuccess(true);
      onSuccess?.();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to end break');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '--:--';
    const date = new Date(timeStr);
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <FiClock className="text-blue-600" size={24} />
          Break Management
        </h3>
        {breakStatus === 'active' && (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">
            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            Break Active
          </span>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <FiAlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <FiCheck className="text-green-600" size={18} />
          <p className="text-sm text-green-700 font-medium">
            Break {breakStatus === 'active' ? 'started' : 'ended'} successfully
          </p>
        </div>
      )}

      {/* Check-in Status */}
      {!currentAttendance?.checkInTime ? (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700 font-medium">
            <FiAlertCircle className="inline mr-2" size={16} />
            Please check in before starting a break
          </p>
        </div>
      ) : currentAttendance?.checkOutTime ? (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-700 font-medium">
            <FiAlertCircle className="inline mr-2" size={16} />
            You have already checked out
          </p>
        </div>
      ) : null}

      {/* Current Break Status */}
      <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <p className="text-xs text-slate-600 font-medium mb-3">Current Break Session</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-500 mb-1">Status</p>
            <p className="text-sm font-bold text-slate-900">
              {breakStatus === 'active' ? '🔴 Active' : breakStatus === 'completed' ? '✅ Completed' : '⚪ Not Started'}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Duration</p>
            <p className="text-sm font-bold text-slate-900">
              {breakStatus === 'active' ? formatDuration(breakDuration) : formatDuration(breakDuration) || '--'}
            </p>
          </div>
        </div>
      </div>

      {/* Start/End Break Buttons */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={handleStartBreak}
          disabled={loading || !canStartBreak()}
          className="flex-1 px-4 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading && breakStatus !== 'active' ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Starting...
            </>
          ) : (
            <>
              <FiPlay size={18} />
              Start Break
            </>
          )}
        </button>
        <button
          onClick={handleEndBreak}
          disabled={loading || !canEndBreak()}
          className="flex-1 px-4 py-3 rounded-lg bg-orange-600 text-white font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading && breakStatus === 'active' ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Ending...
            </>
          ) : (
            <>
              <FiSquare size={18} />
              End Break
            </>
          )}
        </button>
      </div>

      {/* Break History */}
      {breakHistory.length > 0 && (
        <div className="border-t border-slate-200 pt-6">
          <h4 className="text-sm font-bold text-slate-900 mb-3">Break History</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {breakHistory.map((brk, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <p className="text-xs text-slate-600 font-medium">Break {idx + 1}</p>
                  <p className="text-xs text-slate-500">
                    {formatTime(brk.startTime)} - {formatTime(brk.endTime)}
                  </p>
                </div>
                <span className="text-sm font-semibold text-slate-900 px-2 py-1 bg-white rounded border border-slate-300">
                  {formatDuration(brk.durationMinutes)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-6 p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
        <p className="font-medium">💡 Note:</p>
        <p className="mt-1">
          Track your break times accurately. Break duration is automatically calculated and recorded in your attendance.
        </p>
      </div>
    </div>
  );
};

export default BreakTrackingPanel;
