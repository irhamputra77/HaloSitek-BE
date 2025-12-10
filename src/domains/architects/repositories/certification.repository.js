/**
 * Certification Repository
 * Handle database operations untuk Certification model
 */

const prisma = require('../../../config/prisma-client');
const BaseRepository = require('./base-repository');
const { NotFoundError, DatabaseError } = require('../../../errors/app-errors');

class CertificationRepository extends BaseRepository {
  constructor() {
    super(prisma.certification, 'Certification');
  }

  /**
   * Create certification for architect
   * @param {String} architectId - Architect ID
   * @param {Object} certificationData - Certification data
   * @returns {Promise<Object>} - Created certification
   */
  async createForArchitect(architectId, certificationData) {
    try {
      const certification = await this.create({
        architectId,
        ...certificationData,
      });
      return certification;
    } catch (error) {
      throw new DatabaseError(`Failed to create certification: ${error.message}`);
    }
  }

  /**
   * Create multiple certifications
   * @param {String} architectId - Architect ID
   * @param {Array} certificationsData - Array of certification data
   * @returns {Promise<Array>} - Created certifications
   */
  async createMany(architectId, certificationsData) {
    try {
      const certifications = await Promise.all(
        certificationsData.map((certData) =>
          this.createForArchitect(architectId, certData)
        )
      );
      return certifications;
    } catch (error) {
      throw new DatabaseError(`Failed to create certifications: ${error.message}`);
    }
  }

  /**
   * Find certifications by architect ID
   * @param {String} architectId - Architect ID
   * @param {Object} orderBy - Order by clause
   * @returns {Promise<Array>} - Array of certifications
   */
  async findByArchitectId(architectId, orderBy = { year: 'desc' }) {
    return await this.findAll({ architectId }, {}, orderBy);
  }

  /**
   * Find certification by ID with architect info
   * @param {String} id - Certification ID
   * @returns {Promise<Object|null>} - Certification with architect
   */
  async findByIdWithArchitect(id) {
    return await this.findById(id, {
      architect: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    });
  }

  /**
   * Update certification
   * @param {String} id - Certification ID
   * @param {Object} data - Update data
   * @returns {Promise<Object>} - Updated certification
   */
  async updateCertification(id, data) {
    return await this.update(id, data);
  }

  /**
   * Delete certification
   * @param {String} id - Certification ID
   * @returns {Promise<Object>} - Deleted certification
   */
  async deleteCertification(id) {
    return await this.delete(id);
  }

  /**
   * Delete all certifications for architect
   * @param {String} architectId - Architect ID
   * @returns {Promise<Object>} - { count: number }
   */
  async deleteByArchitectId(architectId) {
    return await this.deleteMany({ architectId });
  }

  /**
   * Count certifications by architect
   * @param {String} architectId - Architect ID
   * @returns {Promise<Number>} - Count
   */
  async countByArchitectId(architectId) {
    return await this.count({ architectId });
  }

  /**
   * Find certifications by year range
   * @param {String} architectId - Architect ID
   * @param {Number} startYear - Start year
   * @param {Number} endYear - End year
   * @returns {Promise<Array>} - Array of certifications
   */
  async findByYearRange(architectId, startYear, endYear) {
    return await this.findAll({
      architectId,
      year: {
        gte: startYear,
        lte: endYear,
      },
    });
  }

  /**
   * Find latest certification
   * @param {String} architectId - Architect ID
   * @returns {Promise<Object|null>} - Latest certification
   */
  async findLatest(architectId) {
    try {
      const certification = await prisma.certification.findFirst({
        where: { architectId },
        orderBy: { year: 'desc' },
      });
      return certification;
    } catch (error) {
      throw new DatabaseError(`Failed to find latest certification: ${error.message}`);
    }
  }

  /**
   * Search certifications by name or penerbit
   * @param {String} architectId - Architect ID
   * @param {String} searchTerm - Search term
   * @returns {Promise<Array>} - Array of certifications
   */
  async search(architectId, searchTerm) {
    return await this.findAll({
      architectId,
      OR: [
        { certificationName: { contains: searchTerm, mode: 'insensitive' } },
        { penerbit: { contains: searchTerm, mode: 'insensitive' } },
      ],
    });
  }

  /**
   * Check if architect has certification
   * @param {String} architectId - Architect ID
   * @param {String} certificationName - Certification name
   * @returns {Promise<Boolean>} - True if has certification
   */
  async hasCertification(architectId, certificationName) {
    return await this.exists({
      architectId,
      certificationName: { equals: certificationName, mode: 'insensitive' },
    });
  }

  /**
   * Get certification statistics for architect
   * @param {String} architectId - Architect ID
   * @returns {Promise<Object>} - Statistics
   */
  async getStatistics(architectId) {
    const certifications = await this.findByArchitectId(architectId);

    if (certifications.length === 0) {
      return {
        total: 0,
        oldest: null,
        newest: null,
        penerbitList: [],
      };
    }

    const years = certifications.map((cert) => cert.year);
    const penerbitList = [...new Set(certifications.map((cert) => cert.penerbit))];

    return {
      total: certifications.length,
      oldestYear: Math.min(...years),
      newestYear: Math.max(...years),
      penerbitList,
    };
  }
}

module.exports = new CertificationRepository();