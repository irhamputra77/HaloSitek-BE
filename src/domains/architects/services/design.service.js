/**
 * Design Service
 * Handle business logic untuk design management
 */

const designRepository = require('../repositories/design.repository');
const { architectRepository } = require('../repositories');
const FileUploadHelper = require('../../../utils/file-upload-helper');
const {
  ValidationError,
  NotFoundError,
  AuthorizationError,
  BadRequestError,
} = require('../../../errors/app-errors');

class DesignService {

  parseIndexArray(val, { allowNull = false, expectedLen = null } = {}) {
    if (val === undefined) return null; // field tidak dikirim sama sekali

    let arr = [];

    if (Array.isArray(val)) {
      arr = val;
    } else if (typeof val === "string") {
      const s = val.trim();
      if (!s) arr = [];
      else if (s.startsWith("[") && s.endsWith("]")) {
        try {
          const parsed = JSON.parse(s);
          arr = Array.isArray(parsed) ? parsed : [];
        } catch {
          // fallback: "0,1,2"
          arr = s.split(",").map((x) => x.trim());
        }
      } else {
        // fallback: "0,1,2"
        arr = s.split(",").map((x) => x.trim());
      }
    } else {
      arr = [val];
    }

    const mapped = arr.map((x) => {
      const n = Number(x);
      if (Number.isInteger(n) && n >= 0) return n;
      return allowNull ? null : undefined;
    });

    let out = allowNull ? mapped.map((x) => (x === undefined ? null : x)) : mapped.filter((x) => x !== undefined);

    if (expectedLen != null && out.length < expectedLen) {
      out = [...out, ...new Array(expectedLen - out.length).fill(allowNull ? null : undefined)].filter(
        (x) => allowNull || x !== undefined
      );
    }

    return out;
  }

  applyIndexedReplace(oldArr, newPaths, indices) {
    const next = Array.isArray(oldArr) ? [...oldArr] : [];
    const deleted = [];

    for (let i = 0; i < newPaths.length; i++) {
      const idx = Array.isArray(indices) ? indices[i] : null;
      const path = newPaths[i];

      if (Number.isInteger(idx) && idx >= 0 && idx < next.length) {
        if (next[idx]) deleted.push(next[idx]);
        next[idx] = path;
      } else {
        next.push(path);
      }
    }

    return { next, deleted };
  }

  removeByIndices(arr, indices) {
    const next = Array.isArray(arr) ? [...arr] : [];
    const deleted = [];

    const uniq = Array.from(new Set(indices))
      .filter((n) => Number.isInteger(n) && n >= 0)
      .sort((a, b) => b - a); // descending biar splice aman

    for (const idx of uniq) {
      if (idx >= 0 && idx < next.length) {
        const p = next[idx];
        if (p) deleted.push(p);
        next.splice(idx, 1);
      }
    }

    return { next, deleted };
  }


  async recordDesignViewIfNeeded(viewer, design) {
    try {
      if (!viewer?.id || !viewer?.role) return;

      const role = String(viewer.role).toUpperCase();

      // ✅ USER dihitung selalu
      if (role === "USER") {
        await prisma.viewedDesignUser.upsert({
          where: { userId_designId: { userId: viewer.id, designId: design.id } },
          create: { userId: viewer.id, designId: design.id, viewedCount: 1 },
          update: { viewedCount: { increment: 1 } },
        });
        return;
      }

      // ✅ ARCHITECT dihitung kalau melihat desain arsitek lain
      if (role === "ARCHITECT") {
        // jangan hitung self-view
        if (design.architectId === viewer.id) return;

        await prisma.viewedDesignArchitect.upsert({
          where: {
            architectId_designId: { architectId: viewer.id, designId: design.id },
          },
          create: { architectId: viewer.id, designId: design.id, viewedCount: 1 },
          update: { viewedCount: { increment: 1 } },
        });
      }
    } catch (e) {
      console.warn("⚠️ recordDesignViewIfNeeded failed:", e?.message);
    }
  }

