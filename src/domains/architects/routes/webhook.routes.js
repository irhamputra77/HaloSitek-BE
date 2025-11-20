/**
 * Webhook Routes
 */

const express = require('express');
const router = express.Router();

const webhookController = require('../controllers/webhook.controller');

/**
 * @route   POST /api/webhooks/midtrans
 * @desc    Handle Midtrans webhook notification
 * @access  Public (called by Midtrans)
 */
router.post('/midtrans', webhookController.handleMidtransWebhook);

/**
 * @route   GET /api/webhooks/statistics
 * @desc    Get webhook statistics
 * @access  Admin only (TODO: add auth middleware)
 */
router.get('/statistics', webhookController.getStatistics);

/**
 * @route   POST /api/webhooks/check-expired
 * @desc    Manually check expired transactions
 * @access  Admin only (TODO: add auth middleware)
 */
router.post('/check-expired', webhookController.checkExpiredTransactions);

module.exports = router;