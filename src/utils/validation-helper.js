/**
 * Validation Helper
 * Helper functions untuk validasi data
 */

const { ValidationError } = require('../errors/app-errors');

class ValidationHelper {
  /**
   * Validate email format
   * @param {String} email - Email to validate
   * @returns {Boolean} - True if valid, false otherwise
   */
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone number (Indonesian format)
   * @param {String} phone - Phone number to validate
   * @returns {Boolean} - True if valid, false otherwise
   */
  static isValidPhone(phone) {
    // Indonesian phone: 08xx-xxxx-xxxx atau 62xxx-xxxx-xxxx
    const phoneRegex = /^(\+62|62|0)[0-9]{9,12}$/;
    return phoneRegex.test(phone.replace(/[\s-]/g, ''));
  }

  /**
   * Validate URL format
   * @param {String} url - URL to validate
   * @returns {Boolean} - True if valid, false otherwise
   */
  static isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate UUID format
   * @param {String} uuid - UUID to validate
   * @returns {Boolean} - True if valid, false otherwise
   */
  static isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Validate required fields
   * @param {Object} data - Data object to validate
   * @param {Array} requiredFields - Array of required field names
   * @throws {ValidationError} - If validation fails
   */
  static validateRequiredFields(data, requiredFields) {
    const errors = [];

    requiredFields.forEach((field) => {
      if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
        errors.push({
          field,
          message: `${field} is required`,
        });
      }
    });

    if (errors.length > 0) {
      throw new ValidationError('Validation failed', errors);
    }
  }

  /**
   * Validate email field
   * @param {String} email - Email to validate
   * @param {String} fieldName - Field name for error message
   * @throws {ValidationError} - If validation fails
   */
  static validateEmail(email, fieldName = 'email') {
    if (!email) {
      throw new ValidationError('Validation failed', [
        { field: fieldName, message: `${fieldName} is required` },
      ]);
    }

    if (!this.isValidEmail(email)) {
      throw new ValidationError('Validation failed', [
        { field: fieldName, message: `${fieldName} format is invalid` },
      ]);
    }
  }

  /**
   * Validate phone number field
   * @param {String} phone - Phone to validate
   * @param {String} fieldName - Field name for error message
   * @throws {ValidationError} - If validation fails
   */
  static validatePhone(phone, fieldName = 'phone') {
    if (!phone) {
      throw new ValidationError('Validation failed', [
        { field: fieldName, message: `${fieldName} is required` },
      ]);
    }

    if (!this.isValidPhone(phone)) {
      throw new ValidationError('Validation failed', [
        { field: fieldName, message: `${fieldName} format is invalid. Use format: 08xxxxxxxxxx or +628xxxxxxxxxx` },
      ]);
    }
  }

  /**
   * Validate URL field
   * @param {String} url - URL to validate
   * @param {String} fieldName - Field name for error message
   * @param {Boolean} required - Is field required?
   * @throws {ValidationError} - If validation fails
   */
  static validateUrl(url, fieldName = 'url', required = false) {
    if (!url && required) {
      throw new ValidationError('Validation failed', [
        { field: fieldName, message: `${fieldName} is required` },
      ]);
    }

    if (url && !this.isValidUrl(url)) {
      throw new ValidationError('Validation failed', [
        { field: fieldName, message: `${fieldName} format is invalid` },
      ]);
    }
  }

  /**
   * Validate number range
   * @param {Number} value - Value to validate
   * @param {Number} min - Minimum value
   * @param {Number} max - Maximum value
   * @param {String} fieldName - Field name for error message
   * @throws {ValidationError} - If validation fails
   */
  static validateNumberRange(value, min, max, fieldName = 'value') {
    const errors = [];

    if (typeof value !== 'number' || isNaN(value)) {
      errors.push({
        field: fieldName,
        message: `${fieldName} must be a number`,
      });
    } else {
      if (value < min) {
        errors.push({
          field: fieldName,
          message: `${fieldName} must be at least ${min}`,
        });
      }

      if (value > max) {
        errors.push({
          field: fieldName,
          message: `${fieldName} must be at most ${max}`,
        });
      }
    }

    if (errors.length > 0) {
      throw new ValidationError('Validation failed', errors);
    }
  }

  /**
   * Validate string length
   * @param {String} value - Value to validate
   * @param {Number} min - Minimum length
   * @param {Number} max - Maximum length
   * @param {String} fieldName - Field name for error message
   * @throws {ValidationError} - If validation fails
   */
  static validateStringLength(value, min, max, fieldName = 'value') {
    const errors = [];

    if (typeof value !== 'string') {
      errors.push({
        field: fieldName,
        message: `${fieldName} must be a string`,
      });
    } else {
      if (value.length < min) {
        errors.push({
          field: fieldName,
          message: `${fieldName} must be at least ${min} characters long`,
        });
      }

      if (value.length > max) {
        errors.push({
          field: fieldName,
          message: `${fieldName} must be at most ${max} characters long`,
        });
      }
    }

    if (errors.length > 0) {
      throw new ValidationError('Validation failed', errors);
    }
  }

  /**
   * Validate array
   * @param {Array} value - Array to validate
   * @param {Number} minLength - Minimum array length
   * @param {Number} maxLength - Maximum array length
   * @param {String} fieldName - Field name for error message
   * @throws {ValidationError} - If validation fails
   */
  static validateArray(value, minLength = 0, maxLength = Infinity, fieldName = 'value') {
    const errors = [];

    if (!Array.isArray(value)) {
      errors.push({
        field: fieldName,
        message: `${fieldName} must be an array`,
      });
    } else {
      if (value.length < minLength) {
        errors.push({
          field: fieldName,
          message: `${fieldName} must contain at least ${minLength} items`,
        });
      }

      if (value.length > maxLength) {
        errors.push({
          field: fieldName,
          message: `${fieldName} must contain at most ${maxLength} items`,
        });
      }
    }

    if (errors.length > 0) {
      throw new ValidationError('Validation failed', errors);
    }
  }

  /**
   * Sanitize string (remove HTML tags, trim whitespace)
   * @param {String} str - String to sanitize
   * @returns {String} - Sanitized string
   */
  static sanitizeString(str) {
    if (typeof str !== 'string') return str;
    
    // Remove HTML tags
    let sanitized = str.replace(/<[^>]*>/g, '');
    
    // Trim whitespace
    sanitized = sanitized.trim();
    
    return sanitized;
  }

  /**
   * Sanitize object (sanitize all string values)
   * @param {Object} obj - Object to sanitize
   * @returns {Object} - Sanitized object
   */
  static sanitizeObject(obj) {
    const sanitized = {};

    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        sanitized[key] = this.sanitizeString(obj[key]);
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitized[key] = this.sanitizeObject(obj[key]);
      } else {
        sanitized[key] = obj[key];
      }
    }

    return sanitized;
  }

  /**
   * Validate year (between 1900 and current year)
   * @param {Number} year - Year to validate
   * @param {String} fieldName - Field name for error message
   * @throws {ValidationError} - If validation fails
   */
  static validateYear(year, fieldName = 'year') {
    const currentYear = new Date().getFullYear();
    const minYear = 1900;

    const errors = [];

    if (typeof year !== 'number' || isNaN(year)) {
      errors.push({
        field: fieldName,
        message: `${fieldName} must be a number`,
      });
    } else if (year < minYear || year > currentYear) {
      errors.push({
        field: fieldName,
        message: `${fieldName} must be between ${minYear} and ${currentYear}`,
      });
    }

    if (errors.length > 0) {
      throw new ValidationError('Validation failed', errors);
    }
  }
}

module.exports = ValidationHelper;