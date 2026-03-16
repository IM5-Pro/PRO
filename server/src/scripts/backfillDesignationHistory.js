import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Roles from "../constants/roles.js";
import Designation from "../models/Designation.js";
import Employee from "../models/Employee.js";
import EmployeeDesignationHistory from "../models/EmployeeDesignationHistory.js";
import User from "../models/User.js";
import {
  buildEmployeeDesignationFilter,
  resolveDesignation,
} from "../services/designationAssignmentService.js";

const getFallbackActorId = async () => {
  if (process.env.BACKFILL_USER_ID && mongoose.Types.ObjectId.isValid(process.env.BACKFILL_USER_ID)) {
    return new mongoose.Types.ObjectId(process.env.BACKFILL_USER_ID);
  }

  const adminUser = await User.findOne({
    role: { $in: [Roles.SUPER_ADMIN, Roles.HR_ADMIN] },
    isActive: true,
  })
    .select("_id")
    .lean();

  return adminUser?._id || null;
};

const backfillDesignationHistory = async () => {
  await connectDB();

  const summary = {
    scanned: 0,
    historiesCreated: 0,
    employeesNormalized: 0,
    skipped: 0,
    conflicts: 0,
    unresolved: [],
  };

  try {
    const fallbackActorId = await getFallbackActorId();
    const employees = await Employee.find({
      designation: { $exists: true, $nin: [null, ""] },
    })
      .select("_id firstName lastName email designation joinDate joiningDate createdAt createdBy updatedBy")
      .sort({ _id: 1 });

    summary.scanned = employees.length;

    for (const employee of employees) {
      const designation = await resolveDesignation(employee.designation);
      if (!designation) {
        summary.skipped += 1;
        summary.unresolved.push({
          employeeId: employee._id.toString(),
          email: employee.email,
          reason: `Unable to resolve designation '${employee.designation}'`,
        });
        continue;
      }

      const actorId = employee.updatedBy || employee.createdBy || fallbackActorId;
      if (!actorId) {
        summary.skipped += 1;
        summary.unresolved.push({
          employeeId: employee._id.toString(),
          email: employee.email,
          reason: "No actor available for changedBy; set BACKFILL_USER_ID or ensure an active admin user exists",
        });
        continue;
      }

      const activeHistory = await EmployeeDesignationHistory.findOne({
        employeeId: employee._id,
        effectiveTo: null,
      })
        .sort({ effectiveFrom: -1 })
        .lean();

      const designationId = String(designation._id);
      const currentValue = String(employee.designation || "");

      if (activeHistory && String(activeHistory.designationId) !== designationId) {
        summary.conflicts += 1;
        summary.unresolved.push({
          employeeId: employee._id.toString(),
          email: employee.email,
          reason: "Active designation history conflicts with the current employee designation",
        });
        continue;
      }

      if (!activeHistory) {
        await EmployeeDesignationHistory.create({
          employeeId: employee._id,
          designationId: designation._id,
          departmentId: designation.department || null,
          effectiveFrom: employee.joinDate || employee.joiningDate || employee.createdAt || new Date(),
          changedBy: actorId,
          reason: "BACKFILL",
        });
        summary.historiesCreated += 1;
      }

      if (currentValue !== designationId) {
        employee.designation = designationId;
        employee.updatedBy = actorId;
        await employee.save();
        summary.employeesNormalized += 1;
      }
    }

    const designations = await Designation.find({}).select("_id name");
    for (const designation of designations) {
      const employeeCount = await Employee.countDocuments({
        ...buildEmployeeDesignationFilter(designation),
        isActive: true,
      });

      await Designation.updateOne(
        { _id: designation._id },
        { $set: { employeeCount } },
      );
    }

    console.log("Designation history backfill summary:", summary);
  } catch (error) {
    console.error("Designation history backfill failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

backfillDesignationHistory();