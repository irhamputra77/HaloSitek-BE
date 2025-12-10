/**
 * Admin Repository
 * Handle database operations untuk Admin model
 */

const prisma = require('../../../config/prisma-client');
const BaseRepository = require('../../architects/repositories/base-repository');
const { ConflictError, NotFoundError, DatabaseError } = require('../../../errors/app-errors');

class AdminRepository extends BaseRepository {
  constructor() {
    super(prisma.admin, 'Admin');
  }

  /**
   * Find admin by email
   * @param {String} email - Admin email
   * @param {Object} include - Relations to include
   * @returns {Promise<Object|null>} - Admin or null
   */
  async findByEmail(email, include = {}) {
    return await this.findOne({ email }, include);
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
   * Create admin (for seeding only)
   * @param {Object} adminData - Admin data
   * @returns {Promise<Object>} - Created admin
   */
  async createAdmin(adminData) {
    try {
      // Check if email already exists
      const emailExists = await this.isEmailExists(adminData.email);
      if (emailExists) {
        throw new ConflictError('Email already registered');
      }

      // Create admin
      const admin = await this.create(adminData);

      return admin;
    } catch (error) {
      if (error instanceof ConflictError) {
        throw error;
      }
      throw new DatabaseError(`Failed to create admin: ${error.message}`);
    }
  }

  /**
   * Update admin profile
   * @param {String} id - Admin ID
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<Object>} - Updated admin
   */
  async updateProfile(id, profileData) {
    // Check if updating email and if it already exists
    if (profileData.email) {
      const emailExists = await this.isEmailExists(profileData.email, id);
      if (emailExists) {
        throw new ConflictError('Email already in use');
      }
    }

    return await this.update(id, profileData);
  }

  /**
   * Find all admins
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - { data, pagination }
   */
  async findAdmins(options = {}) {
    return await this.findWithPagination({
      ...options,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: options.orderBy || { createdAt: 'desc' },
    });
  }

  /**
   * Count total admins
   * @returns {Promise<Number>} - Total count
   */
  async countAdmins() {
    return await this.count();
  }

  /**
   * Delete admin
   * @param {String} id - Admin ID
   * @returns {Promise<Object>} - Deleted admin
   */
  async deleteAdmin(id) {
    return await this.delete(id);
  }
}

module.exports = new AdminRepository();