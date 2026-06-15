/**
 * Attendance Components Integration Guide
 * 
 * Three new attendance components have been created:
 * 1. AttendanceEditModal - Edit attendance records (HR/Admin only)
 * 2. AttendanceApprovalPanel - Approve/Reject attendance (Manager/HR/Admin)
 * 3. BreakTrackingPanel - Start/End breaks (Employees)
 * 
 * USAGE EXAMPLES:
 */

import React, { useState } from 'react';
import AttendanceEditModal from './AttendanceEditModal';
import AttendanceApprovalPanel from './AttendanceApprovalPanel';

/**
 * EXAMPLE 1: Using AttendanceEditModal in a list
 * Place in your attendance list/table component
 */
export const AttendanceListExample = () => {
  const [editingRecord, setEditingRecord] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([
    {
      _id: '123',
      employee: { firstName: 'John', lastName: 'Doe' },
      attendanceDate: new Date(),
      status: 'Present',
      checkInTime: new Date(),
      checkOutTime: new Date(),
      workingHours: 8,
    },
  ]);

  const handleEditClick = (record) => {
    setEditingRecord(record);
  };

  const handleEditSuccess = () => {
    // Refresh the attendance list
    // fetchAttendance();
  };

  return (
    <div>
      {/* Your attendance table here */}
      {attendanceRecords.map(record => (
        <div key={record._id} className="flex items-center justify-between p-4 border-b">
          <span>{record.employee.firstName} {record.employee.lastName}</span>
          <button
            onClick={() => handleEditClick(record)}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Edit
          </button>
        </div>
      ))}

      {/* Edit Modal */}
      <AttendanceEditModal
        isOpen={!!editingRecord}
        attendanceRecord={editingRecord}
        onClose={() => setEditingRecord(null)}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
};

/**
 * EXAMPLE 2: Using AttendanceApprovalPanel in an approval queue
 * Place in your HR/Manager dashboard
 */
export const ApprovalQueueExample = () => {
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [pendingApprovals, setPendingApprovals] = useState([
    {
      _id: '456',
      employee: { firstName: 'Jane', lastName: 'Smith' },
      attendanceDate: new Date(),
      status: 'Late',
      checkInTime: new Date(),
      checkOutTime: new Date(),
      workingHours: 7.5,
      requiresManagerApproval: true,
    },
  ]);

  const handleApprovalSuccess = () => {
    // Refresh the pending approvals list
    // fetchPendingApprovals();
    setSelectedRecord(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Pending Approvals List */}
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <h2 className="text-xl font-bold mb-4">Pending Approvals</h2>
        <div className="space-y-3">
          {pendingApprovals.map(record => (
            <div
              key={record._id}
              onClick={() => setSelectedRecord(record)}
              className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
            >
              <p className="font-semibold">{record.employee.firstName} {record.employee.lastName}</p>
              <p className="text-sm text-slate-600">{new Date(record.attendanceDate).toLocaleDateString()}</p>
              <span className="inline-block mt-2 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">
                Pending Review
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Approval Panel */}
      {selectedRecord && (
        <AttendanceApprovalPanel
          attendanceRecord={selectedRecord}
          onClose={() => setSelectedRecord(null)}
          onSuccess={handleApprovalSuccess}
        />
      )}
    </div>
  );
};

/**
 * EXAMPLE 3: Using BreakTrackingPanel in employee dashboard
 * Place in your main attendance or employee dashboard
 */
export const EmployeeDashboardExample = () => {
  const [currentAttendance, setCurrentAttendance] = useState({
    _id: '789',
    checkInTime: new Date(),
    checkOutTime: null,
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Other dashboard content */}
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <h2 className="text-xl font-bold mb-4">Today's Status</h2>
        <p>Check-in: {currentAttendance.checkInTime?.toLocaleTimeString()}</p>
        <p>Check-out: {currentAttendance.checkOutTime?.toLocaleTimeString() || 'Not yet'}</p>
      </div>

    </div>
  );
};

/**
 * INTEGRATION CHECKLIST:
 * 
 * 1. ADD TO ATTENDANCE PAGE:
 *    - Import BreakTrackingPanel in your main attendance/dashboard page
 *    - Pass the current attendance record
 *    - Handle success to refresh data
 * 
 * 2. ADD TO ATTENDANCE LIST/TABLE:
 *    - Import AttendanceEditModal
 *    - Add "Edit" button to each row
 *    - Pass selected record to modal
 *    - Handle success to refresh list
 * 
 * 3. ADD TO HR/MANAGER DASHBOARD:
 *    - Import AttendanceApprovalPanel
 *    - Create a queue of pending approvals
 *    - Show panel when record is selected
 *    - Handle success to update pending list
 * 
 * 4. REQUIRED API ENDPOINTS (already added to endpoints.js):
 *    - ATTENDANCE_ENDPOINTS.update(id)      -> PUT /attendance/:id
 *    - ATTENDANCE_ENDPOINTS.approve(id)     -> POST /attendance/:id/approve
 *    - ATTENDANCE_ENDPOINTS.reject(id)      -> POST /attendance/:id/reject
 *    - ATTENDANCE_ENDPOINTS.breakStart      -> POST /attendance/break/start
 *    - ATTENDANCE_ENDPOINTS.breakEnd        -> POST /attendance/break/end
 * 
 * 5. STYLING NOTE:
 *    All components use the enterprise styling from user preferences:
 *    - Soft backgrounds (slate/blue color palette)
 *    - Subtle shadows: 0 4px 12px rgba(0,0,0,0.05)
 *    - No heavy UI-kit shadows
 *    - Clear status indicators with badges
 *    - Smooth transitions and hover effects
 */
