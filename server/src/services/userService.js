import bcrypt from "bcrypt";
import User from "../models/User.js";
import Employee from "../models/Employee.js";
import { validateCreateUser, canCreateRole } from "../utils/validators.js";

const BCRYPT_SALT_ROUNDS = Number.parseInt(process.env.BCRYPT_SALT_ROUNDS || "12", 10);

/**
 * Normalize email for consistent storage and lookup.
 */
const normalizeEmail = (email) => {
  if (typeof email !== "string") return "";
  return email.trim().toLowerCase();
};

/**
 * Creates a new user including role permission checks.
 * Returns the created user (without the password field).
 */
export const createUser = async ({ creatorRole, creatorId, payload }) => {
  const { email, password, role, firstName, lastName, employeeId } = payload;

  const normalizedEmail = normalizeEmail(email);
  const normalizedRole = String(role || "").trim().toUpperCase();

  const validation = validateCreateUser({ ...payload, email: normalizedEmail, role: normalizedRole });
  if (!validation.isValid) {
    const error = new Error("Validation failed");
    error.details = validation.errors;
    error.status = 400;
    throw error;
  }

  if (!canCreateRole(creatorRole, normalizedRole)) {
    const error = new Error("Insufficient privileges to create this role");
    error.status = 403;
    throw error;
  }

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    const error = new Error("Email already registered");
    error.status = 409;
    error.details = { email: "This email is already in use" };
    throw error;
  }

  let linkedEmployee = null;
  if (employeeId) {
    linkedEmployee = await Employee.findById(employeeId)
      .select("_id email firstName lastName")
      .lean();

    if (!linkedEmployee) {
      const error = new Error("Linked employee not found");
      error.status = 404;
      throw error;
    }
  }

  const hash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  const user = await User.create({
    email: normalizedEmail,
    password: hash,
    role: normalizedRole,
    firstName: typeof firstName === "string" && firstName.trim() ? firstName.trim() : linkedEmployee?.firstName || "",
    lastName: typeof lastName === "string" && lastName.trim() ? lastName.trim() : linkedEmployee?.lastName || "",
    employeeId: linkedEmployee?._id || null,
    createdBy: creatorId,
    isActive: true,
  });

  const safeUser = user.toObject();
  delete safeUser.password;
  return safeUser;
};

/**
 * Throws an error with status property so controllers can handle status-specific responses.
 */
export const createUserOrThrow = async (options) => {
  try {
    return await createUser(options);
  } catch (err) {
    // Pass through.
    throw err;
  }
};
