/**
 * Certification Controller
 * Handle HTTP requests untuk certification management
 */

const certificationService = require('../services/certification.service');
const ResponseFormatter = require('../../../utils/response-formatter');

class CertificationController {

  async uploadCertificationTemp(req, res, next) {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ success: false, message: 'File is required' });
      }

      // Simpan path yang akan kamu taruh ke berkasUrl
      // (Sesuaikan kalau kamu pakai base URL static)
      const berkasUrl = file.path.replace(/\\/g, '/');

      return ResponseFormatter.created(
        res,
        { berkasUrl, originalName: file.originalname, mimeType: file.mimetype, size: file.size },
        'File uploaded successfully'
      );
    } catch (error) {
      next(error);
    }
  }


  /**
   * Create new certification
   * POST /api/architects/auth/certifications
   * Protected - Requires architect authentication
   */
  async createCertification(req, res, next) {
    try {
      const architectId = req.user.id; // From JWT
      const file = req.file; // Uploaded certification file

      const certification = await certificationService.createCertification(
        architectId,
        req.body,
        file
      );

      return ResponseFormatter.created(res, certification, 'Certification created successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get certification by ID
   * GET /api/certifications/:id
   * Public
   */
  async getCertificationById(req, res, next) {
    try {
      const { id } = req.params;

      const certification = await certificationService.getCertificationById(id);

      return ResponseFormatter.success(res, certification, 'Certification retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get my certifications
   * GET /api/architects/auth/certifications
   * Protected - Requires architect authentication
   */
  async getMyCertifications(req, res, next) {
    try {
      const architectId = req.user.id; // From JWT

      const certifications = await certificationService.getCertificationsByArchitect(architectId);

      return ResponseFormatter.success(
        res,
        certifications,
        'Certifications retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update certification
   * PUT /api/architects/auth/certifications/:id
   * Protected - Requires architect authentication
   */
  async updateCertification(req, res, next) {
    try {
      const architectId = req.user.id; // From JWT
      const { id } = req.params;
      const file = req.file; // Uploaded file (optional)

      const certification = await certificationService.updateCertification(
        id,
        architectId,
        req.body,
        file
      );

      return ResponseFormatter.success(res, certification, 'Certification updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete certification
   * DELETE /api/architects/auth/certifications/:id
   * Protected - Requires architect authentication
   */
  async deleteCertification(req, res, next) {
    try {
      const architectId = req.user.id; // From JWT
      const { id } = req.params;

      const result = await certificationService.deleteCertification(id, architectId);

      return ResponseFormatter.success(res, null, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get certification statistics
   * GET /api/architects/auth/certifications/statistics
   * Protected - Requires architect authentication
   */
  async getStatistics(req, res, next) {
    try {
      const architectId = req.user.id; // From JWT

      const stats = await certificationService.getStatistics(architectId);

      return ResponseFormatter.success(res, stats, 'Statistics retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CertificationController();