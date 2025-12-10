/**
 * Architect Authentication Service
 * Handle login, profile management, dan authentication logic
 */

const {
  architectRepository,
  certificationRepository,
  portfolioLinkRepository,
  transactionRepository,
} = require('../repositories');

const PasswordHasher = require('../../../utils/password-hasher');
const JWTHelper = require('../../../utils/jwt-helper');
const FileUploadHelper = require('../../../utils/file-upload-helper');

const {
  ValidationError,
  AuthenticationError,
  NotFoundError,
  BadRequestError,
} = require('../../../errors/app-errors');

class ArchitectAuthService {
  /**
   * Login architect
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

      // Find architect by email
      const architect = await architectRepository.findByEmail(email, {
        transactions: {
          where: { status: 'PENDING' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      });

      if (!architect) {
        throw new AuthenticationError('Invalid email or password');
      }

      // Verify password
      const isPasswordValid = await PasswordHasher.compare(password, architect.password);

      if (!isPasswordValid) {
        throw new AuthenticationError('Invalid email or password');
      }

      // Check account status
      if (architect.status === 'UNPAID') {
        // Account belum bayar
        const pendingTransaction = architect.transactions?.[0];

        if (pendingTransaction) {
          return {
            success: false,
            paymentRequired: true,
            message: 'Account not activated. Please complete payment first.',
            data: {
              architect: {
                id: architect.id,
                name: architect.name,
                email: architect.email,
                status: architect.status,
              },
              payment: {
                orderId: pendingTransaction.orderId,
                paymentToken: pendingTransaction.paymentToken,
                amount: pendingTransaction.amount,
                expiredAt: pendingTransaction.expiredAt,
                paymentUrl: `${process.env.FRONTEND_URL}/payment/${pendingTransaction.paymentToken}`,
              },
            },
          };
        }

        throw new AuthenticationError(
          'Account not activated. Please register again to get payment link.'
        );
      }

      if (architect.status === 'BANNED') {
        throw new AuthenticationError(
          'Your account has been banned. Please contact support.'
        );
      }

      // Generate tokens
      const accessToken = JWTHelper.generateAccessToken({
        id: architect.id,
        email: architect.email,
        role: 'ARCHITECT',
        status: architect.status,
      });

      const refreshToken = JWTHelper.generateRefreshToken({
        id: architect.id,
        email: architect.email,
      });

      console.log('✅ Architect logged in:', architect.email);

      return {
        success: true,
        message: 'Login successful',
        data: {
          architect: {
            id: architect.id,
            name: architect.name,
            email: architect.email,
            phone: architect.phone,
            profilePictureUrl: architect.profilePictureUrl,
            status: architect.status,
            emailVerified: architect.emailVerified,
          },
          tokens: {
            accessToken,
            refreshToken,
          },
        },
      };
    } catch (error) {
      console.error('❌ Login failed:', error.message);
      throw error;
    }
  }

  /**
   * Get architect profile
   * @param {String} architectId - Architect ID
   * @returns {Promise<Object>} - Profile data
   */
  async getProfile(architectId) {
    try {
      const architect = await architectRepository.findByIdWithRelations(architectId);

      if (!architect) {
        throw new NotFoundError('Architect not found');
      }

      // Parse keahlianKhusus from JSON string
      let keahlianKhusus = [];
      if (architect.keahlianKhusus) {
        try {
          keahlianKhusus = JSON.parse(architect.keahlianKhusus);
        } catch (e) {
          keahlianKhusus = [];
        }
      }

      return {
        id: architect.id,
        email: architect.email,
        name: architect.name,
        phone: architect.phone,
        profilePictureUrl: architect.profilePictureUrl
          ? FileUploadHelper.getFileUrl(architect.profilePictureUrl)
          : null,
        tahunPengalaman: architect.tahunPengalaman,
        areaPengalaman: architect.areaPengalaman,
        keahlianKhusus,
        status: architect.status,
        emailVerified: architect.emailVerified,
        emailVerifiedAt: architect.emailVerifiedAt,
        certifications: architect.certifications.map((cert) => ({
          id: cert.id,
          certificationName: cert.certificationName,
          penerbit: cert.penerbit,
          year: cert.year,
          berkasUrl: FileUploadHelper.getFileUrl(cert.berkasUrl),
          createdAt: cert.createdAt,
        })),
        portfolioLinks: architect.portfolioLinks.map((link) => ({
          id: link.id,
          url: link.url,
          order: link.order,
        })),
        designs: architect.designs?.map((design) => ({
          id: design.id,
          title: design.title,
          kategori: design.kategori,
          createdAt: design.createdAt,
        })) || [],
        createdAt: architect.createdAt,
        updatedAt: architect.updatedAt,
      };
    } catch (error) {
      console.error('❌ Failed to get profile:', error.message);
      throw error;
    }
  }

