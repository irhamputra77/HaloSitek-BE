/**
 * Password Hasher Utility
 * Untuk hashing dan verifying password menggunakan bcryptjs
 */

const bcrypt = require('bcryptjs');

class PasswordHasher {
  /**
   * Hash password
   * @param {String} plainPassword - Plain text password
   * @returns {Promise<String>} - Hashed password
   */
  static async hash(plainPassword) {
    try {
      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;
      const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
      return hashedPassword;
    } catch (error) {
      throw new Error('Password hashing failed');
    }
  }

  /**
   * Compare password dengan hash
   * @param {String} plainPassword - Plain text password
   * @param {String} hashedPassword - Hashed password dari database
   * @returns {Promise<Boolean>} - True jika match, false jika tidak
   */
  static async compare(plainPassword, hashedPassword) {
    try {
      const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
      return isMatch;
    } catch (error) {
      throw new Error('Password comparison failed');
    }
  }

  /**
   * Validate password strength
   * @param {String} password - Password to validate
   * @returns {Object} - { isValid: Boolean, errors: Array }
   */
  static validatePasswordStrength(password) {
    const errors = [];

    // Minimum 8 characters
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    // Must contain at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    // Must contain at least one lowercase letter
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    // Must contain at least one number
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    // Must contain at least one special character
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Generate random password
   * @param {Number} length - Length of password (default: 12)
   * @returns {String} - Random password
   */
  static generateRandomPassword(length = 12) {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+{}[]|:;<>?,./';
    const allChars = uppercase + lowercase + numbers + symbols;

    let password = '';

    // Ensure at least one of each type
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];

    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password
    return password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  }
}

module.exports = PasswordHasher;