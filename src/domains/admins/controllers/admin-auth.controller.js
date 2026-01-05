/**
 * Admin Authentication Controller
 * Handle HTTP requests untuk admin authentication dan management
 */

const adminAuthService = require('../services/admin-auth.service');
const ResponseFormatter = require('../../../utils/response-formatter');

class AdminAuthController {
  /**
   * Login
   * POST /api/admins/auth/login
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const result = await adminAuthService.login({ email, password });

      return ResponseFormatter.success(res, result.data, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Profile
   * GET /api/admins/auth/profile
   * Protected - Requires JWT token (ADMIN role)
   */
  async getProfile(req, res, next) {
    try {
      const adminId = req.user.id; // From JWT token

      const profile = await adminAuthService.getProfile(adminId);

      return ResponseFormatter.success(res, profile, 'Profile retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update Profile
   * PUT /api/admins/auth/profile
   * Protected - Requires JWT token (ADMIN role)
   */
  async updateProfile(req, res, next) {
    try {
      const adminId = req.user.id; // From JWT token

      const profile = await adminAuthService.updateProfile(adminId, req.body);

      return ResponseFormatter.success(res, profile, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change Password
   * POST /api/admins/auth/change-password
   * Protected - Requires JWT token (ADMIN role)
   */
  async changePassword(req, res, next) {
    try {
      const adminId = req.user.id; // From JWT token
      const { oldPassword, newPassword } = req.body;

      const result = await adminAuthService.changePassword(adminId, {
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
   * POST /api/admins/auth/refresh-token
   */
  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;

      const result = await adminAuthService.refreshAccessToken(refreshToken);

      return ResponseFormatter.success(res, result.data, 'Token refreshed successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout
   * POST /api/admins/auth/logout
   * Protected - Requires JWT token (ADMIN role)
   */
  async logout(req, res, next) {
    try {
      const adminId = req.user.id; // From JWT token

      const result = await adminAuthService.logout(adminId);

      return ResponseFormatter.success(res, null, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Current Admin Info (from token)
   * GET /api/admins/auth/me
   * Protected - Requires JWT token (ADMIN role)
   */
  async getCurrentAdmin(req, res, next) {
    try {
      const adminId = req.user.id; // From JWT token

      const profile = await adminAuthService.getProfile(adminId);

      return ResponseFormatter.success(res, profile, 'Current admin retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
 * Add new admin
 * POST /api/admins/auth/add
 * Protected - Requires JWT token (ADMIN role)
 */
  async addAdmin(req, res, next) {
    try {
      const admin = await adminAuthService.addAdmin(req.user, req.body);
      return ResponseFormatter.success(res, admin, "Admin created successfully", 201);
    } catch (error) {
      next(error);
    }
  }



  /**
  * Get all admins
  */
  async getAllAdmins(req, res) {
    try {
      const admins = await adminAuthService.getAllAdmins();

      return ResponseFormatter.success(
        res,
        admins,                         // data dulu
        "Admins retrieved successfully" // message
      );

    } catch (error) {
      console.error("❌ Error getting all admins:", error.message);
      return ResponseFormatter.error(
        res,
        error.message || "Failed to get admins",
        500
      );
    }
  }

  /**
   * Get Dashboard Statistics
   * GET /api/admins/auth/dashboard
   * Protected - Requires JWT token (ADMIN role)
   */
  async getDashboard(req, res, next) {
    try {
      const stats = await adminAuthService.getDashboardStats();

      return ResponseFormatter.success(res, stats, 'Dashboard stats retrieved successfully');
    } catch (error) {
      next(error);
    }
  } z
}

module.exports = new AdminAuthController();