/**
 * File Upload Utility
 * Konfigurasi Multer untuk handle file uploads
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { FileUploadError } = require('../errors/app-errors');

class FileUploadHelper {
  /**
   * Get storage configuration for multer
   * @param {String} destination - Upload destination folder
   * @returns {Object} - Multer storage configuration
   */
  static getStorage(destination = 'uploads/temp') {
    const normalizedDestination =
      destination.startsWith('uploads/')
        ? destination
        : path.join('uploads', destination);
    // Ensure upload directory exists
    this.ensureDirectoryExists(destination);

    return multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, normalizedDestination);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        const nameWithoutExt = path.basename(file.originalname, ext);
        const filename = `${nameWithoutExt}-${uniqueSuffix}${ext}`;
        cb(null, filename);
      },
    });
  }

  /**
   * File filter for images
   * @param {Object} req - Express request
   * @param {Object} file - Multer file object
   * @param {Function} cb - Callback
   */
  static imageFilter(req, file, cb) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new FileUploadError('Only JPEG, JPG, and PNG images are allowed'), false);
    }
  }

  /**
   * File filter for documents (PDF and images)
   * @param {Object} req - Express request
   * @param {Object} file - Multer file object
   * @param {Function} cb - Callback
   */
  static documentFilter(req, file, cb) {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new FileUploadError('Only PDF, JPEG, JPG, and PNG files are allowed'), false);
    }
  }

  /**
   * Get max file size from env or default (5MB)
   * @returns {Number} - Max file size in bytes
   */
  static getMaxFileSize() {
    return parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024; // 5MB
  }

  /**
   * Create multer upload middleware for profile pictures
   * @returns {Object} - Multer middleware
   */
  static createProfilePictureUpload() {
    return multer({
      storage: this.getStorage('uploads/architects/profile-pictures'),
      fileFilter: this.imageFilter,
      limits: {
        fileSize: this.getMaxFileSize(),
      },
    }).single('profilePicture'); // Field name: profilePicture
  }

  /**
   * Create multer upload middleware for certifications
   * @returns {Object} - Multer middleware
   */
  static createCertificationUpload() {
    return multer({
      storage: this.getStorage('uploads/architects/certifications'),
      fileFilter: this.documentFilter,
      limits: {
        fileSize: this.getMaxFileSize(),
      },
    }).array('certifications', 10); // Max 10 certifications
  }

  /**
   * Create multer upload middleware for design images
   * @returns {Object} - Multer middleware
   */
  static createDesignImageUpload() {
    return multer({
      storage: this.getStorage('uploads/designs/images'),
      fileFilter: this.imageFilter,
      limits: {
        fileSize: this.getMaxFileSize(),
      },
    }).array('images', 20); // Max 20 images
  }

  /**
   * Ensure directory exists, create if not
   * @param {String} directory - Directory path
   */
  static ensureDirectoryExists(directory) {
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }
  }

  /**
   * Delete file from filesystem
   * @param {String} filePath - Path to file
   * @returns {Boolean} - True if deleted, false otherwise
   */
  static deleteFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  /**
   * Get file URL for response
   * @param {String} filePath - Relative file path
   * @returns {String} - Full URL to file
   */
  static getFileUrl(filePath) {
    if (!filePath) return null;

    // For local development
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    return `${baseUrl}/${filePath}`;
  }

  /**
   * Validate file exists
   * @param {String} filePath - Path to file
   * @returns {Boolean} - True if exists, false otherwise
   */
  static fileExists(filePath) {
    return fs.existsSync(filePath);
  }

  /**
   * Get file size in bytes
   * @param {String} filePath - Path to file
   * @returns {Number|null} - File size in bytes or null if not found
   */
  static getFileSize(filePath) {
    try {
      if (this.fileExists(filePath)) {
        const stats = fs.statSync(filePath);
        return stats.size;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Format file size to human-readable format
   * @param {Number} bytes - File size in bytes
   * @returns {String} - Formatted file size (e.g., "2.5 MB")
   */
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Move uploaded file to different directory
   * @param {String} sourcePath - Current file path
   * @param {String} destinationPath - New file path
   * @returns {Boolean} - True if successful, false otherwise
   */
  static moveFile(sourcePath, destinationPath) {
    try {
      // Ensure destination directory exists
      const destDir = path.dirname(destinationPath);
      this.ensureDirectoryExists(destDir);

      fs.renameSync(sourcePath, destinationPath);
      return true;
    } catch (error) {
      console.error('Error moving file:', error);
      return false;
    }
  }
}

module.exports = FileUploadHelper;