/**
 * AttendanceSheet Component
 * Displays attendance calendar with shifts, weekly offs, and time entries
 * Features: Monthly calendar view, shift tracking, hours logged, view options
 */

import React, { useState, useEffect } from 'react';
import { FiChevronLeft, FiChevronRight, FiRefreshCw, FiX, FiClock } from 'react-icons/fi';
import API from '../../api/client';
import { ATTENDANCE_ENDPOINTS } from '../../api/endpoints';
import { getMonthDateRangeParams } from '../../utils/monthDateRange';
import { fetchOwnLeaveRequests } from '../../services/leavesAttendanceApi';

const HOLIDAYS_DATA = [
  { occasion: "New Year Day", day: "Thursday", date: "01-01-2026", category: "Project Development", department: "Technical", division: "IT" },
  { occasion: "Makara Sankranthi", day: "Wednesday", date: "14-01-2026", category: "Project Development", department: "Technical", division: "IT" },
  { occasion: "Republic Day", day: "Monday", date: "26-01-2026", category: "Project Development", department: "Technical", division: "IT" },
  { occasion: "Presidents' Day (USA)", day: "Monday", date: "16-02-2026", category: "Project Development", department: "Technical", division: "IT" },
  { occasion: "May Day", day: "Friday", date: "01-05-2026", category: "Project Development", department: "Technical", division: "IT" },
  { occasion: "Memorial day (USA)", day: "Monday", date: "25-05-2026", category: "Project Development", department: "Technical", division: "IT" },
  { occasion: "Bakrid / EID AI Adha", day: "Wednesday", date: "27-05-2026", category: "Project Development", department: "Technical", division: "IT" },
  { occasion: "Telangana Formation Day", day: "Tuesday", date: "02-06-2026", category: "Project Development", department: "Technical", division: "IT" },
  { occasion: "Juneteenth", day: "Friday", date: "19-06-2026", category: "Project Development", department: "Technical", division: "IT" },
  { occasion: "Independence Day – (USA)", day: "Friday", date: "03-07-2026", category: "Project Development", department: "Technical", division: "IT" },
  { occasion: "Labor Day - USA", day: "Monday", date: "07-09-2026", category: "Project Development", department: "Technical", division: "IT" },
  { occasion: "Ganesh Chaturthi", day: "Monday", date: "14-09-2026", category: "Project Development", department: "Technical", division: "IT" },
  { occasion: "Mahatma Gandhi Jayanthi/Vijayadashami", day: "Friday", date: "02-10-2026", category: "Project Development", department: "Technical", division: "IT" },
  { occasion: "Dussehra", day: "Tuesday", date: "20-10-2026", category: "Project Development", department: "Technical", division: "IT" },
  { occasion: "Thanksgiving Day", day: "Thursday", date: "26-11-2026", category: "Project Development", department: "Technical", division: "IT" },
  { occasion: "Day after Thanksgiving Day", day: "Friday", date: "27-11-2026", category: "Project Development", department: "Technical", division: "IT" },
  { occasion: "Christmas", day: "Friday", date: "25-12-2026", category: "All", department: "All", division: "All" },
];

