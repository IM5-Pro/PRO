import Roles from "../constants/roles.js";
import User from "../models/User.js";
import {
  validateRegisterSuperAdmin,
  validateLogin,
} from "../utils/validators.js";
import { sendError, sendSuccess } from "../utils/response.js";
import {
  authenticateLogin,
  getCurrentSessionUser,
  invalidateSession,
  issueSessionForUser,
  processChangePassword,
  processCompleteInitialPassword,
  processForgotPassword,
  processForgotUsername,
  processResetPassword,
  refreshSession,
  registerRoleAccount,
  registerSuperAdminAccount,
  buildUserResponse,
} from "../services/authService.js";

const matchesSuperAdminSetupKey = (req) => {
  const configuredSetupKey = String(process.env.SUPER_ADMIN_SETUP_KEY || "").trim();
  if (!configuredSetupKey) {
    return process.env.NODE_ENV !== "production";
  }

  const providedSetupKey = String(
    req.body?.setupKey || req.headers?.["x-setup-key"] || "",
  ).trim();

  return providedSetupKey && providedSetupKey === configuredSetupKey;
};

const registerSuperAdmin = async (req, res) => {
  try {
    if (!matchesSuperAdminSetupKey(req)) {
      return sendError(res, 403, "Invalid setup key");
    }

    const { email, password } = req.body;
    const validation = validateRegisterSuperAdmin({ ...req.body, email });
    if (!validation.isValid) {
      return sendError(res, 400, "Validation failed", validation.errors);
    }

    const result = await registerSuperAdminAccount({ email, password });
    if (!result.ok) {
      return sendError(res, result.status, result.message, result.details);
    }

    return sendSuccess(res, 201, "Super admin registered successfully", {
      data: await buildUserResponse(result.user, []),
    });
  } catch (err) {
    console.error("Register error:", err);
    return sendError(res, 500, "Internal server error", { error: err.message });
  }
};

