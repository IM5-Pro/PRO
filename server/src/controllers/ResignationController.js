/**
 * Resignation Controller
 * Handles resignation request lifecycle management
 * 
 * @module ResignationController
 * @version 1.0.0
 * 
 * Controllers:
 * - Create resignation request
 * - Get resignations (employee, manager, HR)
 * - Approve/Reject resignations
 * - Update resignation status
 * - Cancel resignation
 * - Generate exit clearance
 */

import Resignation from "../models/Resignation.js";
import Employee from "../models/Employee.js";
import User from "../models/User.js";
import AuditLog from "../models/AuditLog.js";
import { sendError, sendSuccess } from "../utils/response.js";
import mongoose from "mongoose";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getNoticeRequirement = (status) => {
  const noticeMap = {
    FULL_TIME: 60,
    PART_TIME: 30,
    CONTRACT: 14,
  };
  return noticeMap[status] || 30;
};

const validateLastDayOfWork = (lastDay, noticePeriod) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const requestedDate = new Date(lastDay);
  requestedDate.setHours(0, 0, 0, 0);

  const minDate = new Date(today);
  minDate.setDate(minDate.getDate() + noticePeriod);

  return requestedDate >= minDate;
};

const createAuditLog = async (action, entity, entityId, actorId, details) => {
  try {
    await AuditLog.create({
      action,
      entity,
      entityId,
      actorId,
      details,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Error creating audit log:", error);
  }
};

// ============================================================================
// CREATE RESIGNATION REQUEST
// ============================================================================

export const createResignation = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { reasonForLeaving, reasonDescription, requestedLastDayOfWork } =
      req.body;
    const userId = req.user?.id;

    if (!userId) {
      return sendError(res, 401, "User not authenticated");
    }

    // Get user and employee details
    const user = await User.findById(userId)
      .select("employeeId")
      .session(session);
    if (!user?.employeeId) {
      return sendError(res, 400, "User does not have an associated employee");
    }

    const employee = await Employee.findById(user.employeeId)
      .select("employeeCode firstName lastName department designation employmentType managerId")
      .session(session);

    if (!employee) {
      return sendError(res, 404, "Employee not found");
    }

    if (employee.status === "RESIGNED") {
      return sendError(res, 400, "Employee has already resigned");
    }

    // Validate last day of work
    const noticePeriod = getNoticeRequirement(employee.employmentType);
    if (
      !validateLastDayOfWork(
        new Date(requestedLastDayOfWork),
        noticePeriod
      )
    ) {
      return sendError(
        res,
        400,
        `Last day must be at least ${noticePeriod} days from today as per notice period`
      );
    }

    // Check for active resignation
    const activeResignation = await Resignation.findOne({
      employeeId: user.employeeId,
      status: { $nin: ["CANCELLED", "REJECTED"] },
    })
      .session(session)
      .populate("manager", "firstName lastName employeeCode")
      .populate("submittedBy", "firstName lastName email");

    if (activeResignation) {
      await session.abortTransaction();
      session.endSession();
      // Return the existing resignation so UI can display it
      return sendSuccess(
        res,
        200,
        "Employee already has an active resignation request",
        activeResignation
      );
    }

    // Create resignation
    const resignation = await Resignation.create(
      [
        {
          employeeId: user.employeeId,
          employeeCode: employee.employeeCode,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          department: employee.department,
          designation: employee.designation,
          manager: employee.managerId,
          reasonForLeaving: reasonForLeaving || "OTHER",
          reasonDescription: reasonDescription || "",
          requestedLastDayOfWork: new Date(requestedLastDayOfWork),
          noticePeriodDays: noticePeriod,
          status: "SUBMITTED",
          submittedAt: new Date(),
          submittedBy: userId,
          createdBy: userId,
        },
      ],
      { session }
    );

    // Create audit log
    await createAuditLog(
      "CREATE",
      "Resignation",
      resignation[0]._id.toString(),
      userId,
      {
        employeeName: resignation[0].employeeName,
        reason: reasonForLeaving,
      }
    );

    await session.commitTransaction();
    session.endSession();

    // Fetch the complete resignation with all virtuals and populated fields
    const completeResignation = await Resignation.findById(resignation[0]._id)
      .populate("manager", "firstName lastName employeeCode")
      .populate("submittedBy", "firstName lastName email");

    // Serialize to JSON format with all virtuals
    const jsonResignation = completeResignation.toJSON();
    const finalResignation = {
      ...jsonResignation,
      employeeName: jsonResignation.employeeName,
      employeeCode: jsonResignation.employeeCode,
      department: jsonResignation.department,
      noticePeriodDays: jsonResignation.noticePeriodDays || 60,
    };

    // Create audit log after transaction (non-blocking)
    createAuditLog(
      "CREATE",
      "Resignation",
      resignation[0]._id.toString(),
      userId,
      {
        employeeName: resignation[0].employeeName,
        reason: reasonForLeaving,
      }
    ).catch(err => console.error("Audit log creation failed:", err));

    return sendSuccess(
      res,
      201,
      "Resignation request submitted successfully",
      finalResignation
    );
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error creating resignation:", error);
    return sendError(res, 500, "Failed to create resignation request", error.message);
  }
};

