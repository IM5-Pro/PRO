import Shift from "../models/Shift.js";
import EmployeeShift from "../models/EmployeeShift.js";
import Employee from "../models/Employee.js";
import Roles from "../constants/roles.js";
import { sendError, sendSuccess } from "../utils/response.js";

const getManagerScopedFilter = (employeeId) => ({
  $or: [
    { manager: employeeId },
    { managerId: employeeId },
    { managerID: employeeId },
  ],
});

const canReadEmployeeShiftData = async ({ requester, targetEmployeeId }) => {
  const role = requester?.role;
  const requesterEmployeeId = requester?.employeeId ? String(requester.employeeId) : "";
  const targetId = String(targetEmployeeId);

  if ([Roles.SUPER_ADMIN, Roles.HR_ADMIN].includes(role)) {
    return true;
  }

  if (requesterEmployeeId && requesterEmployeeId === targetId) {
    return true;
  }

  if ([Roles.MANAGER, Roles.DEPT_ADMIN].includes(role) && requesterEmployeeId) {
    const managedEmployee = await Employee.findOne({
      _id: targetEmployeeId,
      ...getManagerScopedFilter(requesterEmployeeId),
    })
      .select("_id")
      .lean();
    return Boolean(managedEmployee);
  }

  return false;
};

/**
 * Create a new shift
 * POST /api/shifts
 */
export const createShift = async (req, res) => {
  try {
    const { name, code, startTime, endTime, gracePeriodMinutes, earlyCheckoutThresholdMinutes } = req.body;

    // Validate required fields
    if (!name || !startTime || !endTime) {
      return sendError(res, 400, "Name, startTime, and endTime are required");
    }

    // Validate time format
    const timeRegex = /^\d{2}:\d{2}$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return sendError(res, 400, "Time must be in HH:MM format");
    }

    // Check if shift with same code already exists
    if (code) {
      const existingShift = await Shift.findOne({ code: code.toUpperCase(), isActive: true });
      if (existingShift) {
        return sendError(res, 400, "Shift with this code already exists");
      }
    }

    const shift = await Shift.create({
      name,
      code: code?.toUpperCase(),
      startTime,
      endTime,
      gracePeriodMinutes: gracePeriodMinutes || 15,
      earlyCheckoutThresholdMinutes: earlyCheckoutThresholdMinutes || 30,
      isActive: true,
      createdBy: req.user.id,
      updatedBy: req.user.id,
    });

    return sendSuccess(res, 201, "Shift created successfully", shift);
  } catch (err) {
    console.error("Error creating shift:", err);
    return sendError(res, 500, "Internal server error", err.message);
  }
};

/**
 * List all shifts with pagination
 * GET /api/shifts
 */
export const listShifts = async (req, res) => {
  try {
    const { page = 1, limit = 10, isActive = true, search } = req.query;

    const skip = (page - 1) * limit;
    const query = { isActive: isActive === "true" || isActive === true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
      ];
    }

    const shifts = await Shift.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Shift.countDocuments(query);

    return sendSuccess(res, 200, "Shifts retrieved successfully", {
      shifts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("Error listing shifts:", err);
    return sendError(res, 500, "Internal server error", err.message);
  }
};

/**
 * Get shift by ID
 * GET /api/shifts/:shiftId
 */
export const getShift = async (req, res) => {
  try {
    const { shiftId } = req.params;

    const shift = await Shift.findById(shiftId);
    if (!shift) {
      return sendError(res, 404, "Shift not found");
    }

    return sendSuccess(res, 200, "Shift retrieved successfully", shift);
  } catch (err) {
    console.error("Error getting shift:", err);
    return sendError(res, 500, "Internal server error", err.message);
  }
};

/**
 * Update shift
 * PUT /api/shifts/:shiftId
 */
export const updateShift = async (req, res) => {
  try {
    const { shiftId } = req.params;
    const { name, code, startTime, endTime, gracePeriodMinutes, earlyCheckoutThresholdMinutes, isActive } = req.body;

    const shift = await Shift.findById(shiftId);
    if (!shift) {
      return sendError(res, 404, "Shift not found");
    }

    // Validate time format if provided
    const timeRegex = /^\d{2}:\d{2}$/;
    if (startTime && !timeRegex.test(startTime)) {
      return sendError(res, 400, "Start time must be in HH:MM format");
    }
    if (endTime && !timeRegex.test(endTime)) {
      return sendError(res, 400, "End time must be in HH:MM format");
    }

    // Check if new code conflicts with existing shifts
    if (code && code.toUpperCase() !== shift.code) {
      const existingShift = await Shift.findOne({ code: code.toUpperCase(), isActive: true });
      if (existingShift) {
        return sendError(res, 400, "Shift with this code already exists");
      }
    }

    const updatedShift = await Shift.findByIdAndUpdate(
      shiftId,
      {
        name: name || shift.name,
        code: code ? code.toUpperCase() : shift.code,
        startTime: startTime || shift.startTime,
        endTime: endTime || shift.endTime,
        gracePeriodMinutes: gracePeriodMinutes !== undefined ? gracePeriodMinutes : shift.gracePeriodMinutes,
        earlyCheckoutThresholdMinutes:
          earlyCheckoutThresholdMinutes !== undefined
            ? earlyCheckoutThresholdMinutes
            : shift.earlyCheckoutThresholdMinutes,
        isActive: isActive !== undefined ? isActive : shift.isActive,
        updatedBy: req.user.id,
      },
      { new: true }
    );

    return sendSuccess(res, 200, "Shift updated successfully", updatedShift);
  } catch (err) {
    console.error("Error updating shift:", err);
    return sendError(res, 500, "Internal server error", err.message);
  }
};

/**
 * Delete shift (soft delete by setting isActive to false)
 * DELETE /api/shifts/:shiftId
 */
export const deleteShift = async (req, res) => {
  try {
    const { shiftId } = req.params;

    const shift = await Shift.findById(shiftId);
    if (!shift) {
      return sendError(res, 404, "Shift not found");
    }

    // Check if shift is assigned to any active employees
    const activeAssignments = await EmployeeShift.findOne({
      shift: shiftId,
      isActive: true,
    });

    if (activeAssignments) {
      return sendError(res, 400, "Cannot delete shift as it is assigned to active employees");
    }

    await Shift.findByIdAndUpdate(shiftId, { isActive: false, updatedBy: req.user.id });

    return sendSuccess(res, 200, "Shift deleted successfully");
  } catch (err) {
    console.error("Error deleting shift:", err);
    return sendError(res, 500, "Internal server error", err.message);
  }
};

/**
 * Assign shift to employee
 * POST /api/shifts/assign
 */
export const assignShiftToEmployee = async (req, res) => {
  try {
    const { employeeId, shiftId, effectiveFrom } = req.body;

    if (!employeeId || !shiftId) {
      return sendError(res, 400, "Employee ID and Shift ID are required");
    }

    // Check if employee exists
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return sendError(res, 404, "Employee not found");
    }

    // Check if shift exists
    const shift = await Shift.findOne({ _id: shiftId, isActive: true });
    if (!shift) {
      return sendError(res, 404, "Shift not found or is inactive");
    }

    // Deactivate previous shifts
    await EmployeeShift.updateMany(
      {
        employee: employeeId,
        isActive: true,
      },
      {
        $set: {
          isActive: false,
          effectiveTo: effectiveFrom ? new Date(effectiveFrom) : new Date(),
          updatedBy: req.user.id,
        },
      }
    );

    // Create new shift assignment
    const employeeShift = await EmployeeShift.create({
      employee: employeeId,
      shift: shiftId,
      effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : new Date(),
      isActive: true,
      createdBy: req.user.id,
      updatedBy: req.user.id,
    });

    return sendSuccess(res, 201, "Shift assigned successfully", employeeShift);
  } catch (err) {
    console.error("Error assigning shift:", err);
    return sendError(res, 500, "Internal server error", err.message);
  }
};

