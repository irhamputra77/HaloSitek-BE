/**
 * Portfolio Link Repository
 * Handle database operations untuk PortfolioLink model
 */

const prisma = require('../../config/prisma-client');
const BaseRepository = require('./base-repository');
const { DatabaseError } = require('../../errors/app-errors');

class PortfolioLinkRepository extends BaseRepository {
  constructor() {
    super(prisma.portfolioLink, 'PortfolioLink');
  }

  /**
   * Create portfolio link for architect
   * @param {String} architectId - Architect ID
   * @param {String} url - Portfolio URL
   * @param {Number} order - Order/position (optional)
   * @returns {Promise<Object>} - Created portfolio link
   */
  async createForArchitect(architectId, url, order = 0) {
    try {
      const portfolioLink = await this.create({
        architectId,
        url,
        order,
      });
      return portfolioLink;
    } catch (error) {
      throw new DatabaseError(`Failed to create portfolio link: ${error.message}`);
    }
  }

  /**
   * Create multiple portfolio links
   * @param {String} architectId - Architect ID
   * @param {Array} portfolioLinksData - Array of { url, order }
   * @returns {Promise<Array>} - Created portfolio links
   */
  async createMany(architectId, portfolioLinksData) {
    try {
      const portfolioLinks = await Promise.all(
        portfolioLinksData.map((linkData, index) =>
          this.createForArchitect(
            architectId,
            linkData.url,
            linkData.order !== undefined ? linkData.order : index
          )
        )
      );
      return portfolioLinks;
    } catch (error) {
      throw new DatabaseError(`Failed to create portfolio links: ${error.message}`);
    }
  }

  /**
   * Find portfolio links by architect ID
   * @param {String} architectId - Architect ID
   * @returns {Promise<Array>} - Array of portfolio links (ordered)
   */
  async findByArchitectId(architectId) {
    return await this.findAll(
      { architectId },
      {},
      { order: 'asc' } // Order by position
    );
  }

  /**
   * Find portfolio link by ID with architect info
   * @param {String} id - Portfolio link ID
   * @returns {Promise<Object|null>} - Portfolio link with architect
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
   * Update portfolio link
   * @param {String} id - Portfolio link ID
   * @param {Object} data - Update data (url, order)
   * @returns {Promise<Object>} - Updated portfolio link
   */
  async updatePortfolioLink(id, data) {
    return await this.update(id, data);
  }

  /**
   * Update portfolio link order
   * @param {String} id - Portfolio link ID
   * @param {Number} order - New order
   * @returns {Promise<Object>} - Updated portfolio link
   */
  async updateOrder(id, order) {
    return await this.update(id, { order });
  }

  /**
   * Reorder portfolio links
   * @param {Array} orderedIds - Array of portfolio link IDs in new order
   * @returns {Promise<Array>} - Updated portfolio links
   */
  async reorder(orderedIds) {
    try {
      const updates = orderedIds.map((id, index) =>
        this.updateOrder(id, index)
      );
      const portfolioLinks = await Promise.all(updates);
      return portfolioLinks;
    } catch (error) {
      throw new DatabaseError(`Failed to reorder portfolio links: ${error.message}`);
    }
  }

  /**
   * Delete portfolio link
   * @param {String} id - Portfolio link ID
   * @returns {Promise<Object>} - Deleted portfolio link
   */
  async deletePortfolioLink(id) {
    return await this.delete(id);
  }

  /**
   * Delete all portfolio links for architect
   * @param {String} architectId - Architect ID
   * @returns {Promise<Object>} - { count: number }
   */
  async deleteByArchitectId(architectId) {
    return await this.deleteMany({ architectId });
  }

  /**
   * Count portfolio links by architect
   * @param {String} architectId - Architect ID
   * @returns {Promise<Number>} - Count
   */
  async countByArchitectId(architectId) {
    return await this.count({ architectId });
  }

  /**
   * Check if URL already exists for architect
   * @param {String} architectId - Architect ID
   * @param {String} url - URL to check
   * @param {String} excludeId - ID to exclude (untuk update)
   * @returns {Promise<Boolean>} - True if exists
   */
  async isUrlExists(architectId, url, excludeId = null) {
    const where = {
      architectId,
      url,
    };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    return await this.exists(where);
  }

  /**
   * Get next order number for architect
   * @param {String} architectId - Architect ID
   * @returns {Promise<Number>} - Next order number
   */
  async getNextOrder(architectId) {
    try {
      const lastLink = await prisma.portfolioLink.findFirst({
        where: { architectId },
        orderBy: { order: 'desc' },
      });

      return lastLink ? lastLink.order + 1 : 0;
    } catch (error) {
      throw new DatabaseError(`Failed to get next order: ${error.message}`);
    }
  }

  /**
   * Add portfolio link with auto-increment order
   * @param {String} architectId - Architect ID
   * @param {String} url - Portfolio URL
   * @returns {Promise<Object>} - Created portfolio link
   */
  async addLink(architectId, url) {
    const nextOrder = await this.getNextOrder(architectId);
    return await this.createForArchitect(architectId, url, nextOrder);
  }

  /**
   * Replace all portfolio links for architect
   * @param {String} architectId - Architect ID
   * @param {Array} newLinks - Array of { url }
   * @returns {Promise<Array>} - New portfolio links
   */
  async replaceAll(architectId, newLinks) {
    try {
      // Delete existing links
      await this.deleteByArchitectId(architectId);

      // Create new links
      const portfolioLinksData = newLinks.map((link, index) => ({
        url: link.url,
        order: index,
      }));

      return await this.createMany(architectId, portfolioLinksData);
    } catch (error) {
      throw new DatabaseError(`Failed to replace portfolio links: ${error.message}`);
    }
  }

  /**
   * Get portfolio links with validation
   * @param {String} architectId - Architect ID
   * @returns {Promise<Array>} - Array of validated portfolio links
   */
  async getValidatedLinks(architectId) {
    const links = await this.findByArchitectId(architectId);

    // Basic URL validation (can be enhanced)
    return links.filter((link) => {
      try {
        new URL(link.url);
        return true;
      } catch {
        return false;
      }
    });
  }
}

module.exports = new PortfolioLinkRepository();