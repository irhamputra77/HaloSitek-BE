/**
 * Architect Registration Controller
 * Handle HTTP requests untuk architect registration
 */

const { architectRegistrationService } = require('../services');
const ResponseFormatter = require('../../../utils/response-formatter');

class ArchitectRegistrationController {
  /**
   * Register new architect
   * POST /api/architects/register
   */
  async register(req, res, next) {
    try {
      // Get uploaded files
      const profilePicture = req.files?.profilePicture?.[0];
      const certificationFiles = req.files?.certifications || [];

      // Prepare registration data
      const registrationData = {
        basicInfo: {
          email: req.body.email,
          password: req.body.password,
          name: req.body.name,
          phone: req.body.phone,
          profilePictureUrl: profilePicture ? profilePicture.path : null,
        },
        professionalInfo: {
          tahunPengalaman: req.body.tahunPengalaman ? parseInt(req.body.tahunPengalaman) : null,
          areaPengalaman: req.body.areaPengalaman || null,
          keahlianKhusus: req.body.keahlianKhusus 
            ? (Array.isArray(req.body.keahlianKhusus) 
                ? req.body.keahlianKhusus 
                : JSON.parse(req.body.keahlianKhusus))
            : [],
        },
        certifications: [],
        portfolioLinks: req.body.portfolioLinks 
          ? (Array.isArray(req.body.portfolioLinks) 
              ? req.body.portfolioLinks 
              : JSON.parse(req.body.portfolioLinks))
          : [],
      };

      // Parse certifications if provided
      if (req.body.certifications) {
        const certificationsData = Array.isArray(req.body.certifications)
          ? req.body.certifications
          : JSON.parse(req.body.certifications);

        // Map certification data dengan uploaded files
        registrationData.certifications = certificationsData.map((cert, index) => ({
          certificationName: cert.certificationName,
          penerbit: cert.penerbit,
          year: parseInt(cert.year),
          berkasUrl: certificationFiles[index] ? certificationFiles[index].path : cert.berkasUrl,
        }));
      }

      // Call service
      const result = await architectRegistrationService.register(registrationData);

      return ResponseFormatter.created(res, result.data, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get payment info by token
   * GET /api/architects/payment/:token
   */
  async getPaymentInfo(req, res, next) {
    try {
      const { token } = req.params;

      const paymentInfo = await architectRegistrationService.getPaymentInfo(token);

      return ResponseFormatter.success(res, paymentInfo, 'Payment info retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Resend payment link
   * POST /api/architects/payment/resend
   */
  async resendPaymentLink(req, res, next) {
    try {
      const { email } = req.body;

      if (!email) {
        return ResponseFormatter.badRequest(res, 'Email is required');
      }

      const result = await architectRegistrationService.resendPaymentLink(email);

      return ResponseFormatter.success(res, null, result.message);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ArchitectRegistrationController();