import bcrypt from "bcrypt";
import User from "../models/User.js";
import Role from "../models/Role.js";
import Permission from "../models/Permission.js";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.js";
import { validateRegisterSuperAdmin, validateLogin } from "../utils/validators.js";
import { sendError, sendSuccess } from "../utils/response.js";

const registerSuperAdmin = async (req, res) => {
  try {
    // Validate request body
    const validation = validateRegisterSuperAdmin(req.body);
    if (!validation.isValid) {
      return sendError(res, 400, "Validation failed", validation.errors);
    }

    const { email, password } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendError(res, 409, "Email already registered", { email: "This email is already in use" });
    }

    const hash = await bcrypt.hash(password, 10);

    // Update existing super admin or create new one
    const user = await User.findOneAndUpdate(
      { role: "SUPER_ADMIN" },
      {
        email,
        password: hash,
        role: "SUPER_ADMIN",
      },
      { upsert: true, new: true },
    );

    return sendSuccess(res, 201, "Super admin registered successfully", { data: user });
  } catch (err) {
    console.error("Register error:", err);
    return sendError(res, 500, "Internal server error", { error: err.message });
  }
};

const login = async (req, res) => {
  try {
    // Validate request body
    const validation = validateLogin(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.errors,
      });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return sendError(res, 401, "Invalid email or password");
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return sendError(res, 401, "Invalid email or password");
    }

    // fetch role document to get permissions
    const roleDoc = await Role.findOne({ name: user.role }).populate(
      "permissions",
    );
    const permissions = roleDoc ? roleDoc.permissions.map((p) => p.name) : [];

    const tokenUser = {
      id: user._id,
      role: user.role,
      permissions,
    };

    const accessToken = generateAccessToken(tokenUser);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          permissions,
        },
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
    const user = await User.findByIdAndUpdate(req.user.id, {
      $unset: { refreshToken: "" },
    });
    return sendSuccess(res, 200, "Logged out");
  } catch (err) {
    return sendError(res, 500, "Internal server error", err);
  }
};

// Refresh token: issue new access token
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const user = await User.findOne({ refreshToken });
    if (!user)
      return sendError(res, 401, "Invalid refresh token");
    const roleDoc = await Role.findOne({ name: user.role }).populate(
      "permissions",
    );
    const permissions = roleDoc ? roleDoc.permissions.map((p) => p.name) : [];
    const tokenUser = { id: user._id, role: user.role, permissions };
    const accessToken = generateAccessToken(tokenUser);
    return sendSuccess(res, 200, "Token refreshed", { accessToken });
  } catch (err) {
    return sendError(res, 500, "Internal server error", err);
  }
};

// Forgot password: mock email
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return sendError(res, 404, "User not found");
    // Mock: send email
    return sendSuccess(res, 200, "Password reset email sent");
  } catch (err) {
    return sendError(res, 500, "Internal server error", err);
  }
};

// Reset password: set new password
const resetPassword = async (req, res) => {
  try {
    const { email, password } = req.body;
    const hash = await bcrypt.hash(password, 10);
    const user = await User.findOneAndUpdate(
      { email },
      { $set: { password: hash } },
      { new: true },
    );
    if (!user) return sendError(res, 404, "User not found");
    return sendSuccess(res, 200, "Password reset", { data: user });
  } catch (err) {
    return sendError(res, 500, "Internal server error", err);
  }
};

// Change password for logged-in user
const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return sendError(res, 404, "User not found");
    const valid = await bcrypt.compare(oldPassword, user.password);
    if (!valid)
      return sendError(res, 401, "Invalid old password");
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    return sendSuccess(res, 200, "Password changed");
  } catch (err) {
    return sendError(res, 500, "Internal server error", err);
  }
};

// MFA enable (mock)
const mfaEnable = async (req, res) => {
  res.json({ success: true, message: "MFA enabled (mock)" });
};

// MFA disable (mock)
const mfaDisable = async (req, res) => {
  res.json({ success: true, message: "MFA disabled (mock)" });
};

// Session view (mock)
const sessionView = async (req, res) => {
  res.json({
    success: true,
    sessions: [{ id: "mock-session", user: req.user.id }],
  });
};

// Session terminate (mock)
const sessionTerminate = async (req, res) => {
  res.json({ success: true, message: "Session terminated (mock)" });
};

export default {
  registerSuperAdmin,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  changePassword,
  mfaEnable,
  mfaDisable,
  sessionView,
  sessionTerminate,
};