  /**
   * Update architect profile
   * @param {String} architectId - Architect ID
   * @param {Object} profileData - Profile data to update
   * @param {Object} files - Uploaded files (optional)
   * @returns {Promise<Object>} - Updated profile
   */
  async updateProfile(architectId, profileData, files = {}) {
    try {
      // Get current architect
      const architect = await architectRepository.findByIdOrFail(architectId);

      // Prepare update data
      const updateData = {};

      // Basic info
      if (profileData.name) updateData.name = profileData.name;
      if (profileData.phone) updateData.phone = profileData.phone;

      // Professional info
      if (profileData.tahunPengalaman !== undefined) {
        updateData.tahunPengalaman = parseInt(profileData.tahunPengalaman);
      }
      if (profileData.areaPengalaman) {
        updateData.areaPengalaman = profileData.areaPengalaman;
      }

      // Handle keahlianKhusus
      if (profileData.keahlianKhusus) {
        const keahlian = Array.isArray(profileData.keahlianKhusus)
          ? profileData.keahlianKhusus
          : JSON.parse(profileData.keahlianKhusus);
        updateData.keahlianKhusus = JSON.stringify(keahlian);
      }

      // Handle profile picture upload
      if (files.profilePicture) {
        // Delete old profile picture if exists
        if (architect.profilePictureUrl) {
          FileUploadHelper.deleteFile(architect.profilePictureUrl);
        }
        updateData.profilePictureUrl = files.profilePicture.path;
      }

      // Update architect basic data
      const updatedArchitect = await architectRepository.updateProfile(
        architectId,
        updateData
      );

      // Handle certifications update
      if (profileData.certifications || files.certifications) {
        await this.updateCertifications(
          architectId,
          profileData.certifications,
          files.certifications
        );
      }

      // Handle portfolio links update
      if (profileData.portfolioLinks) {
        await this.updatePortfolioLinks(architectId, profileData.portfolioLinks);
      }

      console.log('✅ Profile updated:', architectId);

      // Return updated profile
      return await this.getProfile(architectId);
    } catch (error) {
      console.error('❌ Failed to update profile:', error.message);
      throw error;
    }
  }

  /**
   * Update certifications
   * @param {String} architectId - Architect ID
   * @param {Array|String} certificationsData - Certifications data
   * @param {Array} certificationFiles - Uploaded files
   */
  async updateCertifications(architectId, certificationsData, certificationFiles = []) {
    try {
      if (!certificationsData) return;

      // Parse certifications data
      const certifications = Array.isArray(certificationsData)
        ? certificationsData
        : JSON.parse(certificationsData);

      // Delete all existing certifications
      await certificationRepository.deleteByArchitectId(architectId);

      // Create new certifications
      const newCertifications = certifications.map((cert, index) => ({
        certificationName: cert.certificationName,
        penerbit: cert.penerbit,
        year: parseInt(cert.year),
        berkasUrl: certificationFiles[index]
          ? certificationFiles[index].path
          : cert.berkasUrl,
      }));

      if (newCertifications.length > 0) {
        await certificationRepository.createMany(architectId, newCertifications);
      }

      console.log('✅ Certifications updated');
    } catch (error) {
      console.error('❌ Failed to update certifications:', error.message);
      throw error;
    }
  }

  /**
   * Update portfolio links
   * @param {String} architectId - Architect ID
   * @param {Array|String} portfolioLinksData - Portfolio links data
   */
  async updatePortfolioLinks(architectId, portfolioLinksData) {
    try {
      if (!portfolioLinksData) return;

      // Parse portfolio links
      const portfolioLinks = Array.isArray(portfolioLinksData)
        ? portfolioLinksData
        : JSON.parse(portfolioLinksData);

      // Replace all portfolio links
      const newLinks = portfolioLinks.map((link) => ({
        url: link.url || link,
      }));

      await portfolioLinkRepository.replaceAll(architectId, newLinks);

      console.log('✅ Portfolio links updated');
    } catch (error) {
      console.error('❌ Failed to update portfolio links:', error.message);
      throw error;
    }
  }

  /**
   * Change password
   * @param {String} architectId - Architect ID
   * @param {Object} passwordData - { oldPassword, newPassword }
   * @returns {Promise<Object>} - Result
   */
  async changePassword(architectId, passwordData) {
    try {
      const { oldPassword, newPassword } = passwordData;

      // Validate input
      if (!oldPassword || !newPassword) {
        throw new ValidationError('Old password and new password are required');
      }

      // Get architect
      const architect = await architectRepository.findByIdOrFail(architectId);

      // Verify old password
      const isOldPasswordValid = await PasswordHasher.compare(
        oldPassword,
        architect.password
      );

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
      await architectRepository.update(architectId, {
        password: hashedPassword,
      });

      console.log('✅ Password changed:', architect.email);

      return {
        success: true,
        message: 'Password changed successfully',
      };
    } catch (error) {
      console.error('❌ Failed to change password:', error.message);
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

      // Get architect
      const architect = await architectRepository.findByIdOrFail(decoded.id);

      // Check status
      if (architect.status !== 'ACTIVE') {
        throw new AuthenticationError('Account is not active');
      }

      // Generate new access token
      const newAccessToken = JWTHelper.generateAccessToken({
        id: architect.id,
        email: architect.email,
        role: 'ARCHITECT',
        status: architect.status,
      });

      return {
        success: true,
        data: {
          accessToken: newAccessToken,
        },
      };
    } catch (error) {
      console.error('❌ Failed to refresh token:', error.message);
      throw error;
    }
  }

  /**
   * Logout (optional - for token blacklist implementation)
   * @param {String} architectId - Architect ID
   * @returns {Promise<Object>} - Result
   */
  async logout(architectId) {
    try {
      // TODO: Implement token blacklist if needed
      // For now, just return success
      // Client should delete token from storage

      console.log('✅ Architect logged out:', architectId);

      return {
        success: true,
        message: 'Logged out successfully',
      };
    } catch (error) {
      console.error('❌ Logout failed:', error.message);
      throw error;
    }
  }

  /**
   * Get architect dashboard statistics
   * @param {String} architectId - Architect ID
   * @returns {Promise<Object>} - Dashboard statistics
   */
  async getDashboardStats(architectId) {
    try {
      const stats = await architectRepository.getStatistics(architectId);

      return stats;
    } catch (error) {
      console.error('❌ Failed to get dashboard stats:', error.message);
      throw error;
    }
  }
}

module.exports = new ArchitectAuthService();