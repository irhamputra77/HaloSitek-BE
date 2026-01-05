/**
 * User Repository
 * Handle database operations untuk User model
 */

const prisma = require('../../../config/prisma-client');
const BaseRepository = require('../../architects/repositories/base-repository');
const { ConflictError, NotFoundError } = require('../../../errors/app-errors');

class UserRepository extends BaseRepository {
  constructor() {
    super(prisma.user, 'User');
  }

  /**
   * Find user by email
   * @param {String} email - User email
   * @param {Object} include - Relations to include
   * @returns {Promise<Object|null>} - User or null
   */
  async findByEmail(email, include = {}) {
    return await this.findOne({ email }, include);
  }

  /**
   * Find user by username
   * @param {String} username - Username
   * @param {Object} include - Relations to include
   * @returns {Promise<Object|null>} - User or null
   */
  async findByUsername(username, include = {}) {
    return await this.findOne({ username }, include);
  }

  /**
   * Find user by email or username
   * @param {String} identifier - Email or username
   * @returns {Promise<Object|null>} - User or null
   */
  async findByEmailOrUsername(identifier) {
    return await this.findOne({
      OR: [
        { email: identifier },
        { username: identifier },
      ],
    });
  }

  /**
   * Check if email already exists
   * @param {String} email - Email to check
   * @param {String} excludeId - ID to exclude from check (untuk update)
   * @returns {Promise<Boolean>} - True if exists
   */
  async isEmailExists(email, excludeId = null) {
    const where = { email };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    return await this.exists(where);
  }

  /**
   * Check if username already exists
   * @param {String} username - Username to check
   * @param {String} excludeId - ID to exclude from check (untuk update)
   * @returns {Promise<Boolean>} - True if exists
   */
  async isUsernameExists(username, excludeId = null) {
    const where = { username };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    return await this.exists(where);
  }

  /**
   * Create user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} - Created user
   */
  async createUser(userData) {
    try {
      // Check if email already exists
      const emailExists = await this.isEmailExists(userData.email);
      if (emailExists) {
        throw new ConflictError('Email already registered');
      }

      // Check if username already exists
      const usernameExists = await this.isUsernameExists(userData.username);
      if (usernameExists) {
        throw new ConflictError('Username already taken');
      }

      // Create user
      const user = await this.create(userData);

      return user;
    } catch (error) {
      if (error instanceof ConflictError) {
        throw error;
      }
      throw new DatabaseError(`Failed to create user: ${error.message}`);
    }
  }

  /**
   * Update user profile
   * @param {String} id - User ID
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<Object>} - Updated user
   */
  async updateProfile(id, profileData) {
    // Check if updating email and if it already exists
    if (profileData.email) {
      const emailExists = await this.isEmailExists(profileData.email, id);
      if (emailExists) {
        throw new ConflictError('Email already in use');
      }
    }

    // Check if updating username and if it already exists
    if (profileData.username) {
      const usernameExists = await this.isUsernameExists(profileData.username, id);
      if (usernameExists) {
        throw new ConflictError('Username already taken');
      }
    }

    return await this.update(id, profileData);
  }

  /**
   * Update profile picture
   * @param {String} id - User ID
   * @param {String} profilePictureUrl - New profile picture URL
   * @returns {Promise<Object>} - Updated user
   */
  async updateProfilePicture(id, profilePictureUrl) {
    return await this.update(id, { profilePictureUrl });
  }

  /**
   * Verify user email
   * @param {String} id - User ID
   * @returns {Promise<Object>} - Updated user
   */
  async verifyEmail(id) {
    return await this.update(id, {
      emailVerified: true,
      emailVerifiedAt: new Date(),
    });
  }

  /**
   * Search users
   * @param {String} searchTerm - Search term
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - { data, pagination }
   */
  async search(searchTerm, options = {}) {
    return await this.findWithPagination({
      ...options,
      where: {
        OR: [
          { fullName: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
          { username: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
    });
  }

  /**
   * Count total users
   * @returns {Promise<Object>} - { verified, unverified, total }
   */
  async countByVerification() {
    const [verified, unverified, total] = await Promise.all([
      this.count({ emailVerified: true }),
      this.count({ emailVerified: false }),
      this.count(),
    ]);

    return { verified, unverified, total };
  }

  /**
   * Find users with pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - { data, pagination }
   */
  async findUsers(options = {}) {
    return await this.findWithPagination({
      ...options,
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        profilePictureUrl: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: options.orderBy || { createdAt: 'desc' },
    });
  }

  /**
   * Delete user account
   * @param {String} id - User ID
   * @returns {Promise<Object>} - Deleted user
   */
  async deleteUser(id) {
    return await this.delete(id);
  }
}

module.exports = new UserRepository();