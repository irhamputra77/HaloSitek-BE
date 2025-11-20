/**
 * Custom Error Classes
 * Extended error classes untuk error handling yang lebih baik
 */

/**
 * Base Application Error
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Operational errors vs programming errors
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation Error (400)
 */
class ValidationError extends AppError {
  constructor(message = 'Validation Error', errors = []) {
    super(message, 400);
    this.errors = errors;
  }
}

/**
 * Authentication Error (401)
 */
class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
  }
}

/**
 * Authorization Error (403)
 */
class AuthorizationError extends AppError {
  constructor(message = 'You do not have permission to perform this action') {
    super(message, 403);
  }
}

/**
 * Not Found Error (404)
 */
class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

/**
 * Conflict Error (409)
 * e.g., Email already exists
 */
class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409);
  }
}

/**
 * Bad Request Error (400)
 */
class BadRequestError extends AppError {
  constructor(message = 'Bad request') {
    super(message, 400);
  }
}

/**
 * Payment Error
 * Khusus untuk error terkait payment/transaksi
 */
class PaymentError extends AppError {
  constructor(message = 'Payment processing failed', statusCode = 400) {
    super(message, statusCode);
  }
}

/**
 * File Upload Error
 * Khusus untuk error terkait file upload
 */
class FileUploadError extends AppError {
  constructor(message = 'File upload failed') {
    super(message, 400);
  }
}

/**
 * Database Error
 * Khusus untuk error database operation
 */
class DatabaseError extends AppError {
  constructor(message = 'Database operation failed') {
    super(message, 500);
  }
}

/**
 * External Service Error
 * Untuk error dari external services (Midtrans, Email, etc.)
 */
class ExternalServiceError extends AppError {
  constructor(message = 'External service error', service = 'Unknown') {
    super(message, 503);
    this.service = service;
  }
}

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  BadRequestError,
  PaymentError,
  FileUploadError,
  DatabaseError,
  ExternalServiceError,
};