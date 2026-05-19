import mongoose from "mongoose";
import Resignation from "../models/Resignation.js";
import Employee from "../models/Employee.js";
import User from "../models/User.js";

const startOfUtcDay = (d) => {
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) {
    return null;
  }
  return new Date(Date.UTC(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate()));
};

/**
 * Notice is over the day after approved last working day (last day inclusive).
 */
export const isNoticePeriodEnded = (approvedLastDayOfWork) => {
  const last = startOfUtcDay(approvedLastDayOfWork);
  if (!last) {
    return true;
  }
  const today = startOfUtcDay(new Date());
  return today > last;
};

/**
 * During notice: force login account to EMPLOYEE while preserving prior role for audit.
 */
export const applyNoticePeriodRoleDowngrade = async (employeeId, session = null) => {
  if (!employeeId) {
    return null;
  }

  let query = User.findOne({ employeeId }).select("_id role roleBeforeResignationNotice");
  if (session) {
    query = query.session(session);
  }

  const user = await query;
  if (!user) {
    return null;
  }

  if (user.role === "EMPLOYEE") {
    return user;
  }

  if (!user.roleBeforeResignationNotice) {
    user.roleBeforeResignationNotice = user.role;
  }
  user.role = "EMPLOYEE";
  await user.save({ session });
  return user;
};

/**
 * After notice: mark resignation completed, employee resigned, user account disabled.
 * Idempotent: only transitions from HR_APPROVED when notice period has ended.
 */
export const finalizeResignationAfterNotice = async (resignationId, actorUserId = null, session = null) => {
  let q = Resignation.findOne({
    _id: resignationId,
    status: "HR_APPROVED",
  }).select("employeeId approvedLastDayOfWork requestedLastDayOfWork hrApprovedBy updatedBy");
  if (session) {
    q = q.session(session);
  }
  const resignation = await q.lean();

  if (!resignation) {
    return { updated: false, reason: "not_hr_approved_or_missing" };
  }

  const lastDay = resignation.approvedLastDayOfWork || resignation.requestedLastDayOfWork;
  if (!lastDay || !isNoticePeriodEnded(lastDay)) {
    return { updated: false, reason: "notice_still_active" };
  }

  const actor = actorUserId || resignation.hrApprovedBy || resignation.updatedBy;
  const employeeId = resignation.employeeId;

  const statusUpdate = await Resignation.updateOne(
    { _id: resignationId, status: "HR_APPROVED" },
    {
      $set: {
        status: "COMPLETED",
        actualLastDayOfWork: new Date(lastDay),
        updatedBy: actor || undefined,
        updatedAt: new Date(),
      },
    },
    { session },
  );

  if (statusUpdate.modifiedCount === 0) {
    return { updated: false, reason: "already_finalized" };
  }

  let empQuery = Employee.findById(employeeId).select("status");
  if (session) {
    empQuery = empQuery.session(session);
  }
  const emp = await empQuery.lean();

  if (emp && String(emp.status || "").toUpperCase() !== "RESIGNED") {
    await Employee.findByIdAndUpdate(
      employeeId,
      {
        status: "RESIGNED",
        isActive: false,
        $push: {
          statusHistory: {
            status: "RESIGNED",
            changedAt: new Date(),
            changedBy: actor || undefined,
          },
        },
      },
      { session },
    );
  } else if (emp) {
    await Employee.findByIdAndUpdate(
      employeeId,
      { $set: { isActive: false } },
      { session },
    );
  }

  await User.updateMany(
    { employeeId },
    {
      $set: {
        isActive: false,
        role: "EMPLOYEE",
      },
      $unset: {
        refreshTokenHash: "",
        refreshTokenExpiresAt: "",
      },
    },
    { session },
  );

  return { updated: true };
};

export const processResignationNoticeCompletions = async () => {
  const startToday = startOfUtcDay(new Date());
  const candidates = await Resignation.find({
    status: "HR_APPROVED",
    approvedLastDayOfWork: { $lt: startToday },
  })
    .select("_id")
    .lean();

  let completed = 0;
  for (const row of candidates) {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const res = await finalizeResignationAfterNotice(row._id, null, session);
        if (res.updated) {
          completed += 1;
        }
      });
    } catch (err) {
      console.error("[resignationNotice] finalize failed for", row._id, err);
    } finally {
      session.endSession();
    }
  }

  if (completed > 0) {
    console.log(`[resignationNotice] Completed ${completed} resignation(s) after notice period`);
  }
  return { completed };
};
