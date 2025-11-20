/**
 * Webhook Service
 * Handle Midtrans payment webhook notifications
 */

const {
  architectRepository,
  transactionRepository,
} = require('../repositories');

const paymentService = require('../../../common/services/payment.service');
const emailService = require('../../../common/services/email.service');

const { PaymentError, NotFoundError } = require('../../../errors/app-errors');

class WebhookService {
  /**
   * Process Midtrans webhook notification
   * @param {Object} notification - Webhook notification dari Midtrans
   * @returns {Promise<Object>} - Processing result
   */
  async processMidtransWebhook(notification) {
    try {
      console.log('📥 Processing webhook for order:', notification.order_id);

      // Step 1: Process notification dan verify signature
      const processedData = paymentService.processWebhookNotification(notification);

      console.log('✅ Webhook signature verified');
      console.log('📊 Processed data:', {
        orderId: processedData.orderId,
        status: processedData.status,
        shouldActivate: processedData.shouldActivate,
      });

      // Step 2: Find transaction by order ID
      const transaction = await transactionRepository.findByOrderId(processedData.orderId);

      if (!transaction) {
        throw new NotFoundError(`Transaction with order ID ${processedData.orderId} not found`);
      }

      // Step 3: Check if transaction already processed
      if (transaction.status === 'SUCCESS') {
        console.log('⚠️ Transaction already processed as SUCCESS');
        return {
          success: true,
          message: 'Transaction already processed',
          alreadyProcessed: true,
        };
      }

      // Step 4: Update transaction
      await transactionRepository.updateWithMidtransResponse(
        processedData.orderId,
        processedData.rawNotification
      );

      // Step 5: Handle based on status
      if (processedData.shouldActivate && processedData.status === 'SUCCESS') {
        await this.handleSuccessfulPayment(transaction, processedData);
      } else if (processedData.status === 'FAILED') {
        await this.handleFailedPayment(transaction, processedData);
      } else if (processedData.status === 'PENDING') {
        await this.handlePendingPayment(transaction, processedData);
      }

      console.log('✅ Webhook processed successfully');

      return {
        success: true,
        message: 'Webhook processed successfully',
        orderId: processedData.orderId,
        status: processedData.status,
      };
    } catch (error) {
      console.error('❌ Webhook processing failed:', error.message);
      throw error;
    }
  }

  /**
   * Handle successful payment
   * @param {Object} transaction - Transaction object
   * @param {Object} processedData - Processed webhook data
   */
  async handleSuccessfulPayment(transaction, processedData) {
    try {
      console.log('💰 Processing successful payment...');

      // Step 1: Mark transaction as success
      await transactionRepository.markAsSuccess(
        processedData.orderId,
        processedData.paymentType.toUpperCase(),
        processedData.rawNotification
      );

      console.log('✅ Transaction marked as SUCCESS');

      // Step 2: Activate architect account
      await architectRepository.activateAccount(transaction.architectId);

      console.log('✅ Architect account activated');

      // Step 3: Get architect data
      const architect = await architectRepository.findByIdOrFail(transaction.architectId);

      // Step 4: Send welcome email
      try {
        await emailService.sendWelcomeEmail(architect);
        console.log('✅ Welcome email sent');
      } catch (emailError) {
        console.error('⚠️ Failed to send welcome email:', emailError.message);
        // Don't throw error, continue processing
      }

      console.log('🎉 Payment successful and account activated!');
    } catch (error) {
      console.error('❌ Failed to handle successful payment:', error.message);
      throw error;
    }
  }

  /**
   * Handle failed payment
   * @param {Object} transaction - Transaction object
   * @param {Object} processedData - Processed webhook data
   */
  async handleFailedPayment(transaction, processedData) {
    try {
      console.log('❌ Processing failed payment...');

      // Step 1: Mark transaction as failed
      await transactionRepository.markAsFailed(
        processedData.orderId,
        processedData.rawNotification
      );

      console.log('✅ Transaction marked as FAILED');

      // Step 2: Get architect data
      const architect = await architectRepository.findByIdOrFail(transaction.architectId);

      // Step 3: Send payment failed email
      try {
        await emailService.sendPaymentFailedEmail(architect, processedData.orderId);
        console.log('✅ Payment failed email sent');
      } catch (emailError) {
        console.error('⚠️ Failed to send payment failed email:', emailError.message);
      }

      console.log('📧 Failed payment notification sent');
    } catch (error) {
      console.error('❌ Failed to handle failed payment:', error.message);
      throw error;
    }
  }