  async getDesignViewsCount(designId) {
    const [uAgg, aAgg] = await Promise.all([
      prisma.viewedDesignUser.aggregate({
        where: { designId },
        _sum: { viewedCount: true },
      }),
      prisma.viewedDesignArchitect.aggregate({
        where: { designId },
        _sum: { viewedCount: true },
      }),
    ]);

    const u = uAgg?._sum?.viewedCount || 0;
    const a = aAgg?._sum?.viewedCount || 0;

    return {
      total: u + a,
      fromUsers: u,
      fromArchitects: a,
    };
  }

  /**
   * Create new design
   * @param {String} architectId - Architect ID
   * @param {Object} designData - Design data
   * @param {Object} files - Uploaded files { foto_bangunan: [], foto_denah: [] }
   * @returns {Promise<Object>} - Created design
   */
  async createDesign(architectId, designData, files = {}) {
    try {
      // Validate input
      this.validateDesignData(designData);

      // Verify architect exists
      await architectRepository.findByIdOrFail(architectId);

      // Process uploaded files
      const foto_bangunan = files.foto_bangunan || [];
      const foto_denah = files.foto_denah || [];

      // Prepare design data
      const data = {
        title: designData.title,
        description: designData.description || null,
        kategori: designData.kategori || null,
        luas_bangunan: designData.luas_bangunan || null,
        luas_tanah: designData.luas_tanah || null,
        foto_bangunan: JSON.stringify(foto_bangunan.map(file => file.path)),
        foto_denah: JSON.stringify(foto_denah.map(file => file.path)),
      };

      // Create design
      const design = await designRepository.createForArchitect(architectId, data);

      console.log('✅ Design created:', design.id);

      // Return with formatted URLs
      return this.formatDesignResponse(design);
    } catch (error) {
      console.error('❌ Failed to create design:', error.message);
      throw error;
    }
  }

