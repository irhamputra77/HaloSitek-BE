/**
 * Payment Controller
 * Handle payment-related requests
 */

const paymentService = require('../../../common/services/payment.service');
const ResponseFormatter = require('../../../utils/response-formatter');

class PaymentController {
  /**
   * Get available payment methods
   * GET /api/payment/methods
   */
  async getPaymentMethods(req, res, next) {
    try {
      const methods = paymentService.getAvailablePaymentMethods();

      return ResponseFormatter.success(res, methods, 'Payment methods retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get payment configuration for frontend
   * GET /api/payment/config
   */
  async getPaymentConfig(req, res, next) {
    try {
      const config = {
        clientKey: paymentService.getClientKey(),
        snapJsUrl: paymentService.getSnapJsUrl(),
        isConfigured: paymentService.isConfigured(),
      };

      return ResponseFormatter.success(res, config, 'Payment config retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get transaction status
   * GET /api/payment/status/:orderId
   */
  async getTransactionStatus(req, res, next) {
    try {
      const { orderId } = req.params;

      const status = await paymentService.getTransactionStatus(orderId);

      return ResponseFormatter.success(res, status, 'Transaction status retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PaymentController();