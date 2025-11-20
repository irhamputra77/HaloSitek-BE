/**
 * Payment Service
 * Handle Midtrans Snap API integration
 */

const axios = require('axios');
const { PaymentError, ExternalServiceError } = require('../../errors/app-errors');

class PaymentService {
  constructor() {
    this.serverKey = process.env.MIDTRANS_SERVER_KEY;
    this.clientKey = process.env.MIDTRANS_CLIENT_KEY;
    this.isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';
    
    // API URLs
    this.snapApiUrl = this.isProduction
      ? 'https://app.midtrans.com/snap/v1/transactions'
      : 'https://app.sandbox.midtrans.com/snap/v1/transactions';
    
    this.coreApiUrl = this.isProduction
      ? 'https://api.midtrans.com/v2'
      : 'https://api.sandbox.midtrans.com/v2';

    // Validate configuration
    if (!this.serverKey) {
      console.warn('⚠️ MIDTRANS_SERVER_KEY not configured');
    }
  }

  /**
   * Create Midtrans Snap Transaction
   * @param {Object} params - Transaction parameters
   * @param {String} params.orderId - Unique order ID
   * @param {Number} params.amount - Transaction amount
   * @param {Object} params.customerDetails - Customer details
   * @param {Array} params.itemDetails - Item details (optional)
   * @returns {Promise<Object>} - Snap token and redirect URL
   */
  async createSnapTransaction(params) {
    try {
      const { orderId, amount, customerDetails, itemDetails } = params;

      // Prepare transaction details
      const transactionDetails = {
        order_id: orderId,
        gross_amount: amount,
      };

      // Prepare item details (default jika tidak ada)
      const items = itemDetails || [
        {
          id: 'ARCH_REGISTRATION',
          price: amount,
          quantity: 1,
          name: 'Registrasi Akun Arsitek HaloSitek',
        },
      ];

      // Snap API request body
      const requestBody = {
        transaction_details: transactionDetails,
        item_details: items,
        customer_details: customerDetails,
        credit_card: {
          secure: true, // Enable 3D Secure
        },
        enabled_payments: [
          'credit_card',
          'bca_va',
          'bni_va',
          'bri_va',
          'mandiri_va',
          'permata_va',
          'other_va',
          'gopay',
          'shopeepay',
          'qris',
          'indomaret',
          'alfamart',
        ],
      };

      // Create authorization header
      const authString = Buffer.from(`${this.serverKey}:`).toString('base64');

      // Call Midtrans Snap API
      const response = await axios.post(this.snapApiUrl, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${authString}`,
        },
      });

      const { token, redirect_url } = response.data;

      console.log('✅ Snap transaction created:', orderId);

      return {
        snapToken: token,
        redirectUrl: redirect_url,
      };
    } catch (error) {
      console.error('❌ Midtrans Snap API error:', error.response?.data || error.message);
      
      if (error.response) {
        throw new PaymentError(
          `Midtrans error: ${error.response.data?.error_messages?.[0] || 'Unknown error'}`,
          error.response.status
        );
      }
      
      throw new ExternalServiceError('Failed to create payment transaction', 'Midtrans');
    }
  }

  /**
   * Get Transaction Status
   * @param {String} orderId - Order ID
   * @returns {Promise<Object>} - Transaction status
   */
  async getTransactionStatus(orderId) {
    try {
      const authString = Buffer.from(`${this.serverKey}:`).toString('base64');

      const response = await axios.get(`${this.coreApiUrl}/${orderId}/status`, {
        headers: {
          Authorization: `Basic ${authString}`,
        },
      });

      return response.data;
    } catch (error) {
      console.error('❌ Failed to get transaction status:', error.message);
      
      if (error.response?.status === 404) {
        throw new PaymentError('Transaction not found', 404);
      }
      
      throw new ExternalServiceError('Failed to get transaction status', 'Midtrans');
    }
  }

  /**
   * Verify Webhook Signature
   * @param {String} orderId - Order ID
   * @param {String} statusCode - Status code
   * @param {String} grossAmount - Gross amount
   * @param {String} signatureKey - Signature from Midtrans
   * @returns {Boolean} - True if signature valid
   */
  verifyWebhookSignature(orderId, statusCode, grossAmount, signatureKey) {
    try {
      const crypto = require('crypto');
      
      // Create hash: SHA512(order_id+status_code+gross_amount+server_key)
      const string = `${orderId}${statusCode}${grossAmount}${this.serverKey}`;
      const hash = crypto.createHash('sha512').update(string).digest('hex');

      return hash === signatureKey;
    } catch (error) {
      console.error('❌ Signature verification failed:', error.message);
      return false;
    }
  }

  /**
   * Process Webhook Notification
   * Determine transaction status dari Midtrans webhook
   * @param {Object} notification - Webhook notification dari Midtrans
   * @returns {Object} - { status, shouldActivate }
   */
  processWebhookNotification(notification) {
    const {
      order_id,
      transaction_status,
      fraud_status,
      payment_type,
      gross_amount,
      signature_key,
      status_code,
    } = notification;

    // Verify signature
    const isValid = this.verifyWebhookSignature(
      order_id,
      status_code,
      gross_amount,
      signature_key
    );

    if (!isValid) {
      throw new PaymentError('Invalid webhook signature');
    }

    // Determine final status
    let finalStatus = 'PENDING';
    let shouldActivateAccount = false;

    if (transaction_status === 'capture') {
      if (fraud_status === 'accept') {
        finalStatus = 'SUCCESS';
        shouldActivateAccount = true;
      } else if (fraud_status === 'challenge') {
        finalStatus = 'PENDING';
      } else {
        finalStatus = 'FAILED';
      }
    } else if (transaction_status === 'settlement') {
      finalStatus = 'SUCCESS';
      shouldActivateAccount = true;
    } else if (
      transaction_status === 'cancel' ||
      transaction_status === 'deny' ||
      transaction_status === 'expire'
    ) {
      finalStatus = 'FAILED';
    } else if (transaction_status === 'pending') {
      finalStatus = 'PENDING';
    }

    return {
      orderId: order_id,
      status: finalStatus,
      shouldActivate: shouldActivateAccount,
      paymentType: payment_type,
      transactionStatus: transaction_status,
      fraudStatus: fraud_status,
      rawNotification: notification,
    };
  }

  /**
   * Cancel Transaction
   * @param {String} orderId - Order ID
   * @returns {Promise<Object>} - Cancel result
   */
  async cancelTransaction(orderId) {
    try {
      const authString = Buffer.from(`${this.serverKey}:`).toString('base64');

      const response = await axios.post(
        `${this.coreApiUrl}/${orderId}/cancel`,
        {},
        {
          headers: {
            Authorization: `Basic ${authString}`,
          },
        }
      );

      console.log('✅ Transaction cancelled:', orderId);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to cancel transaction:', error.message);
      throw new ExternalServiceError('Failed to cancel transaction', 'Midtrans');
    }
  }

  /**
   * Expire Transaction
   * @param {String} orderId - Order ID
   * @returns {Promise<Object>} - Expire result
   */
  async expireTransaction(orderId) {
    try {
      const authString = Buffer.from(`${this.serverKey}:`).toString('base64');

      const response = await axios.post(
        `${this.coreApiUrl}/${orderId}/expire`,
        {},
        {
          headers: {
            Authorization: `Basic ${authString}`,
          },
        }
      );

      console.log('✅ Transaction expired:', orderId);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to expire transaction:', error.message);
      throw new ExternalServiceError('Failed to expire transaction', 'Midtrans');
    }
  }

  /**
   * Get available payment methods
   * @returns {Array} - Array of payment methods
   */
  getAvailablePaymentMethods() {
    return [
      {
        type: 'BANK_TRANSFER',
        name: 'Transfer Bank',
        options: ['BCA', 'Mandiri', 'BNI', 'BRI', 'Permata'],
      },
      {
        type: 'E_WALLET',
        name: 'E-Wallet',
        options: ['GoPay', 'ShopeePay'],
      },
      {
        type: 'CREDIT_CARD',
        name: 'Kartu Kredit',
        options: ['Visa', 'Mastercard', 'JCB'],
      },
      {
        type: 'QRIS',
        name: 'QRIS',
        options: ['Scan QRIS'],
      },
      {
        type: 'RETAIL_OUTLET',
        name: 'Retail',
        options: ['Indomaret', 'Alfamart'],
      },
    ];
  }

  /**
   * Format amount untuk Midtrans (harus integer, no decimal)
   * @param {Number} amount - Amount
   * @returns {Number} - Formatted amount
   */
  formatAmount(amount) {
    return Math.round(amount);
  }

  /**
   * Check if Midtrans is configured
   * @returns {Boolean} - True if configured
   */
  isConfigured() {
    return !!(this.serverKey && this.clientKey);
  }

  /**
   * Get Snap.js URL for frontend
   * @returns {String} - Snap.js URL
   */
  getSnapJsUrl() {
    return this.isProduction
      ? 'https://app.midtrans.com/snap/snap.js'
      : 'https://app.sandbox.midtrans.com/snap/snap.js';
  }

  /**
   * Get client key for frontend
   * @returns {String} - Client key
   */
  getClientKey() {
    return this.clientKey;
  }
}

module.exports = new PaymentService();