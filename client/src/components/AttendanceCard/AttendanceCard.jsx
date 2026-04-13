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
  className = '',
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
    <div className="flex items-center space-x-4 p-4 bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-200">
      <div className={`w-10 h-10 flex items-center justify-center rounded-full shadow-sm ${color} text-xl`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-500 mb-0.5">{label}</p>
        <p className="text-xl font-extrabold text-slate-900" style={{ fontFamily: 'Inter, Roboto, sans-serif' }}>{value}</p>
      </div>
    </div>
  );

  return (
    <div className={`w-full max-w-sm bg-white rounded-2xl shadow-xl p-7 flex flex-col items-center ${className}`} style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      {/* Header */}
      <div className="flex items-center justify-between w-full mb-4">
        <h2 className="text-xl font-extrabold text-slate-800 tracking-tight" style={{ fontFamily: 'Inter, Roboto, sans-serif' }}>Attendance</h2>
        <span className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 shadow-sm">
          <FiCalendar size={20} />
        </span>
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
            <p className={`text-4xl font-extrabold ${getStatusColor(percentage)}`} style={{ fontFamily: 'Inter, Roboto, sans-serif' }}>
              {percentage}%
            </p>
            <p className="text-xs text-slate-500 font-medium">This Month</p>
          </div>
        </div>
      </div>

      {/* Attendance Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 w-full">
        <StatItem
          icon={FiCheck}
          label="Present"
          value={present}
          color="bg-green-100 text-green-600"
        />
        <StatItem
          icon={FiX}
          label="Absent"
          value={absent}
          color="bg-red-100 text-red-600"
        />
        <StatItem
          icon={FiClock}
          label="Late"
          value={late}
          color="bg-yellow-100 text-yellow-600"
        />
      </div>

      {/* Action Button */}
      <button className="w-full py-2 rounded-xl bg-blue-600 text-white font-semibold text-sm shadow hover:bg-blue-700 transition-all">View Detailed Report</button>
    </div>
  );
};

export default AttendanceCard;
