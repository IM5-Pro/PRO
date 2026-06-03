import mongoose from "mongoose";
import Announcement from "../models/Announcement.js";
import AuditLog from "../models/AuditLog.js";
import { recordAudit } from "../utils/audit.js";
import Employee from "../models/Employee.js";
import User from "../models/User.js";
import Roles from "../constants/roles.js";
import { sendError, sendSuccess } from "../utils/response.js";

const CREATE_ALLOWED_ROLES = new Set([Roles.SUPER_ADMIN, Roles.HR_ADMIN, Roles.MANAGER]);
const EDIT_ALLOWED_ROLES = new Set([Roles.SUPER_ADMIN, Roles.HR_ADMIN]);
const DELETE_ALLOWED_ROLES = new Set([Roles.SUPER_ADMIN, Roles.HR_ADMIN]);

const ALLOWED_AUDIENCE_BY_ROLE = {
  [Roles.SUPER_ADMIN]: ["ALL", "DEPARTMENT", "ROLE", "LOCATION", "TEAM"],
  [Roles.HR_ADMIN]: ["ALL", "DEPARTMENT"],
  [Roles.MANAGER]: ["TEAM"],
};

const toObjectId = (value) => {
  if (!value) {
    return null;
  }

  if (value instanceof mongoose.Types.ObjectId) {
    return value;
  }

  if (typeof value === "string" && mongoose.Types.ObjectId.isValid(value)) {
    return new mongoose.Types.ObjectId(value);
  }

  return null;
};

const normalizeText = (value) => String(value || "").trim();

const normalizeRole = (value) => normalizeText(value).toUpperCase();

const resolveUserContext = async (req) => {
  let employeeId = req.user?.employeeId || null;

  if (!employeeId && req.user?.id) {
    const user = await User.findById(req.user.id).select("employeeId").lean();
    if (user?.employeeId) {
      employeeId = user.employeeId;
      req.user.employeeId = user.employeeId;
    }
  }

  let employee = null;
  if (employeeId) {
    employee = await Employee.findById(employeeId)
      .select("_id department city state manager managerId managerID")
      .lean();
  }

  return {
    userId: req.user?.id,
    role: normalizeRole(req.user?.role),
    employeeId: employee?._id || toObjectId(employeeId),
    employee,
  };
};

const buildAudiencePayload = ({ role, payload, context }) => {
  const audienceType = normalizeRole(payload.audienceType || "ALL");
  const allowedAudience = ALLOWED_AUDIENCE_BY_ROLE[role] || [];

  if (!allowedAudience.includes(audienceType)) {
    return {
      error: `Audience ${audienceType} is not allowed for role ${role}`,
    };
  }

  const audience = {};

  if (audienceType === "DEPARTMENT") {
    const department = normalizeText(payload.department).toLowerCase();
    if (!department) {
      return { error: "Department is required for department audience" };
    }
    audience.department = department;
  }

  if (audienceType === "ROLE") {
    const targetRole = normalizeRole(payload.role);
    if (!targetRole) {
      return { error: "Role is required for role audience" };
    }
    audience.role = targetRole;
  }

  if (audienceType === "LOCATION") {
    const location = normalizeText(payload.location).toLowerCase();
    if (!location) {
      return { error: "Location is required for location audience" };
    }
    audience.location = location;
  }

  if (audienceType === "TEAM") {
    if (role === Roles.MANAGER) {
      if (!context.employeeId) {
        return { error: "Manager account is not linked to an employee" };
      }
      audience.teamManagerEmployeeId = context.employeeId;
    } else {
      const managerId = toObjectId(payload.teamManagerEmployeeId);
      if (!managerId) {
        return { error: "teamManagerEmployeeId is required for team audience" };
      }
      audience.teamManagerEmployeeId = managerId;
    }
  }

  return {
    audienceType,
    audience,
  };
};

const canCreate = (role) => CREATE_ALLOWED_ROLES.has(role);
const canEdit = (role) => EDIT_ALLOWED_ROLES.has(role);
const canDelete = (role) => DELETE_ALLOWED_ROLES.has(role);

const toIdString = (value) => {
  const objectId = toObjectId(value);
  return objectId ? String(objectId) : "";
};

const getUserTeamScopeIds = (context) => {
  const ids = [
    toIdString(context.employee?.manager),
    toIdString(context.employee?.managerId),
    toIdString(context.employee?.managerID),
  ].filter(Boolean);

  return [...new Set(ids)];
};

