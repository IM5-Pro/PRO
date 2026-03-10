/**
 * AttendanceSheet Component
 * Displays attendance calendar with shifts, weekly offs, and time entries
 * Features: Monthly calendar view, shift tracking, hours logged, view options
 */

import React, { useState } from 'react';
import { FiChevronLeft, FiChevronRight, FiRefreshCw } from 'react-icons/fi';

const AttendanceSheet = () => {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 10)); // March 10, 2026
  const [viewType, setViewType] = useState('month'); // month, week, day

  // Mock attendance data
  const attendanceData = {
    1: { shift: 'Day Shift8:00-20:00', offType: null },
    2: { shift: 'Day Shift8:00-20:00', timeEntry: '12:269 hours 56 minutes', offType: null },
    3: { shift: 'Day Shift8:00-20:00', timeEntry: '11:198 hours 44 minutes', offType: null },
    4: { shift: 'Day Shift8:00-20:00', timeEntry: '10:397 hours 56 minutes', offType: null },
    5: { shift: 'Day Shift8:00-20:00', timeEntry: '10:417 hours 29 minutes', offType: null },
    6: { shift: 'Day Shift8:00-20:00', timeEntry: '12:378 hours 38 minutes', offType: null },
    7: { offType: 'Weekly Off' },
    8: { shift: 'Day Shift8:00-20:00', offType: null },
    9: { shift: 'Day Shift8:00-20:00', timeEntry: '11:437 hours 41 minutes', offType: null },
    10: { shift: 'Day Shift8:00-20:00', timeEntry: '11:192 hours 45 minutes', breakTime: '11:25a' },
    11: { shift: 'Day Shift8:00-20:00', offType: null },
    12: { shift: 'Day Shift8:00-20:00', offType: null },
    13: { shift: 'Day Shift8:00-20:00', offType: null },
    14: { offType: 'Weekly Off' },
    15: { shift: 'Day Shift8:00-20:00', offType: null },
    16: { shift: 'Day Shift8:00-20:00', offType: null },
    17: { shift: 'Day Shift8:00-20:00', offType: null },
    18: { shift: 'Day Shift8:00-20:00', offType: null },
    19: { shift: 'Day Shift8:00-20:00', offType: null },
    20: { shift: 'Day Shift8:00-20:00', offType: null },
    21: { offType: 'Weekly Off' },
    22: { shift: 'Day Shift8:00-20:00', offType: null },
    23: { shift: 'Day Shift8:00-20:00', offType: null },
    24: { shift: 'Day Shift8:00-20:00', offType: null },
    25: { shift: 'Day Shift8:00-20:00', offType: null },
    26: { shift: 'Day Shift8:00-20:00', offType: null },
    27: { shift: 'Day Shift8:00-20:00', offType: null },
    28: { offType: 'Weekly Off' },
    29: { shift: 'Day Shift8:00-20:00', offType: null },
    30: { shift: 'Day Shift8:00-20:00', offType: null },
    31: { shift: 'Day Shift8:00-20:00', offType: null },
  };

  // Get calendar days
  const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days = [];

  // Add empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  // Add days of month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  // Navigation
  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date(2026, 2, 10));
  };

  // Day cell rendering
  const DayCell = ({ day }) => {
    if (!day) return <div className="bg-gray-50 p-2 min-h-32"></div>;

    const data = attendanceData[day] || {};
    const isToday = day === 10;
    const isWeekend = [0, 6].includes(new Date(currentDate.getFullYear(), currentDate.getMonth(), day).getDay());

    return (
      <div className={`border p-2 min-h-32 ${isToday ? 'bg-blue-50 border-blue-300 border-2' : 'bg-white border-gray-200'}`}>
        <div className={`text-lg font-semibold mb-2 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
          {day}
        </div>

        <div className="space-y-1 text-xs">
          {/* Shift Info */}
          {data.shift && (
            <div className="bg-amber-700 text-white px-2 py-1 rounded font-medium">
              {data.shift}
            </div>
          )}

          {/* Time Entry */}
          {data.timeEntry && (
            <div className="bg-blue-500 text-white px-2 py-1 rounded">
              {data.timeEntry}
            </div>
          )}

          {/* Break Time */}
          {data.breakTime && (
            <div className="bg-lime-400 text-gray-700 px-2 py-1 rounded">
              {data.breakTime}
            </div>
          )}

          {/* Weekly Off */}
          {data.offType && (
            <div className="bg-red-500 text-white px-2 py-1 rounded font-medium">
              {data.offType}
            </div>
          )}
        </div>
      </div>
    );
  };

  const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="w-full bg-white rounded-xl shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {/* Navigation Buttons */}
          <button
            onClick={previousMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Previous month"
          >
            <FiChevronLeft size={20} className="text-gray-600" />
          </button>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Next month"
          >
            <FiChevronRight size={20} className="text-gray-600" />
          </button>
          <button
            onClick={goToToday}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium"
          >
            today
          </button>
        </div>

        {/* Month/Year Display */}
        <h2 className="text-2xl font-bold text-gray-800">{monthYear}</h2>

        <div className="flex items-center gap-3">
          {/* View Options */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewType('month')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                viewType === 'month'
                  ? 'bg-blue-100 text-blue-600 border-2 border-blue-600'
                  : 'bg-gray-100 text-gray-600 border-2 border-gray-300 hover:border-blue-300'
              }`}
            >
              month
            </button>
            <button
              onClick={() => setViewType('week')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                viewType === 'week'
                  ? 'bg-blue-100 text-blue-600 border-2 border-blue-600'
                  : 'bg-gray-100 text-gray-600 border-2 border-gray-300 hover:border-blue-300'
              }`}
            >
              week
            </button>
            <button
              onClick={() => setViewType('day')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                viewType === 'day'
                  ? 'bg-blue-100 text-blue-600 border-2 border-blue-600'
                  : 'bg-gray-100 text-gray-600 border-2 border-gray-300 hover:border-blue-300'
              }`}
            >
              day
            </button>
          </div>

          {/* Sync Button */}
          <button className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            <FiRefreshCw size={18} />
            Sync Attendance
          </button>
        </div>
      </div>

      {/* Calendar */}
      {viewType === 'month' && (
        <div>
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-0 mb-0 bg-blue-600 rounded-t-lg overflow-hidden">
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => (
              <div key={day} className="bg-blue-600 text-white font-bold p-4 text-center">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-0 border border-gray-200">
            {days.map((day, idx) => (
              <div key={idx} className="border-r border-b border-gray-200 last:border-r-0">
                <DayCell day={day} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-6 pt-6 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-amber-700 rounded"></div>
          <span className="text-sm text-gray-600">Shift</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span className="text-sm text-gray-600">Hours Logged</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span className="text-sm text-gray-600">Weekly Off</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-lime-400 rounded"></div>
          <span className="text-sm text-gray-600">Break Time</span>
        </div>
      </div>
    </div>
  );
};

export default AttendanceSheet;
