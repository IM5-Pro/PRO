import Employee from "../models/Employee.js";
import EmployeeProfileChangeRequest from "../models/EmployeeProfileChangeRequest.js";
import User from "../models/User.js";
import {
  createNotification,
  createNotificationForRoles,
} from "../controllers/NotificationController.js";
import {
  EMPLOYEE_SELF_SERVICE_FIELDS,
  toEmployeeMongoUpdate,
} from "../utils/employeeProfileFields.js";

const trim = (v) => (typeof v === "string" ? v.trim() : v);

export const buildEmployeeProfilePatch = (body, employee) => {
  const updateData = {};

  if (body.firstName !== undefined) {
    updateData.firstName = trim(body.firstName) || employee.firstName;
  }
  if (body.middleName !== undefined) {
    updateData.middleName = trim(body.middleName) || "";
  }
  if (body.lastName !== undefined) {
    updateData.lastName = trim(body.lastName) || employee.lastName;
  }
  if (body.phoneNumber !== undefined || body.phone !== undefined) {
    const phone = trim(body.phoneNumber ?? body.phone) || "";
    updateData.phoneNumber = phone;
    updateData.phone = phone;
  }
  if (body.dateOfBirth !== undefined) {
    if (body.dateOfBirth !== null && String(body.dateOfBirth).trim() !== "") {
      const d = new Date(body.dateOfBirth);
      updateData.dateOfBirth = Number.isNaN(d.getTime()) ? employee.dateOfBirth : d;
    } else {
      updateData.dateOfBirth = null;
    }
  }
  if (body.panNumber !== undefined) {
    updateData.panNumber = trim(body.panNumber)?.toUpperCase() || "";
  }
  if (body.aadhaarNumber !== undefined) {
    updateData.aadhaarNumber = trim(body.aadhaarNumber)?.replace(/\s/g, "") || "";
  }
  if (body.gender !== undefined) {
    updateData.gender = trim(body.gender) || "";
  }
  if (body.bloodGroup !== undefined) {
    updateData.bloodGroup = trim(body.bloodGroup) || "";
  }
  if (body.emergencyContact !== undefined && typeof body.emergencyContact === "object") {
    updateData.emergencyContact = {
      name: trim(body.emergencyContact.name) || "",
      relation: trim(body.emergencyContact.relation) || "",
      phone: trim(body.emergencyContact.phone) || "",
    };
  }

  const existingStreet =
    trim(employee.addressLine) || trim(employee.address?.street) || "";
  const street =
    typeof body.address === "string"
      ? trim(body.address)
      : body.addressLine !== undefined
        ? trim(body.addressLine)
        : existingStreet;
  const city = body.city !== undefined ? trim(body.city) : employee.city || "";
  const state = body.state !== undefined ? trim(body.state) : employee.state || "";
  const zipCode = body.zipCode !== undefined ? trim(body.zipCode) : employee.zipCode || "";
  const country =
    body.country !== undefined
      ? trim(body.country)
      : (employee.address && employee.address.country) || "";

  if (
    body.address !== undefined ||
    body.addressLine !== undefined ||
    body.city !== undefined ||
    body.state !== undefined ||
    body.zipCode !== undefined ||
    body.country !== undefined
  ) {
    updateData.addressLine = street;
    updateData.city = city;
    updateData.state = state;
    updateData.zipCode = zipCode;
    updateData.address = {
      street: street || "",
      city: city || "",
      state: state || "",
      country: country || "",
      zipCode: zipCode || "",
    };
  }

  return updateData;
};

const snapshotEmployeeFields = (employee) => {
  const doc = employee.toObject ? employee.toObject() : employee;
  const snap = {};
  for (const key of EMPLOYEE_SELF_SERVICE_FIELDS) {
    if (key === "emergencyContact") {
      snap.emergencyContact = { ...(doc.emergencyContact || {}) };
    } else if (key === "addressLine") {
      snap.addressLine = doc.addressLine || doc.address?.street || "";
      snap.city = doc.city || "";
      snap.state = doc.state || "";
      snap.zipCode = doc.zipCode || "";
      snap.country = doc.address?.country || "";
    } else {
      snap[key] = doc[key];
    }
  }
  if (doc.phone) snap.phoneNumber = doc.phoneNumber || doc.phone;
  return snap;
};

export const getActiveProfileChangeRequest = async (employeeId) =>
  EmployeeProfileChangeRequest.findOne({
    employee: employeeId,
    status: { $in: ["DRAFT", "PENDING"] },
  })
    .sort({ updatedAt: -1 })
    .lean();

export const notifyHrProfileChangeSubmitted = async ({ employee, request, actor }) => {
  const name = [employee.firstName, employee.lastName].filter(Boolean).join(" ").trim();
  const payload = {
    type: "onboarding_task",
    title: "Profile pending HR approval",
    message: `${name || "An employee"} submitted profile updates for your review.`,
    priority: "high",
    category: "approval",
    referenceType: "document",
    referenceId: request._id,
    actionUrl: "/?page=profile-approvals",
    metadata: {
      employeeId: String(employee._id),
      requestType: request.requestType,
      entity: "employee_profile_change_request",
    },
    triggeredBy: actor?.id,
  };

  await createNotificationForRoles(["HR_ADMIN", "SUPER_ADMIN"], payload, actor);
};

