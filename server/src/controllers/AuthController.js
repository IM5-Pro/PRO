const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Role = require('../models/Role');

/**
 * Generate Access Token (15 minutes expiry)
 */
const generateAccessToken = (userId, roleId) => {
  const payload = {
    userId,
    roleId,
    type: 'access',
  };

  return jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '15m',
  });
};

/**
 * Generate Refresh Token (7 days expiry)
 */
const generateRefreshToken = (userId) => {
  const payload = {
    userId,
    type: 'refresh',
  };

  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key', {
    expiresIn: '7d',
  });
};

/**
 * Login with email and password
 * POST /api/auth/login
 */
const login = async (req, res) => {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required',
        });
      }

      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'User account is disabled',
        });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      // Get user role for RBAC
      const role = await Role.findOne({ id: user.roleId });
      if (!role) {
        return res.status(500).json({
          success: false,
          message: 'Role not found',
        });
      }

      // Generate tokens
      const accessToken = generateAccessToken(user.id, user.roleId);
      const refreshToken = generateRefreshToken(user.id);

      // Calculate refresh token expiry (7 days)
      const refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      // Update user with refresh token and last login
      await User.findByIdAndUpdate(
        user._id,
        {
          refreshToken,
          refreshTokenExpiresAt,
          lastLogin: new Date(),
        },
        { new: true }
      );

      // Return tokens and user info
      return res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          accessToken,
          refreshToken,
          user: {
            id: user.id,
            email: user.email,
            roleId: user.roleId,
            roleName: role.name,
            employeeId: user.employeeId,
            isActive: user.isActive,
          },
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred during login',
        error: error.message,
      });
    }
  }

/**
 * Refresh Access Token
 * POST /api/auth/refresh
 */
const refreshToken = async (req, res) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token is required',
        });
      }

      // Verify refresh token
      let decoded;
      try {
        decoded = jwt.verify(
          refreshToken,
          process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key'
        );
      } catch (error) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired refresh token',
        });
      }

      // Find user and validate refresh token
      const user = await User.findOne({ id: decoded.userId });
      if (!user || user.refreshToken !== refreshToken) {
        return res.status(401).json({
          success: false,
          message: 'Refresh token mismatch or user not found',
        });
      }

      // Check if refresh token is expired
      if (new Date() > user.refreshTokenExpiresAt) {
        return res.status(401).json({
          success: false,
          message: 'Refresh token has expired',
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'User account is disabled',
        });
      }

      // Generate new access token
      const newAccessToken = generateAccessToken(user.id, user.roleId);

      return res.status(200).json({
        success: true,
        message: 'Access token refreshed',
        data: {
          accessToken: newAccessToken,
        },
      });
    } catch (error) {
      console.error('Refresh token error:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while refreshing token',
        error: error.message,
      });
    }
  }

/**
 * Logout user
 * POST /api/auth/logout
 */
const logout = async (req, res) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      // Clear refresh token from database
      await User.findOneAndUpdate(
        { id: userId },
        {
          refreshToken: null,
          refreshTokenExpiresAt: null,
        },
        { new: true }
      );

      return res.status(200).json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      console.error('Logout error:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred during logout',
        error: error.message,
      });
    }
  }

/**
 * Verify Access Token
 * GET /api/auth/verify
 */
const verifyToken = async (req, res) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];

      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Token is required',
        });
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'your-secret-key'
      );

      const user = await User.findOne({ id: decoded.userId });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      const role = await Role.findOne({ id: user.roleId });

      return res.status(200).json({
        success: true,
        message: 'Token is valid',
        data: {
          userId: decoded.userId,
          roleId: decoded.roleId,
          roleName: role?.name,
          user: {
            id: user.id,
            email: user.email,
            isActive: user.isActive,
          },
        },
      });
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
        error: error.message,
      });
    }
  }

/**
 * Get current user info
 * GET /api/auth/me
 */
const getCurrentUser = async (req, res) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      const user = await User.findOne({ id: userId });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      const role = await Role.findOne({ id: user.roleId });

      return res.status(200).json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          roleId: user.roleId,
          roleName: role?.name,
          employeeId: user.employeeId,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
        },
      });
    } catch (error) {
      console.error('Get current user error:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while fetching user info',
        error: error.message,
      });
    }
  }

module.exports = {
  login,
  refreshToken,
  logout,
  verifyToken,
  getCurrentUser,
  generateAccessToken,
  generateRefreshToken,
};
