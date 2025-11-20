/**
 * Architect Registration Service
 * Handle complete registration flow untuk architect
 */

const {
  architectRepository,
  certificationRepository,
  portfolioLinkRepository,
  transactionRepository,
} = require('../repositories');

const PasswordHasher = require('../../../utils/password-hasher');
const TokenGeneratorService = require('../../../common/services/token-generator.service');
const paymentService = require('../../../common/services/payment.service');
const emailService = require('../../../common/services/email.service');

const {
  ValidationError,
  ConflictError,
  BadRequestError,
} = require('../../../errors/app-errors');

class ArchitectRegistrationService {
  /**
   * Register new architect
   * Complete flow: validate → save data → create payment → send email
   * 
   * @param {Object} registrationData - Registration data
   * @param {Object} registrationData.basicInfo - Basic info (Step 1)
   * @param {Array} registrationData.certifications - Certifications (Step 2)
   * @param {Array} registrationData.portfolioLinks - Portfolio links (Step 2)
   * @param {Object} registrationData.professionalInfo - Professional info (Step 2)
   * @returns {Promise<Object>} - Registration result with payment info
   */
  async register(registrationData) {
    try {
      // Step 1: Validate input
      this.validateRegistrationData(registrationData);

      // Step 2: Check if email already exists
      const emailExists = await architectRepository.isEmailExists(
        registrationData.basicInfo.email
      );

      if (emailExists) {
        throw new ConflictError('Email sudah terdaftar');
      }

      // Step 3: Hash password
      const hashedPassword = await PasswordHasher.hash(
        registrationData.basicInfo.password
      );

      // Step 4: Prepare architect data
      const architectData = {
        email: registrationData.basicInfo.email,
        password: hashedPassword,
        name: registrationData.basicInfo.name,
        phone: registrationData.basicInfo.phone,
        profilePictureUrl: registrationData.basicInfo.profilePictureUrl || null,
        tahunPengalaman: registrationData.professionalInfo?.tahunPengalaman || null,
        areaPengalaman: registrationData.professionalInfo?.areaPengalaman || null,
        keahlianKhusus: registrationData.professionalInfo?.keahlianKhusus
          ? JSON.stringify(registrationData.professionalInfo.keahlianKhusus)
          : null,
        status: 'UNPAID',
        emailVerified: false,
      };

      // Step 5: Prepare certifications
      const certifications = (registrationData.certifications || []).map((cert) => ({
        certificationName: cert.certificationName,
        penerbit: cert.penerbit,
        year: cert.year,
        berkasUrl: cert.berkasUrl,
      }));

      // Step 6: Prepare portfolio links
      const portfolioLinks = (registrationData.portfolioLinks || []).map((link, index) => ({
        url: link.url || link,
        order: index,
      }));

      // Step 7: Create architect with relations (in transaction)
      const architect = await architectRepository.createWithRelations(
        architectData,
        certifications,
        portfolioLinks
      );

      console.log('✅ Architect created:', architect.id);

      // Step 8: Generate payment token and order ID
      const orderId = TokenGeneratorService.generateOrderId();
      const paymentToken = TokenGeneratorService.generatePaymentToken();
      const expiredAt = TokenGeneratorService.getPaymentExpiryDate();
      const amount = parseInt(process.env.ARCHITECT_REGISTRATION_FEE) || 500000;

      // Step 9: Create Midtrans Snap transaction
      let snapToken = null;
      let snapRedirectUrl = null;

      if (paymentService.isConfigured()) {
        try {
          const snapResult = await paymentService.createSnapTransaction({
            orderId,
            amount,
            customerDetails: {
              first_name: architect.name,
              email: architect.email,
              phone: architect.phone,
            },
          });

          snapToken = snapResult.snapToken;
          snapRedirectUrl = snapResult.redirectUrl;

          console.log('✅ Midtrans Snap token created');
        } catch (error) {
          console.error('❌ Failed to create Snap token:', error.message);
          // Continue without Snap token (can be created later)
        }
      }

      // Step 10: Save transaction to database
      const transaction = await transactionRepository.createTransaction({
        architectId: architect.id,
        orderId,
        paymentToken,
        snapToken,
        amount,
        status: 'PENDING',
        expiredAt,
      });

      console.log('✅ Transaction created:', transaction.id);

      // Step 11: Send payment link email
      try {
        await emailService.sendPaymentLinkEmail(
          architect,
          paymentToken,
          orderId,
          amount
        );
        console.log('✅ Payment link email sent');
      } catch (error) {
        console.error('❌ Failed to send email:', error.message);
        // Continue even if email fails
      }

      // Step 12: Return response
      return {
        success: true,
        message: 'Registrasi berhasil. Silakan cek email untuk link pembayaran.',
        data: {
          architect: {
            id: architect.id,
            name: architect.name,
            email: architect.email,
            status: architect.status,
          },
          payment: {
            orderId,
            paymentToken,
            amount,
            expiredAt,
            paymentUrl: `${process.env.FRONTEND_URL}/payment/${paymentToken}`,
            snapToken: snapToken,
            snapRedirectUrl: snapRedirectUrl,
          },
        },
      };
    } catch (error) {
      console.error('❌ Registration failed:', error.message);
      throw error;
    }
  }

