/**
 * Request Validation Middleware
 * Validate request body sebelum masuk ke controller
 */

const { ValidationError } = require('../errors/app-errors');
const ValidationHelper = require('../utils/validation-helper');

class RequestValidator {
  /**
   * Validate architect registration
   */
  static validateArchitectRegistration(req, res, next) {
    try {
      const errors = [];

      // Validate email
      if (!req.body.email) {
        errors.push({ field: 'email', message: 'Email is required' });
      } else if (!ValidationHelper.isValidEmail(req.body.email)) {
        errors.push({ field: 'email', message: 'Invalid email format' });
      }

      // Validate password
      if (!req.body.password) {
        errors.push({ field: 'password', message: 'Password is required' });
      } else if (req.body.password.length < 8) {
        errors.push({ field: 'password', message: 'Password must be at least 8 characters' });
      }

      // Validate name
      if (!req.body.name) {
        errors.push({ field: 'name', message: 'Name is required' });
      }

      // Validate phone
      if (!req.body.phone) {
        errors.push({ field: 'phone', message: 'Phone is required' });
      } else if (!ValidationHelper.isValidPhone(req.body.phone)) {
        errors.push({ field: 'phone', message: 'Invalid phone format' });
      }

      if (errors.length > 0) {
        throw new ValidationError('Validation failed', errors);
      }

      next();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Validate resend payment link
   */
  static validateResendPaymentLink(req, res, next) {
    try {
      const errors = [];

      if (!req.body.email) {
        errors.push({ field: 'email', message: 'Email is required' });
      } else if (!ValidationHelper.isValidEmail(req.body.email)) {
        errors.push({ field: 'email', message: 'Invalid email format' });
      }

      if (errors.length > 0) {
        throw new ValidationError('Validation failed', errors);
      }

      next();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Validate UUID parameter
   */
  static validateUUIDParam(paramName) {
    return (req, res, next) => {
      try {
        const uuid = req.params[paramName];

        if (!uuid) {
          throw new ValidationError('Validation failed', [
            { field: paramName, message: `${paramName} is required` },
          ]);
        }

        if (!ValidationHelper.isValidUUID(uuid)) {
          throw new ValidationError('Validation failed', [
            { field: paramName, message: `Invalid ${paramName} format` },
          ]);
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }
}

module.exports = RequestValidator;