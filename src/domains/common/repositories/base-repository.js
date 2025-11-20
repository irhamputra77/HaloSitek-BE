/**
 * Base Repository
 * Parent class untuk semua repositories
 * Menyediakan common CRUD operations
 */

const { DatabaseError, NotFoundError } = require('../../../errors/app-errors');

class BaseRepository {
  /**
   * Constructor
   * @param {Object} model - Prisma model (e.g., prisma.architect)
   * @param {String} modelName - Model name untuk error messages
   */
  constructor(model, modelName) {
    this.model = model;
    this.modelName = modelName;
  }

  /**
   * Find by ID
   * @param {String} id - Record ID
   * @param {Object} include - Relations to include
   * @returns {Promise<Object|null>} - Record or null
   */
  async findById(id, include = {}) {
    try {
      const record = await this.model.findUnique({
        where: { id },
        include,
      });
      return record;
    } catch (error) {
      throw new DatabaseError(`Failed to find ${this.modelName} by ID: ${error.message}`);
    }
  }

  /**
   * Find by ID or throw error
   * @param {String} id - Record ID
   * @param {Object} include - Relations to include
   * @returns {Promise<Object>} - Record
   * @throws {NotFoundError} - If not found
   */
  async findByIdOrFail(id, include = {}) {
    const record = await this.findById(id, include);
    
    if (!record) {
      throw new NotFoundError(`${this.modelName} with ID ${id} not found`);
    }
    
    return record;
  }

  /**
   * Find one by criteria
   * @param {Object} where - Where clause
   * @param {Object} include - Relations to include
   * @returns {Promise<Object|null>} - Record or null
   */
  async findOne(where, include = {}) {
    try {
      const record = await this.model.findFirst({
        where,
        include,
      });
      return record;
    } catch (error) {
      throw new DatabaseError(`Failed to find ${this.modelName}: ${error.message}`);
    }
  }

  /**
   * Find all records
   * @param {Object} where - Where clause (optional)
   * @param {Object} include - Relations to include
   * @param {Object} orderBy - Order by clause
   * @returns {Promise<Array>} - Array of records
   */
  async findAll(where = {}, include = {}, orderBy = {}) {
    try {
      const records = await this.model.findMany({
        where,
        include,
        orderBy,
      });
      return records;
    } catch (error) {
      throw new DatabaseError(`Failed to find ${this.modelName} records: ${error.message}`);
    }
  }

  /**
   * Find with pagination
   * @param {Object} options - Query options
   * @param {Object} options.where - Where clause
   * @param {Object} options.include - Relations to include
   * @param {Object} options.orderBy - Order by clause
   * @param {Number} options.page - Page number (default: 1)
   * @param {Number} options.limit - Items per page (default: 10)
   * @returns {Promise<Object>} - { data, pagination }
   */
  async findWithPagination(options = {}) {
    try {
      const {
        where = {},
        include = {},
        orderBy = {},
        page = 1,
        limit = 10,
      } = options;

      const skip = (page - 1) * limit;

      // Parallel queries untuk performa
      const [data, totalItems] = await Promise.all([
        this.model.findMany({
          where,
          include,
          orderBy,
          skip,
          take: limit,
        }),
        this.model.count({ where }),
      ]);

      return {
        data,
        pagination: {
          page,
          limit,
          totalItems,
          totalPages: Math.ceil(totalItems / limit),
          hasNextPage: page < Math.ceil(totalItems / limit),
          hasPrevPage: page > 1,
        },
      };
    } catch (error) {
      throw new DatabaseError(`Failed to paginate ${this.modelName}: ${error.message}`);
    }
  }

  /**
   * Create new record
   * @param {Object} data - Record data
   * @returns {Promise<Object>} - Created record
   */
  async create(data) {
    try {
      const record = await this.model.create({
        data,
      });
      return record;
    } catch (error) {
      throw new DatabaseError(`Failed to create ${this.modelName}: ${error.message}`);
    }
  }

  /**
   * Update record by ID
   * @param {String} id - Record ID
   * @param {Object} data - Update data
   * @returns {Promise<Object>} - Updated record
   */
  async update(id, data) {
    try {
      const record = await this.model.update({
        where: { id },
        data,
      });
      return record;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundError(`${this.modelName} with ID ${id} not found`);
      }
      throw new DatabaseError(`Failed to update ${this.modelName}: ${error.message}`);
    }
  }

  /**
   * Delete record by ID
   * @param {String} id - Record ID
   * @returns {Promise<Object>} - Deleted record
   */
  async delete(id) {
    try {
      const record = await this.model.delete({
        where: { id },
      });
      return record;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundError(`${this.modelName} with ID ${id} not found`);
      }
      throw new DatabaseError(`Failed to delete ${this.modelName}: ${error.message}`);
    }
  }

  /**
   * Count records
   * @param {Object} where - Where clause (optional)
   * @returns {Promise<Number>} - Count
   */
  async count(where = {}) {
    try {
      const count = await this.model.count({ where });
      return count;
    } catch (error) {
      throw new DatabaseError(`Failed to count ${this.modelName}: ${error.message}`);
    }
  }

  /**
   * Check if record exists
   * @param {Object} where - Where clause
   * @returns {Promise<Boolean>} - True if exists
   */
  async exists(where) {
    try {
      const count = await this.model.count({ where });
      return count > 0;
    } catch (error) {
      throw new DatabaseError(`Failed to check ${this.modelName} existence: ${error.message}`);
    }
  }

  /**
   * Upsert (update or create)
   * @param {Object} where - Unique where clause
   * @param {Object} create - Data for create
   * @param {Object} update - Data for update
   * @returns {Promise<Object>} - Record
   */
  async upsert(where, create, update) {
    try {
      const record = await this.model.upsert({
        where,
        create,
        update,
      });
      return record;
    } catch (error) {
      throw new DatabaseError(`Failed to upsert ${this.modelName}: ${error.message}`);
    }
  }

  /**
   * Delete many records
   * @param {Object} where - Where clause
   * @returns {Promise<Object>} - { count: number }
   */
  async deleteMany(where) {
    try {
      const result = await this.model.deleteMany({ where });
      return result;
    } catch (error) {
      throw new DatabaseError(`Failed to delete many ${this.modelName}: ${error.message}`);
    }
  }

  /**
   * Update many records
   * @param {Object} where - Where clause
   * @param {Object} data - Update data
   * @returns {Promise<Object>} - { count: number }
   */
  async updateMany(where, data) {
    try {
      const result = await this.model.updateMany({
        where,
        data,
      });
      return result;
    } catch (error) {
      throw new DatabaseError(`Failed to update many ${this.modelName}: ${error.message}`);
    }
  }
}

module.exports = BaseRepository;