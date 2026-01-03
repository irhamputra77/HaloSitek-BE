/**
 * Design Routes
 * Routes untuk design management (Katalog Desain)
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const designController = require('../controllers/design.controller');
const authMiddleware = require('../../../middlewares/auth.middleware');

// Configure multer for design images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/designs/images';

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
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, JPG, and PNG images are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// Upload configuration for design images
const uploadDesignImages = upload.fields([
  { name: 'foto_bangunan', maxCount: 10 },
  { name: 'foto_denah', maxCount: 10 },
]);

// ============================================
// ADMIN ROUTES (Admin only)
// ============================================

router.put(
  '/admin/:id',
  authMiddleware.verifyAdmin,     // <-- pastikan ada
  uploadDesignImages,             // bisa update foto juga
  designController.adminUpdateDesign
);

router.delete(
  '/admin/:id',
  authMiddleware.verifyAdmin,
  designController.adminDeleteDesign
);

/**
 * @route   GET /api/designs/meta/categories
 * @desc    Get distinct categories
 * @access  Public
 */
router.get("/meta/categories", designController.getKategoriList);

// ============================================
// PUBLIC ROUTES
// ============================================

/**
 * @route   GET /api/designs
 * @desc    Get all designs (public)
 * @access  Public
 */
router.get('/', designController.getAllDesigns);

/**
 * @route   GET /api/designs/search
 * @desc    Search designs
 * @access  Public
 */
router.get('/search', designController.searchDesigns);

/**
 * @route   GET /api/designs/latest
 * @desc    Get latest designs
 * @access  Public
 */
router.get('/latest', designController.getLatestDesigns);

/**
 * @route   GET /api/designs/category/:kategori
 * @desc    Get designs by category
 * @access  Public
 */
router.get('/category/:kategori', designController.getDesignsByKategori);

/**
 * @route   GET /api/designs/:id
 * @desc    Get design by ID (public) + HIT VIEW kalau user/arsitek login
 * @access  Public (optional auth)
 *
 * ✅ optionalAuth: kalau ada token -> req.user ada, kalau tidak ada -> req.user null
 * ✅ nanti logic increment view-nya ditaruh di controller/service
 */
router.get('/:id', authMiddleware.optionalAuth, designController.getDesignById);

// ============================================
// PROTECTED ROUTES (Architect only)
// ============================================

/**
 * @route   POST /api/designs/architect/my-designs
 * @desc    Create new design
 * @access  Private (Architect only)
 */
router.post(
  '/architect/my-designs',
  authMiddleware.verifyArchitect,
  uploadDesignImages,
  designController.createDesign
);

/**
 * @route   GET /api/designs/architect/my-designs
 * @desc    Get my designs
 * @access  Private (Architect only)
 */
router.get(
  '/architect/my-designs',
  authMiddleware.verifyArchitect,
  designController.getMyDesigns
);

/**
 * @route   GET /api/designs/architect/my-designs/statistics
 * @desc    Get design statistics
 * @access  Private (Architect only)
 */
router.get(
  '/architect/my-designs/statistics',
  authMiddleware.verifyArchitect,
  designController.getStatistics
);

/**
 * @route   PUT /api/designs/architect/my-designs/:id
 * @desc    Update design
 * @access  Private (Architect only)
 */
router.put(
  '/architect/my-designs/:id',
  authMiddleware.verifyArchitect,
  uploadDesignImages,
  designController.updateDesign
);

/**
 * @route   DELETE /api/designs/architect/my-designs/:id
 * @desc    Delete design
 * @access  Private (Architect only)
 */
router.delete(
  '/architect/my-designs/:id',
  authMiddleware.verifyArchitect,
  designController.deleteDesign
);

module.exports = router;
