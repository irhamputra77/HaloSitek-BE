/**
 * User Authentication Service
 * Handle login, registration, profile management, dan authentication logic
 */

const { userRepository } = require('../repositories');

const PasswordHasher = require('../../../utils/password-hasher');
const JWTHelper = require('../../../utils/jwt-helper');
const FileUploadHelper = require('../../../utils/file-upload-helper');

const {
  ValidationError,
  AuthenticationError,
  NotFoundError,
  BadRequestError,
  ConflictError,
} = require('../../../errors/app-errors');

class UserAuthService {
  /**
   * Register new user
   * @param {Object} registrationData - Registration data
   * @returns {Promise<Object>} - Registration result
   */
  async register(registrationData) {
    try {
      // Validate input
      this.validateRegistrationData(registrationData);

      // Check if email already exists
      const emailExists = await userRepository.isEmailExists(registrationData.email);
      if (emailExists) {
        throw new ConflictError('Email already registered');
      }

      // Check if username already exists
      const usernameExists = await userRepository.isUsernameExists(registrationData.username);
      if (usernameExists) {
        throw new ConflictError('Username already taken');
      }

      // Hash password
      const hashedPassword = await PasswordHasher.hash(registrationData.password);

      // Prepare user data
      const userData = {
        email: registrationData.email,
        username: registrationData.username,
        password: hashedPassword,
        fullName: registrationData.fullName,
        profilePictureUrl: registrationData.profilePictureUrl || null,
        emailVerified: false,
      };

      // Create user
      const user = await userRepository.createUser(userData);

      console.log('✅ User created:', user.id);

      // Generate tokens
      const accessToken = JWTHelper.generateAccessToken({
        id: user.id,
        email: user.email,
        username: user.username,
        role: 'USER',
      });

      const refreshToken = JWTHelper.generateRefreshToken({
        id: user.id,
        email: user.email,
      });

      return {
        success: true,
        message: 'Registration successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            fullName: user.fullName,
            profilePictureUrl: user.profilePictureUrl,
            emailVerified: user.emailVerified,
          },
          tokens: {
            accessToken,
            refreshToken,
          },
        },
      };
    } catch (error) {
      console.error('❌ Registration failed:', error.message);
      throw error;
    }
  }

  /**
   * Validate registration data
   * @param {Object} data - Registration data
   * @throws {ValidationError} - If validation fails
   */
  validateRegistrationData(data) {
    const errors = [];

    // Validate email
    if (!data.email) {
      errors.push({ field: 'email', message: 'Email is required' });
    }

    // Validate username
    if (!data.username) {
      errors.push({ field: 'username', message: 'Username is required' });
    } else if (data.username.length < 3) {
      errors.push({ field: 'username', message: 'Username must be at least 3 characters' });
    } else if (!/^[a-zA-Z0-9_]+$/.test(data.username)) {
      errors.push({ field: 'username', message: 'Username can only contain letters, numbers, and underscores' });
    }

    // Validate password
    if (!data.password) {
      errors.push({ field: 'password', message: 'Password is required' });
    } else {
      const passwordValidation = PasswordHasher.validatePasswordStrength(data.password);
      if (!passwordValidation.isValid) {
        errors.push({
          field: 'password',
          message: passwordValidation.errors.join(', '),
        });
      }
    }

    // Validate full name
    if (!data.fullName) {
      errors.push({ field: 'fullName', message: 'Full name is required' });
    }

    if (errors.length > 0) {
      throw new ValidationError('Validation failed', errors);
    }
  }

  /**
   * Login user
   * @param {Object} credentials - { identifier, password } (identifier can be email or username)
   * @returns {Promise<Object>} - Login result with tokens
   */
  async login(credentials) {
    try {
      const { identifier, password } = credentials;

      // Validate input
      if (!identifier || !password) {
        throw new ValidationError('Email/username and password are required');
      }

      // Find user by email or username
      const user = await userRepository.findByEmailOrUsername(identifier);

      if (!user) {
        throw new AuthenticationError('Invalid email/username or password');
      }

      // Verify password
      const isPasswordValid = await PasswordHasher.compare(password, user.password);

      if (!isPasswordValid) {
        throw new AuthenticationError('Invalid email/username or password');
      }

      // Generate tokens
      const accessToken = JWTHelper.generateAccessToken({
        id: user.id,
        email: user.email,
        username: user.username,
        role: 'USER',
      });

      const refreshToken = JWTHelper.generateRefreshToken({
        id: user.id,
        email: user.email,
      });

      console.log('✅ User logged in:', user.email);

      return {
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            fullName: user.fullName,
            profilePictureUrl: user.profilePictureUrl,
            emailVerified: user.emailVerified,
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
   * Get user profile
   * @param {String} userId - User ID
   * @returns {Promise<Object>} - Profile data
   */
  async getProfile(userId) {
    try {
      const user = await userRepository.findByIdOrFail(userId);

      return {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        profilePictureUrl: user.profilePictureUrl
          ? FileUploadHelper.getFileUrl(user.profilePictureUrl)
          : null,
        emailVerified: user.emailVerified,
        emailVerifiedAt: user.emailVerifiedAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    } catch (error) {
      console.error('❌ Failed to get profile:', error.message);
      throw error;
    }
  }

  /**
   * Update user profile
   * @param {String} userId - User ID
   * @param {Object} profileData - Profile data to update
   * @param {Object} file - Uploaded profile picture (optional)
   * @returns {Promise<Object>} - Updated profile
   */
  async updateProfile(userId, profileData, file = null) {
    try {
      // Get current user
      const user = await userRepository.findByIdOrFail(userId);

      // Prepare update data
      const updateData = {};

      // Basic info
      if (profileData.fullName) updateData.fullName = profileData.fullName;
      if (profileData.email) updateData.email = profileData.email;
      if (profileData.username) updateData.username = profileData.username;

      // Handle profile picture upload
      if (file) {
        // Delete old profile picture if exists
        if (user.profilePictureUrl) {
          FileUploadHelper.deleteFile(user.profilePictureUrl);
        }
        updateData.profilePictureUrl = file.path;
      }

      // Update user
      const updatedUser = await userRepository.updateProfile(userId, updateData);

      console.log('✅ Profile updated:', userId);

      // Return updated profile
      return await this.getProfile(userId);
    } catch (error) {
      console.error('❌ Failed to update profile:', error.message);
      throw error;
    }
  }

  /**
   * Change password
   * @param {String} userId - User ID
   * @param {Object} passwordData - { oldPassword, newPassword }
   * @returns {Promise<Object>} - Result
   */
  async changePassword(userId, passwordData) {
    try {
      const { oldPassword, newPassword } = passwordData;

      // Validate input
      if (!oldPassword || !newPassword) {
        throw new ValidationError('Old password and new password are required');
      }

      // Get user
      const user = await userRepository.findByIdOrFail(userId);

      // Verify old password
      const isOldPasswordValid = await PasswordHasher.compare(oldPassword, user.password);

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
      await userRepository.update(userId, {
        password: hashedPassword,
      });

      console.log('✅ Password changed:', user.email);

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

      // Get user
      const user = await userRepository.findByIdOrFail(decoded.id);

      // Generate new access token
      const newAccessToken = JWTHelper.generateAccessToken({
        id: user.id,
        email: user.email,
        username: user.username,
        role: 'USER',
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
   * @param {String} userId - User ID
   * @returns {Promise<Object>} - Result
   */
  async logout(userId) {
    try {
      // TODO: Implement token blacklist if needed
      // For now, just return success
      // Client should delete token from storage

      console.log('✅ User logged out:', userId);

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
   * Verify user email
   * @param {String} userId - User ID
   * @returns {Promise<Object>} - Result
   */
  async verifyEmail(userId) {
    try {
      await userRepository.verifyEmail(userId);

      console.log('✅ Email verified:', userId);

      return {
        success: true,
        message: 'Email verified successfully',
      };
    } catch (error) {
      console.error('❌ Failed to verify email:', error.message);
      throw error;
    }
  }
}

module.exports = new UserAuthService();