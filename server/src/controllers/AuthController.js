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
import {
  isValidEmail,
  isValidPassword,
  validateRegisterSuperAdmin,
  validateLogin,
} from "../utils/validators.js";
import { sendError, sendSuccess } from "../utils/response.js";
import { createUserOrThrow } from "../services/userService.js";

const BCRYPT_SALT_ROUNDS = Number.parseInt(process.env.BCRYPT_SALT_ROUNDS || "12", 10);
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCK_MINUTES = 15;
const PASSWORD_RESET_TOKEN_TTL_MINUTES = 15;
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const PASSWORD_VALIDATION_MESSAGE = "Password must be at least 8 characters and include uppercase, lowercase, number, and special character";

const isEmployeeLoginBlocked = (employee) => {
  if (!employee) {
    return false;
  }

  const normalizedStatus = String(employee.status || "").trim().toUpperCase();
  return employee.isActive === false || (normalizedStatus && normalizedStatus !== "ACTIVE");
};

const ensureLinkedEmployeeCanAuthenticate = async (user) => {
  if (!user?.employeeId) {
    return { isBlocked: false };
  }

  const employee = await Employee.findById(user.employeeId)
    .select("isActive status")
    .lean();

  if (isEmployeeLoginBlocked(employee)) {
    return {
      isBlocked: true,
      message: "Employee is deactivated. Please contact HR",
    };
  }

  return { isBlocked: false };
};

const normalizeEmail = (email) => {
  if (typeof email !== "string") {
    return "";
  }
  return email.toLowerCase().trim();
};

const getUserPermissions = async (roleName) => {
  const roleDoc = await Role.findOne({ name: roleName }).populate("permissions", "name");
  return roleDoc ? roleDoc.permissions.map((permission) => permission.name) : [];
};

const toUserResponse = (user, permissions = []) => ({
  id: user._id,
  email: user.email,
  role: user.role,
  employeeId: user.employeeId || null,
  permissions,
  isActive: user.isActive,
  mustChangePassword: Boolean(user.mustChangePassword),
  lastLogin: user.lastLogin,
});

const generatePasswordResetToken = () => {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  return { token, tokenHash };
};

const registerSuperAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    // Validate request body
    const validation = validateRegisterSuperAdmin({ ...req.body, email: normalizedEmail });
    if (!validation.isValid) {
      return sendError(res, 400, "Validation failed", validation.errors);
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return sendError(res, 409, "Email already registered", { email: "This email is already in use" });
    }

    const existingSuperAdmin = await User.findOne({ role: Roles.SUPER_ADMIN });
    if (existingSuperAdmin) {
      return sendError(res, 403, "Super admin already exists");
    }

    const hash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    const user = await User.create({
      email: normalizedEmail,
      password: hash,
      role: Roles.SUPER_ADMIN,
    });

    return sendSuccess(res, 201, "Super admin registered successfully", {
      data: toUserResponse(user),
    });
  } catch (err) {
    console.error("Register error:", err);
    return sendError(res, 500, "Internal server error", { error: err.message });
  }
};

const registerUser = async (req, res, targetRole) => {
  try {
    // Only SUPER_ADMIN or HR_ADMIN can register other users
    if (!req.user || (req.user.role !== Roles.SUPER_ADMIN && req.user.role !== Roles.HR_ADMIN)) {
      return sendError(res, 403, "Access denied");
    }

    const user = await createUserOrThrow({
      creatorRole: req.user.role,
      creatorId: req.user.id,
      payload: {
        ...req.body,
        role: targetRole,
      },
    });

    return sendSuccess(res, 201, `${targetRole} created successfully`, {
      data: toUserResponse(user),
    });
  } catch (err) {
    console.error(`Register ${targetRole} error:`, err);
    const status = err.status || 500;
    return sendError(res, status, err.message, err.details);
  }
};

const registerHrAdmin = async (req, res) => registerUser(req, res, Roles.HR_ADMIN);
const registerManager = async (req, res) => registerUser(req, res, Roles.MANAGER);
const registerEmployee = async (req, res) => registerUser(req, res, Roles.EMPLOYEE);

