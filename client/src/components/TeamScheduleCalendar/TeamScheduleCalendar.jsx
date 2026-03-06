/**
 * TeamScheduleCalendar Component
 * Displays team member availability calendar with attendance markers
 * Features: Visual calendar grid, color-coded attendance status, interactive cell selection
 * 
 * @component
 * @example
 * <TeamScheduleCalendar 
 *   teamMembers={members}
 *   selectedMember={currentMember}
 * />
 */

import React, { useState } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

/**
 * Attendance status types and their colors
 * @type {Object}
 */
const ATTENDANCE_STATUS = {
  present: { label: 'Present', color: 'bg-blue-500', textColor: 'text-blue-700' },
  absent: { label: 'Absent', color: 'bg-red-500', textColor: 'text-red-700' },
  halfDay: { label: 'Half Day', color: 'bg-yellow-500', textColor: 'text-yellow-700' },
  leave: { label: 'Leave', color: 'bg-purple-500', textColor: 'text-purple-700' },
  empty: { label: 'No Data', color: 'bg-gray-200', textColor: 'text-gray-700' },
};

/**
 * Generate calendar data for a team member
 * Creates a month's worth of attendance records
 * 
 * @returns {Array<string>} Array of attendance status keys (30 days)
 */
const generateCalendarData = () => {
  const attendanceKeys = ['present', 'absent', 'halfDay', 'leave'];
  return Array.from({ length: 30 }, () => 
    attendanceKeys[Math.floor(Math.random() * attendanceKeys.length)]
  );
};

/**
 * Sample team members with calendar data
 * @type {Array}
 */
const TEAM_MEMBERS = [
  {
    id: 1,
    name: 'Alena Gouse',
    role: 'UI Designer - UID2',
    avatar: '👩‍💼',
    calendar: generateCalendarData(),
  },
  {
    id: 2,
    name: 'Miracle Vetrovs',
    role: 'UX Designer - UX03',
    avatar: '👩‍💼',
    calendar: generateCalendarData(),
  },
];

/**
 * TeamScheduleCalendar Component
 * Shows team member availability on a monthly calendar view
 * 
 * @param {Object} props - Component props
 * @param {Array} props.teamMembers - Array of team members
 * @param {Object} props.selectedMember - Currently selected team member
 * @param {Function} props.onMemberSelect - Callback when member is selected
 * @returns {JSX.Element} Team schedule calendar component
 */
