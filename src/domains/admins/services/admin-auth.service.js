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
        role: admin.role, // ✅ ambil dari database: ADMIN / SUPER_ADMIN
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
  * Add new admin (create admin)
  * Hanya admin khusus yang boleh menambahkan admin
  *
  * @param {Object} requester - admin dari JWT (req.user)
  * @param {Object} payload - { email, password, fullName }
  * @returns {Promise<Object>} - Created admin (safe fields)
  */
  async addAdmin(requester, payload) {
    try {
      // ✅ allowlist admin khusus
      const ADMIN_CREATOR_EMAIL = "admin@halositek.com";
      if (!requester || requester.email !== ADMIN_CREATOR_EMAIL) {
        throw new ForbiddenError("Anda tidak memiliki izin untuk menambahkan admin");
      }

      const { email, password, fullName } = payload || {};

      if (!email || !password || !fullName) {
        throw new ValidationError("Email, password, dan fullName wajib diisi");
      }

      const passwordValidation = PasswordHasher.validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        throw new ValidationError(
          "Password tidak memenuhi requirement",
          passwordValidation.errors.map((err) => ({ field: "password", message: err }))
        );
      }

      const hashedPassword = await PasswordHasher.hash(password);

      const created = await adminRepository.createAdmin({
        email,
        password: hashedPassword,
        fullName,
        role: "ADMIN", // ✅ hardcode
      });

      console.log("✅ Admin created:", created.email, "by", requester.email);

      return {
        id: created.id,
        email: created.email,
        fullName: created.fullName,
        role: created.role,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      };
    } catch (error) {
      console.error("❌ Failed to add admin:", error.message);
      throw error;
    }
  }



  /**
 * Delete admin
 * @param {String} requesterAdminId - id admin yang sedang login (dari token)
 * @param {String} targetAdminId - id admin yang mau dihapus
 * @returns {Promise<Object>} - deleted admin (safe fields)
 */
  async deleteAdmin(requesterAdminId, targetAdminId) {
    try {
      if (!targetAdminId) {
        throw new ValidationError("Admin ID is required");
      }

      // ❌ cegah self-delete
      if (String(requesterAdminId) === String(targetAdminId)) {
        throw new BadRequestError("Tidak boleh menghapus akun admin sendiri");
      }

      // Pastikan admin target ada
      const admin = await adminRepository.findByIdOrFail(targetAdminId);

      // Hapus
      await adminRepository.deleteAdmin(targetAdminId);

      console.log("🗑️ Admin deleted:", targetAdminId);

      // Kembalikan field aman (opsional)
      return {
        id: admin.id,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt,
      };
    } catch (error) {
      console.error("❌ Failed to delete admin:", error.message);
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
 * Update admin by ID (admin management)
 * @param {String} requesterAdminId - Admin ID dari JWT
 * @param {String} targetAdminId - Admin ID yang akan diupdate
 * @param {Object} payload - Data update (fullName, email, password?)
 * @returns {Promise<Object>} - Updated admin (safe fields)
 */
  async updateAdminById(requesterAdminId, targetAdminId, payload) {
    try {
      if (!targetAdminId) {
        throw new ValidationError("Admin ID is required");
      }

      // (opsional tapi disarankan) cegah edit diri sendiri lewat endpoint ini
      if (String(requesterAdminId) === String(targetAdminId)) {
        throw new BadRequestError(
          "Gunakan endpoint update profile untuk mengubah akun sendiri"
        );
      }

      // Pastikan admin target ada
      await adminRepository.findByIdOrFail(targetAdminId);

      const updateData = {};

      if (payload.fullName) updateData.fullName = payload.fullName;
      if (payload.email) updateData.email = payload.email;

      if (payload.password) {
        const validation = PasswordHasher.validatePasswordStrength(payload.password);
        if (!validation.isValid) {
          throw new ValidationError(
            "Password tidak memenuhi requirement",
            validation.errors.map((err) => ({
              field: "password",
              message: err,
            }))
          );
        }
        updateData.password = await PasswordHasher.hash(payload.password);
      }

      if (Object.keys(updateData).length === 0) {
        throw new ValidationError("Tidak ada data yang diubah");
      }

      // Update admin
      await adminRepository.updateProfile(targetAdminId, updateData);

      console.log("✏️ Admin updated:", targetAdminId);

      // Ambil data terbaru (tanpa password)
      const updated = await adminRepository.findByIdOrFail(targetAdminId);

      return {
        id: updated.id,
        email: updated.email,
        fullName: updated.fullName,
        role: updated.role,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      };
    } catch (error) {
      console.error("❌ Failed to update admin by id:", error.message);
      throw error;
    }
  }


  /**
 * Get all admins
 * @returns {Promise<Array>} - List admin data
 */
  async getAllAdmins() {
    try {
      // ✅ jangan pakai include untuk scalar fields
      const admins = await adminRepository.findAll(
        {},                 // where
        {},                 // include (kosong)
        { createdAt: "desc" } // orderBy
      );

      // ✅ samakan output seperti getProfile (hanya field aman)
      return admins.map((admin) => ({
        id: admin.id,
        email: admin.email,
        username: admin.username,
        fullName: admin.fullName,
        role: admin.role,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt,
      }));
    } catch (error) {
      console.error("❌ Failed to get all admins:", error.message);
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