/**
 * Get employee's current shift
 * GET /api/shifts/employee/:employeeId
 */
export const getEmployeeCurrentShift = async (req, res) => {
  try {
    const { employeeId } = req.params;

    // Check if employee exists
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return sendError(res, 404, "Employee not found");
    }

    const canRead = await canReadEmployeeShiftData({
      requester: req.user,
      targetEmployeeId: employee._id,
    });
    if (!canRead) {
      return sendError(res, 403, "Access denied");
    }

    // Get current active shift
    const employeeShift = await EmployeeShift.findOne({
      employee: employeeId,
      isActive: true,
      effectiveFrom: { $lte: new Date() },
    })
      .sort({ effectiveFrom: -1 })
      .populate("shift");

    if (!employeeShift) {
      return sendSuccess(res, 200, "No active shift found", null);
    }

    return sendSuccess(res, 200, "Employee shift retrieved successfully", employeeShift.shift);
  } catch (err) {
    console.error("Error getting employee shift:", err);
    return sendError(res, 500, "Internal server error", err.message);
  }
};

/**
 * Get shift assignment history for an employee
 * GET /api/shifts/employee/:employeeId/history
 */
export const getEmployeeShiftHistory = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Check if employee exists
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return sendError(res, 404, "Employee not found");
    }

    const canRead = await canReadEmployeeShiftData({
      requester: req.user,
      targetEmployeeId: employee._id,
    });
    if (!canRead) {
      return sendError(res, 403, "Access denied");
    }

    const skip = (page - 1) * limit;

    const shifts = await EmployeeShift.find({ employee: employeeId })
      .populate("shift")
      .sort({ effectiveFrom: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await EmployeeShift.countDocuments({ employee: employeeId });

    return sendSuccess(res, 200, "Shift history retrieved successfully", {
      shifts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("Error getting shift history:", err);
    return sendError(res, 500, "Internal server error", err.message);
  }
};

/**
 * Get all employees assigned to a specific shift
 * GET /api/shifts/:shiftId/employees
 */
export const getShiftEmployees = async (req, res) => {
  try {
    const { shiftId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Check if shift exists
    const shift = await Shift.findById(shiftId);
    if (!shift) {
      return sendError(res, 404, "Shift not found");
    }

    const skip = (page - 1) * limit;

    const employees = await EmployeeShift.find({
      shift: shiftId,
      isActive: true,
    })
      .populate({
        path: "employee",
        select: "firstName lastName email employeeCode designation",
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await EmployeeShift.countDocuments({
      shift: shiftId,
      isActive: true,
    });

    return sendSuccess(res, 200, "Shift employees retrieved successfully", {
      employees,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("Error getting shift employees:", err);
    return sendError(res, 500, "Internal server error", err.message);
  }
};
