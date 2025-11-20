/**
 * JWT Helper Utility
 * Untuk generate dan verify JWT tokens
 */

const jwt = require('jsonwebtoken');
const { AuthenticationError } = require('../errors/app-errors');

class JWTHelper {
  /**
   * Generate JWT Token
   * @param {Object} payload - Data yang akan disimpan di token
   * @param {String} expiresIn - Token expiry (default: from env or 24h)
   * @returns {String} - JWT token
   */
  static generateToken(payload, expiresIn = null) {
    try {
      const secret = process.env.JWT_SECRET;
      
      if (!secret) {
        throw new Error('JWT_SECRET is not defined in environment variables');
      }

      const expiry = expiresIn || process.env.JWT_EXPIRES_IN || '24h';

      const token = jwt.sign(payload, secret, {
        expiresIn: expiry,
      });

      return token;
    } catch (error) {
      throw new Error(`Token generation failed: ${error.message}`);
    }
  }

  /**
   * Generate Access Token (short-lived)
   * @param {Object} user - User data
   * @returns {String} - Access token
   */
  static generateAccessToken(user) {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role || 'ARCHITECT', // ARCHITECT, USER, ADMIN
      status: user.status, // UNPAID, ACTIVE, BANNED
    };

    return this.generateToken(payload, '24h');
  }

  /**
   * Generate Refresh Token (long-lived)
   * @param {Object} user - User data
   * @returns {String} - Refresh token
   */
  static generateRefreshToken(user) {
    const payload = {
      id: user.id,
      type: 'refresh',
    };

    return this.generateToken(payload, '7d');
  }

  /**
   * Verify JWT Token
   * @param {String} token - JWT token
   * @returns {Object} - Decoded token payload
   * @throws {AuthenticationError} - If token is invalid or expired
   */
  static verifyToken(token) {
    try {
      const secret = process.env.JWT_SECRET;
      
      if (!secret) {
        throw new Error('JWT_SECRET is not defined in environment variables');
      }

      const decoded = jwt.verify(token, secret);
      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new AuthenticationError('Token has expired');
      }
      
      if (error.name === 'JsonWebTokenError') {
        throw new AuthenticationError('Invalid token');
      }

      throw new AuthenticationError('Token verification failed');
    }
  }

  /**
   * Decode token without verification (for debugging)
   * @param {String} token - JWT token
   * @returns {Object} - Decoded token (unverified)
   */
  static decodeToken(token) {
    try {
      return jwt.decode(token);
    } catch (error) {
      return null;
    }
  }

  /**
   * Extract token from Authorization header
   * @param {String} authHeader - Authorization header value
   * @returns {String|null} - Extracted token or null
   */
  static extractTokenFromHeader(authHeader) {
    if (!authHeader) {
      return null;
    }

    // Expected format: "Bearer <token>"
    const parts = authHeader.split(' ');
    
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    return parts[1];
  }

  /**
   * Generate token for password reset
   * @param {String} userId - User ID
   * @returns {String} - Reset token (valid for 1 hour)
   */
  static generatePasswordResetToken(userId) {
    const payload = {
      id: userId,
      type: 'password_reset',
    };

    return this.generateToken(payload, '1h');
  }

  /**
   * Generate token for email verification
   * @param {String} userId - User ID
   * @param {String} email - User email
   * @returns {String} - Verification token (valid for 24 hours)
   */
  static generateEmailVerificationToken(userId, email) {
    const payload = {
      id: userId,
      email,
      type: 'email_verification',
    };

    return this.generateToken(payload, '24h');
  }
}

module.exports = JWTHelper;