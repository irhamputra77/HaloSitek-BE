/**
 * User Authentication Controller
 * Handle HTTP requests untuk user authentication dan profile management
 */

const { userAuthService } = require('../services');
const ResponseFormatter = require('../../../utils/response-formatter');

class UserAuthController {
  /**
   * Register new user
   * POST /api/users/register
   */
  async register(req, res, next) {
    try {
      const profilePicture = req.file;

      // Prepare registration data
      const registrationData = {
        email: req.body.email,
        username: req.body.username,
        password: req.body.password,
        fullName: req.body.fullName,
        profilePictureUrl: profilePicture ? profilePicture.path : null,
      };

      // Call service
      const result = await userAuthService.register(registrationData);

      return ResponseFormatter.created(res, result.data, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login
   * POST /api/users/auth/login
   */
  async login(req, res, next) {
    try {
      const { identifier, password } = req.body;

      const result = await userAuthService.login({ identifier, password });

      return ResponseFormatter.success(res, result.data, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Profile
   * GET /api/users/auth/profile
   * Protected - Requires JWT token
   */
  async getProfile(req, res, next) {
    try {
      const userId = req.user.id; // From JWT token

      const profile = await userAuthService.getProfile(userId);

      return ResponseFormatter.success(res, profile, 'Profile retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update Profile
   * PUT /api/users/auth/profile
   * Protected - Requires JWT token
   */
  async updateProfile(req, res, next) {
    try {
      const userId = req.user.id; // From JWT token
      const file = req.file; // Profile picture

      const profile = await userAuthService.updateProfile(userId, req.body, file);

      return ResponseFormatter.success(res, profile, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change Password
   * POST /api/users/auth/change-password
   * Protected - Requires JWT token
   */
  async changePassword(req, res, next) {
    try {
      const userId = req.user.id; // From JWT token
      const { oldPassword, newPassword } = req.body;

      const result = await userAuthService.changePassword(userId, {
        oldPassword,
        newPassword,
      });

      return ResponseFormatter.success(res, null, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh Token
   * POST /api/users/auth/refresh-token
   */
  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;

      const result = await userAuthService.refreshAccessToken(refreshToken);

      return ResponseFormatter.success(res, result.data, 'Token refreshed successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout
   * POST /api/users/auth/logout
   * Protected - Requires JWT token
   */
  async logout(req, res, next) {
    try {
      const userId = req.user.id; // From JWT token

      const result = await userAuthService.logout(userId);

      return ResponseFormatter.success(res, null, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Current User Info (from token)
   * GET /api/users/auth/me
   * Protected - Requires JWT token
   */
  async getCurrentUser(req, res, next) {
    try {
      const userId = req.user.id; // From JWT token

      const profile = await userAuthService.getProfile(userId);

      return ResponseFormatter.success(res, profile, 'Current user retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify Email
   * POST /api/users/auth/verify-email
   * Protected - Requires JWT token
   */
  async verifyEmail(req, res, next) {
    try {
      const userId = req.user.id; // From JWT token

      const result = await userAuthService.verifyEmail(userId);

      return ResponseFormatter.success(res, null, result.message);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserAuthController();