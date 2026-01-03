/**
 * Design Controller
 * Handle HTTP requests untuk design management
 */

const designService = require('../services/design.service');
const ResponseFormatter = require('../../../utils/response-formatter');

class DesignController {
  /**
   * Create new design
   * POST /api/architects/auth/designs
   * Protected - Requires architect authentication
   */
  async createDesign(req, res, next) {
    try {
      const architectId = req.user.id; // From JWT

      // Get uploaded files
      const files = {
        foto_bangunan: req.files?.foto_bangunan || [],
        foto_denah: req.files?.foto_denah || [],
      };

      // Create design
      const design = await designService.createDesign(architectId, req.body, files);

      return ResponseFormatter.created(res, design, 'Design created successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get design by ID
   * GET /api/designs/:id
   * Public
   */
  async getDesignById(req, res, next) {
    try {
      const { id } = req.params;

      const viewer = req.user || null;

      const design = await designService.getDesignById(id, true, viewer);

      return ResponseFormatter.success(res, design, 'Design retrieved successfully');
    } catch (error) {
      next(error);
    }
  }



  /**
 * Admin Update design
 * PUT /api/designs/admin/:id
 * Protected - Requires admin authentication
 */
  async adminUpdateDesign(req, res, next) {
    try {
      const { id } = req.params;

      const files = {
        foto_bangunan: req.files?.foto_bangunan || [],
        foto_denah: req.files?.foto_denah || [],
      };

      const design = await designService.adminUpdateDesign(id, req.body, files);
      return ResponseFormatter.success(res, design, 'Design updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin Delete design
   * DELETE /api/designs/admin/:id
   * Protected - Requires admin authentication
   */
  async adminDeleteDesign(req, res, next) {
    try {
      const { id } = req.params;

      const result = await designService.adminDeleteDesign(id);
      return ResponseFormatter.success(res, null, result.message);
    } catch (error) {
      next(error);
    }
  }


  /**
 * Get distinct categories (public)
 * GET /api/designs/meta/categories
 */
  async getKategoriList(req, res, next) {
    try {
      const categories = await designService.getKategoriList();
      return ResponseFormatter.success(res, categories, "Design categories fetched", 200);
    } catch (error) {
      next(error);
    }
  }


  /**
   * Get designs by architect (my designs)
   * GET /api/architects/auth/designs
   * Protected - Requires architect authentication
   */
  async getMyDesigns(req, res, next) {
    try {
      const architectId = req.user.id; // From JWT
      const { page, limit, orderBy } = req.query;

      const result = await designService.getDesignsByArchitect(architectId, {
        page,
        limit,
        orderBy: orderBy ? JSON.parse(orderBy) : undefined,
      });

      return ResponseFormatter.success(res, result.data, 'Designs retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all designs (public)
   * GET /api/designs
   * Public
   */
  async getAllDesigns(req, res, next) {
    try {
      const { page, limit, orderBy } = req.query;

      const result = await designService.getAllDesigns({
        page,
        limit,
        orderBy: orderBy ? JSON.parse(orderBy) : undefined,
      });

      return ResponseFormatter.success(res, result.data, 'Designs retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Search designs
   * GET /api/designs/search
   * Public
   */
  // design.controller.js
  // design.controller.js
  async searchDesigns(req, res, next) {
    try {
      const { q, kategori, city, location, page, limit } = req.query;

      const result = await designService.searchDesigns({
        q,
        kategori,
        city: city || location,
        page,
        limit,
      });

      return ResponseFormatter.success(res, result.data, "Search completed successfully", 200);
    } catch (error) {
      next(error);
    }
  }



  /**
   * Get designs by category
   * GET /api/designs/category/:kategori
   * Public
   */
  async getDesignsByKategori(req, res, next) {
    try {
      const { kategori } = req.params;
      const { page, limit } = req.query;

      const result = await designService.getDesignsByKategori(kategori, {
        page,
        limit,
      });

      return ResponseFormatter.success(res, result.data, 'Designs retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get latest designs
   * GET /api/designs/latest
   * Public
   */
  async getLatestDesigns(req, res, next) {
    try {
      const { limit = 10 } = req.query;

      const designs = await designService.getLatestDesigns(parseInt(limit));

      return ResponseFormatter.success(res, designs, 'Latest designs retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update design
   * PUT /api/architects/auth/designs/:id
   * Protected - Requires architect authentication
   */
  async updateDesign(req, res, next) {
    try {
      const architectId = req.user.id; // From JWT
      const { id } = req.params;

      // Get uploaded files
      const files = {
        foto_bangunan: req.files?.foto_bangunan || [],
        foto_denah: req.files?.foto_denah || [],
      };

      // Update design
      const design = await designService.updateDesign(id, architectId, req.body, files);

      return ResponseFormatter.success(res, design, 'Design updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete design
   * DELETE /api/architects/auth/designs/:id
   * Protected - Requires architect authentication
   */
  async deleteDesign(req, res, next) {
    try {
      const architectId = req.user.id; // From JWT
      const { id } = req.params;

      const result = await designService.deleteDesign(id, architectId);

      return ResponseFormatter.success(res, null, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get design statistics
   * GET /api/architects/auth/designs/statistics
   * Protected - Requires architect authentication
   */
  async getStatistics(req, res, next) {
    try {
      const architectId = req.user.id; // From JWT

      const stats = await designService.getStatistics(architectId);

      return ResponseFormatter.success(res, stats, 'Statistics retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DesignController();