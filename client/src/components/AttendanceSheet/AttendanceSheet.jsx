/**
 * AttendanceSheet Component
 * Displays attendance calendar with shifts, weekly offs, and time entries
 * Features: Monthly calendar view, shift tracking, hours logged, view options
 */

import React, { useState, useEffect, useContext, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FiChevronLeft, FiChevronRight, FiRefreshCw, FiX, FiClock, FiEdit } from 'react-icons/fi';
import API from '../../api/client';
import { ATTENDANCE_ENDPOINTS, SHIFT_ENDPOINTS } from '../../api/endpoints';
import { getMonthDateRangeParams } from '../../utils/monthDateRange';
import { fetchOwnLeaveRequests } from '../../services/leavesAttendanceApi';
import { AuthContext } from '../../context/AuthContext';

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

const buildLeaveMap = (leaveArr, y, m) => {
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
  return leaveMap;
};

const buildHolidayMap = (holidayArr, y, m) => {
  const holidayMap = {};
  holidayArr.forEach((holiday) => {
    if (!holiday?.date) return;
    const dateStr = holiday.date;
    const [dayStr, monthStr, yearStr] = dateStr.split('-');
    const holidayDate = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, parseInt(dayStr, 10));
    if (holidayDate.getFullYear() === y && holidayDate.getMonth() === m) {
      holidayMap[holidayDate.getDate()] = holiday;
    }
  });
  return holidayMap;
};

const mapAttendanceRecordToDay = (record) => ({
  shift: record.shift ? `${record.shift.startTime}-${record.shift.endTime}` : null,
  timeEntry: record.workingHours ? `${record.workingHours.toFixed(2)} hours` : null,
  offType: record.status === 'Absent' ? 'Absent' : null,
  status: record.status,
  isLossOfPay: record.isLossOfPay,
  isAutoMarked: record.isAutoMarked,
  lopReason: record.lopReason,
  requiresApproval: record.requiresManagerApproval,
  approvalStatus: record.approvalStatus,
  manuallyAdded: Boolean(record.manuallyAddedBy),
  isArchived: record.isArchived,
});

