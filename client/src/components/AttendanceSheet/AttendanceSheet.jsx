/**
 * AttendanceSheet Component
 * Displays attendance calendar with shifts, weekly offs, and time entries
 * Features: Monthly calendar view, shift tracking, hours logged, view options
 */

import React, { useState, useEffect } from 'react';
import { FiChevronLeft, FiChevronRight, FiRefreshCw } from 'react-icons/fi';
import API from '../../api/client';
import { ATTENDANCE_ENDPOINTS } from '../../api/endpoints';
import { getMonthDateRangeParams } from '../../utils/monthDateRange';
import { fetchOwnLeaveRequests } from '../../services/leavesAttendanceApi';

const AttendanceSheet = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState('month'); // month, week, day
  const [attendanceData, setAttendanceData] = useState({});
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Stats
  // const [stats, setStats] = useState({ present: 0, absent: 0, totalHours: 0, avgHours: 0 });

  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true);
      setError(null);
      // Avoid showing last month's cells under the new month's grid while the request runs
      setAttendanceData({});
      setLeaveRequests([]);
      try {
        const y = currentDate.getFullYear();
        const m = currentDate.getMonth();
        const { startDate, endDate } = getMonthDateRangeParams(y, m);

        const [attendanceRes, leaveRes] = await Promise.all([
          API.get(ATTENDANCE_ENDPOINTS.own(), {
            params: {
              startDate,
              endDate,
              limit: 62,
              page: 1,
            },
          }),
          fetchOwnLeaveRequests(),
        ]);

        const attendanceArr = attendanceRes.data?.attendance || [];
        const leaveArr = Array.isArray(leaveRes?.data) ? leaveRes.data : [];

        const leaveMap = {};
        leaveArr.forEach((request) => {
          if (!request?.startDate || !request?.endDate) return;
          const normalizedStatus = String(request.status || '').toLowerCase();
          if (!['approved', 'pending'].includes(normalizedStatus)) return;

          const start = new Date(request.startDate);
          const end = new Date(request.endDate);
          for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
            if (date.getFullYear() !== y || date.getMonth() !== m) continue;
            const day = date.getDate();
            const existing = leaveMap[day];
            if (!existing || (existing.status === 'pending' && normalizedStatus === 'approved')) {
              leaveMap[day] = request;
            }
          }
        });

        const calendarObj = {};
        attendanceArr.forEach((record) => {
          const d = new Date(record.attendanceDate);
          // Only map rows that belong to the visible month (safety if API returns extra rows)
          if (d.getFullYear() !== y || d.getMonth() !== m) return;
          const day = d.getDate();
          calendarObj[day] = {
            shift: record.shift ? `${record.shift.startTime}-${record.shift.endTime}` : null,
            timeEntry: record.workingHours ? `${record.workingHours.toFixed(2)} hours` : null,
            breakTime: record.breakDurationMinutes ? `${record.breakDurationMinutes} min break` : null,
            offType: record.status === 'Absent' ? 'Absent' : null,
            status: record.status,
          };
        });

        Object.entries(leaveMap).forEach(([dayKey, leaveRequest]) => {
          const day = Number(dayKey);
          const existing = calendarObj[day] || {};
          calendarObj[day] = {
            ...existing,
            leaveRequest,
            status: 'Leave',
            offType: leaveRequest.status === 'approved' ? 'Leave - Approved' : 'Leave - Applied',
            leaveType: leaveRequest.type,
          };
        });

        setAttendanceData(calendarObj);
        setLeaveRequests(leaveArr);
      } catch (err) {
        setError('Failed to load attendance');
        setAttendanceData({});
        setLeaveRequests([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, [currentDate]);

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
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Day cell rendering
  const DayCell = ({ day }) => {
    if (!day) return <div className="bg-gray-50 p-2 min-h-[8.5rem] rounded-xl border border-transparent" />;
    const data = attendanceData[day] || {};
    const isToday = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();
    const isWeekend = [0, 6].includes(new Date(currentDate.getFullYear(), currentDate.getMonth(), day).getDay());
    const defaultShift = 'Day Shift:08:00-20:00';
    const leaveRequest = data.leaveRequest;
    const leaveBadge = leaveRequest
      ? leaveRequest.status === 'approved'
        ? 'Approved Leave'
        : 'Applied Leave'
      : null;
    const badgeClass = leaveRequest
      ? leaveRequest.status === 'approved'
        ? 'bg-purple-600 text-white'
        : 'bg-indigo-600 text-white'
      : '';
    const shiftDisplay = leaveRequest ? null : (data.shift || defaultShift);
    const cellBase =
      leaveRequest
        ? 'bg-gradient-to-br from-violet-50 to-fuchsia-50 border border-violet-200'
        : isToday
          ? 'bg-gradient-to-br from-blue-100 to-blue-50 border-blue-400 border-2'
          : isWeekend
            ? 'bg-red-50 border border-red-200'
            : 'bg-white border border-gray-200';
    return (
      <div
        className={`flex min-h-[8.5rem] flex-col overflow-hidden rounded-xl p-2 shadow-sm transition-all duration-300 ${cellBase} hover:shadow-md`}
      >
        <div
          className={`mb-1 shrink-0 text-lg font-semibold leading-none ${leaveRequest ? 'text-violet-800' : isToday ? 'text-blue-700' : isWeekend ? 'text-red-800' : 'text-gray-700'}`}
        >
          {day}
        </div>
        <div className="min-h-0 flex-1 space-y-1 overflow-y-auto text-xs [overflow-wrap:anywhere]">
          {leaveRequest && (
            <div className={`rounded px-2 py-1 font-medium shadow-sm ${badgeClass}`}>{leaveBadge}</div>
          )}
          {leaveRequest && leaveRequest.type && (
            <div className="rounded bg-violet-100 px-2 py-1 text-violet-800 shadow-sm">{leaveRequest.type}</div>
          )}
          {shiftDisplay && (
            <div className="rounded bg-gradient-to-r from-red-700 to-yellow-700 px-2 py-1 font-medium text-white shadow-sm">{shiftDisplay}</div>
          )}
          {data.timeEntry && !leaveRequest && (
            <div className="rounded bg-gradient-to-r from-blue-500 to-blue-300 px-2 py-1 text-white shadow-sm">{data.timeEntry}</div>
          )}
          {data.breakTime && !leaveRequest && (
            <div className="rounded bg-gradient-to-r from-lime-400 to-green-200 px-2 py-1 text-gray-700 shadow-sm">{data.breakTime}</div>
          )}
          {data.offType && !leaveRequest && (
            <div className="rounded bg-gradient-to-r from-red-500 to-pink-400 px-2 py-1 font-medium text-white shadow-sm">{data.offType}</div>
          )}
        </div>
      </div>
    );
  };

  const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  return (
    <div className="w-full card animate-fadeInUp bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={previousMonth}
            className="p-3 hover:bg-blue-100 text-gray-600 hover:text-blue-700 rounded-xl transition-all transform hover:scale-110 active:scale-95 shadow-sm"
            title="Previous month"
          >
            <FiChevronLeft size={20} />
          </button>
          <button
            onClick={nextMonth}
            className="p-3 hover:bg-blue-100 text-gray-600 hover:text-blue-700 rounded-xl transition-all transform hover:scale-110 active:scale-95 shadow-sm"
            title="Next month"
          >
            <FiChevronRight size={20} />
          </button>
          <button
            onClick={goToToday}
            className="px-4 py-2 text-gray-600 hover:text-blue-700 hover:bg-blue-100 rounded-xl transition-all text-sm font-medium transform hover:scale-105 active:scale-95 shadow-sm"
          >
            today
          </button>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 tracking-tight drop-shadow-sm">{monthYear}</h2>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
          <div className="flex gap-2">
            <button
              onClick={() => setViewType('month')}
              className={`px-4 py-2 rounded-xl font-medium transition-all transform hover:scale-105 active:scale-95 ${viewType === 'month' ? 'bg-blue-700 text-white border-2 border-blue-500 shadow-lg shadow-blue-500/30' : 'bg-gray-100 text-gray-600 border-2 border-gray-300 hover:border-blue-400 hover:bg-gray-50'}`}
            >month</button>
            <button
              onClick={() => setViewType('week')}
              className={`px-4 py-2 rounded-xl font-medium transition-all transform hover:scale-105 active:scale-95 ${viewType === 'week' ? 'bg-blue-700 text-white border-2 border-blue-500 shadow-lg shadow-blue-500/30' : 'bg-gray-100 text-gray-600 border-2 border-gray-300 hover:border-blue-400 hover:bg-gray-50'}`}
            >week</button>
            <button
              onClick={() => setViewType('day')}
              className={`px-4 py-2 rounded-xl font-medium transition-all transform hover:scale-105 active:scale-95 ${viewType === 'day' ? 'bg-blue-700 text-white border-2 border-blue-500 shadow-lg shadow-blue-500/30' : 'bg-gray-100 text-gray-600 border-2 border-gray-300 hover:border-blue-400 hover:bg-gray-50'}`}
            >day</button>
          </div>
          <button className="btn-success flex items-center gap-2 animate-scaleUp rounded-xl shadow-sm">
            <FiRefreshCw size={18} className="animate-bounce-soft" />
            Sync Attendance
          </button>
        </div>
      </div>
      {/* Calendar */}
      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
      {loading ? (
        <div className="w-full text-center py-12 text-lg text-gray-500 animate-pulse">Loading attendance...</div>
      ) : viewType === 'month' && (
        <div className="animate-fadeInUp">
          <div className="grid grid-cols-7 gap-0 mb-0 header-blue overflow-hidden rounded-xl">
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => (
              <div key={day} className="bg-gradient-to-b from-blue-700 to-blue-500 text-white p-4 text-center text-sm font-semibold tracking-wide shadow-sm">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0 border border-gray-200 rounded-xl overflow-hidden">
            {days.map((day, idx) => (
              <div key={idx} className="border-r border-b border-gray-200 last:border-r-0 transition-all duration-300">
                <DayCell day={day} />
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Legend */}
      <div className={`mt-6 flex flex-wrap gap-6 pt-6 border-t border-gray-200 animate-slideInDown`}>
        <div className="flex items-center gap-2 hover:scale-110 transition-transform duration-300 cursor-pointer">
          <div className="w-4 h-4 bg-gradient-to-r from-amber-700 to-yellow-400 rounded shadow"></div>
          <span className="text-sm text-gray-600">Shift</span>
        </div>
        <div className="flex items-center gap-2 hover:scale-110 transition-transform duration-300 cursor-pointer">
          <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-blue-300 rounded shadow"></div>
          <span className="text-sm text-gray-600">Hours Logged</span>
        </div>
        <div className="flex items-center gap-2 hover:scale-110 transition-transform duration-300 cursor-pointer">
          <div className="w-4 h-4 bg-gradient-to-r from-red-500 to-pink-400 rounded shadow"></div>
          <span className="text-sm text-gray-600">Weekly Off</span>
        </div>
        <div className="flex items-center gap-2 hover:scale-110 transition-transform duration-300 cursor-pointer">
          <div className="w-4 h-4 bg-gradient-to-r from-lime-400 to-green-200 rounded shadow"></div>
          <span className="text-sm text-gray-600">Break Time</span>
        </div>
        <div className="flex items-center gap-2 hover:scale-110 transition-transform duration-300 cursor-pointer">
          <div className="w-4 h-4 bg-purple-600 rounded shadow"></div>
          <span className="text-sm text-gray-600">Approved Leave</span>
        </div>
        <div className="flex items-center gap-2 hover:scale-110 transition-transform duration-300 cursor-pointer">
          <div className="w-4 h-4 bg-indigo-600 rounded shadow"></div>
          <span className="text-sm text-gray-600">Applied Leave</span>
        </div>
      </div>
    </div>
  );
};

export default AttendanceSheet;