// ============================================================================
// GET RESIGNATIONS
// ============================================================================

export const getMyResignation = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return sendError(res, 401, "User not authenticated");
    }

    const user = await User.findById(userId).select("employeeId");
    if (!user?.employeeId) {
      return sendError(res, 400, "User does not have an associated employee");
    }

    const resignations = await Resignation.find({
      employeeId: user.employeeId,
    })
      .sort({ createdAt: -1 })
      .populate("manager", "firstName lastName employeeCode")
      .populate("submittedBy", "firstName lastName email");

    if (!resignations || resignations.length === 0) {
      return sendSuccess(res, 200, "No resignations found", []);
    }

    // Convert to JSON for proper serialization
    const serializedResignations = resignations.map(r => {
      const json = r.toJSON();
      return {
        ...json,
        employeeName: json.employeeName || `${json.employeeId?.firstName || ''} ${json.employeeId?.lastName || ''}`.trim(),
        employeeCode: json.employeeCode,
        department: json.department,
        noticePeriodDays: json.noticePeriodDays || 60,
      };
    });

    return sendSuccess(res, 200, "Resignations retrieved", serializedResignations);
  } catch (error) {
    console.error("Error fetching resignations:", error);
    return sendError(res, 500, "Failed to fetch resignations", error.message);
  }
};

export const getTeamResignations = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { status, limit = 50, skip = 0 } = req.query;

    if (!userId) {
      return sendError(res, 401, "User not authenticated");
    }

    const user = await User.findById(userId).select("employeeId");
    if (!user?.employeeId) {
      return sendError(res, 400, "User does not have an associated employee");
    }

    const query = { manager: user.employeeId };
    if (status) {
      query.status = status;
    }

    const resignations = await Resignation.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .populate("employeeId", "firstName lastName employeeCode email department")
      .populate("submittedBy", "firstName lastName");

    const total = await Resignation.countDocuments(query);

    // Convert to JSON and ensure all required fields are present
    const deserializedResignations = resignations.map(r => {
      const json = r.toJSON();
      return {
        ...json,
        employeeName: json.employeeName || `${json.employeeId?.firstName || ''} ${json.employeeId?.lastName || ''}`.trim(),
        employeeCode: json.employeeCode,
        department: json.department,
        noticePeriodDays: json.noticePeriodDays || 60,
      };
    });

    return sendSuccess(res, 200, "Team resignations retrieved", {
      data: deserializedResignations,
      total,
      count: deserializedResignations.length,
    });
  } catch (error) {
    console.error("Error fetching team resignations:", error);
    return sendError(res, 500, "Failed to fetch team resignations", error.message);
  }
};

// ============================================================================
// GET RESIGNATION BY ID
// ============================================================================