const isTeamAnnouncementVisible = (announcement, context) => {
  const targetManagerEmployeeId = toIdString(announcement?.audience?.teamManagerEmployeeId);
  if (!targetManagerEmployeeId) {
    return false;
  }

  const currentEmployeeId = toIdString(context.employeeId || context.employee?._id);
  if (currentEmployeeId && currentEmployeeId === targetManagerEmployeeId) {
    return true;
  }

  const reportingManagerIds = getUserTeamScopeIds(context);
  return reportingManagerIds.includes(targetManagerEmployeeId);
};

const isAnnouncementVisibleToUser = (announcement, context) => {
  if (!announcement?.isActive) {
    return false;
  }

  // Manager-created announcements are strictly team scoped regardless of role.
  if (announcement?.createdByRole === Roles.MANAGER) {
    return isTeamAnnouncementVisible(announcement, context);
  }

  if (context.role === Roles.SUPER_ADMIN || context.role === Roles.HR_ADMIN) {
    return true;
  }

  const audienceType = normalizeRole(announcement?.audienceType || "ALL");
  if (audienceType === "ALL") {
    return true;
  }

  if (audienceType === "DEPARTMENT") {
    const userDepartment = normalizeText(context.employee?.department).toLowerCase();
    const announcementDepartment = normalizeText(announcement?.audience?.department).toLowerCase();
    return Boolean(userDepartment && announcementDepartment && userDepartment === announcementDepartment);
  }

  if (audienceType === "ROLE") {
    const announcementRole = normalizeRole(announcement?.audience?.role);
    return Boolean(announcementRole && announcementRole === context.role);
  }

  if (audienceType === "LOCATION") {
    const userLocations = toLocationVariants(context.employee);
    const targetLocation = normalizeText(announcement?.audience?.location).toLowerCase();
    return Boolean(targetLocation && userLocations.includes(targetLocation));
  }

  if (audienceType === "TEAM") {
    return isTeamAnnouncementVisible(announcement, context);
  }

  return false;
};

const toLocationVariants = (employee) => {
  const values = [
    normalizeText(employee?.city).toLowerCase(),
    normalizeText(employee?.state).toLowerCase(),
    normalizeText(employee?.address?.city).toLowerCase(),
    normalizeText(employee?.address?.state).toLowerCase(),
  ].filter(Boolean);

  return [...new Set(values)];
};

const mapAnnouncement = (announcement, contextRole) => {
  const createdByName =
    [announcement?.createdBy?.firstName, announcement?.createdBy?.lastName]
      .filter(Boolean)
      .join(" ")
      .trim() || announcement?.createdBy?.email || "System";

  return {
    ...announcement,
    createdByName,
    canEdit: canEdit(contextRole),
    canDelete: canDelete(contextRole),
    canDismiss: true,
  };
};

const listAnnouncements = async (req, res) => {
  try {
    const context = await resolveUserContext(req);
    const userObjectId = toObjectId(context.userId);
    if (!userObjectId) {
      return sendError(res, 401, "Unauthorized");
    }

    const announcements = await Announcement.find({
      isActive: true,
      dismissedBy: { $ne: userObjectId },
    })
      .populate("createdBy", "firstName lastName email role")
      .sort({ publishedAt: -1, createdAt: -1 })
      .lean();

    const visibleAnnouncements = announcements.filter((item) => isAnnouncementVisibleToUser(item, context));

    return sendSuccess(res, 200, "Announcements retrieved successfully", {
      data: visibleAnnouncements.map((item) => mapAnnouncement(item, context.role)),
    });
  } catch (error) {
    return sendError(res, 500, "Internal server error", { error: error.message });
  }
};

const createAnnouncement = async (req, res) => {
  try {
    const context = await resolveUserContext(req);

    if (!canCreate(context.role)) {
      return sendError(res, 403, "You are not allowed to create announcements");
    }

    const title = normalizeText(req.body.title);
    const content = normalizeText(req.body.content);
    const priority = normalizeRole(req.body.priority || "MEDIUM");

    if (!title || !content) {
      return sendError(res, 400, "title and content are required");
    }

    if (!["LOW", "MEDIUM", "HIGH"].includes(priority)) {
      return sendError(res, 400, "priority must be LOW, MEDIUM, or HIGH");
    }

    const audiencePayload = buildAudiencePayload({
      role: context.role,
      payload: req.body,
      context,
    });

    if (audiencePayload.error) {
      return sendError(res, 400, audiencePayload.error);
    }

    const deliveryChannels = {
      notification: req.body?.deliveryChannels?.notification !== false,
      email: req.body?.deliveryChannels?.email === true,
      dashboardBanner: req.body?.deliveryChannels?.dashboardBanner !== false,
    };

    const announcement = await Announcement.create({
      title,
      content,
      priority,
      audienceType: audiencePayload.audienceType,
      audience: audiencePayload.audience,
      deliveryChannels,
      createdBy: context.userId,
      createdByRole: context.role,
      publishedAt: new Date(),
    });

    await recordAudit(req, {
      action: "ANNOUNCEMENT_CREATE",
      entityType: "Announcement",
      entityId: announcement._id.toString(),
      description: `Announcement created for ${announcement.audienceType} audience`,
      changes: {
        deliveryChannels,
      },
    });

    return sendSuccess(res, 201, "Announcement published successfully", {
      data: announcement,
      delivery: {
        notificationQueued: deliveryChannels.notification,
        emailQueued: deliveryChannels.email,
        dashboardBannerEnabled: deliveryChannels.dashboardBanner,
      },
    });
  } catch (error) {
    return sendError(res, 500, "Internal server error", { error: error.message });
  }
};

