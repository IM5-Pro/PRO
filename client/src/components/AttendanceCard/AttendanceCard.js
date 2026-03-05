/**
 * AttendanceCard Component
 * Displays attendance statistics
 */

import React from 'react';
import { FiCalendar, FiCheck, FiX, FiClock } from 'react-icons/fi';

/**
 * AttendanceCard Component - Shows attendance summary
 * @param {object} props - Component props
 * @param {number} props.present - Number of present days
 * @param {number} props.absent - Number of absent days
 * @param {number} props.late - Number of late arrivals
 * @param {string} props.percentage - Attendance percentage
 * @returns {JSX.Element} - AttendanceCard component
 */
const AttendanceCard = ({
  present = 18,
  absent = 2,
  late = 1,
  percentage = 90,
}) => {
  /**
   * Determine color based on attendance percentage
   * @param {number} percent - Attendance percentage
   * @returns {string} - Tailwind color classes
   */
  const getStatusColor = (percent) => {
    if (percent >= 90) return 'text-green-600 bg-green-50';
    if (percent >= 75) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  /**
   * Attendance stat item component
   */
  const StatItem = ({ icon: Icon, label, value, color }) => (
    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:shadow-md transition-shadow duration-200">
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-lg font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="card w-full max-w-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-800">Attendance</h2>
        <FiCalendar className="text-gray-400" size={20} />
      </div>

      {/* Attendance Percentage Circle */}
      <div className="flex justify-center mb-6">
        <div className="relative w-32 h-32 flex items-center justify-center">
          {/* Background circle */}
          <svg
            className="absolute w-full h-full transform -rotate-90"
            viewBox="0 0 100 100"
          >
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={percentage >= 90 ? '#10b981' : percentage >= 75 ? '#f59e0b' : '#ef4444'}
              strokeWidth="8"
              strokeDasharray={`${(percentage / 100) * 283} 283`}
            />
          </svg>
          {/* Percentage text */}
          <div className="text-center relative z-10">
            <p className={`text-3xl font-bold ${getStatusColor(percentage)}`}>
              {percentage}%
            </p>
            <p className="text-xs text-gray-500">This Month</p>
          </div>
        </div>
      </div>

      {/* Attendance Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <StatItem
          icon={FiCheck}
          label="Present"
          value={present}
          color="text-green-600 bg-green-50"
        />
        <StatItem
          icon={FiX}
          label="Absent"
          value={absent}
          color="text-red-600 bg-red-50"
        />
        <StatItem
          icon={FiClock}
          label="Late"
          value={late}
          color="text-yellow-600 bg-yellow-50"
        />
      </div>

      {/* Action Button */}
      <button className="w-full btn-primary text-sm">View Detailed Report</button>
    </div>
  );
};

export default AttendanceCard;
