/**
 * User Authentication Routes
 * Routes untuk user registration, login, dan profile management
 */

const express = require('express');
const router = express.Router();

const userAuthController = require('../controllers/user-auth.controller');
const authMiddleware = require('../../../middlewares/auth.middleware');
const { upload } = require('../../../middlewares/upload.middleware');

// Configure multer for single profile picture upload
const uploadProfilePicture = upload.single('profilePicture');

/**
 * @route   POST /api/users/register
 * @desc    Register new user
 * @access  Public
 */
router.post('/register', uploadProfilePicture, userAuthController.register);

/**
 * @route   POST /api/users/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/auth/login', userAuthController.login);

/**
 * @route   POST /api/users/auth/refresh-token
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/auth/refresh-token', userAuthController.refreshToken);

/**
 * @route   GET /api/users/auth/profile
 * @desc    Get user profile
 * @access  Private (Users only)
 */
router.get('/auth/profile', authMiddleware.verifyUser, userAuthController.getProfile);

/**
 * @route   GET /api/users/auth/me
 * @desc    Get current user info
 * @access  Private (Users only)
 */
router.get('/auth/me', authMiddleware.verifyUser, userAuthController.getCurrentUser);

/**
 * @route   PUT /api/users/auth/profile
 * @desc    Update user profile
 * @access  Private (Users only)
 */
router.put(
  '/auth/profile',
  authMiddleware.verifyUser,
  uploadProfilePicture,
  userAuthController.updateProfile
);

/**
 * @route   POST /api/users/auth/change-password
 * @desc    Change password
 * @access  Private (Users only)
 */
router.post(
  '/auth/change-password',
  authMiddleware.verifyUser,
  userAuthController.changePassword
);

/**
 * @route   POST /api/users/auth/logout
 * @desc    Logout user
 * @access  Private (Users only)
 */
router.post('/auth/logout', authMiddleware.verifyUser, userAuthController.logout);

/**
 * @route   POST /api/users/auth/verify-email
 * @desc    Verify user email
 * @access  Private (Users only)
 */
router.post('/auth/verify-email', authMiddleware.verifyUser, userAuthController.verifyEmail);

module.exports = router;