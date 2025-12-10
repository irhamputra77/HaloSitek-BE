/**
 * Admin Authentication Service
 * Handle login, profile management untuk admin
 * Note: No registration - admins created via seeder
 */

const { adminRepository } = require('../repositories');

const PasswordHasher = require('../../../utils/password-hasher');
const JWTHelper = require('../../../utils/jwt-helper');

const {
  ValidationError,
  AuthenticationError,
  NotFoundError,
  BadRequestError,
} = require('../../../errors/app-errors');

class AdminAuthService {
  /**
   * Login admin
   * @param {Object} credentials - { email, password }
   * @returns {Promise<Object>} - Login result with tokens
   */
  async login(credentials) {
    try {
      const { email, password } = credentials;

      // Validate input
      if (!email || !password) {
        throw new ValidationError('Email and password are required');
      }

      // Find admin by email
      const admin = await adminRepository.findByEmail(email);

      if (!admin) {
        throw new AuthenticationError('Invalid email or password');
      }

      // Verify password
      const isPasswordValid = await PasswordHasher.compare(password, admin.password);

      if (!isPasswordValid) {
        throw new AuthenticationError('Invalid email or password');
      }

      // Generate tokens
      const accessToken = JWTHelper.generateAccessToken({
        id: admin.id,
        email: admin.email,
        role: 'ADMIN',
      });

      const refreshToken = JWTHelper.generateRefreshToken({
        id: admin.id,
        email: admin.email,
      });

      console.log('✅ Admin logged in:', admin.email);

      return {
        success: true,
        message: 'Login successful',
        data: {
          admin: {
            id: admin.id,
            email: admin.email,
            fullName: admin.fullName,
            role: admin.role,
          },
          tokens: {
            accessToken,
            refreshToken,
          },
        },
      };
    } catch (error) {
      console.error('❌ Admin login failed:', error.message);
      throw error;
    }
  }

  /**
   * Get admin profile
   * @param {String} adminId - Admin ID
   * @returns {Promise<Object>} - Profile data
   */
  async getProfile(adminId) {
    try {
      const admin = await adminRepository.findByIdOrFail(adminId);

      return {
        id: admin.id,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt,
      };
    } catch (error) {
      console.error('❌ Failed to get admin profile:', error.message);
      throw error;
    }
  }

  /**
   * Update admin profile
   * @param {String} adminId - Admin ID
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<Object>} - Updated profile
   */
  async updateProfile(adminId, profileData) {
    try {
      // Get current admin
      await adminRepository.findByIdOrFail(adminId);

      // Prepare update data
      const updateData = {};

      // Basic info
      if (profileData.fullName) updateData.fullName = profileData.fullName;
      if (profileData.email) updateData.email = profileData.email;

      // Update admin
      await adminRepository.updateProfile(adminId, updateData);

      console.log('✅ Admin profile updated:', adminId);

      // Return updated profile
      return await this.getProfile(adminId);
    } catch (error) {
      console.error('❌ Failed to update admin profile:', error.message);
      throw error;
    }
  }