  async adminUpdateDesign(designId, updateData, files = {}) {
    // Ambil design dulu
    const design = await designRepository.findByIdOrFail(designId);

    // Validasi (kalau title diubah)
    if (updateData.title !== undefined) {
      this.validateDesignData({ title: updateData.title });
    }

    const data = {};
    if (updateData.title !== undefined) data.title = updateData.title;
    if (updateData.description !== undefined) data.description = updateData.description;
    if (updateData.kategori !== undefined) data.kategori = updateData.kategori;
    if (updateData.luas_bangunan !== undefined) data.luas_bangunan = updateData.luas_bangunan;
    if (updateData.luas_tanah !== undefined) data.luas_tanah = updateData.luas_tanah;

    // Handle replace foto_bangunan (kalau dikirim file baru)
    // Handle foto_bangunan
    // helper local di dalam updateDesign (atau jadikan method)
    const safeParseArray = (val) => {
      if (!val) return [];
      try {
        const parsed = typeof val === "string" ? JSON.parse(val) : val;
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    };

    const uniqNums = (arr) =>
      Array.from(new Set((arr || []).map((x) => Number(x)).filter((n) => Number.isFinite(n))));

    function applyPhotoOps({ oldPaths, newFiles, indices, deleteIndices }) {
      const base = [...oldPaths];
      const toDelete = new Set();

      // delete indices
      uniqNums(deleteIndices).forEach((idx) => {
        if (idx >= 0 && idx < base.length && base[idx]) {
          toDelete.add(base[idx]);
          base[idx] = null;
        }
      });

      // indices for each uploaded file: replace index OR -1 append
      const idxArr = (indices && indices.length) ? indices : null;

      // BACKWARD COMPAT:
      // kalau client tidak ngirim indices, anggap replace-all seperti behaviour lama
      if (!idxArr) {
        // hapus semua lama
        oldPaths.forEach((p) => toDelete.add(p));
        // hasilnya hanya file baru
        return {
          nextPaths: newFiles.map((f) => f.path),
          deletedPaths: Array.from(toDelete),
        };
      }

      // apply replace / append based on idxArr order
      newFiles.forEach((file, i) => {
        const targetIdx = Number(idxArr[i]);

        if (Number.isFinite(targetIdx) && targetIdx >= 0) {
          // replace
          if (targetIdx < base.length) {
            if (base[targetIdx]) toDelete.add(base[targetIdx]);
            base[targetIdx] = file.path;
          } else {
            // kalau index out of range, treat as append
            base.push(file.path);
          }
        } else {
          // append
          base.push(file.path);
        }
      });

      const nextPaths = base.filter(Boolean);
      return { nextPaths, deletedPaths: Array.from(toDelete) };
    }

    // ===== FOTO BANGUNAN =====
    const oldBangunan = this.parseJsonArray(design.foto_bangunan);
    const bangunanIndices = safeParseArray(updateData.foto_bangunan_indices);
    const bangunanDelete = safeParseArray(updateData.foto_bangunan_delete_indices);

    if (
      (files.foto_bangunan && files.foto_bangunan.length > 0) ||
      (bangunanDelete && bangunanDelete.length > 0)
    ) {
      const { nextPaths, deletedPaths } = applyPhotoOps({
        oldPaths: oldBangunan,
        newFiles: files.foto_bangunan || [],
        indices: bangunanIndices,
        deleteIndices: bangunanDelete,
      });

      // delete only affected files
      deletedPaths.forEach((p) => FileUploadHelper.deleteFile(p));

      data.foto_bangunan = JSON.stringify(nextPaths);
    }

    // ===== FOTO DENAH =====
    const oldDenah = this.parseJsonArray(design.foto_denah);
    const denahIndices = safeParseArray(updateData.foto_denah_indices);
    const denahDelete = safeParseArray(updateData.foto_denah_delete_indices);

    if (
      (files.foto_denah && files.foto_denah.length > 0) ||
      (denahDelete && denahDelete.length > 0)
    ) {
      const { nextPaths, deletedPaths } = applyPhotoOps({
        oldPaths: oldDenah,
        newFiles: files.foto_denah || [],
        indices: denahIndices,
        deleteIndices: denahDelete,
      });

      deletedPaths.forEach((p) => FileUploadHelper.deleteFile(p));

      data.foto_denah = JSON.stringify(nextPaths);
    }


    // Handle foto_denah
    if (files.foto_denah && files.foto_denah.length > 0) {
      const oldFotoDenah = this.parseJsonArray(design.foto_denah);
      const idxArr = this.parseIndexArray(updateData.foto_denah_indices);

      if (idxArr) {
        const nextArr = this.applyIndexedReplace(oldFotoDenah, files.foto_denah, idxArr);
        data.foto_denah = JSON.stringify(nextArr);
      } else {
        // fallback: replace semua
        oldFotoDenah.forEach((p) => FileUploadHelper.deleteFile(p));
        data.foto_denah = JSON.stringify(files.foto_denah.map((f) => f.path));
      }
    }


    const updated = await designRepository.updateDesign(designId, data);
    return this.formatDesignResponse(updated);
  }

  async adminDeleteDesign(designId) {
    const design = await designRepository.findByIdOrFail(designId);

    const fotoBangunan = this.parseJsonArray(design.foto_bangunan);
    const fotoDenah = this.parseJsonArray(design.foto_denah);

    fotoBangunan.forEach(p => FileUploadHelper.deleteFile(p));
    fotoDenah.forEach(p => FileUploadHelper.deleteFile(p));

    await designRepository.deleteDesign(designId);

    return { success: true, message: 'Design deleted successfully' };
  }

  /**
   * Get distinct kategori list (public)
   * @returns {Promise<string[]>}
   */
  async getKategoriList() {
    return await designRepository.getDistinctKategori();
  }




  /**
   * Validate design data
   * @param {Object} data - Design data
   * @throws {ValidationError} - If validation fails
   */
  validateDesignData(data) {
    const errors = [];

    if (!data.title || data.title.trim() === '') {
      errors.push({ field: 'title', message: 'Title is required' });
    }

    if (data.title && data.title.length > 200) {
      errors.push({ field: 'title', message: 'Title must be less than 200 characters' });
    }

    if (errors.length > 0) {
      throw new ValidationError('Validation failed', errors);
    }
  }

  /**
   * Get design by ID
   * @param {String} designId - Design ID
   * @param {Boolean} includeArchitect - Include architect info
   * @returns {Promise<Object>} - Design data
   */
  async getDesignById(designId, includeArchitect = false, viewer = null) {
    try {
      const design = includeArchitect
        ? await designRepository.findByIdWithArchitect(designId)
        : await designRepository.findByIdOrFail(designId);

      if (!design) {
        throw new NotFoundError("Design not found");
      }

      if (viewer?.id && viewer?.role) {
        const role = String(viewer.role).toUpperCase();

        if (role === "USER") {
          await designRepository.recordViewByUser(viewer.id, designId);
        }

        if (role === "ARCHITECT") {
          if (viewer.id !== design.architectId) {
            await designRepository.recordViewByArchitect(viewer.id, designId);
          }
        }
      }

      const views = await designRepository.getViewsSummary(designId);

      const formatted = this.formatDesignResponse(design);
      return {
        ...formatted,
        views: views.totalViews,
        uniqueViewers: views.uniqueViewers,
        viewsBreakdown: views.breakdown,
      };
    } catch (error) {
      throw error;
    }
  }



  /**
   * Get designs by architect
   * @param {String} architectId - Architect ID
   * @param {Object} options - Query options (page, limit, orderBy)
   * @returns {Promise<Object>} - { data, pagination }
   */
  async getDesignsByArchitect(architectId, options = {}) {
    try {
      const { page = 1, limit = 10, orderBy = { createdAt: "desc" } } = options;

      const result = await designRepository.findByArchitectId(architectId, {
        page: parseInt(page),
        limit: parseInt(limit),
        orderBy,
      });

      const ids = result.data.map((d) => d.id);
      const viewsMap = await designRepository.getViewsTotalsMap(ids);

      return {
        data: result.data.map((design) => {
          const formatted = this.formatDesignResponse(design);
          const v = viewsMap[design.id] || { totalViews: 0, uniqueViewers: 0 };
          return { ...formatted, views: v.totalViews, uniqueViewers: v.uniqueViewers };
        }),
        pagination: result.pagination,
      };
    } catch (error) {
      throw error;
    }
  }


  /**
   * Update design
   * @param {String} designId - Design ID
   * @param {String} architectId - Architect ID (for authorization)
   * @param {Object} updateData - Update data
   * @param {Object} files - Uploaded files (optional)
   * @returns {Promise<Object>} - Updated design
   */
  async updateDesign(designId, architectId, updateData, files = {}) {
    try {
      const design = await designRepository.findByIdOrFail(designId);

      if (design.architectId !== architectId) {
        throw new AuthorizationError("You do not have permission to update this design");
      }

      if (updateData.title) {
        this.validateDesignData(updateData);
      }

      const data = {};
      if (updateData.title) data.title = updateData.title;
      if (updateData.description !== undefined) data.description = updateData.description;
      if (updateData.kategori !== undefined) data.kategori = updateData.kategori;
      if (updateData.luas_bangunan !== undefined) data.luas_bangunan = updateData.luas_bangunan;
      if (updateData.luas_tanah !== undefined) data.luas_tanah = updateData.luas_tanah;

      // =========================
      // FOTO (INDEXED UPDATE)
      // =========================
      let fotoBangunanArr = this.parseJsonArray(design.foto_bangunan);
      let fotoDenahArr = this.parseJsonArray(design.foto_denah);

      let bangunanChanged = false;
      let denahChanged = false;

      const bangunanFiles = files.foto_bangunan || [];
      const denahFiles = files.foto_denah || [];

      // apakah field indices dikirim?
      const hasBangunanIndicesField = updateData.foto_bangunan_indices !== undefined;
      const hasDenahIndicesField = updateData.foto_denah_indices !== undefined;

      // 1) Replace/Append foto_bangunan
      if (bangunanFiles.length > 0) {
        const newPaths = bangunanFiles.map((f) => f.path);

        if (hasBangunanIndicesField) {
          const indices = this.parseIndexArray(updateData.foto_bangunan_indices, {
            allowNull: true,
            expectedLen: newPaths.length,
          });

          const { next, deleted } = this.applyIndexedReplace(fotoBangunanArr, newPaths, indices || []);
          deleted.forEach((p) => FileUploadHelper.deleteFile(p));

          fotoBangunanArr = next;
        } else {
          // backward compat: kalau indices tidak dikirim, replace semua
          fotoBangunanArr.forEach((p) => FileUploadHelper.deleteFile(p));
          fotoBangunanArr = newPaths;
        }

        bangunanChanged = true;
      }

      // 2) Replace/Append foto_denah
      if (denahFiles.length > 0) {
        const newPaths = denahFiles.map((f) => f.path);

        if (hasDenahIndicesField) {
          const indices = this.parseIndexArray(updateData.foto_denah_indices, {
            allowNull: true,
            expectedLen: newPaths.length,
          });

          const { next, deleted } = this.applyIndexedReplace(fotoDenahArr, newPaths, indices || []);
          deleted.forEach((p) => FileUploadHelper.deleteFile(p));

          fotoDenahArr = next;
        } else {
          fotoDenahArr.forEach((p) => FileUploadHelper.deleteFile(p));
          fotoDenahArr = newPaths;
        }

        denahChanged = true;
      }

      // 3) Delete per-index (setelah replace, supaya index tidak “geser”)
      const rmBangunan = this.parseIndexArray(
        updateData.remove_foto_bangunan_indices ?? updateData.foto_bangunan_delete_indices,
        { allowNull: false }
      );
      if (Array.isArray(rmBangunan) && rmBangunan.length > 0) {
        const { next, deleted } = this.removeByIndices(fotoBangunanArr, rmBangunan);
        deleted.forEach((p) => FileUploadHelper.deleteFile(p));

        fotoBangunanArr = next;
        bangunanChanged = true;
      }
      const rmDenah = this.parseIndexArray(
        updateData.remove_foto_denah_indices ?? updateData.foto_denah_delete_indices,
        { allowNull: false }
      );
      if (Array.isArray(rmDenah) && rmDenah.length > 0) {
        const { next, deleted } = this.removeByIndices(fotoDenahArr, rmDenah);
        deleted.forEach((p) => FileUploadHelper.deleteFile(p));

        fotoDenahArr = next;
        denahChanged = true;
      }

      if (bangunanChanged) data.foto_bangunan = JSON.stringify(fotoBangunanArr);
      if (denahChanged) data.foto_denah = JSON.stringify(fotoDenahArr);

      const updatedDesign = await designRepository.updateDesign(designId, data);

      console.log("✅ Design updated:", designId);
      return this.formatDesignResponse(updatedDesign);
    } catch (error) {
      console.error("❌ Failed to update design:", error.message);
      throw error;
    }
  }


  /**
   * Delete design
   * @param {String} designId - Design ID
   * @param {String} architectId - Architect ID (for authorization)
   * @returns {Promise<Object>} - Result
   */
  async deleteDesign(designId, architectId) {
    try {
      // Check if design exists and belongs to architect
      const design = await designRepository.findByIdOrFail(designId);

      if (design.architectId !== architectId) {
        throw new AuthorizationError('You do not have permission to delete this design');
      }

      // Delete uploaded files
      const fotoBangunan = this.parseJsonArray(design.foto_bangunan);
      const fotoDenah = this.parseJsonArray(design.foto_denah);

      fotoBangunan.forEach(path => FileUploadHelper.deleteFile(path));
      fotoDenah.forEach(path => FileUploadHelper.deleteFile(path));

      // Delete design
      await designRepository.deleteDesign(designId);

      console.log('✅ Design deleted:', designId);

      return {
        success: true,
        message: 'Design deleted successfully',
      };
    } catch (error) {
      console.error('❌ Failed to delete design:', error.message);
      throw error;
    }
  }

  /**
   * Get all designs (public)
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - { data, pagination }
   */
  async getAllDesigns(options = {}) {
    try {
      const { page = 1, limit = 12, orderBy = { createdAt: 'desc' } } = options;

      const result = await designRepository.findAllPublic({
        page: parseInt(page),
        limit: parseInt(limit),
        orderBy,
      });

      return {
        data: result.data.map(design => this.formatDesignResponse(design)),
        pagination: result.pagination,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Search designs (public)
   * @param {String} searchTerm - Search term
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - { data, pagination }
   */
  // design.service.js
  async searchDesigns({ q, kategori, city, page = 1, limit = 12 } = {}) {
    try {
      const hasAny =
        (q && q.trim()) ||
        (kategori && kategori.trim()) ||
        (city && city.trim());

      if (!hasAny) {
        return await this.getAllDesigns({ page, limit });
      }

      const result = await designRepository.searchPublic({
        q,
        kategori,
        city,
        page: parseInt(page),
        limit: parseInt(limit),
      });

      return {
        data: result.data.map((d) => this.formatDesignResponse(d)),
        pagination: result.pagination,
      };
    } catch (error) {
      throw error;
    }
  }


  /**
   * Get designs by category
   * @param {String} kategori - Category
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - { data, pagination }
   */
  async getDesignsByKategori(kategori, options = {}) {
    try {
      const { page = 1, limit = 12 } = options;

      const result = await designRepository.findByKategori(kategori, {
        page: parseInt(page),
        limit: parseInt(limit),
      });

      return {
        data: result.data.map(design => this.formatDesignResponse(design)),
        pagination: result.pagination,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get latest designs (public)
   * @param {Number} limit - Number of designs
   * @returns {Promise<Array>} - Array of designs
   */
  async getLatestDesigns(limit = 10) {
    try {
      const designs = await designRepository.findLatest(limit);
      return designs.map(design => this.formatDesignResponse(design));
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get design statistics for architect
   * @param {String} architectId - Architect ID
   * @returns {Promise<Object>} - Statistics
   */
  async getStatistics(architectId) {
    try {
      return await designRepository.getStatistics(architectId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Format design response with file URLs
   * @param {Object} design - Design object
   * @returns {Object} - Formatted design
   */
  formatDesignResponse(design) {
    const fotoBangunan = this.parseJsonArray(design.foto_bangunan);
    const fotoDenah = this.parseJsonArray(design.foto_denah);

    return {
      id: design.id,
      title: design.title,
      description: design.description,
      kategori: design.kategori,
      luas_bangunan: design.luas_bangunan,
      luas_tanah: design.luas_tanah,
      foto_bangunan: fotoBangunan.map(path => FileUploadHelper.getFileUrl(path)),
      foto_denah: fotoDenah.map(path => FileUploadHelper.getFileUrl(path)),
      architect: design.architect ? {
        id: design.architect.id,
        name: design.architect.name,
        profilePictureUrl: design.architect.profilePictureUrl
          ? FileUploadHelper.getFileUrl(design.architect.profilePictureUrl)
          : null,
        tahunPengalaman: design.architect.tahunPengalaman,
        areaPengalaman: design.architect.areaPengalaman,
      } : undefined,
      createdAt: design.createdAt,
      updatedAt: design.updatedAt,
    };
  }

  /**
   * Parse JSON array safely
   * @param {String} jsonString - JSON string
   * @returns {Array} - Parsed array or empty array
   */
  parseJsonArray(jsonString) {
    if (!jsonString) return [];
    try {
      return JSON.parse(jsonString);
    } catch (e) {
      return [];
    }
  }
}

module.exports = new DesignService();