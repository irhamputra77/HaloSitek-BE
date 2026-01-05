/**
 * Certification Routes
 * Routes untuk certification management
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const certificationController = require('../controllers/certification.controller');
const authMiddleware = require('../../../middlewares/auth.middleware');

// Configure multer for certification files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/architects/certifications';

    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '-');
    cb(null, `${sanitizedName}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, JPEG, JPG, and PNG files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

const uploadCertificationFile = upload.single('berkas');

// ============================================
// PUBLIC ROUTES
// ============================================

/**
 * @route   GET /api/certifications/:id
 * @desc    Get certification by ID
 * @access  Public
 */
router.get('/:id', certificationController.getCertificationById);

/**
 * @route   POST /api/certifications/public/upload
 * @desc    Upload certification file for registration (no auth)
 * @access  Public
 */
router.post(
  '/public/upload',
  uploadCertificationFile,
  certificationController.uploadCertificationTemp
);


// ============================================
// PROTECTED ROUTES (Architect only)
// ============================================

/**
 * @route   POST /api/architects/auth/certifications
 * @desc    Create new certification
 * @access  Private (Architect only)
 */
router.post(
  '/architect/my-certifications',
  authMiddleware.verifyArchitect,
  uploadCertificationFile,
  certificationController.createCertification
);

/**
 * @route   GET /api/architects/auth/certifications
 * @desc    Get my certifications
 * @access  Private (Architect only)
 */
router.get(
  '/architect/my-certifications',
  authMiddleware.verifyArchitect,
  certificationController.getMyCertifications
);

/**
 * @route   GET /api/architects/auth/certifications/statistics
 * @desc    Get certification statistics
 * @access  Private (Architect only)
 */
router.get(
  '/architect/my-certifications/statistics',
  authMiddleware.verifyArchitect,
  certificationController.getStatistics
);

/**
 * @route   PUT /api/architects/auth/certifications/:id
 * @desc    Update certification
 * @access  Private (Architect only)
 */
router.put(
  '/architect/my-certifications/:id',
  authMiddleware.verifyArchitect,
  uploadCertificationFile,
  certificationController.updateCertification
);

/**
 * @route   DELETE /api/architects/auth/certifications/:id
 * @desc    Delete certification
 * @access  Private (Architect only)
 */
router.delete(
  '/architect/my-certifications/:id',
  authMiddleware.verifyArchitect,
  certificationController.deleteCertification
);

module.exports = router;