export const notifyEmployeeProfileDecision = async ({
  employee,
  request,
  approved,
  actor,
  remarks,
}) => {
  const user = await User.findOne({ employeeId: employee._id }).select("_id").lean();
  if (!user) return;

  await createNotification(
    {
      userId: user._id,
      type: approved ? "document_approval" : "document_rejection",
      title: approved ? "Profile updates approved" : "Profile updates rejected",
      message: approved
        ? "HR approved your profile changes. They are now visible on your profile."
        : `HR rejected your profile changes.${remarks ? ` Reason: ${remarks}` : ""}`,
      priority: "medium",
      category: "update",
      referenceType: "document",
      referenceId: request._id,
      actionUrl: "/?page=employee-profile",
      metadata: { approved, remarks: remarks || "", entity: "employee_profile_change_request" },
      triggeredBy: actor?.id,
    },
    actor,
  );
};

const applyPatchToEmployee = async (employeeId, patch, updatedBy) => {
  const mongoUpdate = toEmployeeMongoUpdate({ ...patch, updatedBy });
  const updated = await Employee.findByIdAndUpdate(employeeId, mongoUpdate, { new: true });

  await User.updateMany(
    { employeeId: updated._id },
    {
      $set: {
        firstName: updated.firstName || "",
        middleName: updated.middleName || "",
        lastName: updated.lastName || "",
      },
    },
  );

  return updated;
};

export const saveEmployeeProfileChangeRequest = async ({
  employeeId,
  userId,
  body,
  submitForApproval,
}) => {
  const employee = await Employee.findById(employeeId);
  if (!employee) {
    const err = new Error("Employee not found");
    err.statusCode = 404;
    throw err;
  }

  const existing = await EmployeeProfileChangeRequest.findOne({
    employee: employeeId,
    status: { $in: ["DRAFT", "PENDING"] },
  });

  if (existing?.status === "PENDING" && !submitForApproval) {
    const err = new Error("Profile changes are already pending HR approval");
    err.statusCode = 409;
    throw err;
  }

  const patch = buildEmployeeProfilePatch(body, employee);
  if (Object.keys(patch).length === 0) {
    const err = new Error("No valid fields to update");
    err.statusCode = 400;
    throw err;
  }

  const mergedProposed = {
    ...(existing?.proposedChanges || {}),
    ...patch,
  };

  const requestType =
    employee.profileCompletionStatus === "pending_employee" ? "ONBOARDING" : "UPDATE";

  let request = existing;
  if (!request) {
    request = await EmployeeProfileChangeRequest.create({
      employee: employeeId,
      submittedBy: userId,
      status: submitForApproval ? "PENDING" : "DRAFT",
      requestType,
      proposedChanges: mergedProposed,
      previousSnapshot: snapshotEmployeeFields(employee),
      submittedAt: submitForApproval ? new Date() : null,
    });
  } else {
    request.proposedChanges = mergedProposed;
    if (submitForApproval) {
      request.status = "PENDING";
      request.submittedAt = new Date();
    }
    await request.save();
  }

  if (submitForApproval) {
    await Employee.findByIdAndUpdate(employeeId, {
      profileCompletionStatus: "pending_hr",
    });
    try {
      await notifyHrProfileChangeSubmitted({
        employee,
        request,
        actor: { id: userId },
      });
    } catch (notifyErr) {
      console.error("Profile change HR notification failed (submission saved):", notifyErr);
    }
  }

  return { request, employee };
};

export const approveProfileChangeRequest = async ({ requestId, reviewerId, remarks }) => {
  const request = await EmployeeProfileChangeRequest.findById(requestId);
  if (!request) {
    const err = new Error("Profile change request not found");
    err.statusCode = 404;
    throw err;
  }
  if (request.status !== "PENDING") {
    const err = new Error("Only pending requests can be approved");
    err.statusCode = 400;
    throw err;
  }

  const employee = await applyPatchToEmployee(
    request.employee,
    request.proposedChanges,
    reviewerId,
  );

  request.status = "APPROVED";
  request.reviewedBy = reviewerId;
  request.reviewedAt = new Date();
  request.reviewRemarks = remarks || "";
  await request.save();

  await Employee.findByIdAndUpdate(employee._id, {
    profileCompletionStatus: "complete",
  });

  try {
    await notifyEmployeeProfileDecision({
      employee,
      request,
      approved: true,
      actor: { id: reviewerId },
      remarks,
    });
  } catch (notifyErr) {
    console.error("Profile approval notification failed:", notifyErr);
  }

  return { request, employee };
};

export const rejectProfileChangeRequest = async ({ requestId, reviewerId, remarks }) => {
  const request = await EmployeeProfileChangeRequest.findById(requestId);
  if (!request) {
    const err = new Error("Profile change request not found");
    err.statusCode = 404;
    throw err;
  }
  if (request.status !== "PENDING") {
    const err = new Error("Only pending requests can be rejected");
    err.statusCode = 400;
    throw err;
  }

  request.status = "REJECTED";
  request.reviewedBy = reviewerId;
  request.reviewedAt = new Date();
  request.reviewRemarks = remarks || "";
  await request.save();

  const employee = await Employee.findById(request.employee);
  if (employee?.profileCompletionStatus === "pending_hr") {
    await Employee.findByIdAndUpdate(employee._id, {
      profileCompletionStatus: "pending_employee",
    });
  }

  try {
    await notifyEmployeeProfileDecision({
      employee,
      request,
      approved: false,
      actor: { id: reviewerId },
      remarks,
    });
  } catch (notifyErr) {
    console.error("Profile rejection notification failed:", notifyErr);
  }

  return { request, employee };
};

export const listPendingProfileChangeRequests = async ({ limit = 50 }) => {
  const rows = await EmployeeProfileChangeRequest.find({ status: "PENDING" })
    .populate("employee", "firstName middleName lastName email department designation employeeCode")
    .populate("submittedBy", "email firstName lastName")
    .sort({ submittedAt: -1, createdAt: -1 })
    .limit(Math.min(limit, 200))
    .lean();

  return rows;
};
