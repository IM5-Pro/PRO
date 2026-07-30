import bcrypt from "bcrypt";
import crypto from "crypto";
import User from "../models/User.js";
import Employee from "../models/Employee.js";
import Role from "../models/Role.js";
import Roles from "../constants/roles.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";
import { isValidEmail, isValidPassword } from "../utils/validators.js";
import { createUserOrThrow } from "./userService.js";
import {
  clearAuthCookies,
  getRefreshTokenFromRequest,
  setAuthCookies,
  shouldExposeTokensInBody,
} from "../utils/sessionCookies.js";

export const BCRYPT_SALT_ROUNDS = Number.parseInt(process.env.BCRYPT_SALT_ROUNDS || "12", 10);
export const MAX_LOGIN_ATTEMPTS = 5;
export const LOGIN_LOCK_MINUTES = 15;
export const PASSWORD_RESET_TOKEN_TTL_MINUTES = 15;
export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const PASSWORD_VALIDATION_MESSAGE =
  "Password must be at least 8 characters and include uppercase, lowercase, number, and special character";

export const normalizeEmail = (email) => {
  if (typeof email !== "string") {
    return "";
  }
  return email.toLowerCase().trim();
};

const isEmployeeLoginBlocked = (employee) => {
  if (!employee) {
    return false;
  }

  if (employee.isActive === false) {
    return true;
  }

  const normalizedStatus = String(employee.status || "").trim().toUpperCase();
  if (normalizedStatus === "TERMINATED") {
    return true;
  }

  if (normalizedStatus === "RESIGNED" && employee.isActive !== true) {
    return true;
  }

  return false;
};

export const ensureLinkedEmployeeCanAuthenticate = async (user) => {
  if (!user?.employeeId) {
    return { isBlocked: false };
  }

  const employee = await Employee.findById(user.employeeId).select("isActive status").lean();

  if (isEmployeeLoginBlocked(employee)) {
    return {
      isBlocked: true,
      message: "Employee is deactivated. Please contact HR",
    };
  }

  return { isBlocked: false };
};

export const getUserPermissions = async (roleName) => {
  const roleDoc = await Role.findOne({ name: roleName }).populate("permissions", "name");
  return roleDoc ? roleDoc.permissions.map((permission) => permission.name) : [];
};

export const buildUserResponse = async (user, permissions = []) => {
  if (!user) {
    return null;
  }

  let designation = "";
  let department = "";

  if (user.employeeId) {
    const emp = await Employee.findById(user.employeeId).select("designation department").lean();
    if (emp) {
      designation = emp.designation || "";
      department = emp.department || "";
    }
  }

  return {
    id: user._id,
    email: user.email,
    role: user.role,
    employeeId: user.employeeId || null,
    designation,
    department,
    firstName: user.firstName || "",
    middleName: user.middleName || "",
    lastName: user.lastName || "",
    permissions,
    isActive: user.isActive,
    mustChangePassword: Boolean(user.mustChangePassword),
    lastLogin: user.lastLogin,
  };
};

const generatePasswordResetToken = () => {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  return { token, tokenHash };
};

const attachSessionToResponse = (res, { accessToken, refreshToken, user }) => {
  setAuthCookies(res, { accessToken, refreshToken });

  const payload = { user };
  if (shouldExposeTokensInBody()) {
    payload.accessToken = accessToken;
    payload.refreshToken = refreshToken;
  }

  return payload;
};

export const issueSessionForUser = async (user, res) => {
  const permissions = await getUserPermissions(user.role);
  const accessToken = generateAccessToken({
    id: user._id,
    role: user.role,
    employeeId: user.employeeId || null,
  });
  const issuedRefreshToken = generateRefreshToken({ id: user._id });
  const refreshTokenHash = await bcrypt.hash(issuedRefreshToken, BCRYPT_SALT_ROUNDS);

  user.refreshTokenHash = refreshTokenHash;
  user.refreshTokenExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
  user.failedLoginAttempts = 0;
  user.lockedUntil = undefined;
  user.lastLogin = new Date();
  await user.save();

  const userResponse = await buildUserResponse(user, permissions);
  const data = attachSessionToResponse(res, {
    accessToken,
    refreshToken: issuedRefreshToken,
    user: userResponse,
  });

  return { data, user: userResponse };
};

