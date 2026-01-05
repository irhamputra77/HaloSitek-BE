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

// NEW: Import design, certification, portfolio-link routes
const designRoutes = require('./domains/architects/routes/design.routes');
const certificationRoutes = require('./domains/architects/routes/certification.routes');
const portfolioLinkRoutes = require('./domains/architects/routes/portfolio-link.routes');

const userAuthRoutes = require('./domains/users/routes/user-auth.routes');
const adminUserRoutes = require('./domains/users/routes/admin-user.routes');
const adminAuthRoutes = require('./domains/admins/routes/admin-auth.routes');
const arsipediaRoutes = require('./domains/arsipedia/routes/arsipedia.routes');
const viewRoutes = require("./domains/views/routes/view.routes");

// NEW: admin architect & admin transaction routes
const adminArchitectRoutes = require('./domains/architects/routes/architect-admin.routes');
const adminTransactionRoutes = require('./domains/architects/routes/admin-transaction.routes');


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

// NEW: Design, Certification, Portfolio Link routes
router.use('/designs', designRoutes);
router.use('/certifications', certificationRoutes);
router.use('/portfolio-links', portfolioLinkRoutes);

router.use('/users', userAuthRoutes);
router.use('/admin/users', adminUserRoutes);

router.use('/admins', adminAuthRoutes);
router.use('/arsipedia', arsipediaRoutes);

router.use('/admin/architects', adminArchitectRoutes);
router.use('/admin/transactions', adminTransactionRoutes);

router.use("/views", viewRoutes);


module.exports = router;