export const getResignationById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return sendError(res, 401, "User not authenticated");
    }

    if (!id) {
      return sendError(res, 400, "Resignation ID is required");
    }

    // Validate if ID is valid MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return sendError(res, 400, "Invalid resignation ID format");
    }

    const resignation = await Resignation.findById(id)
      .populate("employeeId", "firstName lastName employeeCode email department")
      .populate("submittedBy", "firstName lastName email")
      .populate("approvedBy", "firstName lastName")
      .populate("rejectedBy", "firstName lastName")
      .populate("manager", "firstName lastName employeeCode")
      .select("-__v");

    if (!resignation) {
      console.warn(`Resignation not found for ID: ${id}`);
      return sendError(res, 404, "Resignation not found");
    }

    // Check access permissions
    const user = await User.findById(userId).select("employeeId role");
    const isOwner = resignation.employeeId?._id?.toString() === user?.employeeId?.toString();
    const isManager = resignation.manager?._id?.toString() === user?.employeeId?.toString();
    const isHR_Admin = user?.role === "HR_ADMIN";
    const isSuperAdmin = user?.role === "SUPER_ADMIN";

    if (!isOwner && !isManager && !isHR_Admin && !isSuperAdmin) {
      return sendError(res, 403, "You do not have permission to view this resignation");
    }

    // Serialize to JSON with all virtuals
    const jsonResignation = resignation.toJSON();
    const finalResignation = {
      ...jsonResignation,
      employeeName: jsonResignation.employeeName,
      employeeCode: jsonResignation.employeeCode,
      department: jsonResignation.department,
      noticePeriodDays: jsonResignation.noticePeriodDays || 60,
    };

    return sendSuccess(res, 200, "Resignation retrieved", finalResignation);
  } catch (error) {
    console.error("Error fetching resignation:", error);
    return sendError(res, 500, "Failed to fetch resignation", error.message);
  }
};

// ============================================================================
// GET ALL RESIGNATIONS
// ============================================================================

export const getAllResignations = async (req, res) => {
  try {
    const { status, limit = 50, skip = 0, sortBy = "-createdAt" } = req.query;

    const query = {};
    if (status) {
      query.status = status;
    }

    const resignations = await Resignation.find(query)
      .sort(sortBy)
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .populate("employeeId", "firstName lastName employeeCode email department")
      .populate("manager", "firstName lastName employeeCode")
      .populate("submittedBy", "firstName lastName email");

    const total = await Resignation.countDocuments(query);

    // Convert to JSON and ensure all required fields are present
    const deserializedResignations = resignations.map(r => {
      const json = r.toJSON();
      return {
        ...json,
        employeeName: json.employeeName || `${json.employeeId?.firstName || ''} ${json.employeeId?.lastName || ''}`.trim(),
        employeeCode: json.employeeCode,
        department: json.department,
        noticePeriodDays: json.noticePeriodDays || 60,
      };
    });

    return sendSuccess(res, 200, "All resignations retrieved", {
      data: deserializedResignations,
      total,
      count: deserializedResignations.length,
    });
  } catch (error) {
    console.error("Error fetching resignations:", error);
    return sendError(res, 500, "Failed to fetch resignations", error.message);
  }
};

// ============================================================================
// UPDATE RESIGNATION
// ============================================================================

export const updateResignation = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { reasonForLeaving, reasonDescription, requestedLastDayOfWork } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return sendError(res, 401, "User not authenticated");
    }

    if (!id) {
      return sendError(res, 400, "Resignation ID is required");
    }

    const resignation = await Resignation.findById(id).session(session);
    if (!resignation) {
      return sendError(res, 404, "Resignation not found");
    }

    // Check authorization - only owner can edit their pending resignation
    const user = await User.findById(userId).select("employeeId").session(session);
    if (resignation.employeeId.toString() !== user.employeeId.toString()) {
      return sendError(res, 403, "You can only edit your own resignation");
    }

    // Only allow editing DRAFT and SUBMITTED status
    if (!["DRAFT", "SUBMITTED"].includes(resignation.status)) {
      return sendError(res, 400, "Cannot edit resignation in current status");
    }

    // Validate last day of work if being updated
    if (requestedLastDayOfWork) {
      const employee = await Employee.findById(resignation.employeeId)
        .select("employmentType")
        .session(session);
      
      const noticePeriod = getNoticeRequirement(employee.employmentType);
      if (!validateLastDayOfWork(new Date(requestedLastDayOfWork), noticePeriod)) {
        return sendError(
          res,
          400,
          `Last day must be at least ${noticePeriod} days from today as per notice period`
        );
      }

      resignation.requestedLastDayOfWork = new Date(requestedLastDayOfWork);
    }

    // Update allowed fields
    if (reasonForLeaving) {
      resignation.reasonForLeaving = reasonForLeaving;
    }
    if (reasonDescription !== undefined) {
      resignation.reasonDescription = reasonDescription;
    }

    resignation.updatedAt = new Date();
    resignation.updatedBy = userId;

    await resignation.save({ session });
    await session.commitTransaction();
    session.endSession();

    const updatedResignation = await Resignation.findById(id)
      .populate("manager", "firstName lastName employeeCode")
      .populate("submittedBy", "firstName lastName email");

    // Create audit log after transaction (non-blocking)
    createAuditLog(
      "UPDATE",
      "Resignation",
      id,
      userId,
      {
        changes: {
          reasonForLeaving,
          requestedLastDayOfWork,
        },
      }
    ).catch(err => console.error("Audit log creation failed:", err));

    // Serialize to JSON format
    const jsonResignation = updatedResignation.toJSON();
    const finalResignation = {
      ...jsonResignation,
      employeeName: jsonResignation.employeeName,
      employeeCode: jsonResignation.employeeCode,
      department: jsonResignation.department,
      noticePeriodDays: jsonResignation.noticePeriodDays || 60,
    };

    return sendSuccess(res, 200, "Resignation updated successfully", finalResignation);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error updating resignation:", error);
    return sendError(res, 500, "Failed to update resignation", error.message);
  }
};

