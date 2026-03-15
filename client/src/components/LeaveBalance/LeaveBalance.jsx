/**
 * LeaveBalance Component
 * Displays leave balance information
 */

import React from 'react';
import { FiCalendar, FiSun, FiAlertCircle } from 'react-icons/fi';

/**
 * LeaveBalance Component - Shows leave balance details
 * @param {object} props - Component props
 * @param {number} props.totalLeaves - Total leaves available
 * @param {number} props.usedLeaves - Leaves already used
 * @param {number} props.sickLeaves - Sick leaves available
 * @param {number} props.casualLeaves - Casual leaves available
 * @returns {JSX.Element} - LeaveBalance component
 */
const LeaveBalance = ({
  totalLeaves = 20,
  usedLeaves = 5,
  sickLeaves = 5,
  casualLeaves = 15,
  className = '',
}) => {
  // Calculate remaining leaves
  const remainingLeaves = totalLeaves - usedLeaves;
  const usagePercentage = (usedLeaves / totalLeaves) * 100;

  /**
   * Leave type item component
   */
  const LeaveTypeItem = ({ icon: Icon, label, total, used, color }) => (
    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon size={18} />
          </div>
          <span className="text-sm font-semibold text-gray-800">{label}</span>
        </div>
      </div>
      <div className="flex justify-between">
        <p className="text-xs text-gray-600">
          <span className="font-bold text-gray-800">{used}</span> / {total} days
        </p>
        <p className="text-xs font-semibold text-gray-600">
          {Math.round(((used / total) * 100))}%
        </p>
      </div>
      {/* Progress bar */}
      <div className="mt-2 w-full bg-gray-300 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${color.replace('bg-', 'bg-')}`}
          style={{ width: `${(used / total) * 100}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className={`card w-full max-w-lg ${className}`}>
      {/* Header */}
      <h2 className="text-lg font-bold text-gray-800 mb-4">Leave Balance</h2>

      {/* Total Leave Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Total Remaining */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Remaining</p>
          <p className="text-2xl font-bold text-blue-600">{remainingLeaves}</p>
          <p className="text-xs text-gray-500">Days Left</p>
        </div>

        {/* Used Leaves */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Used</p>
          <p className="text-2xl font-bold text-orange-600">{usedLeaves}</p>
          <p className="text-xs text-gray-500">Days Used</p>
        </div>
      </div>

      {/* Usage Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm font-semibold text-gray-700">Annual Leave Usage</p>
          <span className="text-sm font-bold text-gray-600">{Math.round(usagePercentage)}%</span>
        </div>
        <div className="w-full bg-gray-300 rounded-full h-3 overflow-hidden">
          <div
            className="h-3 bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
            style={{ width: `${usagePercentage}%` }}
          />
        </div>
      </div>

      {/* Leave Types */}
      <div className="space-y-3 mb-6">
        <LeaveTypeItem
          icon={FiCalendar}
          label="Sick Leave"
          total={sickLeaves}
          used={2}
          color="bg-red-100 text-red-600"
        />
        <LeaveTypeItem
          icon={FiSun}
          label="Casual Leave"
          total={casualLeaves}
          used={3}
          color="bg-yellow-100 text-yellow-600"
        />
      </div>

      {/* Warning Message */}
      {remainingLeaves <= 5 && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start space-x-2">
          <FiAlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={16} />
          <p className="text-xs text-yellow-700">
            You have limited leaves remaining. Plan your vacation accordingly.
          </p>
        </div>
      )}

      {/* Action Button */}
      <button className="w-full btn-primary text-sm mt-4">Request New Leave</button>
    </div>
  );
};

export default LeaveBalance;