const updateAnnouncement = async (req, res) => {
  try {
    const context = await resolveUserContext(req);

    if (!canEdit(context.role)) {
      return sendError(res, 403, "You are not allowed to edit announcements");
    }

    const announcement = await Announcement.findById(req.params.id);
    if (!announcement || !announcement.isActive) {
      return sendError(res, 404, "Announcement not found");
    }

    const title = req.body.title !== undefined ? normalizeText(req.body.title) : announcement.title;
    const content = req.body.content !== undefined ? normalizeText(req.body.content) : announcement.content;
    const priority = req.body.priority !== undefined ? normalizeRole(req.body.priority) : announcement.priority;

    if (!title || !content) {
      return sendError(res, 400, "title and content are required");
    }

    if (!["LOW", "MEDIUM", "HIGH"].includes(priority)) {
      return sendError(res, 400, "priority must be LOW, MEDIUM, or HIGH");
    }

    const audiencePayload = buildAudiencePayload({
      role: context.role,
      payload: {
        audienceType: req.body.audienceType || announcement.audienceType,
        department: req.body.department || announcement.audience?.department,
        role: req.body.role || announcement.audience?.role,
        location: req.body.location || announcement.audience?.location,
        teamManagerEmployeeId: req.body.teamManagerEmployeeId || announcement.audience?.teamManagerEmployeeId,
      },
      context,
    });

    if (audiencePayload.error) {
      return sendError(res, 400, audiencePayload.error);
    }

    announcement.title = title;
    announcement.content = content;
    announcement.priority = priority;
    announcement.audienceType = audiencePayload.audienceType;
    announcement.audience = audiencePayload.audience;

    if (req.body.deliveryChannels) {
      announcement.deliveryChannels = {
        notification: req.body.deliveryChannels.notification !== false,
        email: req.body.deliveryChannels.email === true,
        dashboardBanner: req.body.deliveryChannels.dashboardBanner !== false,
      };
    }

    await announcement.save();

    await recordAudit(req, {
      action: "ANNOUNCEMENT_UPDATE",
      entityType: "Announcement",
      entityId: announcement._id.toString(),
      description: "Announcement updated",
    });

    return sendSuccess(res, 200, "Announcement updated successfully", {
      data: announcement,
    });
  } catch (error) {
    return sendError(res, 500, "Internal server error", { error: error.message });
  }
};

const deleteAnnouncement = async (req, res) => {
  try {
    const context = await resolveUserContext(req);

    if (!canDelete(context.role)) {
      return sendError(res, 403, "You are not allowed to delete announcements");
    }

    const announcement = await Announcement.findById(req.params.id);
    if (!announcement || !announcement.isActive) {
      return sendError(res, 404, "Announcement not found");
    }

    announcement.isActive = false;
    await announcement.save();

    await recordAudit(req, {
      action: "ANNOUNCEMENT_DELETE",
      entityType: "Announcement",
      entityId: announcement._id.toString(),
      description: "Announcement deleted",
    });

    return sendSuccess(res, 200, "Announcement deleted successfully");
  } catch (error) {
    return sendError(res, 500, "Internal server error", { error: error.message });
  }
};

const dismissAnnouncement = async (req, res) => {
  try {
    const userObjectId = toObjectId(req.user?.id);
    if (!userObjectId) {
      return sendError(res, 401, "Unauthorized");
    }

    const announcement = await Announcement.findOneAndUpdate(
      { _id: req.params.id, isActive: true },
      {
        $addToSet: {
          dismissedBy: userObjectId,
          viewedBy: userObjectId,
        },
      },
      { returnDocument: 'after' }
    );

    if (!announcement) {
      return sendError(res, 404, "Announcement not found");
    }

    return sendSuccess(res, 200, "Announcement dismissed successfully", { data: announcement });
  } catch (error) {
    return sendError(res, 500, "Internal server error", { error: error.message });
  }
};

export default {
  listAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  dismissAnnouncement,
};