const AttendanceSheet = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState('month'); // month, week, day
  const [attendanceData, setAttendanceData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Modal state for adding attendance
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDateForAdd, setSelectedDateForAdd] = useState(null);
  const [isSubmittingAttendance, setIsSubmittingAttendance] = useState(false);

  // Stats
  // const [stats, setStats] = useState({ present: 0, absent: 0, totalHours: 0, avgHours: 0 });

  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true);
      setError(null);
      // Avoid showing last month's cells under the new month's grid while the request runs
      setAttendanceData({});
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
        const holidayArr = HOLIDAYS_DATA;

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

        const holidayMap = {};
        holidayArr.forEach((holiday) => {
          if (!holiday?.date) return;
          const dateStr = holiday.date; // e.g., "01-01-2026"
          const [dayStr, monthStr, yearStr] = dateStr.split('-');
          const holidayDate = new Date(parseInt(yearStr), parseInt(monthStr) - 1, parseInt(dayStr));
          if (holidayDate.getFullYear() === y && holidayDate.getMonth() === m) {
            const day = holidayDate.getDate();
            holidayMap[day] = holiday;
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

        Object.entries(holidayMap).forEach(([dayKey, holiday]) => {
          const day = Number(dayKey);
          const existing = calendarObj[day] || {};
          calendarObj[day] = {
            ...existing,
            holiday,
            status: 'Holiday',
            offType: 'Holiday',
            holidayName: holiday.occasion,
          };
        });

        setAttendanceData(calendarObj);
      } catch (err) {
        setError('Failed to load attendance');
        setAttendanceData({});
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, [currentDate]);

  // Handle date click to open add attendance modal
  const handleDateClick = (day) => {
    const selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDateForAdd(selectedDate);
    setShowAddModal(true);
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
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Handle add attendance submission
  const handleAddAttendance = async (date, formData) => {
    setIsSubmittingAttendance(true);
    try {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const attendanceDate = `${year}-${month}-${day}`;

      // Convert times to full datetime
      const [checkInHour, checkInMin] = formData.checkInTime.split(':');
      const [checkOutHour, checkOutMin] = formData.checkOutTime.split(':');

      const checkInDateTime = new Date(attendanceDate);
      checkInDateTime.setHours(parseInt(checkInHour), parseInt(checkInMin), 0);

      const checkOutDateTime = new Date(attendanceDate);
      checkOutDateTime.setHours(parseInt(checkOutHour), parseInt(checkOutMin), 0);

      const payload = {
        attendanceDate,
        checkInTime: checkInDateTime.toISOString(),
        checkOutTime: checkOutDateTime.toISOString(),
        breakDurationMinutes: parseInt(formData.breakDuration) || 0,
        remarks: formData.notes || '',
      };

      // Call API to create attendance
      await API.post(ATTENDANCE_ENDPOINTS.manual, payload);

      setShowAddModal(false);
      setError(null);
      
      // Refresh attendance data
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
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          if (d.getFullYear() !== y || d.getMonth() !== m) continue;
          const dayNum = d.getDate();
          const existing = leaveMap[dayNum];
          if (!existing || (existing.status === 'pending' && normalizedStatus === 'approved')) {
            leaveMap[dayNum] = request;
          }
        }
      });

      const calendarObj = {};
      attendanceArr.forEach((record) => {
        const d = new Date(record.attendanceDate);
        if (d.getFullYear() !== y || d.getMonth() !== m) return;
        const dayNum = d.getDate();
        calendarObj[dayNum] = {
          shift: record.shift ? `${record.shift.startTime}-${record.shift.endTime}` : null,
          timeEntry: record.workingHours ? `${record.workingHours.toFixed(2)} hours` : null,
          breakTime: record.breakDurationMinutes ? `${record.breakDurationMinutes} min break` : null,
          offType: record.status === 'Absent' ? 'Absent' : null,
          status: record.status,
        };
      });

      Object.entries(leaveMap).forEach(([dayKey, leaveRequest]) => {
        const dayNum = Number(dayKey);
        const existing = calendarObj[dayNum] || {};
        calendarObj[dayNum] = {
          ...existing,
          leaveRequest,
          status: 'Leave',
          offType: leaveRequest.status === 'approved' ? 'Leave - Approved' : 'Leave - Applied',
          leaveType: leaveRequest.type,
        };
      });

      setAttendanceData(calendarObj);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to add attendance');
      console.error('Error adding attendance:', err);
    } finally {
      setIsSubmittingAttendance(false);
    }
  };

  // Day cell rendering
  const DayCell = ({ day, onDateClick }) => {
    if (!day) return <div className="bg-gray-50 p-2 min-h-[8.5rem] rounded-xl border border-transparent" />;
    const data = attendanceData[day] || {};
    const isToday = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();
    const isWeekend = [0, 6].includes(new Date(currentDate.getFullYear(), currentDate.getMonth(), day).getDay());
    const defaultShift = 'Day Shift:08:00-20:00';
    const leaveRequest = data.leaveRequest;
    const holiday = data.holiday;
    const hasAttendance = data.status && !leaveRequest && !holiday;
    const hasBothLeaveAndAttendance = leaveRequest && (data.timeEntry || data.offType);
    
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
    
    const shiftDisplay = holiday ? null : (data.shift || (hasAttendance ? defaultShift : null));
    
    // Adjust background when both leave and attendance exist
    const cellBase =
      holiday
        ? 'bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200'
        : hasBothLeaveAndAttendance
          ? 'bg-gradient-to-br from-violet-50 via-blue-50 to-fuchsia-50 border border-violet-300'
          : leaveRequest
            ? 'bg-gradient-to-br from-violet-50 to-fuchsia-50 border border-violet-200'
            : isToday
              ? 'bg-gradient-to-br from-blue-100 to-blue-50 border-blue-400 border-2'
              : isWeekend
                ? 'bg-red-50 border border-red-200'
                : 'bg-white border border-gray-200';
    
    return (
      <div
        onClick={() => onDateClick?.(day)}
        className={`flex min-h-[8.5rem] flex-col overflow-hidden rounded-xl p-2 shadow-sm transition-all duration-300 ${cellBase} hover:shadow-lg hover:bg-opacity-80 cursor-pointer active:scale-95`}
      >
        <div
          className={`mb-1 shrink-0 text-lg font-semibold leading-none ${holiday ? 'text-green-800' : hasBothLeaveAndAttendance ? 'text-violet-700' : leaveRequest ? 'text-violet-800' : isToday ? 'text-blue-700' : isWeekend ? 'text-red-800' : 'text-gray-700'}`}
        >
          {day}
        </div>
        <div className="min-h-0 flex-1 space-y-1 overflow-y-auto text-xs [overflow-wrap:anywhere]">
          {holiday && (
            <div className="rounded bg-green-600 px-2 py-1 font-medium text-white shadow-sm">Holiday</div>
          )}
          {holiday && holiday.occasion && (
            <div className="rounded bg-green-100 px-2 py-1 text-green-800 shadow-sm">{holiday.occasion}</div>
          )}
          {leaveRequest && (
            <div className={`rounded px-2 py-1 font-medium shadow-sm ${badgeClass}`}>{leaveBadge}</div>
          )}
          {leaveRequest && leaveRequest.type && (
            <div className="rounded bg-violet-100 px-2 py-1 text-violet-800 shadow-sm">{leaveRequest.type}</div>
          )}
          {shiftDisplay && (
            <div className="rounded bg-gradient-to-r from-red-700 to-yellow-700 px-2 py-1 font-medium text-white shadow-sm">{shiftDisplay}</div>
          )}
          {data.timeEntry && (
            <div className="rounded bg-gradient-to-r from-blue-500 to-blue-300 px-2 py-1 text-white shadow-sm font-semibold">{data.timeEntry}</div>
          )}
          {data.breakTime && (
            <div className="rounded bg-gradient-to-r from-lime-400 to-green-200 px-2 py-1 text-gray-700 shadow-sm">{data.breakTime}</div>
          )}
          {data.offType && !leaveRequest && !holiday && (
            <div className="rounded bg-gradient-to-r from-red-500 to-pink-400 px-2 py-1 font-medium text-white shadow-sm">{data.offType}</div>
          )}
          {hasBothLeaveAndAttendance && (
            <div className="rounded bg-blue-500 px-2 py-1 text-white shadow-sm text-center font-medium">📌 Both Leave & Attendance</div>
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
                <DayCell day={day} onDateClick={handleDateClick} />
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
          <div className="w-4 h-4 bg-gradient-to-r from-purple-600 to-blue-400 rounded shadow"></div>
          <span className="text-sm text-gray-600">Leave + Attendance</span>
        </div>
        <div className="flex items-center gap-2 hover:scale-110 transition-transform duration-300 cursor-pointer">
          <div className="w-4 h-4 bg-green-600 rounded shadow"></div>
          <span className="text-sm text-gray-600">Holiday</span>
        </div>
      </div>

      {/* Add Attendance Modal */}
      <AddAttendanceModal 
        isOpen={showAddModal}
        selectedDate={selectedDateForAdd}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddAttendance}
        isSubmitting={isSubmittingAttendance}
      />
    </div>
  );
};

// Modal component for adding attendance
const AddAttendanceModal = ({ isOpen, selectedDate, onClose, onSubmit, isSubmitting }) => {
  const [formData, setFormData] = useState({
    checkInTime: '09:00',
    checkOutTime: '18:00',
    breakDuration: '30',
    notes: '',
  });

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        checkInTime: '09:00',
        checkOutTime: '18:00',
        breakDuration: '30',
        notes: '',
      });
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedDate) {
      onSubmit(selectedDate, formData);
    }
  };

  if (!isOpen) return null;

  const dateStr = selectedDate ? new Date(selectedDate).toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }) : '';

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FiClock className="text-blue-600" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">Add Attendance</h2>
              <p className="text-sm text-gray-500">{dateStr}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiX size={24} className="text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Check-in Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Check-in Time
            </label>
            <div className="flex items-center gap-2">
              <FiClock size={18} className="text-gray-500" />
              <input
                type="time"
                name="checkInTime"
                value={formData.checkInTime}
                onChange={handleChange}
                required
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Check-out Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Check-out Time
            </label>
            <div className="flex items-center gap-2">
              <FiClock size={18} className="text-gray-500" />
              <input
                type="time"
                name="checkOutTime"
                value={formData.checkOutTime}
                onChange={handleChange}
                required
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Break Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Break Duration (minutes)
            </label>
            <input
              type="number"
              name="breakDuration"
              value={formData.breakDuration}
              onChange={handleChange}
              min="0"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (optional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              placeholder="Add any notes..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : 'Add Attendance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AttendanceSheet;
