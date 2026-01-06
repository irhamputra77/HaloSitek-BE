/**
 * Certification Service
 * Handle business logic untuk certification management
 */

const { certificationRepository, architectRepository } = require('../repositories');
const FileUploadHelper = require('../../../utils/file-upload-helper');
const {
  ValidationError,
  NotFoundError,
  AuthorizationError,
} = require('../../../errors/app-errors');

class CertificationService {
  /**
   * Create new certification
   * @param {String} architectId - Architect ID
   * @param {Object} certData - Certification data
   * @param {Object} file - Uploaded file
   * @returns {Promise<Object>} - Created certification
   */
  async createCertification(architectId, certData, file) {
    try {
      // Validate input
      this.validateCertificationData(certData);

      // Verify architect exists
      await architectRepository.findByIdOrFail(architectId);

      // Validate file upload
      if (!file) {
        throw new ValidationError('Certification file is required', [
          { field: 'berkas', message: 'Certification file is required' },
        ]);
      }

      // Prepare data
      const data = {
        certificationName: certData.certificationName,
        penerbit: certData.penerbit,
        year: parseInt(certData.year),
        berkasUrl: await FileUploadHelper.persistFile(file, "architects/certifications"),
      };

      // Create certification
      const certification = await certificationRepository.createForArchitect(architectId, data);

      console.log('✅ Certification created:', certification.id);

      return this.formatCertificationResponse(certification);
    } catch (error) {
      console.error('❌ Failed to create certification:', error.message);
      throw error;
    }
  }

  /**
   * Validate certification data
   * @param {Object} data - Certification data
   * @throws {ValidationError} - If validation fails
   */
  validateCertificationData(data) {
    const errors = [];

    if (!data.certificationName || data.certificationName.trim() === '') {
      errors.push({ field: 'certificationName', message: 'Certification name is required' });
    }

    if (!data.penerbit || data.penerbit.trim() === '') {
      errors.push({ field: 'penerbit', message: 'Penerbit is required' });
    }

    if (!data.year) {
      errors.push({ field: 'year', message: 'Year is required' });
    } else {
      const year = parseInt(data.year);
      const currentYear = new Date().getFullYear();
      if (year < 1900 || year > currentYear) {
        errors.push({
          field: 'year',
          message: `Year must be between 1900 and ${currentYear}`,
        });
      }
    }

    if (errors.length > 0) {
      throw new ValidationError('Validation failed', errors);
    }
  }

  /**
   * Get certification by ID
   * @param {String} certificationId - Certification ID
   * @returns {Promise<Object>} - Certification data
   */
  async getCertificationById(certificationId) {
    try {
      const certification = await certificationRepository.findByIdOrFail(certificationId);
      return this.formatCertificationResponse(certification);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get certifications by architect
   * @param {String} architectId - Architect ID
   * @returns {Promise<Array>} - Array of certifications
   */
  async getCertificationsByArchitect(architectId) {
    try {
      const certifications = await certificationRepository.findByArchitectId(architectId);
      return certifications.map(cert => this.formatCertificationResponse(cert));
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update certification
   * @param {String} certificationId - Certification ID
   * @param {String} architectId - Architect ID (for authorization)
   * @param {Object} updateData - Update data
   * @param {Object} file - Uploaded file (optional)
   * @returns {Promise<Object>} - Updated certification
   */
  async updateCertification(certificationId, architectId, updateData, file = null) {
    try {
      // Get certification
      const certification = await certificationRepository.findByIdOrFail(certificationId);

      // Check ownership
      if (certification.architectId !== architectId) {
        throw new AuthorizationError('You do not have permission to update this certification');
      }

      // Validate update data if provided
      if (updateData.certificationName || updateData.penerbit || updateData.year) {
        this.validateCertificationData({
          certificationName: updateData.certificationName || certification.certificationName,
          penerbit: updateData.penerbit || certification.penerbit,
          year: updateData.year || certification.year,
        });
      }

      // Prepare update object
      const data = {};

      if (updateData.certificationName) data.certificationName = updateData.certificationName;
      if (updateData.penerbit) data.penerbit = updateData.penerbit;
      if (updateData.year) data.year = parseInt(updateData.year);

      // Handle file update
      if (file) {
        await FileUploadHelper.safeDeleteFile(certification.berkasUrl);
        data.berkasUrl = await FileUploadHelper.persistFile(file, "architects/certifications");
      }



      // Update certification
      const updated = await certificationRepository.updateCertification(certificationId, data);

      console.log('✅ Certification updated:', certificationId);

      return this.formatCertificationResponse(updated);
    } catch (error) {
      console.error('❌ Failed to update certification:', error.message);
      throw error;
    }
  }

  /**
   * Delete certification
   * @param {String} certificationId - Certification ID
   * @param {String} architectId - Architect ID (for authorization)
   * @returns {Promise<Object>} - Result
   */
  async deleteCertification(certificationId, architectId) {
    try {
      // Get certification
      const certification = await certificationRepository.findByIdOrFail(certificationId);

      // Check ownership
      if (certification.architectId !== architectId) {
        throw new AuthorizationError('You do not have permission to delete this certification');
      }

      // Delete file
      await FileUploadHelper.safeDeleteFile(certification.berkasUrl);

      // Delete certification
      await certificationRepository.deleteCertification(certificationId);

      console.log('✅ Certification deleted:', certificationId);

      return {
        success: true,
        message: 'Certification deleted successfully',
      };
    } catch (error) {
      console.error('❌ Failed to delete certification:', error.message);
      throw error;
    }
  }

  /**
   * Get certification statistics
   * @param {String} architectId - Architect ID
   * @returns {Promise<Object>} - Statistics
   */
  async getStatistics(architectId) {
    try {
      return await certificationRepository.getStatistics(architectId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Format certification response
   * @param {Object} certification - Certification object
   * @returns {Object} - Formatted certification
   */
  formatCertificationResponse(certification) {
    return {
      id: certification.id,
      certificationName: certification.certificationName,
      penerbit: certification.penerbit,
      year: certification.year,
      berkasUrl: FileUploadHelper.getFileUrl(certification.berkasUrl),
      createdAt: certification.createdAt,
      updatedAt: certification.updatedAt,
    };
  }
}

module.exports = new CertificationService();