/**
 * Transaction Repository
 * Handle database operations untuk Transaction model (Payment records)
 */

const prisma = require('../../config/prisma-client');
const BaseRepository = require('./base-repository');
const { DatabaseError, NotFoundError } = require('../../errors/app-errors');

class TransactionRepository extends BaseRepository {
  constructor() {
    super(prisma.transaction, 'Transaction');
  }

  /**
   * Create transaction for architect registration
   * @param {Object} transactionData - Transaction data
   * @returns {Promise<Object>} - Created transaction
   */
  async createTransaction(transactionData) {
    try {
      const transaction = await this.create(transactionData);
      return transaction;
    } catch (error) {
      throw new DatabaseError(`Failed to create transaction: ${error.message}`);
    }
  }

  /**
   * Find transaction by order ID
   * @param {String} orderId - Order ID (unique)
   * @returns {Promise<Object|null>} - Transaction
   */
  async findByOrderId(orderId) {
    return await this.findOne({ orderId });
  }

  /**
   * Find transaction by payment token
   * @param {String} paymentToken - Payment token (unique)
   * @returns {Promise<Object|null>} - Transaction
   */
  async findByPaymentToken(paymentToken) {
    return await this.findOne({ paymentToken });
  }

  /**
   * Find transaction by payment token or fail
   * @param {String} paymentToken - Payment token
   * @returns {Promise<Object>} - Transaction
   * @throws {NotFoundError} - If not found
   */
  async findByPaymentTokenOrFail(paymentToken) {
    const transaction = await this.findByPaymentToken(paymentToken);
    
    if (!transaction) {
      throw new NotFoundError('Payment link not found or expired');
    }
    
    return transaction;
  }