const login = async (req, res) => {
  try {
    // Validate request body
    const validation = validateLogin(req.body);
    if (!validation.isValid) {
      return sendError(res, 400, "Validation failed", validation.errors);
    }

    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return sendError(res, 401, "Invalid email or password");
    }

    if (!user.isActive) {
      return sendError(res, 403, "Account is disabled");
    }

    const employeeAuthStatus = await ensureLinkedEmployeeCanAuthenticate(user);
    if (employeeAuthStatus.isBlocked) {
      return sendError(res, 403, employeeAuthStatus.message);
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return sendError(res, 423, "Account temporarily locked due to failed login attempts");
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      const nextAttempts = (user.failedLoginAttempts || 0) + 1;

      if (nextAttempts >= MAX_LOGIN_ATTEMPTS) {
        user.failedLoginAttempts = 0;
        user.lockedUntil = new Date(Date.now() + LOGIN_LOCK_MINUTES * 60 * 1000);
        await user.save();
        return sendError(res, 423, "Account temporarily locked due to failed login attempts");
      }

      user.failedLoginAttempts = nextAttempts;
      await user.save();
      return sendError(res, 401, "Invalid email or password");
    }

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

    return sendSuccess(res, 200, "Login successful", {
      data: {
        accessToken,
        refreshToken: issuedRefreshToken,
        user: toUserResponse(user, permissions),
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return sendError(res, 500, "Internal server error", { error: err.message });
  }
};

// Logout: invalidate refresh token
const logout = async (req, res) => {
  try {
    if (!req.user?.id) {
      return sendError(res, 401, "Unauthorized");
    }

    await User.findByIdAndUpdate(req.user.id, {
      $unset: {
        refreshTokenHash: "",
        refreshTokenExpiresAt: "",
      },
    });

    return sendSuccess(res, 200, "Logged out");
  } catch (err) {
    return sendError(res, 500, "Internal server error", { error: err.message });
  }
};

// Refresh token: issue new access token
const refreshToken = async (req, res) => {
  try {
    const { refreshToken: providedRefreshToken } = req.body;
    if (!providedRefreshToken || typeof providedRefreshToken !== "string") {
      return sendError(res, 400, "Refresh token is required");
    }

    let payload;
    try {
      payload = verifyRefreshToken(providedRefreshToken);
    } catch (_verifyError) {
      return sendError(res, 401, "Invalid refresh token");
    }

    const userId = payload.id || payload.sub;
    const user = await User.findById(userId);
    if (!user || !user.refreshTokenHash) {
      return sendError(res, 401, "Invalid refresh token");
    }

    if (!user.isActive) {
      return sendError(res, 403, "Account is disabled");
    }

    const employeeAuthStatus = await ensureLinkedEmployeeCanAuthenticate(user);
    if (employeeAuthStatus.isBlocked) {
      return sendError(res, 403, employeeAuthStatus.message);
    }

    if (user.refreshTokenExpiresAt && user.refreshTokenExpiresAt < new Date()) {
      return sendError(res, 401, "Refresh token expired");
    }

    const isTokenMatch = await bcrypt.compare(providedRefreshToken, user.refreshTokenHash);
    if (!isTokenMatch) {
      return sendError(res, 401, "Invalid refresh token");
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

    return sendSuccess(res, 200, "Token refreshed", {
      data: {
        accessToken,
        refreshToken: newRefreshToken,
        user: toUserResponse(user, permissions),
      },
    });
  } catch (err) {
    return sendError(res, 500, "Internal server error", { error: err.message });
  }
};

// Forgot password: mock email
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      return sendError(res, 400, "A valid email is required");
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
    if (resetToken && process.env.NODE_ENV !== "production") {
      responseData.resetToken = resetToken;
    }

    return sendSuccess(res, 200, "If the email exists, a password reset link has been sent", {
      data: responseData,
    });
  } catch (err) {
    return sendError(res, 500, "Internal server error", { error: err.message });
  }
};

// Forgot username: now works as Forgot Email ID using phone number
const forgotUsername = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    const normalizedPhoneNumber = String(phoneNumber || "").trim();

    if (!normalizedPhoneNumber) {
      return sendError(res, 400, "Phone number is required");
    }

    const employee = await Employee.findOne({ phoneNumber: normalizedPhoneNumber })
      .select("_id")
      .lean();

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

    return sendSuccess(res, 200, "If the phone number exists, email ID details have been sent", {
      data: responseData,
    });
  } catch (err) {
    return sendError(res, 500, "Internal server error", { error: err.message });
  }
};

