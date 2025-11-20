/**
 * File Upload Middleware
 * Configure Multer untuk handle file uploads
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { FileUploadError } = require('../../errors/app-errors');

// Ensure upload directories exist
const ensureDirectoryExists = (directory) => {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
};

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/temp';

    if (file.fieldname === 'profilePicture') {
      uploadPath = 'uploads/architects/profile-pictures';
    } else if (file.fieldname === 'certifications') {
      uploadPath = 'uploads/architects/certifications';
    }

    ensureDirectoryExists(uploadPath);
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

// File filter
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  const allowedDocTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

  if (file.fieldname === 'profilePicture') {
    if (allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new FileUploadError('Only JPEG, JPG, and PNG images allowed for profile picture'), false);
    }
  } else if (file.fieldname === 'certifications') {
    if (allowedDocTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new FileUploadError('Only PDF, JPEG, JPG, and PNG files allowed for certifications'), false);
    }
  } else {
    cb(new FileUploadError('Unexpected field'), false);
  }
};

// Multer upload configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
  },
});

/**
 * Middleware untuk architect registration
 * Handles: profilePicture (single) + certifications (multiple)
 */
const uploadArchitectFiles = upload.fields([
  { name: 'profilePicture', maxCount: 1 },
  { name: 'certifications', maxCount: 10 },
]);

module.exports = {
  uploadArchitectFiles,
  upload,
};