  /**
   * Change password
   * @param {String} adminId - Admin ID
   * @param {Object} passwordData - { oldPassword, newPassword }
   * @returns {Promise<Object>} - Result
   */
  async changePassword(adminId, passwordData) {
    try {
      const { oldPassword, newPassword } = passwordData;

      // Validate input
      if (!oldPassword || !newPassword) {
        throw new ValidationError('Old password and new password are required');
      }

      // Get admin
      const admin = await adminRepository.findByIdOrFail(adminId);

      // Verify old password
      const isOldPasswordValid = await PasswordHasher.compare(oldPassword, admin.password);

      if (!isOldPasswordValid) {
        throw new BadRequestError('Old password is incorrect');
      }

      // Validate new password strength
      const passwordValidation = PasswordHasher.validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        throw new ValidationError(
          'Password does not meet requirements',
          passwordValidation.errors.map((err) => ({ field: 'newPassword', message: err }))
        );
      }

      // Hash new password
      const hashedPassword = await PasswordHasher.hash(newPassword);

      // Update password
      await adminRepository.update(adminId, {
        password: hashedPassword,
      });

      console.log('✅ Admin password changed:', admin.email);

      return {
        success: true,
        message: 'Password changed successfully',
      };
    } catch (error) {
      console.error('❌ Failed to change admin password:', error.message);
      throw error;
    }
  }

  /**
   * Refresh access token
   * @param {String} refreshToken - Refresh token
   * @returns {Promise<Object>} - New access token
   */
  async refreshAccessToken(refreshToken) {
    try {
      if (!refreshToken) {
        throw new AuthenticationError('Refresh token is required');
      }

      // Verify refresh token
      const decoded = JWTHelper.verifyToken(refreshToken);

      if (decoded.type !== 'refresh') {
        throw new AuthenticationError('Invalid refresh token');
      }

      // Get admin
      const admin = await adminRepository.findByIdOrFail(decoded.id);

      // Generate new access token
      const newAccessToken = JWTHelper.generateAccessToken({
        id: admin.id,
        email: admin.email,
        role: 'ADMIN',
      });

      return {
        success: true,
        data: {
          accessToken: newAccessToken,
        },
      };
    } catch (error) {
      console.error('❌ Failed to refresh admin token:', error.message);
      throw error;
    }
  }

  /**
   * Logout
   * @param {String} adminId - Admin ID
   * @returns {Promise<Object>} - Result
   */
  async logout(adminId) {
    try {
      // TODO: Implement token blacklist if needed
      console.log('✅ Admin logged out:', adminId);

      return {
        success: true,
        message: 'Logged out successfully',
      };
    } catch (error) {
      console.error('❌ Admin logout failed:', error.message);
      throw error;
    }
  }

  /**
   * Get dashboard statistics (for admin panel)
   * @returns {Promise<Object>} - Statistics
   */
  async getDashboardStats() {
    try {
      const prisma = require('../../../config/prisma-client');

      // Get counts directly from prisma instead of importing other repositories
      const [architectStats, transactionStats, userStats, adminCount] = await Promise.all([
        // Architect stats
        Promise.all([
          prisma.architect.count({ where: { status: 'UNPAID' } }),
          prisma.architect.count({ where: { status: 'ACTIVE' } }),
          prisma.architect.count({ where: { status: 'BANNED' } }),
          prisma.architect.count(),
        ]).then(([unpaid, active, banned, total]) => ({
          unpaid,
          active,
          banned,
          total,
        })),

        // Transaction stats
        Promise.all([
          prisma.transaction.count({ where: { status: 'PENDING' } }),
          prisma.transaction.count({ where: { status: 'SUCCESS' } }),
          prisma.transaction.count({ where: { status: 'FAILED' } }),
          prisma.transaction.count({ where: { status: 'EXPIRED' } }),
          prisma.transaction.count(),
          prisma.transaction.aggregate({
            where: { status: 'SUCCESS' },
            _sum: { amount: true },
          }),
        ]).then(([pending, success, failed, expired, total, sumResult]) => ({
          pending,
          success,
          failed,
          expired,
          total,
          totalAmount: sumResult._sum.amount || 0,
        })),

        // User stats
        Promise.all([
          prisma.user.count({ where: { emailVerified: true } }),
          prisma.user.count({ where: { emailVerified: false } }),
          prisma.user.count(),
        ]).then(([verified, unverified, total]) => ({
          verified,
          unverified,
          total,
        })),

        // Admin count
        adminRepository.countAdmins(),
      ]);

      return {
        architects: architectStats,
        transactions: transactionStats,
        users: userStats,
        admins: adminCount,
      };
    } catch (error) {
      console.error('❌ Failed to get dashboard stats:', error.message);
      throw error;
    }
  }
}

module.exports = new AdminAuthService();