// Reset password: set new password
const resetPassword = async (req, res) => {
  try {
    const { resetToken, password } = req.body;

    if (!resetToken || typeof resetToken !== "string") {
      return sendError(res, 400, "Reset token is required");
    }

    if (!isValidPassword(password)) {
      return sendError(res, 400, PASSWORD_VALIDATION_MESSAGE);
    }

    const tokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");

    const user = await User.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetTokenExpiresAt: { $gt: new Date() },
    });

    if (!user) {
      return sendError(res, 400, "Invalid or expired reset token");
    }

    user.password = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    user.passwordResetTokenHash = undefined;
    user.passwordResetTokenExpiresAt = undefined;
    user.refreshTokenHash = undefined;
    user.refreshTokenExpiresAt = undefined;
    await user.save();

    return sendSuccess(res, 200, "Password reset successfully");
  } catch (err) {
    return sendError(res, 500, "Internal server error", { error: err.message });
  }
};

// Change password for logged-in user
const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return sendError(res, 400, "Old password and new password are required");
    }

    if (!isValidPassword(newPassword)) {
      return sendError(res, 400, PASSWORD_VALIDATION_MESSAGE);
    }

    const user = await User.findById(req.user.id);
    if (!user) return sendError(res, 404, "User not found");
    const valid = await bcrypt.compare(oldPassword, user.password);
    if (!valid) {
      return sendError(res, 401, "Invalid old password");
    }

    user.password = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
    user.refreshTokenHash = undefined;
    user.refreshTokenExpiresAt = undefined;
    await user.save();
    return sendSuccess(res, 200, "Password changed");
  } catch (err) {
    return sendError(res, 500, "Internal server error", { error: err.message });
  }
};

const completeInitialPassword = async (req, res) => {
  try {
    const { password, confirmPassword } = req.body;

    if (!password || !confirmPassword) {
      return sendError(res, 400, "Password and confirm password are required");
    }

    if (password !== confirmPassword) {
      return sendError(res, 400, "Password and confirm password must match");
    }

    if (!isValidPassword(password)) {
      return sendError(res, 400, PASSWORD_VALIDATION_MESSAGE);
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return sendError(res, 404, "User not found");
    }

    if (!user.mustChangePassword) {
      return sendError(res, 400, "Initial password change is not required for this account");
    }

    user.password = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    user.mustChangePassword = false;
    user.failedLoginAttempts = 0;
    user.lockedUntil = undefined;
    await user.save();

    return sendSuccess(res, 200, "Password created successfully", {
      data: {
        user: toUserResponse(user, await getUserPermissions(user.role)),
      },
    });
  } catch (err) {
    return sendError(res, 500, "Internal server error", { error: err.message });
  }
};

// MFA enable (mock)
const mfaEnable = async (req, res) => {
  return sendSuccess(res, 200, "MFA enabled (mock)");
};

// MFA disable (mock)
const mfaDisable = async (req, res) => {
  return sendSuccess(res, 200, "MFA disabled (mock)");
};

// Session view (mock)
const sessionView = async (req, res) => {
  return sendSuccess(res, 200, "Sessions retrieved", {
    data: {
      sessions: [{ id: "mock-session", user: req.user.id }],
    },
  });
};

// Session terminate (mock)
const sessionTerminate = async (req, res) => {
  return sendSuccess(res, 200, "Session terminated (mock)");
};

export default {
  registerSuperAdmin,
  registerHrAdmin,
  registerManager,
  registerEmployee,
  login,
  logout,
  refreshToken,
  forgotUsername,
  forgotPassword,
  resetPassword,
  changePassword,
  completeInitialPassword,
  mfaEnable,
  mfaDisable,
  sessionView,
  sessionTerminate,
};