  /**
   * Handle pending payment
   * @param {Object} transaction - Transaction object
   * @param {Object} processedData - Processed webhook data
   */
  async handlePendingPayment(transaction, processedData) {
    try {
      console.log('⏳ Processing pending payment...');

      // Just update transaction status, no email needed
      await transactionRepository.updateStatus(transaction.id, 'PENDING');

      console.log('✅ Transaction status updated to PENDING');
    } catch (error) {
      console.error('❌ Failed to handle pending payment:', error.message);
      throw error;
    }
  }

  /**
   * Handle expired transactions (Cron job)
   * Check for expired pending transactions and mark them as EXPIRED
   * @returns {Promise<Object>} - Result with count
   */
  async handleExpiredTransactions() {
    try {
      console.log('🔍 Checking for expired transactions...');

      // Find all expired transactions
      const expiredTransactions = await transactionRepository.findExpired();

      console.log(`📊 Found ${expiredTransactions.length} expired transactions`);

      if (expiredTransactions.length === 0) {
        return {
          success: true,
          message: 'No expired transactions found',
          count: 0,
        };
      }

      // Mark all as expired
      const result = await transactionRepository.markExpiredTransactions();

      console.log(`✅ Marked ${result.count} transactions as EXPIRED`);

      // Send expired emails
      for (const transaction of expiredTransactions) {
        try {
          if (transaction.architect) {
            await emailService.sendPaymentExpiredEmail(
              transaction.architect,
              transaction.orderId
            );
            console.log(`📧 Expired email sent to ${transaction.architect.email}`);
          }
        } catch (emailError) {
          console.error('⚠️ Failed to send expired email:', emailError.message);
        }
      }

      return {
        success: true,
        message: `Processed ${result.count} expired transactions`,
        count: result.count,
      };
    } catch (error) {
      console.error('❌ Failed to handle expired transactions:', error.message);
      throw error;
    }
  }

  /**
   * Verify webhook authenticity
   * Check if webhook came from Midtrans
   * @param {Object} notification - Webhook notification
   * @returns {Boolean} - True if authentic
   */
  verifyWebhookAuthenticity(notification) {
    try {
      const {
        order_id,
        status_code,
        gross_amount,
        signature_key,
      } = notification;

      if (!order_id || !status_code || !gross_amount || !signature_key) {
        console.error('❌ Missing required webhook fields');
        return false;
      }

      return paymentService.verifyWebhookSignature(
        order_id,
        status_code,
        gross_amount,
        signature_key
      );
    } catch (error) {
      console.error('❌ Webhook verification error:', error.message);
      return false;
    }
  }

  /**
   * Get webhook processing statistics
   * @param {Date} startDate - Start date (optional)
   * @param {Date} endDate - End date (optional)
   * @returns {Promise<Object>} - Statistics
   */
  async getWebhookStatistics(startDate = null, endDate = null) {
    const where = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [success, failed, pending, expired] = await Promise.all([
      transactionRepository.count({ ...where, status: 'SUCCESS' }),
      transactionRepository.count({ ...where, status: 'FAILED' }),
      transactionRepository.count({ ...where, status: 'PENDING' }),
      transactionRepository.count({ ...where, status: 'EXPIRED' }),
    ]);

    const totalAmount = await transactionRepository.getTotalSuccessAmount();

    return {
      success,
      failed,
      pending,
      expired,
      total: success + failed + pending + expired,
      totalAmount,
      successRate: success > 0 ? ((success / (success + failed)) * 100).toFixed(2) : 0,
    };
  }
}

module.exports = new WebhookService();