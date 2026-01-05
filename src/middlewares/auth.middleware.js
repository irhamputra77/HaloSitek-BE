/**
 * Authentication Middleware
 * Verify JWT token dan check architect status
 */

const JWTHelper = require('../utils/jwt-helper');
const { architectRepository } = require('../domains/architects/repositories');
const ResponseFormatter = require('../utils/response-formatter');
const { AuthenticationError, AuthorizationError } = require('../errors/app-errors');

class AuthMiddleware {
  /**
   * Verify JWT Token
   * Middleware untuk verify token dari Authorization header
   */
  async verifyToken(req, res, next) {
    try {
      // Get token from Authorization header
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        return ResponseFormatter.unauthorized(res, 'No token provided');
      }

      // Extract token
      const token = JWTHelper.extractTokenFromHeader(authHeader);

      if (!token) {
        return ResponseFormatter.unauthorized(res, 'Invalid token format');
      }

      // Verify token
      const decoded = JWTHelper.verifyToken(token);

      // Attach user info to request
      req.user = decoded;

      next();
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return ResponseFormatter.unauthorized(res, error.message);
      }
      return ResponseFormatter.unauthorized(res, 'Invalid or expired token');
    }
  }

  /**
   * Verify Architect Token dan Check Status
   * Khusus untuk architect endpoints
   * Memastikan:
   * 1. Token valid
   * 2. User adalah architect
   * 3. Status ACTIVE (sudah bayar)
   */
  async verifyArchitect(req, res, next) {
    try {
      // Get token from Authorization header
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        return ResponseFormatter.unauthorized(res, 'No token provided');
      }

      // Extract token
      const token = JWTHelper.extractTokenFromHeader(authHeader);

      if (!token) {
        return ResponseFormatter.unauthorized(res, 'Invalid token format');
      }

      // Verify token
      const decoded = JWTHelper.verifyToken(token);

      // Check if role is ARCHITECT
      if (decoded.role !== 'ARCHITECT') {
        return ResponseFormatter.forbidden(res, 'Access denied. Architects only.');
      }

      // Get architect from database
      const architect = await architectRepository.findById(decoded.id);

      if (!architect) {
        return ResponseFormatter.unauthorized(res, 'Architect not found');
      }

      // Check architect status
      if (architect.status === 'UNPAID') {
        return ResponseFormatter.forbidden(
          res,
          'Account not activated. Please complete payment first.'
        );
      }

      if (architect.status === 'BANNED') {
        return ResponseFormatter.forbidden(
          res,
          'Account has been banned. Please contact support.'
        );
      }

      // Attach architect info to request
      req.user = decoded;
      req.architect = architect;

      next();
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return ResponseFormatter.unauthorized(res, error.message);
      }
      return ResponseFormatter.unauthorized(res, 'Invalid or expired token');
    }
  }
  /**
   * Verify User Token
   * Khusus untuk user endpoints
   */
  async verifyUser(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return ResponseFormatter.unauthorized(res, 'No token provided');
      }

      const token = JWTHelper.extractTokenFromHeader(authHeader);
      if (!token) {
        return ResponseFormatter.unauthorized(res, 'Invalid token format');
      }

      const decoded = JWTHelper.verifyToken(token);

      if (decoded.role !== 'USER') {
        return ResponseFormatter.forbidden(res, 'Access denied. Users only.');
      }

      req.user = decoded;
      next();
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return ResponseFormatter.unauthorized(res, error.message);
      }
      return ResponseFormatter.unauthorized(res, 'Invalid or expired token');
    }
  }
  /**
   * Verify Admin Token
   * Khusus untuk admin endpoints
   */
  async verifyAdmin(req, res, next) {
    try {
      // Get token from Authorization header
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        return ResponseFormatter.unauthorized(res, 'No token provided');
      }

      // Extract token
      const token = JWTHelper.extractTokenFromHeader(authHeader);

      if (!token) {
        return ResponseFormatter.unauthorized(res, 'Invalid token format');
      }

      // Verify token
      const decoded = JWTHelper.verifyToken(token);

      // Check if role is ADMIN or SUPER_ADMIN
      if (decoded.role !== 'ADMIN') {
        return ResponseFormatter.forbidden(res, 'Access denied. Admins only.');
      }



      // Attach admin info to request
      req.user = decoded;

      next();
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return ResponseFormatter.unauthorized(res, error.message);
      }
      return ResponseFormatter.unauthorized(res, 'Invalid or expired token');
    }
  }

  /**
 * Verify Super Admin Token
 * Khusus untuk aksi sensitif admin management (add/edit/delete admin)
 */


  /**
   * Optional Authentication
   * Token tidak wajib, tapi jika ada akan di-verify
   */
  async optionalAuth(req, res, next) {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        // No token, continue without authentication
        req.user = null;
        return next();
      }

      const token = JWTHelper.extractTokenFromHeader(authHeader);

      if (!token) {
        req.user = null;
        return next();
      }

      try {
        const decoded = JWTHelper.verifyToken(token);
        req.user = decoded;
      } catch (error) {
        // Invalid token, but continue anyway
        req.user = null;
      }

      next();
    } catch (error) {
      req.user = null;
      next();
    }
  }

  /**
   * Check if user owns the resource
   * Memastikan user hanya bisa akses resource miliknya sendiri
   * @param {String} paramName - Parameter name yang berisi architect ID (default: 'id')
   */
  checkOwnership(paramName = 'id') {
    return (req, res, next) => {
      try {
        const resourceId = req.params[paramName];
        const userId = req.user?.id;

        if (!userId) {
          return ResponseFormatter.unauthorized(res, 'Authentication required');
        }

        if (resourceId !== userId) {
          return ResponseFormatter.forbidden(
            res,
            'You do not have permission to access this resource'
          );
        }

        next();
      } catch (error) {
        return ResponseFormatter.serverError(res, 'Authorization check failed');
      }
    };
  }
}

module.exports = new AuthMiddleware();