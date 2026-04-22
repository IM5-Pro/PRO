/**
 * Attendance Auto-marking Service
 * Automatically marks unrecorded attendance as Leave (using earned leaves)
 * or Loss of Pay after 2 working days
 */

import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";
import EmployeeLeaveBalance from "../models/EmployeeLeaveBalance.js";
import LeaveRequest from "../models/LeaveRequest.js";
import LeaveType from "../models/LeaveType.js";
import EmployeeShift from "../models/EmployeeShift.js";

/**
 * Check if a date is a working day (not Saturday or Sunday)
 */
const isWorkingDay = (date) => {
  const day = date.getDay();
  return day !== 0 && day !== 6; // 0 = Sunday, 6 = Saturday
};

/**
 * Get working days between two dates
 */
const getWorkingDaysBetween = (startDate, endDate) => {
  const workingDays = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    if (isWorkingDay(current)) {
      workingDays.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }
  
  return workingDays;
};

/**
 * Check if an employee has leave balance of a specific type
 */
const getLeaveBalance = async (employeeId, leaveTypeId) => {
  try {
    const balance = await EmployeeLeaveBalance.findOne({
      employee: employeeId,
      leaveType: leaveTypeId,
    });
    return balance?.availableBalance || 0;
  } catch (err) {
    console.error("Error getting leave balance:", err);
    return 0;
  }
};

/**
 * Deduct leave balance
 */
const deductLeaveBalance = async (employeeId, leaveTypeId, days) => {
  try {
    const balance = await EmployeeLeaveBalance.findOne({
      employee: employeeId,
      leaveType: leaveTypeId,
    });

    if (balance && balance.availableBalance >= days) {
      balance.availableBalance -= days;
      balance.usedBalance = (balance.usedBalance || 0) + days;
      await balance.save();
      return true;
    }
    return false;
  } catch (err) {
    console.error("Error deducting leave balance:", err);
    return false;
  }
};

/**
 * Get employee's current shift
 */
const getEmployeeShift = async (employeeId) => {
  try {
    const employeeShift = await EmployeeShift.findOne({
      employee: employeeId,
      isActive: true,
      effectiveFrom: { $lte: new Date() },
    })
      .sort({ effectiveFrom: -1 })
      .populate("shift");

    return employeeShift?.shift;
  } catch (err) {
    console.error("Error getting employee shift:", err);
    return null;
  }
};

/**
 * Auto-mark attendance for unrecorded dates
 * After 2 working days without attendance, mark as Leave (if balance) or LOP
 */
