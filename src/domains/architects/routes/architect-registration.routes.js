/**
 * Architect Registration Routes
 */

const express = require('express');
const router = express.Router();

const architectRegistrationController = require('../controllers/architect-registration.controller');
const { uploadArchitectFiles } = require('../../../middlewares/upload.middleware');
const RequestValidator = require('../../../middlewares/request-validator.middleware');

/**
 * @route   POST /api/architects/register
 * @desc    Register new architect
 * @access  Public
 */
router.post(
  '/register',
  uploadArchitectFiles,
  RequestValidator.validateArchitectRegistration,
  architectRegistrationController.register
);

/**
 * @route   GET /api/architects/payment/:token
 * @desc    Get payment info by token
 * @access  Public
 */
router.get(
  '/payment/:token',
  architectRegistrationController.getPaymentInfo
);

/**
 * @route   POST /api/architects/payment/resend
 * @desc    Resend payment link email
 * @access  Public
 */
router.post(
  '/payment/resend',
  RequestValidator.validateResendPaymentLink,
  architectRegistrationController.resendPaymentLink
);

module.exports = router;