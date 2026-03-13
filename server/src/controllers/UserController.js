import bcrypt from "bcrypt";
import User from "../models/User.js";
import Employee from "../models/Employee.js";
import { sendError, sendSuccess } from "../utils/response.js";

const createUser = async (req, res) => {
  try {
    const {
      email,
      password,
      role,
      firstName,
      lastName,
      employeeId,
    } = req.body;

    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedRole = String(role || "").trim().toUpperCase();

    const creatorRole = req.user.role;

    if (!normalizedEmail || !password || !normalizedRole) {
      return sendError(res, 400, "Email, password, and role are required");
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return sendError(res, 409, "User already exists with this email");
    }

    let linkedEmployee = null;
    if (employeeId) {
      linkedEmployee = await Employee.findById(employeeId)
        .select("_id email firstName lastName")
        .lean();

      if (!linkedEmployee) {
        return sendError(res, 404, "Linked employee not found");
      }
    }

    if (creatorRole === "SUPER_ADMIN") {
      if (!["HR_ADMIN", "MANAGER", "EMPLOYEE"].includes(normalizedRole)) {
        return sendError(res, 403, "Invalid role creation");
      }
    }

    if (creatorRole === "HR_ADMIN") {
      if (!["MANAGER", "EMPLOYEE"].includes(normalizedRole)) {
        return sendError(res, 403, "Invalid role creation");
      }
    }

    if (creatorRole === "MANAGER" || creatorRole === "EMPLOYEE") {
      return sendError(res, 403, "You cannot create users");
    }

    const hash = await bcrypt.hash(password, 10);

    const resolvedFirstName =
      typeof firstName === "string" && firstName.trim().length > 0
        ? firstName.trim()
        : linkedEmployee?.firstName || "";
    const resolvedLastName =
      typeof lastName === "string" && lastName.trim().length > 0
        ? lastName.trim()
        : linkedEmployee?.lastName || "";

    const user = await User.create({
      email: normalizedEmail,
      password: hash,
      role: normalizedRole,
      firstName: resolvedFirstName,
      lastName: resolvedLastName,
      employeeId: linkedEmployee?._id,
      createdBy: req.user.id,
    });

    const safeUser = user.toObject();
    delete safeUser.password;

    sendSuccess(res, 201, "User created successfully", { data: safeUser });
  } catch (err) {
    sendError(res, 500, "Internal server error", err.message);
  }
};

const getEmployees = async (req, res) => {
  const users = await User.find({
    role: "EMPLOYEE",
  });

  sendSuccess(res, 200, "Employees retrieved successfully", users);
};

// Read user by ID
const readUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return sendError(res, 404, "User not found");
    sendSuccess(res, 200, "User retrieved successfully", user);
  } catch (err) {
    sendError(res, 500, "Internal server error", err.message);
  }
};

// Update user by ID
const updateUser = async (req, res) => {
  try {
    const { email, role, isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { email, role, isActive } },
      { new: true },
    );
    if (!user) return sendError(res, 404, "User not found");
    sendSuccess(res, 200, "User updated successfully", user);
  } catch (err) {
    sendError(res, 500, "Internal server error", err.message);
  }
};

// Delete user by ID
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return sendError(res, 404, "User not found");
    sendSuccess(res, 200, "User deleted successfully");
  } catch (err) {
    sendError(res, 500, "Internal server error", err.message);
  }
};

// Activate user
const activateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive: true } },
      { new: true },
    );
    if (!user) return sendError(res, 404, "User not found");
    sendSuccess(res, 200, "User activated successfully", user);
  } catch (err) {
    sendError(res, 500, "Internal server error", err.message);
  }
};

// Deactivate user
const deactivateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive: false } },
      { new: true },
    );
    if (!user) return sendError(res, 404, "User not found");
    sendSuccess(res, 200, "User deactivated successfully", user);
  } catch (err) {
    sendError(res, 500, "Internal server error", err.message);
  }
};

// Assign role to user
const assignRole = async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { role } },
      { new: true },
    );
    if (!user) return sendError(res, 404, "User not found");
    sendSuccess(res, 200, "Role assigned successfully", user);
  } catch (err) {
    sendError(res, 500, "Internal server error", err.message);
  }
};

// Remove role from user
const removeRole = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $unset: { role: "" } },
      { new: true },
    );
    if (!user) return sendError(res, 404, "User not found");
    sendSuccess(res, 200, "Role removed successfully", user);
  } catch (err) {
    sendError(res, 500, "Internal server error", err.message);
  }
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const hash = await bcrypt.hash(password, 10);
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { password: hash } },
      { new: true },
    );
    if (!user) return sendError(res, 404, "User not found");
    sendSuccess(res, 200, "Password reset successfully", user);
  } catch (err) {
    sendError(res, 500, "Internal server error", err.message);
  }
};

export default {
  createUser,
  getEmployees,
  readUser,
  updateUser,
  deleteUser,
  activateUser,
  deactivateUser,
  assignRole,
  removeRole,
  resetPassword,
};