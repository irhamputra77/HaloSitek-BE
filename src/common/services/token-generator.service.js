/**
 * Token Generator Service
 * Generate unique tokens untuk orders dan payments
 */

const crypto = require('crypto');

class TokenGeneratorService {
  /**
   * Generate Order ID
   * Format: ARCH-{timestamp}-{random}
   * Example: ARCH-1704067200000-A5B9C3
   * @returns {String} - Unique order ID
   */
  static generateOrderId() {
    const timestamp = Date.now();
    const random = this.generateRandomString(6, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789');
    return `ARCH-${timestamp}-${random}`;
  }

  /**
   * Generate Payment Token (UUID v4)
   * Used untuk payment link: /payment/{token}
   * @returns {String} - UUID token
   */
  static generatePaymentToken() {
    return crypto.randomUUID();
  }

  /**
   * Generate Random String
   * @param {Number} length - Length of string
   * @param {String} chars - Characters to use
   * @returns {String} - Random string
   */
  static generateRandomString(length, chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Generate Verification Code (6 digits)
   * For email verification, OTP, etc.
   * @returns {String} - 6 digit code
   */
  static generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Generate Secure Token
   * For password reset, email verification links
   * @param {Number} length - Token length (default: 32)
   * @returns {String} - Secure token
   */
  static generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Validate Order ID format
   * @param {String} orderId - Order ID to validate
   * @returns {Boolean} - True if valid format
   */
  static isValidOrderId(orderId) {
    // Format: ARCH-{timestamp}-{random6chars}
    const pattern = /^ARCH-\d{13}-[A-Z0-9]{6}$/;
    return pattern.test(orderId);
  }

  /**
   * Validate UUID format
   * @param {String} uuid - UUID to validate
   * @returns {Boolean} - True if valid UUID
   */
  static isValidUUID(uuid) {
    const pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return pattern.test(uuid);
  }

  /**
   * Extract timestamp from Order ID
   * @param {String} orderId - Order ID
   * @returns {Number|null} - Timestamp or null if invalid
   */
  static extractTimestampFromOrderId(orderId) {
    if (!this.isValidOrderId(orderId)) {
      return null;
    }

    const parts = orderId.split('-');
    return parseInt(parts[1]);
  }

  /**
   * Get expiry date (24 hours from now)
   * @returns {Date} - Expiry date
   */
  static getPaymentExpiryDate() {
    const hours = parseInt(process.env.PAYMENT_EXPIRY_HOURS) || 24;
    return new Date(Date.now() + hours * 60 * 60 * 1000);
  }

  /**
   * Check if payment has expired
   * @param {Date} expiredAt - Expiry date
   * @returns {Boolean} - True if expired
   */
  static isPaymentExpired(expiredAt) {
    return new Date() > new Date(expiredAt);
  }
}

module.exports = TokenGeneratorService;