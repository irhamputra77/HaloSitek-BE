/**
 * Services Index
 * Central export untuk semua services
 */

// Common Services
const tokenGeneratorService = require('../../common/services/token-generator.service');
const emailService = require('../../common/services/email.service');
const paymentService = require('../../common/services/payment.service');

// Architect Services
const architectRegistrationService = require('./architect-registration.service');
const webhookService = require('./webhook.service');

module.exports = {
  // Common Services
  tokenGeneratorService,
  emailService,
  paymentService,

  // Architect Services
  architectRegistrationService,
  webhookService,
};