export const authenticateLogin = async ({ email, password }) => {
  const normalizedEmail = normalizeEmail(email);
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    return { ok: false, status: 401, message: "Invalid email or password" };
  }

  if (!user.isActive) {
    return { ok: false, status: 403, message: "Account is disabled" };
  }

  const employeeAuthStatus = await ensureLinkedEmployeeCanAuthenticate(user);
  if (employeeAuthStatus.isBlocked) {
    return { ok: false, status: 403, message: employeeAuthStatus.message };
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return { ok: false, status: 423, message: "Account temporarily locked due to failed login attempts" };
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    const nextAttempts = (user.failedLoginAttempts || 0) + 1;

    if (nextAttempts >= MAX_LOGIN_ATTEMPTS) {
      user.failedLoginAttempts = 0;
      user.lockedUntil = new Date(Date.now() + LOGIN_LOCK_MINUTES * 60 * 1000);
      await user.save();
      return { ok: false, status: 423, message: "Account temporarily locked due to failed login attempts" };
    }

    user.failedLoginAttempts = nextAttempts;
    await user.save();
    return { ok: false, status: 401, message: "Invalid email or password" };
  }

  return { ok: true, user };
};

export const refreshSession = async (req, res) => {
  const providedRefreshToken = getRefreshTokenFromRequest(req);
  if (!providedRefreshToken) {
    return { ok: false, status: 400, message: "Refresh token is required" };
  }

  let payload;
  try {
    payload = verifyRefreshToken(providedRefreshToken);
  } catch (_verifyError) {
    return { ok: false, status: 401, message: "Invalid refresh token" };
  }

  const userId = payload.id || payload.sub;
  const user = await User.findById(userId);
  if (!user || !user.refreshTokenHash) {
    return { ok: false, status: 401, message: "Invalid refresh token" };
  }

  if (!user.isActive) {
    return { ok: false, status: 403, message: "Account is disabled" };
  }

  const employeeAuthStatus = await ensureLinkedEmployeeCanAuthenticate(user);
  if (employeeAuthStatus.isBlocked) {
    return { ok: false, status: 403, message: employeeAuthStatus.message };
  }

  if (user.refreshTokenExpiresAt && user.refreshTokenExpiresAt < new Date()) {
    return { ok: false, status: 401, message: "Refresh token expired" };
  }

  const isTokenMatch = await bcrypt.compare(providedRefreshToken, user.refreshTokenHash);
  if (!isTokenMatch) {
    return { ok: false, status: 401, message: "Invalid refresh token" };
  }

  const permissions = await getUserPermissions(user.role);
  const accessToken = generateAccessToken({
    id: user._id,
    role: user.role,
    employeeId: user.employeeId || null,
  });
  const newRefreshToken = generateRefreshToken({ id: user._id });
  const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, BCRYPT_SALT_ROUNDS);

  user.refreshTokenHash = newRefreshTokenHash;
  user.refreshTokenExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
  await user.save();

  const userResponse = await buildUserResponse(user, permissions);
  const data = attachSessionToResponse(res, {
    accessToken,
    refreshToken: newRefreshToken,
    user: userResponse,
  });

  return { ok: true, data };
};

export const invalidateSession = async (userId, res) => {
  if (userId) {
    await User.findByIdAndUpdate(userId, {
      $unset: {
        refreshTokenHash: "",
        refreshTokenExpiresAt: "",
      },
    });
  }

  clearAuthCookies(res);
};

export const getCurrentSessionUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user || !user.isActive) {
    return null;
  }

  const employeeAuthStatus = await ensureLinkedEmployeeCanAuthenticate(user);
  if (employeeAuthStatus.isBlocked) {
    return null;
  }

  return buildUserResponse(user, await getUserPermissions(user.role));
};

export const registerSuperAdminAccount = async ({ email, password }) => {
  const normalizedEmail = normalizeEmail(email);
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    return { ok: false, status: 409, message: "Email already registered", details: { email: "This email is already in use" } };
  }

  const existingSuperAdmin = await User.findOne({ role: Roles.SUPER_ADMIN }).lean();
  if (existingSuperAdmin) {
    return {
      ok: false,
      status: 403,
      message: "Super admin already exists",
      details: { role: "SUPER_ADMIN" },
    };
  }

  const hash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
  const user = await User.create({
    email: normalizedEmail,
    password: hash,
    role: Roles.SUPER_ADMIN,
  });

  return { ok: true, user };
};

export const registerRoleAccount = async ({ creatorRole, creatorId, payload, targetRole }) => {
  const user = await createUserOrThrow({
    creatorRole,
    creatorId,
    payload: {
      ...payload,
      role: targetRole,
    },
  });

  return { ok: true, user };
};

