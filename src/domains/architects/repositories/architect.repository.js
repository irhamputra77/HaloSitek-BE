/**
 * Architect Repository
 * Handle database operations untuk Architect model
 */

const prisma = require('../../config/prisma-client');
const BaseRepository = require('./base-repository');
const { ConflictError, NotFoundError } = require('../../errors/app-errors');

class ArchitectRepository extends BaseRepository {
  constructor() {
    super(prisma.architect, 'Architect');
  }

  /**
   * Find architect by email
   * @param {String} email - Architect email
   * @param {Object} include - Relations to include
   * @returns {Promise<Object|null>} - Architect or null
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
   * Create architect with complete data
   * @param {Object} architectData - Architect data
   * @param {Array} certifications - Certifications data (optional)
   * @param {Array} portfolioLinks - Portfolio links data (optional)
   * @returns {Promise<Object>} - Created architect with relations
   */
  async createWithRelations(architectData, certifications = [], portfolioLinks = []) {
    try {
      // Check if email already exists
      const emailExists = await this.isEmailExists(architectData.email);
      if (emailExists) {
        throw new ConflictError('Email already registered');
      }

      // Create architect dengan relations
      const architect = await prisma.architect.create({
        data: {
          ...architectData,
          certifications: certifications.length > 0 ? {
            create: certifications,
          } : undefined,
          portfolioLinks: portfolioLinks.length > 0 ? {
            create: portfolioLinks,
          } : undefined,
        },
        include: {
          certifications: true,
          portfolioLinks: true,
        },
      });

      return architect;
    } catch (error) {
      if (error instanceof ConflictError) {
        throw error;
      }
      throw new DatabaseError(`Failed to create architect: ${error.message}`);
    }
  }

  /**
   * Find architect with all relations
   * @param {String} id - Architect ID
   * @returns {Promise<Object>} - Architect with relations
   */
  async findByIdWithRelations(id) {
    return await this.findById(id, {
      certifications: {
        orderBy: { year: 'desc' },
      },
      portfolioLinks: {
        orderBy: { order: 'asc' },
      },
      transactions: {
        orderBy: { createdAt: 'desc' },
      },
      designs: {
        orderBy: { createdAt: 'desc' },
      },
    });
  }

  /**
   * Update architect status
   * @param {String} id - Architect ID
   * @param {String} status - New status (UNPAID, ACTIVE, BANNED)
   * @returns {Promise<Object>} - Updated architect
   */
  async updateStatus(id, status) {
    return await this.update(id, { status });
  }

  /**
   * Activate architect account (after payment)
   * @param {String} id - Architect ID
   * @returns {Promise<Object>} - Updated architect
   */
  async activateAccount(id) {
    return await this.update(id, {
      status: 'ACTIVE',
    });
  }

  /**
   * Ban architect account
   * @param {String} id - Architect ID
   * @returns {Promise<Object>} - Updated architect
   */
  async banAccount(id) {
    return await this.update(id, {
      status: 'BANNED',
    });
  }

  /**
   * Find active architects
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - { data, pagination }
   */
  async findActiveArchitects(options = {}) {
    return await this.findWithPagination({
      ...options,
      where: {
        ...options.where,
        status: 'ACTIVE',
      },
      include: {
        certifications: true,
        portfolioLinks: true,
        designs: {
          select: {
            id: true,
            title: true,
            kategori: true,
          },
        },
      },
      orderBy: options.orderBy || { createdAt: 'desc' },
    });
  }

  /**
   * Find architects by status
   * @param {String} status - Status (UNPAID, ACTIVE, BANNED)
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - { data, pagination }
   */
  async findByStatus(status, options = {}) {
    return await this.findWithPagination({
      ...options,
      where: {
        ...options.where,
        status,
      },
    });
  }

  /**
   * Search architects
   * @param {String} searchTerm - Search term
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - { data, pagination }
   */
  async search(searchTerm, options = {}) {
    return await this.findWithPagination({
      ...options,
      where: {
        AND: [
          { status: 'ACTIVE' }, // Only search active architects
          {
            OR: [
              { name: { contains: searchTerm, mode: 'insensitive' } },
              { email: { contains: searchTerm, mode: 'insensitive' } },
              { areaPengalaman: { contains: searchTerm, mode: 'insensitive' } },
            ],
          },
        ],
      },
      include: {
        certifications: true,
        portfolioLinks: true,
      },
    });
  }

  /**
   * Update architect profile
   * @param {String} id - Architect ID
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<Object>} - Updated architect
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
   * Update profile picture
   * @param {String} id - Architect ID
   * @param {String} profilePictureUrl - New profile picture URL
   * @returns {Promise<Object>} - Updated architect
   */
  async updateProfilePicture(id, profilePictureUrl) {
    return await this.update(id, { profilePictureUrl });
  }

  /**
   * Verify architect email
   * @param {String} id - Architect ID
   * @returns {Promise<Object>} - Updated architect
   */
  async verifyEmail(id) {
    return await this.update(id, {
      emailVerified: true,
      emailVerifiedAt: new Date(),
    });
  }

  /**
   * Count architects by status
   * @returns {Promise<Object>} - { unpaid, active, banned, total }
   */
  async countByStatus() {
    const [unpaid, active, banned, total] = await Promise.all([
      this.count({ status: 'UNPAID' }),
      this.count({ status: 'ACTIVE' }),
      this.count({ status: 'BANNED' }),
      this.count(),
    ]);

    return { unpaid, active, banned, total };
  }

  /**
   * Get architect statistics
   * @param {String} id - Architect ID
   * @returns {Promise<Object>} - Statistics
   */
  async getStatistics(id) {
    const architect = await this.findByIdOrFail(id);

    const [totalDesigns, totalCertifications, totalPortfolioLinks] = await Promise.all([
      prisma.design.count({ where: { architectId: id } }),
      prisma.certification.count({ where: { architectId: id } }),
      prisma.portfolioLink.count({ where: { architectId: id } }),
    ]);

    return {
      architect: {
        id: architect.id,
        name: architect.name,
        status: architect.status,
        createdAt: architect.createdAt,
      },
      statistics: {
        totalDesigns,
        totalCertifications,
        totalPortfolioLinks,
      },
    };
  }

  /**
   * Find architects with pending payment (UNPAID)
   * @returns {Promise<Array>} - Array of unpaid architects
   */
  async findUnpaidArchitects() {
    return await this.findAll(
      { status: 'UNPAID' },
      {
        transactions: {
          where: { status: 'PENDING' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      { createdAt: 'desc' }
    );
  }

  /**
   * Delete architect and all related data (cascade)
   * @param {String} id - Architect ID
   * @returns {Promise<Object>} - Deleted architect
   */
  async deleteWithRelations(id) {
    // Prisma akan otomatis delete related data karena onDelete: Cascade
    return await this.delete(id);
  }
}

module.exports = new ArchitectRepository();