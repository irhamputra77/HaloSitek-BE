/**
 * Admin Authentication Routes
 * Routes untuk admin login dan management
 * Note: No registration route - admins created via seeder
 */

const express = require('express');
const router = express.Router();

const adminAuthController = require('../controllers/admin-auth.controller');
const authMiddleware = require('../../../middlewares/auth.middleware');

/**
 * @route   POST /api/admins/auth/login
 * @desc    Login admin
 * @access  Public
 */
router.post('/auth/login', adminAuthController.login);

/**
 * @route   POST /api/admins/auth/add
 * @desc    Add new admin
 * @access  Private (Super Admins only)
 */
router.post('/auth/add', authMiddleware.verifyAdmin, adminAuthController.addAdmin);

/**
 * @route   POST /api/admins/auth/refresh-token
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/auth/refresh-token', adminAuthController.refreshToken);

/**
 * @route   GET /api/admins/auth/profile
 * @desc    Get admin profile
 * @access  Private (Admins only)
 */
router.get('/auth/profile', authMiddleware.verifyAdmin, adminAuthController.getProfile);

/**
 * @route   GET /api/admins/auth/all
 * @desc    Get all admins
 * @access  Private (Admins only)
 */
router.get('/auth/all', authMiddleware.verifyAdmin, adminAuthController.getAllAdmins);

/**
 * @route   GET /api/admins/auth/me
 * @desc    Get current admin info
 * @access  Private (Admins only)
 */
router.get('/auth/me', authMiddleware.verifyAdmin, adminAuthController.getCurrentAdmin);

/**
 * @route   PUT /api/admins/auth/profile
 * @desc    Update admin profile
 * @access  Private (Admins only)
 */
router.put('/auth/profile', authMiddleware.verifyAdmin, adminAuthController.updateProfile);

/**
 * @route   POST /api/admins/auth/change-password
 * @desc    Change password
 * @access  Private (Admins only)
 */
router.post(
  '/auth/change-password',
  authMiddleware.verifyAdmin,
  adminAuthController.changePassword
);

/**
 * @route   POST /api/admins/auth/logout
 * @desc    Logout admin
 * @access  Private (Admins only)
 */
router.post('/auth/logout', authMiddleware.verifyAdmin, adminAuthController.logout);

/**
 * @route   GET /api/admins/auth/dashboard
 * @desc    Get dashboard statistics
 * @access  Private (Admins only)
 */
router.get('/auth/dashboard', authMiddleware.verifyAdmin, adminAuthController.getDashboard);

module.exports = router;