const buildCalendarObject = (attendanceArr, leaveArr, y, m, holidayArr = HOLIDAYS_DATA) => {
  const leaveMap = buildLeaveMap(leaveArr, y, m);
  const holidayMap = buildHolidayMap(holidayArr, y, m);
  const calendarObj = {};

  attendanceArr.forEach((record) => {
    const d = new Date(record.attendanceDate);
    if (d.getFullYear() !== y || d.getMonth() !== m) return;
    calendarObj[d.getDate()] = mapAttendanceRecordToDay(record);
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

  return calendarObj;
};

const AttendanceSheet = () => {
  const { user } = useContext(AuthContext);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [employeeShift, setEmployeeShift] = useState(null);
  
  // Modal state for adding attendance
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDateForAdd, setSelectedDateForAdd] = useState(null);
  const [isSubmittingAttendance, setIsSubmittingAttendance] = useState(false);

  // Modal state for editing shifts
  const [showEditShiftModal, setShowEditShiftModal] = useState(false);
  const [availableShifts, setAvailableShifts] = useState([]);

  // Sync and success state
  const [isSyncing, setIsSyncing] = useState(false);
  const [success, setSuccess] = useState(false);

  // Check if user has permission to edit shifts
  const canEditShifts = user?.role && ['SUPER_ADMIN', 'HR_ADMIN'].includes(user.role);

  // Fetch employee's current shift
  useEffect(() => {
    const fetchEmployeeShift = async () => {
      try {
        if (!user?.employee?._id) return;
        const response = await API.get(SHIFT_ENDPOINTS.getEmployeeShift(user.employee._id));
        setEmployeeShift(response.data?.data);
      } catch (err) {
        console.error('Error fetching employee shift:', err);
        // Set default shift if none found
        setEmployeeShift({ startTime: '09:00', endTime: '17:00', name: 'Day Shift' });
      }
    };

    fetchEmployeeShift();
  }, [user?.employee?._id]);

  // Fetch available shifts for shift selection modal
  useEffect(() => {
    const fetchAvailableShifts = async () => {
      try {
        if (!showEditShiftModal) return;
        const response = await API.get(SHIFT_ENDPOINTS.list(100));
        setAvailableShifts(response.data?.data?.shifts || []);
      } catch (err) {
        console.error('Error fetching available shifts:', err);
      }
    };

    fetchAvailableShifts();
  }, [showEditShiftModal]);

  // Stats
  // const [stats, setStats] = useState({ present: 0, absent: 0, totalHours: 0, avgHours: 0 });

  const fetchMonthAttendance = useCallback(async ({ showLoading = true } = {}) => {
    if (showLoading) {
      setLoading(true);
      setAttendanceData({});
    }
    setError(null);

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
      setAttendanceData(buildCalendarObject(attendanceArr, leaveArr, y, m));
    } catch (err) {
      setError('Failed to load attendance');
      if (showLoading) {
        setAttendanceData({});
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [currentDate]);

  useEffect(() => {
    fetchMonthAttendance();
  }, [fetchMonthAttendance]);

  useEffect(() => {
    const refreshIfVisible = () => {
      if (document.visibilityState === 'visible') {
        fetchMonthAttendance({ showLoading: false });
      }
    };

    window.addEventListener('focus', refreshIfVisible);
    document.addEventListener('visibilitychange', refreshIfVisible);

    const pollInterval = setInterval(refreshIfVisible, 30000);

    return () => {
      window.removeEventListener('focus', refreshIfVisible);
      document.removeEventListener('visibilitychange', refreshIfVisible);
      clearInterval(pollInterval);
    };
  }, [fetchMonthAttendance]);

  // Handle sync attendance - fetches latest punch data and updates calendar
  const handleSyncAttendance = async () => {
    setIsSyncing(true);
    setError(null);
    try {
      await API.post(ATTENDANCE_ENDPOINTS.sync);
      await fetchMonthAttendance({ showLoading: false });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to sync attendance');
      console.error('Error syncing attendance:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle date click to open add attendance modal
  const handleDateClick = (day) => {
    const selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDateForAdd(selectedDate);
    setShowAddModal(true);
  };

  const closeAddAttendanceModal = () => {
    if (isSubmittingAttendance) return;
    setShowAddModal(false);
    setSelectedDateForAdd(null);
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
        remarks: formData.notes || '',
      };

      // Call API to create attendance
      await API.post(ATTENDANCE_ENDPOINTS.manual, payload);

      setShowAddModal(false);
      setError(null);
      await fetchMonthAttendance({ showLoading: false });
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to add attendance');
      console.error('Error adding attendance:', err);
    } finally {
      setIsSubmittingAttendance(false);
    }
  };

  // Day cell rendering
  const DayCell = ({ day, onDateClick }) => {
    if (!day) return <div className="aspect-square min-w-0 rounded-xl border border-transparent bg-gray-50 p-1 sm:p-2" />;
    const data = attendanceData[day] || {};
    const isToday = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();
    const isWeekend = [0, 6].includes(new Date(currentDate.getFullYear(), currentDate.getMonth(), day).getDay());
    const shiftDisplay = employeeShift ? `${employeeShift.name}:${employeeShift.startTime}-${employeeShift.endTime}` : 'Day Shift:09:00-17:00';
    
    const leaveRequest = data.leaveRequest;
    const holiday = data.holiday;
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
        className={`flex aspect-square min-w-0 flex-col overflow-hidden rounded-xl p-1 shadow-sm transition-all duration-300 sm:p-2 ${cellBase} hover:shadow-lg hover:bg-opacity-80 cursor-pointer active:scale-95`}
      >
        <div
          className={`mb-1 shrink-0 text-sm font-semibold leading-none sm:text-lg ${holiday ? 'text-green-800' : hasBothLeaveAndAttendance ? 'text-violet-700' : leaveRequest ? 'text-violet-800' : isToday ? 'text-blue-700' : isWeekend ? 'text-red-800' : 'text-gray-700'}`}
        >
          {day}
        </div>
        <div className="min-h-0 flex-1 space-y-0.5 overflow-hidden text-[9px] sm:space-y-1 sm:text-xs">
          {shiftDisplay && (
            <div className="truncate rounded bg-gradient-to-r from-red-700 to-yellow-700 px-1 py-0.5 font-medium text-white shadow-sm sm:px-2 sm:py-1">{shiftDisplay}</div>
          )}
          {holiday && (
            <div className="truncate rounded bg-green-600 px-1 py-0.5 font-medium text-white shadow-sm sm:px-2 sm:py-1">Holiday</div>
          )}
          {holiday && holiday.occasion && (
            <div className="truncate rounded bg-green-100 px-1 py-0.5 text-green-800 shadow-sm sm:px-2 sm:py-1">{holiday.occasion}</div>
          )}
          {leaveRequest && (
            <div className={`truncate rounded px-1 py-0.5 font-medium shadow-sm sm:px-2 sm:py-1 ${badgeClass}`}>{leaveBadge}</div>
          )}
          {leaveRequest && leaveRequest.type && (
            <div className="truncate rounded bg-violet-100 px-1 py-0.5 text-violet-800 shadow-sm sm:px-2 sm:py-1">{leaveRequest.type}</div>
          )}
          {data.timeEntry && (
            <div className="truncate rounded bg-gradient-to-r from-blue-500 to-blue-300 px-1 py-0.5 font-semibold text-white shadow-sm sm:px-2 sm:py-1">{data.timeEntry}</div>
          )}
          {data.offType && !leaveRequest && !holiday && (
            <div className="truncate rounded bg-gradient-to-r from-red-500 to-pink-400 px-1 py-0.5 font-medium text-white shadow-sm sm:px-2 sm:py-1">{data.offType}</div>
          )}
          {data.isLossOfPay && (
            <div className="truncate rounded bg-gradient-to-r from-orange-600 to-red-600 px-1 py-0.5 font-medium text-white shadow-sm sm:px-2 sm:py-1">💼 LOP: {data.lopReason}</div>
          )}
          {data.isAutoMarked && (
            <div className="truncate rounded bg-gradient-to-r from-amber-500 to-yellow-500 px-1 py-0.5 text-white shadow-sm sm:px-2 sm:py-1">🤖 Auto</div>
          )}
          {data.approvalStatus === 'Pending' && (
            <div className="truncate rounded bg-gradient-to-r from-blue-600 to-cyan-600 px-1 py-0.5 font-medium text-white shadow-sm sm:px-2 sm:py-1">
              ⏳ Pending
            </div>
          )}
          {data.approvalStatus === 'Approved' && data.manuallyAdded && (
            <div className="truncate rounded bg-gradient-to-r from-green-600 to-emerald-500 px-1 py-0.5 font-medium text-white shadow-sm sm:px-2 sm:py-1">
              ✓ Approved
            </div>
          )}
          {data.approvalStatus === 'Rejected' && (
            <div className="truncate rounded bg-gradient-to-r from-red-600 to-rose-500 px-1 py-0.5 font-medium text-white shadow-sm sm:px-2 sm:py-1">
              ✗ Rejected
            </div>
          )}
          {hasBothLeaveAndAttendance && (
            <div className="truncate rounded bg-blue-500 px-1 py-0.5 text-center font-medium text-white shadow-sm sm:px-2 sm:py-1">📌 L&A</div>
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
          {canEditShifts && (
            <button 
              onClick={() => setShowEditShiftModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all text-sm font-medium transform hover:scale-105 active:scale-95 shadow-sm flex items-center gap-2"
              title="Edit employee shift"
            >
              <FiEdit size={16} />
              Edit Shift
            </button>
          )}
          <button 
            onClick={handleSyncAttendance}
            disabled={isSyncing}
            className="btn-success flex items-center gap-2 animate-scaleUp rounded-xl shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            title="Sync attendance from punch records"
          >
            <FiRefreshCw size={18} className={isSyncing ? 'animate-spin' : 'animate-bounce-soft'} />
            {isSyncing ? 'Syncing...' : 'Sync Attendance'}
          </button>
        </div>
      </div>
      {/* Calendar */}
      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
      {success && <div className="text-green-600 text-sm mb-4 font-medium">✓ Attendance synced successfully!</div>}
      {loading ? (
        <div className="w-full text-center py-12 text-lg text-gray-500 animate-pulse">Loading attendance...</div>
      ) : (
        <div className="animate-fadeInUp">
          <div className="grid min-w-0 grid-cols-7 gap-0 mb-0 header-blue overflow-hidden rounded-xl">
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => (
              <div key={day} className="truncate bg-gradient-to-b from-blue-700 to-blue-500 p-2 text-center text-[10px] font-semibold tracking-wide text-white shadow-sm sm:p-3 sm:text-sm">{day}</div>
            ))}
          </div>
          <div className="grid min-w-0 grid-cols-7 gap-0 overflow-hidden rounded-xl border border-gray-200">
            {days.map((day, idx) => (
              <div key={idx} className="min-w-0 border-r border-b border-gray-200 last:border-r-0 transition-all duration-300">
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
        <div className="flex items-center gap-2 hover:scale-110 transition-transform duration-300 cursor-pointer">
          <div className="w-4 h-4 bg-gradient-to-r from-orange-600 to-red-600 rounded shadow"></div>
          <span className="text-sm text-gray-600">Loss of Pay (LOP)</span>
        </div>
        <div className="flex items-center gap-2 hover:scale-110 transition-transform duration-300 cursor-pointer">
          <div className="w-4 h-4 bg-gradient-to-r from-amber-500 to-yellow-500 rounded shadow"></div>
          <span className="text-sm text-gray-600">Auto-marked</span>
        </div>
        <div className="flex items-center gap-2 hover:scale-110 transition-transform duration-300 cursor-pointer">
          <div className="w-4 h-4 bg-gradient-to-r from-blue-600 to-cyan-600 rounded shadow"></div>
          <span className="text-sm text-gray-600">Pending Approval</span>
        </div>
      </div>

      {/* Add Attendance Modal */}
      <AddAttendanceModal 
        isOpen={showAddModal}
        selectedDate={selectedDateForAdd}
        onClose={closeAddAttendanceModal}
        onSubmit={handleAddAttendance}
        isSubmitting={isSubmittingAttendance}
      />
      
      {/* Edit Shift Modal */}
      <ShiftEditModal
        isOpen={showEditShiftModal}
        currentShift={employeeShift}
        availableShifts={availableShifts}
        onClose={() => setShowEditShiftModal(false)}
        onSubmit={async (newShiftId) => {
          try {
            await API.post(SHIFT_ENDPOINTS.assign, {
              employeeId: user?.employee?._id,
              shiftId: newShiftId,
              effectiveFrom: new Date(),
            });
            setShowEditShiftModal(false);
            // Refresh employee shift
            const response = await API.get(SHIFT_ENDPOINTS.getEmployeeShift(user.employee._id));
            setEmployeeShift(response.data?.data);
          } catch (err) {
            console.error('Error assigning shift:', err);
            alert('Failed to assign shift');
          }
        }}
      />
    </div>
  );
};

// Modal component for adding attendance
const AddAttendanceModal = ({ isOpen, selectedDate, onClose, onSubmit, isSubmitting }) => {
  const [formData, setFormData] = useState({
    checkInTime: '09:00',
    checkOutTime: '18:00',
    notes: '',
  });

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        checkInTime: '09:00',
        checkOutTime: '18:00',
        notes: '',
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedDate && !isSubmitting) {
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

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fadeIn"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl animate-slideUp"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-attendance-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FiClock className="text-blue-600" size={20} />
            </div>
            <div>
              <h2 id="add-attendance-title" className="text-lg font-bold text-gray-800">Add Attendance</h2>
              <p className="text-sm text-gray-500">{dateStr}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close add attendance"
          >
            <FiX size={24} className="text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="max-h-[calc(90vh-5rem)] overflow-y-auto p-6 space-y-4">
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
              disabled={isSubmitting}
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
    </div>,
    document.body
  );
};

// Shift Edit Modal Component
const ShiftEditModal = ({ isOpen, currentShift, availableShifts, onClose, onSubmit }) => {
  const [selectedShiftId, setSelectedShiftId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedShiftId) {
      alert('Please select a shift');
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit(selectedShiftId);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-slideUp">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">Edit Employee Shift</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {currentShift && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm font-semibold text-blue-900">Current Shift:</p>
              <p className="text-sm text-blue-800">
                {currentShift.name}: {currentShift.startTime} - {currentShift.endTime}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select New Shift
            </label>
            <select
              value={selectedShiftId || ''}
              onChange={(e) => setSelectedShiftId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Choose a shift --</option>
              {availableShifts.map((shift) => (
                <option key={shift._id} value={shift._id}>
                  {shift.name} ({shift.startTime} - {shift.endTime})
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedShiftId}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Assigning...' : 'Assign Shift'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AttendanceSheet;