const TeamScheduleCalendar = ({
  teamMembers = TEAM_MEMBERS,
  selectedMember = null,
  onMemberSelect = () => {},
}) => {
  /**
   * Ensure selected member has valid calendar data
   * If selectedMember doesn't have calendar, use first team member with calendar
   * @returns {Object} Valid team member with calendar data
   */
  const getValidSelectedMember = () => {
    // If selectedMember has calendar, return it
    if (selectedMember && Array.isArray(selectedMember.calendar)) {
      return selectedMember;
    }

    // Try to find a team member that has calendar data
    const memberWithCalendar = teamMembers?.find(
      (member) => Array.isArray(member.calendar)
    );

    if (memberWithCalendar) {
      return memberWithCalendar;
    }

    // If no team member has calendar, create one from selectedMember or use TEAM_MEMBERS default
    if (selectedMember) {
      return {
        ...selectedMember,
        calendar: generateCalendarData(),
      };
    }

    // Last resort: return first TEAM_MEMBERS default
    return TEAM_MEMBERS[0];
  };

  // Validated selected member with calendar data
  const validSelectedMember = getValidSelectedMember();

  // State for current month/year
  const [currentDate, setCurrentDate] = useState(new Date(2023, 8, 1)); // Sep 2023

  /**
   * Get days in current month
   * @returns {number} Number of days in month
   */
  const getDaysInMonth = () => {
    return new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  };

  /**
   * Get first day of week for month (0 = Sunday)
   * @returns {number} Day of week (0-6)
   */
  const getFirstDayOfMonth = () => {
    return new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  };

  /**
   * Navigate to previous month
   */
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  /**
   * Navigate to next month
   */
  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  /**
   * Get month and year display string
   * @returns {string} Formatted month and year
   */
  const getMonthYearString = () => {
    return currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  };

  /**
   * Render calendar grid with attendance markers
   * Handles missing or invalid calendar data gracefully
   * 
   * @returns {JSX.Element} Calendar grid
   */
  const renderCalendarGrid = () => {
    // validSelectedMember is already validated, so we can safely use it
    const daysInMonth = getDaysInMonth();
    const firstDay = getFirstDayOfMonth();
    const days = [];
    const calendarData = validSelectedMember?.calendar || [];

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div
          key={`empty-${i}`}
          className="aspect-square bg-gray-50 rounded-lg"
          aria-hidden="true"
        />
      );
    }

    // Add calendar days with validation
    for (let day = 1; day <= daysInMonth; day++) {
      const dayIndex = day - 1;
      // Get attendance status, default to 'empty' if not found
      const status = calendarData[dayIndex] || 'empty';
      const statusInfo = ATTENDANCE_STATUS[status] || ATTENDANCE_STATUS.empty;

      days.push(
        <div
          key={day}
          className={`
            aspect-square rounded-lg p-1 flex flex-col items-center justify-center
            cursor-pointer transition-all duration-200 hover:shadow-md
            border-2 border-transparent hover:border-gray-300
            ${statusInfo?.color || 'bg-gray-200'}
          `}
          title={`${day} - ${statusInfo?.label || 'No Data'}`}
          role="gridcell"
          aria-label={`${day} - ${statusInfo?.label || 'No Data'}`}
        >
          {/* Day number */}
          <span className="text-xs font-bold text-white">{day}</span>

          {/* Status indicator dot */}
          <div className="w-1 h-1 rounded-full bg-white mt-0.5 opacity-75" />
        </div>
      );
    }

    return days;
  };

  /**
   * Render legend for attendance status
   * @returns {JSX.Element} Legend items
   */
  const renderLegend = () => {
    return (
      <div className="flex flex-wrap gap-3 justify-center">
        {Object.entries(ATTENDANCE_STATUS).map(([key, value]) => (
          key !== 'empty' && (
            <div key={key} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded ${value.color}`} />
              <span className="text-xs text-gray-700">{value.label}</span>
            </div>
          )
        ))}
      </div>
    );
  };

  return (
    <div className="card w-full h-full flex flex-col">
      {/* Header with Month Navigation */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Team Schedule</h2>
          <p className="text-xs text-gray-500 mt-1">From 1-30 Sep, 2023</p>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            title="Previous month"
            aria-label="Previous month"
          >
            <FiChevronLeft size={18} className="text-gray-600" />
          </button>

          <span className="text-sm font-semibold text-gray-800 min-w-fit w-32 text-center">
            {getMonthYearString()}
          </span>

          <button
            onClick={handleNextMonth}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            title="Next month"
            aria-label="Next month"
          >
            <FiChevronRight size={18} className="text-gray-600" />
          </button>
        </div>
      </div>

      {/* Team Members List - Horizontal Scroll */}
      <div className="mb-6 overflow-x-auto pb-2 scrollbar-hide">
        <div className="flex gap-2 min-w-min">
          {teamMembers.map((member) => (
            <button
              key={member.id}
              onClick={() => onMemberSelect(member)}
              className={`
                flex flex-col items-center min-w-fit p-2 rounded-lg transition-all duration-200 flex-shrink-0
                ${
                  selectedMember?.id === member.id
                    ? 'bg-blue-100 border-2 border-blue-500'
                    : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                }
              `}
              title={member.name}
            >
              {/* Avatar */}
              <span className="text-2xl mb-1">{member.avatar}</span>

              {/* Name */}
              <p className="text-xs font-semibold text-gray-800 text-center max-w-16 truncate">
                {member.name.split(' ')[0]}
              </p>

              {/* Role */}
              <p className="text-xs text-gray-600 text-center max-w-16 truncate">
                {member.role.split(' ')[0]}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Calendar Grid - 7 days week */}
      <div className="flex-1 flex flex-col mb-4">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-2 mb-3">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div
              key={day}
              className="aspect-square flex items-center justify-center"
            >
              <span className="text-xs font-bold text-gray-600">{day}</span>
            </div>
          ))}
        </div>

        {/* Calendar days grid */}
        <div className="grid grid-cols-7 gap-2 flex-1">
          {renderCalendarGrid()}
        </div>
      </div>

      {/* Legend */}
      <div className="border-t border-gray-200 pt-4">
        {renderLegend()}
      </div>

      {/* Member Summary */}
      {validSelectedMember && validSelectedMember.name ? (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">{validSelectedMember.avatar || '👤'}</span>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-800">{validSelectedMember.name || 'Unknown'}</p>
              <p className="text-xs text-gray-600">{validSelectedMember.role || 'No role'}</p>

              {/* Quick stats */}
              <div className="flex gap-3 mt-2 flex-wrap">
                {Object.entries(ATTENDANCE_STATUS).map(([key, value]) => {
                  // Skip the 'empty' status
                  if (key === 'empty') return null;

                  // safely count attendance with validation
                  const calendarArray = Array.isArray(validSelectedMember.calendar) ? validSelectedMember.calendar : [];
                  const count = calendarArray.filter((day) => day === key).length;

                  return (
                    <div key={key} className="text-center">
                      <p className="text-xs text-gray-600">{value.label}</p>
                      <p className="text-sm font-bold text-gray-800">{count}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-4 pt-4 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-600">No member selected</p>
        </div>
      )}
    </div>
  );
};

export default TeamScheduleCalendar;
