/**
 * TimeTracker Component
 * Tracks work time with start/stop functionality
 */

import React, { useState, useEffect } from 'react';
import { FiPlay, FiPause, FiRotateCcw } from 'react-icons/fi';

/**
 * TimeTracker Component - Track employee work hours
 * @param {object} props - Component props
 * @returns {JSX.Element} - TimeTracker component
 */
const TimeTracker = () => {
  // State for time tracking
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);

  // Effect hook to manage timer
  useEffect(() => {
    let interval = null;

    if (isActive) {
      interval = setInterval(() => {
        setSeconds((seconds) => seconds + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }

    return () => clearInterval(interval);
  }, [isActive]);

  /**
   * Format seconds to HH:MM:SS format
   * @param {number} totalSeconds - Total seconds to format
   * @returns {string} - Formatted time string
   */
  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(
      secs
    ).padStart(2, '0')}`;
  };

  /**
   * Handle start/stop button click
   */
  const handleToggle = () => {
    setIsActive(!isActive);
  };

  /**
   * Reset the timer to zero
   */
  const handleReset = () => {
    setSeconds(0);
    setIsActive(false);
  };

  return (
    <div className="card w-full max-w-sm">
      {/* Header */}
      <h2 className="text-lg font-bold text-gray-800 mb-4">Time Tracker</h2>

      {/* Time Display */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 mb-4">
        <p className="text-center text-sm text-gray-600 mb-2">Total Work Time</p>
        <p className="text-center text-4xl font-bold text-blue-600 font-mono">
          {formatTime(seconds)}
        </p>
      </div>

      {/* Status Badge */}
      <div className="flex justify-center mb-6">
        <span
          className={`badge ${
            isActive
              ? 'badge-success'
              : seconds > 0
              ? 'badge-warning'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {isActive ? '⏱️ Active' : seconds > 0 ? '⏸️ Paused' : '⏵️ Not Started'}
        </span>
      </div>

      {/* Control Buttons */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={handleToggle}
          className={`flex-1 py-2 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center gap-2 ${
            isActive
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'btn-primary'
          }`}
          aria-label={isActive ? 'Pause tracking' : 'Start tracking'}
        >
          {isActive ? (
            <>
              <FiPause size={18} />
              Pause
            </>
          ) : (
            <>
              <FiPlay size={18} />
              Start
            </>
          )}
        </button>

        <button
          onClick={handleReset}
          className="px-4 py-2 btn-secondary flex items-center justify-center gap-2"
          aria-label="Reset timer"
        >
          <FiRotateCcw size={18} />
          Reset
        </button>
      </div>

      {/* Info Text */}
      <p className="text-xs text-gray-500 text-center">
        Track your daily work hours and productivity
      </p>
    </div>
  );
};

export default TimeTracker;
