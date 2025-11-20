/**
 * Webhook Controller
 * Handle webhooks dari external services (Midtrans)
 */

const { webhookService } = require('../services');
const ResponseFormatter = require('../../../utils/response-formatter');

class WebhookController {
  /**
   * Handle Midtrans webhook notification
   * POST /api/webhooks/midtrans
   */
  async handleMidtransWebhook(req, res, next) {
    try {
      console.log('📥 Received Midtrans webhook');

      // Verify webhook authenticity
      const isAuthentic = webhookService.verifyWebhookAuthenticity(req.body);

      if (!isAuthentic) {
        console.error('❌ Invalid webhook signature');
        return ResponseFormatter.badRequest(res, 'Invalid webhook signature');
      }

      // Process webhook
      const result = await webhookService.processMidtransWebhook(req.body);

      console.log('✅ Webhook processed:', result.orderId);

      // Always return 200 to Midtrans
      return ResponseFormatter.success(res, null, result.message);
    } catch (error) {
      console.error('❌ Webhook processing error:', error.message);
      
      // Still return 200 to Midtrans to prevent retry
      // But log the error
      return ResponseFormatter.success(res, null, 'Webhook received but processing failed');
    }
  }

  /**
   * Get webhook statistics (Admin only)
   * GET /api/webhooks/statistics
   */
  async getStatistics(req, res, next) {
    try {
      const { startDate, endDate } = req.query;

      const stats = await webhookService.getWebhookStatistics(
        startDate ? new Date(startDate) : null,
        endDate ? new Date(endDate) : null
      );

      return ResponseFormatter.success(res, stats, 'Statistics retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Manually trigger expired transaction check (Admin only)
   * POST /api/webhooks/check-expired
   */
  async checkExpiredTransactions(req, res, next) {
    try {
      const result = await webhookService.handleExpiredTransactions();

      return ResponseFormatter.success(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new WebhookController();