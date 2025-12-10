/**
 * Main Routes Index
 * Aggregate all routes
 */

const express = require('express');
const router = express.Router();

// Import domain routes
const architectRegistrationRoutes = require('./domains/architects/routes/architect-registration.routes');
const architectAuthRoutes = require('./domains/architects/routes/architect-auth.routes');
const webhookRoutes = require('./domains/architects/routes/webhook.routes');
const paymentRoutes = require('./domains/architects/routes/payment.routes');
const userAuthRoutes = require('./domains/users/routes/user-auth.routes');
const adminAuthRoutes = require('./domains/admins/routes/admin-auth.routes');

// Health check route
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API routes
router.use('/architects', architectRegistrationRoutes);
router.use('/architects/auth', architectAuthRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/payment', paymentRoutes);
router.use('/users', userAuthRoutes);
router.use('/admins', adminAuthRoutes);


module.exports = router;