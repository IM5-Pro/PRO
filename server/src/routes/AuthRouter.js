const express = require('express');
const {
  login,
  refreshToken,
  verifyToken,
  logout,
  getCurrentUser,
} = require('../controllers/AuthController');
const { verifyAccessToken, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * Public Routes
 */

/**
 * @route POST /api/auth/login
 * @desc User login with email and password
 * @access Public
 */
router.post('/login', login);

/**
 * @route POST /api/auth/refresh
 * @desc Refresh access token using refresh token
 * @access Public
 */
router.post('/refresh', refreshToken);

/**
 * @route GET /api/auth/verify
 * @desc Verify if access token is valid
 * @access Public
 */
router.get('/verify', verifyToken);

/**
 * Protected Routes (Require Authentication)
 */

/**
 * @route POST /api/auth/logout
 * @desc User logout and clear refresh token
 * @access Protected (Authenticated users only)
 */
router.post('/logout', verifyAccessToken, logout);

/**
 * @route GET /api/auth/me
 * @desc Get current user information
 * @access Protected (Authenticated users only)
 */
router.get('/me', verifyAccessToken, getCurrentUser);

module.exports = router;
