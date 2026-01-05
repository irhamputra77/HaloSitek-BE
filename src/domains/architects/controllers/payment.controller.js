/**
 * Payment Controller
 * Handle payment-related requests
 */

const paymentService = require('../../../common/services/payment.service');
const ResponseFormatter = require('../../../utils/response-formatter');
const { transactionRepository, architectRepository } = require('../repositories');
const { mapMidtransToInternalStatus } = require('../../../common/services/payment.service');
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

  async getTransactionStatus(req, res, next) {
    try {
      const { orderId } = req.params;

      const mid = await paymentService.getTransactionStatus(orderId);

      const { status, shouldActivate } = mapMidtransToInternalStatus(mid);

      // reconcile ke DB lokal
      const tx = await transactionRepository.findByOrderId(orderId); // kalau belum ada, buat method ini
      if (tx) {
        if (status === "SUCCESS") {
          await transactionRepository.markAsSuccess(orderId, (mid.payment_type || "OTHER").toUpperCase(), mid);
          if (shouldActivate) {
            await architectRepository.activateAccount(tx.architectId);
          }
        } else if (status === "FAILED") {
          await transactionRepository.markAsFailed(orderId, mid); // optional
        }
      }

      return ResponseFormatter.success(res, {
        orderId,
        status,                       // <- ini yang FE kamu butuhkan
        transaction_status: mid.transaction_status,
        fraud_status: mid.fraud_status,
        payment_type: mid.payment_type,
      }, 'Transaction status retrieved successfully');
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

      res.setHeader("Cache-Control", "no-store");

      const mid = await paymentService.getTransactionStatus(orderId);

      const ts = (mid?.transaction_status || "").toLowerCase();
      const fraud = (mid?.fraud_status || "").toLowerCase();

      let status = "PENDING";
      if (ts === "settlement") {
        status = "SUCCESS";
      } else if (ts === "capture") {
        status = fraud === "accept" ? "SUCCESS" : (fraud === "challenge" ? "PENDING" : "FAILED");
      } else if (["deny", "cancel", "expire"].includes(ts)) {
        status = "FAILED";
      } else if (ts === "pending") {
        status = "PENDING";
      }

      return ResponseFormatter.success(
        res,
        {
          orderId,
          status,
          transaction_status: mid?.transaction_status,
          fraud_status: mid?.fraud_status,
          payment_type: mid?.payment_type,
        },
        "Transaction status retrieved successfully"
      );
    } catch (error) {
      next(error);
    }
  }

}

module.exports = new PaymentController();