  /**
   * Find transaction with architect info
   * @param {String} id - Transaction ID
   * @returns {Promise<Object|null>} - Transaction with architect
   */
  async findByIdWithArchitect(id) {
    return await this.findById(id, {
      architect: {
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
        },
      },
    });
  }

  /**
   * Find transactions by architect ID
   * @param {String} architectId - Architect ID
   * @returns {Promise<Array>} - Array of transactions
   */
  async findByArchitectId(architectId) {
    return await this.findAll(
      { architectId },
      {},
      { createdAt: 'desc' }
    );
  }

  /**
   * Find pending transactions
   * @returns {Promise<Array>} - Array of pending transactions
   */
  async findPending() {
    return await this.findAll(
      { status: 'PENDING' },
      { architect: true },
      { createdAt: 'desc' }
    );
  }

  /**
   * Find expired transactions (PENDING dan sudah lewat expiredAt)
   * @returns {Promise<Array>} - Array of expired transactions
   */
  async findExpired() {
    try {
      const expiredTransactions = await prisma.transaction.findMany({
        where: {
          status: 'PENDING',
          expiredAt: {
            lt: new Date(), // Less than current time
          },
        },
        include: {
          architect: true,
        },
      });
      return expiredTransactions;
    } catch (error) {
      throw new DatabaseError(`Failed to find expired transactions: ${error.message}`);
    }
  }

  /**
   * Update transaction status
   * @param {String} id - Transaction ID
   * @param {String} status - New status (PENDING, SUCCESS, FAILED, EXPIRED)
   * @returns {Promise<Object>} - Updated transaction
   */
  async updateStatus(id, status) {
    const updateData = { status };

    // Set paidAt if status is SUCCESS
    if (status === 'SUCCESS') {
      updateData.paidAt = new Date();
    }

    return await this.update(id, updateData);
  }

  /**
   * Update transaction with Midtrans response
   * @param {String} orderId - Order ID
   * @param {Object} midtransResponse - Response dari Midtrans webhook
   * @returns {Promise<Object>} - Updated transaction
   */
  async updateWithMidtransResponse(orderId, midtransResponse) {
    try {
      const transaction = await prisma.transaction.update({
        where: { orderId },
        data: {
          midtransResponse,
          updatedAt: new Date(),
        },
        include: {
          architect: true,
        },
      });
      return transaction;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundError(`Transaction with order ID ${orderId} not found`);
      }
      throw new DatabaseError(`Failed to update transaction: ${error.message}`);
    }
  }

  /**
   * Mark transaction as success
   * @param {String} orderId - Order ID
   * @param {String} paymentMethod - Payment method used
   * @param {Object} midtransResponse - Midtrans response
   * @returns {Promise<Object>} - Updated transaction
   */
  async markAsSuccess(orderId, paymentMethod, midtransResponse = null) {
    try {
      const transaction = await prisma.transaction.update({
        where: { orderId },
        data: {
          status: 'SUCCESS',
          paymentMethod: paymentMethod || 'OTHER',
          paidAt: new Date(),
          midtransResponse,
        },
        include: {
          architect: true,
        },
      });
      return transaction;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundError(`Transaction with order ID ${orderId} not found`);
      }
      throw new DatabaseError(`Failed to mark transaction as success: ${error.message}`);
    }
  }

  /**
   * Mark transaction as failed
   * @param {String} orderId - Order ID
   * @param {Object} midtransResponse - Midtrans response
   * @returns {Promise<Object>} - Updated transaction
   */
  async markAsFailed(orderId, midtransResponse = null) {
    try {
      const transaction = await prisma.transaction.update({
        where: { orderId },
        data: {
          status: 'FAILED',
          midtransResponse,
        },
      });
      return transaction;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundError(`Transaction with order ID ${orderId} not found`);
      }
      throw new DatabaseError(`Failed to mark transaction as failed: ${error.message}`);
    }
  }

  /**
   * Mark expired transactions
   * Updates all PENDING transactions that passed expiredAt
   * @returns {Promise<Object>} - { count: number }
   */
  async markExpiredTransactions() {
    try {
      const result = await prisma.transaction.updateMany({
        where: {
          status: 'PENDING',
          expiredAt: {
            lt: new Date(),
          },
        },
        data: {
          status: 'EXPIRED',
        },
      });
      return result;
    } catch (error) {
      throw new DatabaseError(`Failed to mark expired transactions: ${error.message}`);
    }
  }

  /**
   * Get transaction statistics
   * @returns {Promise<Object>} - Statistics
   */
  async getStatistics() {
    const [pending, success, failed, expired, totalAmount] = await Promise.all([
      this.count({ status: 'PENDING' }),
      this.count({ status: 'SUCCESS' }),
      this.count({ status: 'FAILED' }),
      this.count({ status: 'EXPIRED' }),
      this.getTotalSuccessAmount(),
    ]);

    return {
      pending,
      success,
      failed,
      expired,
      total: pending + success + failed + expired,
      totalAmount,
    };
  }

  /**
   * Get total amount from successful transactions
   * @returns {Promise<Number>} - Total amount
   */
  async getTotalSuccessAmount() {
    try {
      const result = await prisma.transaction.aggregate({
        where: { status: 'SUCCESS' },
        _sum: {
          amount: true,
        },
      });
      return result._sum.amount || 0;
    } catch (error) {
      throw new DatabaseError(`Failed to calculate total amount: ${error.message}`);
    }
  }

  /**
   * Find successful transactions with pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - { data, pagination }
   */
  async findSuccessTransactions(options = {}) {
    return await this.findWithPagination({
      ...options,
      where: {
        ...options.where,
        status: 'SUCCESS',
      },
      include: {
        architect: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: options.orderBy || { paidAt: 'desc' },
    });
  }

  /**
   * Check if architect has successful transaction
   * @param {String} architectId - Architect ID
   * @returns {Promise<Boolean>} - True if has successful transaction
   */
  async hasSuccessfulTransaction(architectId) {
    return await this.exists({
      architectId,
      status: 'SUCCESS',
    });
  }

  /**
   * Get latest transaction for architect
   * @param {String} architectId - Architect ID
   * @returns {Promise<Object|null>} - Latest transaction
   */
  async getLatestByArchitect(architectId) {
    try {
      const transaction = await prisma.transaction.findFirst({
        where: { architectId },
        orderBy: { createdAt: 'desc' },
      });
      return transaction;
    } catch (error) {
      throw new DatabaseError(`Failed to get latest transaction: ${error.message}`);
    }
  }

  /**
   * Count transactions by date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {String} status - Status filter (optional)
   * @returns {Promise<Number>} - Count
   */
  async countByDateRange(startDate, endDate, status = null) {
    const where = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (status) {
      where.status = status;
    }

    return await this.count(where);
  }

  /**
   * Validate transaction before payment
   * @param {String} paymentToken - Payment token
   * @returns {Promise<Object>} - { valid: Boolean, message: String, transaction: Object }
   */
  async validateForPayment(paymentToken) {
    const transaction = await this.findByPaymentToken(paymentToken);

    if (!transaction) {
      return {
        valid: false,
        message: 'Payment link not found',
        transaction: null,
      };
    }

    if (transaction.status !== 'PENDING') {
      return {
        valid: false,
        message: `Payment already ${transaction.status.toLowerCase()}`,
        transaction,
      };
    }

    if (new Date() > transaction.expiredAt) {
      return {
        valid: false,
        message: 'Payment link has expired',
        transaction,
      };
    }

    return {
      valid: true,
      message: 'Valid payment link',
      transaction,
    };
  }
}

module.exports = new TransactionRepository();