// ============================================================================
// APPROVE/REJECT RESIGNATION
// ============================================================================

export const approveResignation = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { resignationId } = req.params;
    const { approvalNotes, approvedLastDayOfWork } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return sendError(res, 401, "User not authenticated");
    }

    const resignation = await Resignation.findById(resignationId).session(
      session
    );
    if (!resignation) {
      return sendError(res, 404, "Resignation not found");
    }

    // Check authorization
    if (!resignation.canApprove(userRole, userId)) {
      return sendError(res, 403, "Not authorized to approve this resignation");
    }

    // Update resignation
    if (userRole === "MANAGER") {
      resignation.status = "MANAGER_APPROVED";
      resignation.managerApprovalAt = new Date();
      resignation.managerApprovedBy = userId;
      resignation.managerApprovalNotes = approvalNotes || "";
    } else if (userRole === "HR_ADMIN") {
      resignation.status = "HR_APPROVED";
      resignation.hrApprovalAt = new Date();
      resignation.hrApprovedBy = userId;
      resignation.hrApprovalNotes = approvalNotes || "";
      resignation.approvedLastDayOfWork =
        approvedLastDayOfWork || resignation.requestedLastDayOfWork;

      // Update employee status
      await Employee.findByIdAndUpdate(
        resignation.employeeId,
        {
          status: "RESIGNED",
          $push: {
            statusHistory: {
              status: "RESIGNED",
              changedAt: new Date(),
              changedBy: userId,
            },
          },
        },
        { session }
      );
    }

    resignation.updatedBy = userId;
    await resignation.save({ session });
    await session.commitTransaction();
    session.endSession();

    // Create audit log after transaction (non-blocking)
    createAuditLog(
      "APPROVE",
      "Resignation",
      resignationId,
      userId,
      {
        newStatus: resignation.status,
        notes: approvalNotes,
      }
    ).catch(err => console.error("Audit log creation failed:", err));

    // Serialize to JSON format
    const jsonResignation = resignation.toJSON();
    const finalResignation = {
      ...jsonResignation,
      employeeName: jsonResignation.employeeName,
      employeeCode: jsonResignation.employeeCode,
      department: jsonResignation.department,
      noticePeriodDays: jsonResignation.noticePeriodDays || 60,
    };

    return sendSuccess(
      res,
      200,
      "Resignation approved successfully",
      finalResignation
    );
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error approving resignation:", error);
    return sendError(res, 500, "Failed to approve resignation", error.message);
  }
};