export const processForgotPassword = async (email) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
    return { ok: false, status: 400, message: "A valid email is required" };
  }

  const user = await User.findOne({ email: normalizedEmail });
  let resetToken;
  if (user) {
    const resetPayload = generatePasswordResetToken();
    resetToken = resetPayload.token;
    user.passwordResetTokenHash = resetPayload.tokenHash;
    user.passwordResetTokenExpiresAt = new Date(
      Date.now() + PASSWORD_RESET_TOKEN_TTL_MINUTES * 60 * 1000,
    );
    await user.save();
  }

  const responseData = {};
  if (resetToken) {
    responseData.resetToken = resetToken;
  }

  return { ok: true, data: responseData };
};

export const processForgotUsername = async (phoneNumber) => {
  const normalizedPhoneNumber = String(phoneNumber || "").trim();
  if (!normalizedPhoneNumber) {
    return { ok: false, status: 400, message: "Phone number is required" };
  }

  const employee = await Employee.findOne({ phoneNumber: normalizedPhoneNumber }).select("_id").lean();
  const responseData = {};

  if (employee?._id) {
    const user = await User.findOne({ employeeId: employee._id }).select("email").lean();
    if (user?.email) {
      const [localPart, domainPart] = user.email.split("@");
      const safeLocal = String(localPart || "");
      const maskedLocal =
        safeLocal.length <= 2
          ? `${safeLocal.slice(0, 1)}*`
          : `${safeLocal.slice(0, 1)}${"*".repeat(Math.max(1, safeLocal.length - 2))}${safeLocal.slice(-1)}`;

      responseData.usernameHint = `${maskedLocal}@${domainPart || "ispace.com"}`;
      if (process.env.NODE_ENV !== "production") {
        responseData.username = user.email;
      }
    }
  }

  return { ok: true, data: responseData };
};

export const processResetPassword = async ({ resetToken, password }) => {
  if (!resetToken || typeof resetToken !== "string") {
    return { ok: false, status: 400, message: "Reset token is required" };
  }

  if (!isValidPassword(password)) {
    return { ok: false, status: 400, message: PASSWORD_VALIDATION_MESSAGE };
  }

  const tokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
  const user = await User.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetTokenExpiresAt: { $gt: new Date() },
  });

  if (!user) {
    return { ok: false, status: 400, message: "Invalid or expired reset token" };
  }

  user.password = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
  user.passwordResetTokenHash = undefined;
  user.passwordResetTokenExpiresAt = undefined;
  user.refreshTokenHash = undefined;
  user.refreshTokenExpiresAt = undefined;
  await user.save();

  return { ok: true };
};

export const processChangePassword = async ({ userId, oldPassword, newPassword }) => {
  if (!oldPassword || !newPassword) {
    return { ok: false, status: 400, message: "Old password and new password are required" };
  }

  if (!isValidPassword(newPassword)) {
    return { ok: false, status: 400, message: PASSWORD_VALIDATION_MESSAGE };
  }

  const user = await User.findById(userId);
  if (!user) {
    return { ok: false, status: 404, message: "User not found" };
  }

  const valid = await bcrypt.compare(oldPassword, user.password);
  if (!valid) {
    return { ok: false, status: 401, message: "Invalid old password" };
  }

  user.password = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
  user.refreshTokenHash = undefined;
  user.refreshTokenExpiresAt = undefined;
  await user.save();

  return { ok: true };
};

export const processCompleteInitialPassword = async ({ userId, password, confirmPassword }) => {
  if (!password || !confirmPassword) {
    return { ok: false, status: 400, message: "Password and confirm password are required" };
  }

  if (password !== confirmPassword) {
    return { ok: false, status: 400, message: "Password and confirm password must match" };
  }

  if (!isValidPassword(password)) {
    return { ok: false, status: 400, message: PASSWORD_VALIDATION_MESSAGE };
  }

  const user = await User.findById(userId);
  if (!user) {
    return { ok: false, status: 404, message: "User not found" };
  }

  if (!user.mustChangePassword) {
    return { ok: false, status: 400, message: "Initial password change is not required for this account" };
  }

  user.password = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
  user.mustChangePassword = false;
  user.failedLoginAttempts = 0;
  user.lockedUntil = undefined;
  await user.save();

  return {
    ok: true,
    user: await buildUserResponse(user, await getUserPermissions(user.role)),
  };
};
