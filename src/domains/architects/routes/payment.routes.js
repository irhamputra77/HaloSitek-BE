/**
 * Payment Routes
 */

const express = require('express');
const router = express.Router();

const paymentController = require('../controllers/payment.controller');

/**
 * @route   GET /api/payment/methods
 * @desc    Get available payment methods
 * @access  Public
 */
router.get('/methods', paymentController.getPaymentMethods);

/**
 * @route   GET /api/payment/config
 * @desc    Get payment configuration
 * @access  Public
 */
router.get('/config', paymentController.getPaymentConfig);

/**
 * @route   GET /api/payment/status/:orderId
 * @desc    Get transaction status
 * @access  Public (TODO: add auth)
 */
router.get('/status/:orderId', paymentController.getTransactionStatus);

module.exports = router;