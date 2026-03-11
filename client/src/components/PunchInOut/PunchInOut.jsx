/**
 * PunchInOut Component
 * Attendance punch in/out interface
 * Shows current time, punch status, and allows users to punch in/out
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiClock, FiPlay, FiSquare, FiSkipForward } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

/**
 * PunchInOut Component
 * Main attendance interface after login
 * @returns {JSX.Element} - Punch in/out UI
 */
const PunchInOut = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isPunchedIn, setIsPunchedIn] = useState(false);
  const [punchInTime, setPunchInTime] = useState(null);
  const [dailyWorkingHours, setDailyWorkingHours] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Load daily working hours on component mount
  useEffect(() => {
    const storedDailyHours = localStorage.getItem('dailyWorkingHours');
    if (storedDailyHours) {
      setDailyWorkingHours(parseFloat(storedDailyHours));
    }
  }, []);

  /**
   * Handle punch in action
   */
  const handlePunchIn = async () => {
    setIsLoading(true);
    try {
      const now = new Date();
      setPunchInTime(now);
      setIsPunchedIn(true);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Store in localStorage for persistence
      localStorage.setItem('punchInTime', now.toISOString());
      localStorage.setItem('isPunchedIn', 'true');
      localStorage.setItem('hasPunchedInToday', 'true');

      // Navigate to dashboard after punch in
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (error) {
      console.error('Punch in failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle punch out action
   */
  const handlePunchOut = async () => {
    setIsLoading(true);
    try {
      const punchOutTime = new Date();
      setIsPunchedIn(false);

      // Calculate session hours and add to daily total
      if (punchInTime) {
        const sessionHours = (punchOutTime - punchInTime) / (1000 * 60 * 60);
        const newDailyTotal = dailyWorkingHours + sessionHours;
        setDailyWorkingHours(newDailyTotal);

        // Store updated daily hours
        localStorage.setItem('dailyWorkingHours', newDailyTotal.toString());
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Clear session data but keep daily total
      localStorage.removeItem('punchInTime');
      localStorage.removeItem('isPunchedIn');

      // Navigate to dashboard after punch out
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (error) {
      console.error('Punch out failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle skip action - go directly to dashboard
   */
  const handleSkip = () => {
    navigate('/dashboard');
  };

  // Check if already punched in on component mount
  useEffect(() => {
    const storedPunchInTime = localStorage.getItem('punchInTime');
    const storedIsPunchedIn = localStorage.getItem('isPunchedIn');
    const storedDailyHours = localStorage.getItem('dailyWorkingHours');

    if (storedPunchInTime && storedIsPunchedIn === 'true') {
      setPunchInTime(new Date(storedPunchInTime));
      setIsPunchedIn(true);
    }

    if (storedDailyHours) {
      setDailyWorkingHours(parseFloat(storedDailyHours));
    }
  }, []);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white text-center">
          <h1 className="text-2xl font-bold mb-2">Welcome back, {user?.name || 'User'}!</h1>
          <p className="text-blue-100">Please punch in to start your workday</p>
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
              {isPunchedIn ? 'Currently Working' : 'Not Punched In'}
            </span>
          </div>

          {isPunchedIn && punchInTime && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="text-sm text-green-800">
                <strong>Punched In:</strong> {formatTime(punchInTime)}
              </div>
              <div className="text-sm text-green-800 mt-1">
                <strong>Current Session:</strong> {((currentTime - punchInTime) / (1000 * 60 * 60)).toFixed(2)} hrs
              </div>
              <div className="text-sm text-green-800 mt-1">
                <strong>Today's Total:</strong> {(dailyWorkingHours + (currentTime - punchInTime) / (1000 * 60 * 60)).toFixed(2)} hrs
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="px-6 pb-6 space-y-3">
          {!isPunchedIn ? (
            <button
              onClick={handlePunchIn}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <FiPlay size={20} />
              <span>{isLoading ? 'Punching In...' : 'Punch In'}</span>
            </button>
          ) : (
            <button
              onClick={handlePunchOut}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <FiSquare size={20} />
              <span>{isLoading ? 'Punching Out...' : 'Punch Out'}</span>
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