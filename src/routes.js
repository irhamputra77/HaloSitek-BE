/**
 * Main Routes Index
 * Aggregate all routes
 */

const express = require('express');
const router = express.Router();

// Import domain routes
const architectRegistrationRoutes = require('./domains/architects/routes/architect-registration.routes');
const webhookRoutes = require('./domains/architects/routes/webhook.routes');
const paymentRoutes = require('./domains/architects/routes/payment.routes');

// Health check route
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
router.use('/architects', architectRegistrationRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/payment', paymentRoutes);

module.exports = router;