/**
 * PunchInOut Component
 * Attendance punch in/out interface
 * Shows current time, punch status, and allows users to punch in/out
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiClock, FiLogIn, FiLogOut, FiMapPin, FiSkipForward } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { setCookie } from '../../utils/cookies';
import { usePunch } from '../../context/PunchContext';

const PUNCHED_TODAY_COOKIE = 'hasPunchedInToday';
const PUNCH_DAY_COOKIE = 'punchDayKey';
const PUNCH_COOKIE_MAX_AGE = 24 * 60 * 60;

const getPunchDayKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
};

/**
 * PunchInOut Component
 * Main attendance interface after login
 * @returns {JSX.Element} - Punch in/out UI
 */
const PunchInOut = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    punchStatus,
    punchInTime,
    punchOutTime,
    punchInLocation,
    punchOutLocation,
    workingHours,
    attendanceStatus,
    locationLabel,
    locationLoading,
    loading,
    punchIn,
    punchOut,
  } = usePunch();

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handlePunchIn = async () => {
    setError(null);
    try {
      await punchIn();
      navigate('/');
    } catch (error) {
      setError(error?.response?.data?.message || 'Punch in failed.');
    }
  };

  const handlePunchOut = async () => {
    setError(null);
    try {
      await punchOut();
      navigate('/');
    } catch (error) {
      setError(error?.response?.data?.message || 'Punch out failed.');
    }
  };

  /**
   * Handle skip action - go directly to dashboard
   */
  const handleSkip = () => {
    // Mark that user has seen punch screen today to prevent forced redirect
    setCookie(PUNCHED_TODAY_COOKIE, 'true', PUNCH_COOKIE_MAX_AGE);
    setCookie(PUNCH_DAY_COOKIE, getPunchDayKey(), PUNCH_COOKIE_MAX_AGE);
    navigate('/');
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: true,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const statusText = useMemo(() => {
    if (punchStatus === 'in') return 'Currently Working';
    if (punchStatus === 'out') return 'Punched Out';
    return 'Not Punched In';
  }, [punchStatus]);

  return (
    <div className="app-punch-bg min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div
        className="max-w-md w-full bg-white rounded-2xl overflow-hidden"
        style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}
      >
        {/* Header */}
        <div className="bg-blue-600 p-6 text-white text-center">
          <h1 className="text-2xl font-bold mb-2">Welcome back, {user?.name || 'User'}!</h1>
          <p className="text-blue-50">Please confirm your attendance to start your workday</p>
        </div>

        {/* Time Display */}
        <div className="p-6 text-center bg-gray-50">
          <div className="text-4xl font-mono font-bold text-gray-800 mb-2">
            {formatTime(currentTime)}
          </div>
          <div className="text-sm text-gray-600">
            {formatDate(currentTime)}
          </div>
        </div>

        {/* Status */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <FiClock className="text-gray-400" size={20} />
            <span className="text-sm text-gray-600">
              {statusText}
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">Location</span>
              <span className="text-sm text-slate-800">
                {locationLoading ? 'Detecting...' : (locationLabel || 'Unknown')}
              </span>
            </div>
            {attendanceStatus && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">Status</span>
                <span className="text-sm font-semibold text-blue-700">{attendanceStatus}</span>
              </div>
            )}
            {punchInTime && (
              <div className="text-sm text-green-800">
                <strong>Punched In:</strong> {punchInTime}
              </div>
            )}
            {punchInLocation && (
              <div className="text-sm text-slate-600 flex items-center gap-2">
                <FiMapPin size={14} className="text-slate-400" />
                <span>{punchInLocation}</span>
              </div>
            )}
            {punchOutTime && (
              <div className="text-sm text-red-700">
                <strong>Punched Out:</strong> {punchOutTime}
              </div>
            )}
            {punchOutLocation && (
              <div className="text-sm text-slate-600 flex items-center gap-2">
                <FiMapPin size={14} className="text-slate-400" />
                <span>{punchOutLocation}</span>
              </div>
            )}
            {workingHours != null && (
              <div className="text-sm text-blue-700">
                <strong>Total Worked:</strong> {workingHours} hrs
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="px-6 pb-6 space-y-3">
          {punchStatus === 'in' ? (
            <button
              onClick={handlePunchOut}
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <FiLogOut size={20} />
              <span>{loading ? 'Punching Out...' : 'Punch Out'}</span>
            </button>
          ) : (
            <button
              onClick={handlePunchIn}
              disabled={loading || locationLoading}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <FiLogIn size={20} />
              <span>{loading ? 'Punching In...' : 'Punch In'}</span>
            </button>
          )}

          <button
            onClick={handleSkip}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <FiSkipForward size={20} />
            <span>Skip for Now</span>
          </button>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 text-center">
          <p className="text-xs text-gray-500">
            Your attendance will be automatically tracked
          </p>
        </div>
      </div>
    </div>
  );
};

export default PunchInOut;