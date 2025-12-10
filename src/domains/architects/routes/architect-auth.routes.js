/**
 * Architect Authentication Routes
 * Routes untuk login, profile management, dan authentication
 */

const express = require('express');
const router = express.Router();

const architectAuthController = require('../controllers/architect-auth.controller');
const authMiddleware = require('../../../middlewares/auth.middleware');
const { uploadArchitectFiles } = require('../../../middlewares/upload.middleware');

/**
 * @route   POST /api/architects/auth/login
 * @desc    Login architect
 * @access  Public
 */
router.post('/login', architectAuthController.login);

/**
 * @route   POST /api/architects/auth/refresh-token
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh-token', architectAuthController.refreshToken);

/**
 * @route   GET /api/architects/auth/profile
 * @desc    Get architect profile
 * @access  Private (ACTIVE architects only)
 */
router.get(
  '/profile',
  authMiddleware.verifyArchitect,
  architectAuthController.getProfile
);

/**
 * @route   GET /api/architects/auth/me
 * @desc    Get current user info
 * @access  Private (ACTIVE architects only)
 */
router.get(
  '/me',
  authMiddleware.verifyArchitect,
  architectAuthController.getCurrentUser
);

/**
 * @route   PUT /api/architects/auth/profile
 * @desc    Update architect profile
 * @access  Private (ACTIVE architects only)
 */
router.put(
  '/profile',
  authMiddleware.verifyArchitect,
  uploadArchitectFiles,
  architectAuthController.updateProfile
);

/**
 * @route   POST /api/architects/auth/change-password
 * @desc    Change password
 * @access  Private (ACTIVE architects only)
 */
router.post(
  '/change-password',
  authMiddleware.verifyArchitect,
  architectAuthController.changePassword
);

/**
 * @route   POST /api/architects/auth/logout
 * @desc    Logout architect
 * @access  Private (ACTIVE architects only)
 */
router.post(
  '/logout',
  authMiddleware.verifyArchitect,
  architectAuthController.logout
);

/**
 * @route   GET /api/architects/auth/dashboard
 * @desc    Get dashboard statistics
 * @access  Private (ACTIVE architects only)
 */
router.get(
  '/dashboard',
  authMiddleware.verifyArchitect,
  architectAuthController.getDashboard
);

module.exports = router;