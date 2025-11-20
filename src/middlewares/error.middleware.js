/**
 * Global Error Handler Middleware
 * Menangani semua error yang terjadi di aplikasi
 */

const ResponseFormatter = require('../utils/response-formatter');
const { AppError } = require('../errors/app-errors');

/**
 * Error Handler Middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
  // Log error untuk debugging
  console.error('❌ Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // Default error values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || null;

  // Handle Prisma errors
  if (err.code) {
    const prismaError = handlePrismaError(err);
    statusCode = prismaError.statusCode;
    message = prismaError.message;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Handle Multer errors (file upload)
  if (err.name === 'MulterError') {
    const multerError = handleMulterError(err);
    statusCode = multerError.statusCode;
    message = multerError.message;
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errors = err.errors;
  }

  // Send error response
  return ResponseFormatter.error(res, message, statusCode, errors);
};

/**
 * Handle Prisma Database Errors
 */
const handlePrismaError = (err) => {
  switch (err.code) {
    case 'P2002':
      // Unique constraint violation
      const field = err.meta?.target?.[0] || 'field';
      return {
        statusCode: 409,
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`,
      };

    case 'P2025':
      // Record not found
      return {
        statusCode: 404,
        message: 'Record not found',
      };

    case 'P2003':
      // Foreign key constraint failed
      return {
        statusCode: 400,
        message: 'Invalid reference to related record',
      };

    case 'P2014':
      // Invalid ID
      return {
        statusCode: 400,
        message: 'Invalid ID format',
      };

    default:
      return {
        statusCode: 500,
        message: 'Database operation failed',
      };
  }
};

/**
 * Handle Multer File Upload Errors
 */
const handleMulterError = (err) => {
  switch (err.code) {
    case 'LIMIT_FILE_SIZE':
      return {
        statusCode: 400,
        message: 'File size too large. Maximum 5MB allowed',
      };

    case 'LIMIT_FILE_COUNT':
      return {
        statusCode: 400,
        message: 'Too many files uploaded',
      };

    case 'LIMIT_UNEXPECTED_FILE':
      return {
        statusCode: 400,
        message: 'Unexpected file field',
      };

    default:
      return {
        statusCode: 400,
        message: 'File upload failed',
      };
  }
};

/**
 * 404 Not Found Handler
 * Untuk route yang tidak ditemukan
 */
const notFoundHandler = (req, res, next) => {
  return ResponseFormatter.notFound(
    res,
    `Route ${req.method} ${req.path} not found`
  );
};

module.exports = {
  errorHandler,
  notFoundHandler,
};