  /**
   * Validate registration data
   * @param {Object} data - Registration data
   * @throws {ValidationError} - If validation fails
   */
  validateRegistrationData(data) {
    const errors = [];

    // Validate basic info
    if (!data.basicInfo) {
      errors.push({ field: 'basicInfo', message: 'Basic info is required' });
    } else {
      if (!data.basicInfo.email) {
        errors.push({ field: 'email', message: 'Email is required' });
      }

      if (!data.basicInfo.password) {
        errors.push({ field: 'password', message: 'Password is required' });
      } else {
        // Validate password strength
        const PasswordHasher = require('../../../utils/password-hasher');
        const passwordValidation = PasswordHasher.validatePasswordStrength(
          data.basicInfo.password
        );
        if (!passwordValidation.isValid) {
          errors.push({
            field: 'password',
            message: passwordValidation.errors.join(', '),
          });
        }
      }

      if (!data.basicInfo.name) {
        errors.push({ field: 'name', message: 'Name is required' });
      }

      if (!data.basicInfo.phone) {
        errors.push({ field: 'phone', message: 'Phone is required' });
      }
    }

    // Validate professional info (optional but if provided, validate)
    if (data.professionalInfo) {
      if (
        data.professionalInfo.tahunPengalaman &&
        (data.professionalInfo.tahunPengalaman < 0 ||
          data.professionalInfo.tahunPengalaman > 50)
      ) {
        errors.push({
          field: 'tahunPengalaman',
          message: 'Years of experience must be between 0 and 50',
        });
      }
    }

    // Validate certifications
    if (data.certifications && Array.isArray(data.certifications)) {
      data.certifications.forEach((cert, index) => {
        if (!cert.certificationName) {
          errors.push({
            field: `certifications[${index}].certificationName`,
            message: 'Certification name is required',
          });
        }
        if (!cert.penerbit) {
          errors.push({
            field: `certifications[${index}].penerbit`,
            message: 'Penerbit is required',
          });
        }
        if (!cert.year) {
          errors.push({
            field: `certifications[${index}].year`,
            message: 'Year is required',
          });
        }
        if (!cert.berkasUrl) {
          errors.push({
            field: `certifications[${index}].berkasUrl`,
            message: 'Berkas URL is required',
          });
        }
      });
    }

    // Validate portfolio links
    if (data.portfolioLinks && Array.isArray(data.portfolioLinks)) {
      data.portfolioLinks.forEach((link, index) => {
        const url = link.url || link;
        if (!url) {
          errors.push({
            field: `portfolioLinks[${index}]`,
            message: 'Portfolio URL is required',
          });
        } else {
          // Validate URL format
          try {
            new URL(url);
          } catch (e) {
            errors.push({
              field: `portfolioLinks[${index}]`,
              message: 'Invalid URL format',
            });
          }
        }
      });
    }

    if (errors.length > 0) {
      throw new ValidationError('Validation failed', errors);
    }
  }

  /**
   * Get payment info by token
   * @param {String} paymentToken - Payment token
   * @returns {Promise<Object>} - Payment info
   */
  async getPaymentInfo(paymentToken) {
    // Validate payment token
    const validation = await transactionRepository.validateForPayment(paymentToken);

    if (!validation.valid) {
      throw new BadRequestError(validation.message);
    }

    const transaction = validation.transaction;

    // Get architect info
    const architect = await architectRepository.findByIdOrFail(transaction.architectId);

    // If no snapToken yet, create one
    let snapToken = transaction.snapToken;
    let snapRedirectUrl = null;

    if (!snapToken && paymentService.isConfigured()) {
      try {
        const snapResult = await paymentService.createSnapTransaction({
          orderId: transaction.orderId,
          amount: transaction.amount,
          customerDetails: {
            first_name: architect.name,
            email: architect.email,
            phone: architect.phone,
          },
        });

        snapToken = snapResult.snapToken;
        snapRedirectUrl = snapResult.redirectUrl;

        // Update transaction dengan snap token
        await transactionRepository.update(transaction.id, {
          snapToken,
        });

        console.log('✅ Snap token created for existing transaction');
      } catch (error) {
        console.error('❌ Failed to create Snap token:', error.message);
      }
    }

    return {
      architect: {
        name: architect.name,
        email: architect.email,
      },
      transaction: {
        orderId: transaction.orderId,
        amount: transaction.amount,
        status: transaction.status,
        expiredAt: transaction.expiredAt,
        snapToken,
        snapRedirectUrl,
      },
      payment: {
        clientKey: paymentService.getClientKey(),
        snapJsUrl: paymentService.getSnapJsUrl(),
      },
    };
  }

  /**
   * Resend payment link email
   * @param {String} email - Architect email
   * @returns {Promise<Object>} - Result
   */
  async resendPaymentLink(email) {
    // Find architect by email
    const architect = await architectRepository.findByEmail(email);

    if (!architect) {
      throw new BadRequestError('Email not found');
    }

    if (architect.status === 'ACTIVE') {
      throw new BadRequestError('Account already active');
    }

    // Get latest pending transaction
    const transaction = await transactionRepository.getLatestByArchitect(architect.id);

    if (!transaction) {
      throw new BadRequestError('No pending transaction found');
    }

    if (transaction.status !== 'PENDING') {
      throw new BadRequestError(`Transaction already ${transaction.status.toLowerCase()}`);
    }

    // Check if expired
    if (TokenGeneratorService.isPaymentExpired(transaction.expiredAt)) {
      throw new BadRequestError('Payment link has expired. Please register again.');
    }

    // Resend email
    await emailService.sendPaymentLinkEmail(
      architect,
      transaction.paymentToken,
      transaction.orderId,
      transaction.amount
    );

    return {
      success: true,
      message: 'Payment link has been resent to your email',
    };
  }
}

module.exports = new ArchitectRegistrationService();