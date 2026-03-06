const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Role = require('../models/Role');

/**
 * Middleware to verify JWT access token
 */
const verifyAccessToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required',
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    );

    const user = await User.findOne({ id: decoded.userId });
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token or user is inactive',
      });
    }

    req.user = {
      id: decoded.userId,
      roleId: decoded.roleId,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Access token has expired',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      error: error.message,
    });
  }
};

/**
 * Middleware for Role-Based Access Control (RBAC)
 * Usage: requireRole('Admin', 'Manager')
 */
const requireRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user?.roleId) {
        return res.status(401).json({
          success: false,
          message: 'User role not found',
        });
      }

      const role = await Role.findOne({ id: req.user.roleId });
      if (!role) {
        return res.status(401).json({
          success: false,
          message: 'Role not found',
        });
      }

      if (!allowedRoles.includes(role.name)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
        });
      }

      req.role = role;
      next();
    } catch (error) {
      console.error('RBAC error:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred during authorization check',
        error: error.message,
      });
    }
  };
};

/**
 * Middleware to check if user is owner or admin
 */
const checkOwnerOrAdmin = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const targetUserId = req.params.userId || req.body.userId;

    const user = await User.findOne({ id: userId });
    const role = await Role.findOne({ id: user.roleId });

    // Admin can access anything
    if (role.name === 'Admin') {
      return next();
    }

    // User can only access their own data
    if (userId !== targetUserId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this resource',
      });
    }

    next();
  } catch (error) {
    console.error('Owner check error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during authorization check',
      error: error.message,
    });
  }
};

module.exports = {
  verifyAccessToken,
  requireRole,
  checkOwnerOrAdmin,
};
