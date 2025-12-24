  /**
   * Architect Authentication Controller
   * Handle HTTP requests untuk authentication dan profile management
   */

  const architectAuthService = require('../services/architect-auth.service');
  const ResponseFormatter = require('../../../utils/response-formatter');

  class ArchitectAuthController {
    /**
     * Login
     * POST /api/architects/auth/login
     */
    async login(req, res, next) {
      try {
        const { email, password } = req.body;

        const result = await architectAuthService.login({ email, password });

        // Jika account UNPAID (payment required)
        if (!result.success && result.paymentRequired) {
          return ResponseFormatter.forbidden(res, result.message);
        }

        return ResponseFormatter.success(res, result.data, result.message);
      } catch (error) {
        next(error);
      }
    }

    /**
     * Get Profile
     * GET /api/architects/auth/profile
     * Protected - Requires JWT token
     */
    async getProfile(req, res, next) {
      try {
        const architectId = req.user.id; // From JWT token

        const profile = await architectAuthService.getProfile(architectId);

        return ResponseFormatter.success(res, profile, 'Profile retrieved successfully');
      } catch (error) {
        next(error);
      }
    }

    /**
     * Update Profile
     * PUT /api/architects/auth/profile
     * Protected - Requires JWT token
     */
    async updateProfile(req, res, next) {
      try {
        const architectId = req.user.id; // From JWT token

        // Get uploaded files
        const files = {
          profilePicture: req.files?.profilePicture?.[0],
          certifications: req.files?.certifications || [],
        };

        const profile = await architectAuthService.updateProfile(
          architectId,
          req.body,
          files
        );

        return ResponseFormatter.success(res, profile, 'Profile updated successfully');
      } catch (error) {
        next(error);
      }
    }

    /**
     * Change Password
     * POST /api/architects/auth/change-password
     * Protected - Requires JWT token
     */
    async changePassword(req, res, next) {
      try {
        const architectId = req.user.id; // From JWT token
        const { oldPassword, newPassword } = req.body;

        const result = await architectAuthService.changePassword(architectId, {
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
     * POST /api/architects/auth/refresh-token
     */
    async refreshToken(req, res, next) {
      try {
        const { refreshToken } = req.body;

        const result = await architectAuthService.refreshAccessToken(refreshToken);

        return ResponseFormatter.success(res, result.data, 'Token refreshed successfully');
      } catch (error) {
        next(error);
      }
    }

    /**
     * Logout
     * POST /api/architects/auth/logout
     * Protected - Requires JWT token
     */
    async logout(req, res, next) {
      try {
        const architectId = req.user.id; // From JWT token

        const result = await architectAuthService.logout(architectId);

        return ResponseFormatter.success(res, null, result.message);
      } catch (error) {
        next(error);
      }
    }

    /**
     * Get Dashboard Statistics
     * GET /api/architects/auth/dashboard
     * Protected - Requires JWT token
     */
    async getDashboard(req, res, next) {
      try {
        const architectId = req.user.id; // From JWT token

        const stats = await architectAuthService.getDashboardStats(architectId);

        return ResponseFormatter.success(res, stats, 'Dashboard stats retrieved successfully');
      } catch (error) {
        next(error);
      }
    }

    /**
     * Get Current User Info (from token)
     * GET /api/architects/auth/me
     * Protected - Requires JWT token
     */
    async getCurrentUser(req, res, next) {
      try {
        const architectId = req.user.id; // From JWT token

        const profile = await architectAuthService.getProfile(architectId);

        return ResponseFormatter.success(res, profile, 'Current user retrieved successfully');
      } catch (error) {
        next(error);
      }
    }
  }

  module.exports = new ArchitectAuthController();