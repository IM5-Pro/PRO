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
  present: {
    label: 'Present',
    chipClass: 'bg-blue-100 text-blue-700',
    cardClass: 'bg-blue-50 border-blue-200',
  },
  absent: {
    label: 'Absent',
    chipClass: 'bg-red-100 text-red-700',
    cardClass: 'bg-red-50 border-red-200',
  },
  halfDay: {
    label: 'Half Day',
    chipClass: 'bg-yellow-100 text-yellow-700',
    cardClass: 'bg-yellow-50 border-yellow-200',
  },
  leave: {
    label: 'Leave',
    chipClass: 'bg-purple-100 text-purple-700',
    cardClass: 'bg-purple-50 border-purple-200',
  },
  empty: {
    label: 'No Data',
    chipClass: 'bg-gray-100 text-gray-700',
    cardClass: 'bg-gray-50 border-gray-200',
  },
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
   * Count attendance by status for selected member
   * @param {string} statusKey - Attendance status key
   * @returns {number} Count of selected status
   */
  const getStatusCount = (statusKey) => {
    const calendarArray = Array.isArray(validSelectedMember?.calendar)
      ? validSelectedMember.calendar
      : [];
    return calendarArray.filter((day) => day === statusKey).length;
  };

  /**
   * Render calendar grid with attendance markers
   * Handles missing or invalid calendar data gracefully
   * 
   * @returns {JSX.Element} Calendar grid
   */
  const renderCalendarGrid = () => {
    const daysInMonth = getDaysInMonth();
    const firstDay = getFirstDayOfMonth();
    const days = [];
    const calendarData = validSelectedMember?.calendar || [];

    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div
          key={`empty-${i}`}
          className="h-16 rounded-xl border border-dashed border-gray-200 bg-gray-50"
          aria-hidden="true"
        />
      );
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dayIndex = day - 1;
      const status = calendarData[dayIndex] || 'empty';
      const statusInfo = ATTENDANCE_STATUS[status] || ATTENDANCE_STATUS.empty;

      days.push(
        <div
          key={day}
          className={`
            h-16 rounded-xl px-2 py-1.5 border flex flex-col justify-between
            transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5
            ${statusInfo?.cardClass || ATTENDANCE_STATUS.empty.cardClass}
          `}
          title={`${day} - ${statusInfo?.label || 'No Data'}`}
          role="gridcell"
          aria-label={`${day} - ${statusInfo?.label || 'No Data'}`}
        >
          <span className="text-xs font-bold text-gray-800">{day}</span>
          <span
            className={`inline-flex self-start px-1.5 py-0.5 rounded text-[10px] font-semibold ${statusInfo.chipClass}`}
          >
            {statusInfo.label}
          </span>
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
      <div className="flex flex-wrap gap-2">
        {Object.entries(ATTENDANCE_STATUS).map(([key, value]) => (
          key !== 'empty' && (
            <div key={key} className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded text-xs font-semibold ${value.chipClass}`}>
                {value.label}
              </span>
            </div>
          )
        ))}
      </div>
    );
  };

  return (
    <div className="card w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Team Schedule Planner</h2>
          <p className="text-xs text-gray-500 mt-1">Track team availability and attendance</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Previous month"
            aria-label="Previous month"
          >
            <FiChevronLeft size={18} className="text-gray-600" />
          </button>

          <span className="text-sm font-semibold text-gray-800 min-w-fit w-36 text-center">
            {getMonthYearString()}
          </span>

          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Next month"
            aria-label="Next month"
          >
            <FiChevronRight size={18} className="text-gray-600" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <aside className="xl:col-span-3 space-y-2">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Team Members</p>
          {teamMembers.map((member) => (
            <button
              key={member.id}
              onClick={() => onMemberSelect(member)}
              className={`
                w-full flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 text-left
                ${
                  selectedMember?.id === member.id
                    ? 'bg-blue-50 border-blue-300 shadow-sm'
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }
              `}
              title={member.name}
            >
              <span className="text-2xl">{member.avatar}</span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{member.name}</p>
                <p className="text-xs text-gray-600 truncate">{member.role}</p>
              </div>
            </button>
          ))}
        </aside>

        <section className="xl:col-span-9 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['present', 'absent', 'halfDay', 'leave'].map((statusKey) => (
              <div
                key={statusKey}
                className="rounded-xl border border-gray-200 bg-white p-3"
              >
                <p className="text-xs text-gray-600 mb-1">{ATTENDANCE_STATUS[statusKey].label}</p>
                <div className="flex items-center justify-between">
                  <p className="text-lg font-bold text-gray-800">{getStatusCount(statusKey)}</p>
                  <span className={`text-[10px] px-2 py-1 rounded font-semibold ${ATTENDANCE_STATUS[statusKey].chipClass}`}>
                    Days
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-gray-200 p-3 bg-white">
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center py-1">
                  <span className="text-xs font-semibold text-gray-600">{day}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {renderCalendarGrid()}
            </div>
          </div>

          <div className="pt-1">
            {renderLegend()}
          </div>
        </section>
      </div>
    </div>
  );
};

export default TeamScheduleCalendar;