export const rejectResignation = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { resignationId } = req.params;
    const { rejectionReason } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return sendError(res, 401, "User not authenticated");
    }

    const resignation = await Resignation.findById(resignationId).session(
      session
    );
    if (!resignation) {
      return sendError(res, 404, "Resignation not found");
    }

    // Check authorization
    if (!resignation.canReject(userRole, userId)) {
      return sendError(res, 403, "Not authorized to reject this resignation");
    }

    // Update resignation
    if (userRole === "MANAGER") {
      resignation.status = "MANAGER_REJECTED";
      resignation.managerApprovalNotes = rejectionReason || "";
      resignation.managerApprovedBy = userId;
      resignation.managerApprovalAt = new Date();
    } else if (userRole === "HR_ADMIN") {
      resignation.status = "HR_REJECTED";
      resignation.hrApprovalNotes = rejectionReason || "";
      resignation.hrApprovedBy = userId;
      resignation.hrApprovalAt = new Date();
    }

    resignation.updatedBy = userId;
    await resignation.save({ session });
    await session.commitTransaction();
    session.endSession();

    // Create audit log after transaction (non-blocking)
    createAuditLog(
      "REJECT",
      "Resignation",
      resignationId,
      userId,
      {
        status: resignation.status,
        reason: rejectionReason,
      }
    ).catch(err => console.error("Audit log creation failed:", err));

    // Serialize to JSON format
    const jsonResignation = resignation.toJSON();
    const finalResignation = {
      ...jsonResignation,
      employeeName: jsonResignation.employeeName,
      employeeCode: jsonResignation.employeeCode,
      department: jsonResignation.department,
      noticePeriodDays: jsonResignation.noticePeriodDays || 60,
    };

    return sendSuccess(
      res,
      200,
      "Resignation rejected successfully",
      finalResignation
    );
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error rejecting resignation:", error);
    return sendError(res, 500, "Failed to reject resignation", error.message);
  }
};

// ============================================================================
// CANCEL RESIGNATION
// ============================================================================

export const cancelResignation = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { cancellationReason } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return sendError(res, 401, "User not authenticated");
    }

    if (!id) {
      return sendError(res, 400, "Resignation ID is required");
    }

    const resignation = await Resignation.findById(id).session(session);
    if (!resignation) {
      return sendError(res, 404, "Resignation not found");
    }

    // Check authorization - only owner can cancel their own resignation
    const user = await User.findById(userId).select("employeeId role").session(session);
    if (resignation.employeeId.toString() !== user.employeeId.toString()) {
      return sendError(res, 403, "You can only cancel your own resignation");
    }

    // Check if can cancel based on status
    if (!["DRAFT", "SUBMITTED"].includes(resignation.status)) {
      return sendError(res, 400, `Cannot cancel resignation in ${resignation.status} status`);
    }

    resignation.status = "CANCELLED";
    resignation.cancelledAt = new Date();
    resignation.cancelledBy = userId;
    resignation.cancellationReason = cancellationReason || "";
    resignation.updatedBy = userId;
    resignation.updatedAt = new Date();

    await resignation.save({ session });
    await session.commitTransaction();
    session.endSession();

    const cancelledResignation = await Resignation.findById(id)
      .populate("manager", "firstName lastName employeeCode")
      .populate("submittedBy", "firstName lastName email");

    // Create audit log after transaction (non-blocking)
    createAuditLog(
      "CANCEL",
      "Resignation",
      id,
      userId,
      {
        reason: cancellationReason,
      }
    ).catch(err => console.error("Audit log creation failed:", err));

    // Serialize to JSON format
    const jsonResignation = cancelledResignation.toJSON();
    const finalResignation = {
      ...jsonResignation,
      employeeName: jsonResignation.employeeName,
      employeeCode: jsonResignation.employeeCode,
      department: jsonResignation.department,
      noticePeriodDays: jsonResignation.noticePeriodDays || 60,
    };

    return sendSuccess(
      res,
      200,
      "Resignation cancelled successfully",
      finalResignation
    );
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error cancelling resignation:", error);
    return sendError(res, 500, "Failed to cancel resignation", error.message);
  }
};

// ============================================================================
// GET RESIGNATION STATISTICS
// ============================================================================

export const getResignationStats = async (req, res) => {
  try {
    const stats = {
      total: await Resignation.countDocuments(),
      pending: await Resignation.countDocuments({
        status: { $in: ["SUBMITTED", "MANAGER_APPROVED"] },
      }),
      approved: await Resignation.countDocuments({ status: "HR_APPROVED" }),
      completed: await Resignation.countDocuments({ status: "COMPLETED" }),
      rejected: await Resignation.countDocuments({
        status: { $in: ["MANAGER_REJECTED", "HR_REJECTED"] },
      }),
    };

    return sendSuccess(res, 200, "Resignation statistics", stats);
  } catch (error) {
    console.error("Error fetching resignation stats:", error);
    return sendError(
      res,
      500,
      "Failed to fetch resignation statistics",
      error
    );
  }
};

export default {
  createResignation,
  getMyResignation,
  getTeamResignations,
  getResignationById,
  getAllResignations,
  updateResignation,
  approveResignation,
  rejectResignation,
  cancelResignation,
  getResignationStats,
};