export const autoMarkAttendance = async () => {
  try {
    console.log("🔄 Starting auto-mark attendance process...");

    // Get all active employees
    const activeEmployees = await Employee.find({ isActive: true });

    if (!activeEmployees.length) {
      console.log("No active employees found");
      return;
    }

    // Get earned leave type (assuming it exists)
    const earnedLeaveType = await LeaveType.findOne({
      code: "EL",
      isActive: true,
    });

    const today = new Date();
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    let markedCount = 0;
    let lopCount = 0;

    for (const employee of activeEmployees) {
      try {
        // Find dates without attendance (last 2 working days)
        const workingDays = getWorkingDaysBetween(twoDaysAgo, today);

        for (const workingDate of workingDays) {
          const dateStr = workingDate.toISOString().split("T")[0];

          // Check if attendance already exists
          const existingAttendance = await Attendance.findOne({
            employee: employee._id,
            attendanceDate: {
              $gte: new Date(dateStr),
              $lt: new Date(new Date(dateStr).getTime() + 24 * 60 * 60 * 1000),
            },
            isArchived: false,
          });

          if (existingAttendance) {
            console.log(
              `✅ Attendance already recorded for ${employee.firstName} on ${dateStr}`
            );
            continue;
          }

          // Get employee's shift
          const employeeShift = await getEmployeeShift(employee._id);

          // Check if we should mark as leave or LOP
          if (earnedLeaveType) {
            const balance = await getLeaveBalance(employee._id, earnedLeaveType._id);

            if (balance > 0) {
              // Create leave request
              const leaveRequest = await LeaveRequest.create({
                employee: employee._id,
                leaveType: earnedLeaveType._id,
                startDate: workingDate,
                endDate: workingDate,
                totalDays: 1,
                reason: "Auto-marked by system - No attendance recorded",
                status: "approved",
                appliedOn: new Date(),
                approvedOn: new Date(),
                approvedBy: null,
              });

              // Create attendance record with leave status
              await Attendance.create({
                employee: employee._id,
                attendanceDate: workingDate,
                status: "Leave",
                shift: employeeShift?._id || null,
                assignedShiftStart: employeeShift?.startTime || "09:00",
                assignedShiftEnd: employeeShift?.endTime || "17:00",
                approvalStatus: "Approved",
                isAutoMarked: true,
                associatedLeaveRequest: leaveRequest._id,
                isLossOfPay: false,
              });

              // Deduct leave balance
              await deductLeaveBalance(employee._id, earnedLeaveType._id, 1);

              markedCount++;
              console.log(
                `✅ Auto-marked as Leave for ${employee.firstName} on ${dateStr}`
              );
            } else {
              // Mark as Loss of Pay
              await Attendance.create({
                employee: employee._id,
                attendanceDate: workingDate,
                status: "Absent",
                shift: employeeShift?._id || null,
                assignedShiftStart: employeeShift?.startTime || "09:00",
                assignedShiftEnd: employeeShift?.endTime || "17:00",
                approvalStatus: "Approved",
                isAutoMarked: true,
                isLossOfPay: true,
                lopReason: "No Leave Balance",
              });

              lopCount++;
              console.log(
                `⚠️  Auto-marked as LOP for ${employee.firstName} on ${dateStr}`
              );
            }
          } else {
            // No earned leave type, mark as LOP
            await Attendance.create({
              employee: employee._id,
              attendanceDate: workingDate,
              status: "Absent",
              shift: employeeShift?._id || null,
              assignedShiftStart: employeeShift?.startTime || "09:00",
              assignedShiftEnd: employeeShift?.endTime || "17:00",
              approvalStatus: "Approved",
              isAutoMarked: true,
              isLossOfPay: true,
              lopReason: "No Leave Balance",
            });

            lopCount++;
            console.log(
              `⚠️  Auto-marked as LOP for ${employee.firstName} on ${dateStr}`
            );
          }
        }
      } catch (err) {
        console.error(`Error processing employee ${employee._id}:`, err);
      }
    }

    console.log(
      `\n✨ Auto-mark completed! Marked ${markedCount} as Leave, ${lopCount} as LOP`
    );
  } catch (err) {
    console.error("Error in auto-mark attendance:", err);
  }
};

/**
 * Get pending attendance approvals for a manager
 */
export const getPendingApprovals = async (managerId) => {
  try {
    // Get employees managed by this manager
    const managedEmployees = await Employee.find({ managerId });
    const employeeIds = managedEmployees.map((emp) => emp._id);

    // Get pending manual attendance records
    const pendingRecords = await Attendance.find({
      employee: { $in: employeeIds },
      approvalStatus: "Pending",
      requiresManagerApproval: true,
      isArchived: false,
    })
      .populate("employee", "firstName lastName email")
      .populate("shift")
      .sort({ createdAt: -1 });

    return pendingRecords;
  } catch (err) {
    console.error("Error getting pending approvals:", err);
    throw err;
  }
};

/**
 * Approve attendance
 */
export const approveAttendance = async (attendanceId, managerId, remarks) => {
  try {
    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) {
      throw new Error("Attendance record not found");
    }

    attendance.approvalStatus = "Approved";
    attendance.approvedBy = managerId;
    attendance.approvalDate = new Date();
    attendance.approvalRemarks = remarks || "";
    attendance.requiresManagerApproval = false;

    await attendance.save();
    return attendance;
  } catch (err) {
    console.error("Error approving attendance:", err);
    throw err;
  }
};

/**
 * Reject attendance
 */
export const rejectAttendance = async (attendanceId, managerId, remarks) => {
  try {
    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) {
      throw new Error("Attendance record not found");
    }

    attendance.approvalStatus = "Rejected";
    attendance.approvedBy = managerId;
    attendance.approvalDate = new Date();
    attendance.approvalRemarks = remarks || "Rejected by manager";
    attendance.requiresManagerApproval = false;

    await attendance.save();
    return attendance;
  } catch (err) {
    console.error("Error rejecting attendance:", err);
    throw err;
  }
};