const registerUser = async (req, res, targetRole) => {
  try {
    if (!req.user || (req.user.role !== Roles.SUPER_ADMIN && req.user.role !== Roles.HR_ADMIN)) {
      return sendError(res, 403, "Access denied");
    }

    const result = await registerRoleAccount({
      creatorRole: req.user.role,
      creatorId: req.user.id,
      payload: req.body,
      targetRole,
    });

    return sendSuccess(res, 201, `${targetRole} created successfully`, {
      data: await buildUserResponse(result.user, []),
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
    const validation = validateLogin(req.body);
    if (!validation.isValid) {
      return sendError(res, 400, "Validation failed", validation.errors);
    }

    const { email, password } = req.body;
    const authResult = await authenticateLogin({ email, password });
    if (!authResult.ok) {
      return sendError(res, authResult.status, authResult.message);
    }

    const { data } = await issueSessionForUser(authResult.user, res);
    return sendSuccess(res, 200, "Login successful", { data });
  } catch (err) {
    console.error("Login error:", err);
    return sendError(res, 500, "Internal server error", { error: err.message });
  }
};

const logout = async (req, res) => {
  try {
    if (!req.user?.id) {
      return sendError(res, 401, "Unauthorized");
    }

    await invalidateSession(req.user.id, res);
    return sendSuccess(res, 200, "Logged out");
  } catch (err) {
    return sendError(res, 500, "Internal server error", { error: err.message });
  }
};

const refreshToken = async (req, res) => {
  try {
    const result = await refreshSession(req, res);
    if (!result.ok) {
      return sendError(res, result.status, result.message);
    }

    return sendSuccess(res, 200, "Token refreshed", { data: result.data });
  } catch (err) {
    return sendError(res, 500, "Internal server error", { error: err.message });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const user = await getCurrentSessionUser(req.user.id);
    if (!user) {
      return sendError(res, 401, "Unauthorized");
    }

    return sendSuccess(res, 200, "Session active", { data: { user } });
  } catch (err) {
    return sendError(res, 500, "Internal server error", { error: err.message });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const result = await processForgotPassword(req.body?.email);
    if (!result.ok) {
      return sendError(res, result.status, result.message);
    }

    return sendSuccess(res, 200, "If the email exists, a password reset link has been sent", {
      data: result.data,
    });
  } catch (err) {
    return sendError(res, 500, "Internal server error", { error: err.message });
  }
};

const forgotUsername = async (req, res) => {
  try {
    const result = await processForgotUsername(req.body?.phoneNumber);
    if (!result.ok) {
      return sendError(res, result.status, result.message);
    }

    return sendSuccess(res, 200, "If the phone number exists, email ID details have been sent", {
      data: result.data,
    });
  } catch (err) {
    return sendError(res, 500, "Internal server error", { error: err.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const result = await processResetPassword(req.body);
    if (!result.ok) {
      return sendError(res, result.status, result.message);
    }

    return sendSuccess(res, 200, "Password reset successfully");
  } catch (err) {
    return sendError(res, 500, "Internal server error", { error: err.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const result = await processChangePassword({
      userId: req.user.id,
      oldPassword: req.body?.oldPassword,
      newPassword: req.body?.newPassword,
    });

    if (!result.ok) {
      return sendError(res, result.status, result.message);
    }

    return sendSuccess(res, 200, "Password changed");
  } catch (err) {
    return sendError(res, 500, "Internal server error", { error: err.message });
  }
};

const completeInitialPassword = async (req, res) => {
  try {
    const result = await processCompleteInitialPassword({
      userId: req.user.id,
      password: req.body?.password,
      confirmPassword: req.body?.confirmPassword,
    });

    if (!result.ok) {
      return sendError(res, result.status, result.message);
    }

    return sendSuccess(res, 200, "Password created successfully", {
      data: { user: result.user },
    });
  } catch (err) {
    return sendError(res, 500, "Internal server error", { error: err.message });
  }
};

const mfaEnable = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $set: {
          mfaEnabled: true,
          mfaUpdatedAt: new Date(),
        },
      },
      { new: true },
    ).select("mfaEnabled");

    if (!user) {
      return sendError(res, 404, "User not found");
    }

    return sendSuccess(res, 200, "MFA enabled", { data: { mfaEnabled: user.mfaEnabled } });
  } catch (err) {
    return sendError(res, 500, "Internal server error", { error: err.message });
  }
};

const mfaDisable = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $set: {
          mfaEnabled: false,
          mfaUpdatedAt: new Date(),
        },
      },
      { new: true },
    ).select("mfaEnabled");

    if (!user) {
      return sendError(res, 404, "User not found");
    }

    return sendSuccess(res, 200, "MFA disabled", { data: { mfaEnabled: user.mfaEnabled } });
  } catch (err) {
    return sendError(res, 500, "Internal server error", { error: err.message });
  }
};

const sessionView = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("lastLogin mfaEnabled").lean();
    if (!user) {
      return sendError(res, 404, "User not found");
    }

    return sendSuccess(res, 200, "Sessions retrieved", {
      data: {
        sessions: [
          {
            id: "current",
            user: req.user.id,
            current: true,
            lastLogin: user.lastLogin || null,
            mfaEnabled: Boolean(user.mfaEnabled),
          },
        ],
      },
    });
  } catch (err) {
    return sendError(res, 500, "Internal server error", { error: err.message });
  }
};

const sessionTerminate = async (req, res) => {
  try {
    await invalidateSession(req.user.id, res);
    return sendSuccess(res, 200, "Session terminated");
  } catch (err) {
    return sendError(res, 500, "Internal server error", { error: err.message });
  }
};

export default {
  registerSuperAdmin,
  registerHrAdmin,
  registerManager,
  registerEmployee,
  login,
  logout,
  refreshToken,
  getCurrentUser,
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
